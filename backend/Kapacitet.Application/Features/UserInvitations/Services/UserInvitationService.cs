using System.Security.Cryptography;
using System.Text;
using Kapacitet.Application.Features.Common.Errors;
using Kapacitet.Application.Features.Common.Services;
using Kapacitet.Application.Features.Notifications.Services;
using Kapacitet.Application.Features.UserInvitations.DTOs;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Domain.Utilities;
using Kapacitet.Infrastructure.Keycloak;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Kapacitet.Application.Features.UserInvitations.Services;

public class UserInvitationService
{
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(48);

    private readonly AppDbContext _db;
    private readonly KeycloakAdminClient _keycloakClient;
    private readonly EmailService _emailService;
    private readonly CurrentUserService _currentUserService;
    private readonly ILogger<UserInvitationService> _logger;

    public UserInvitationService(
        AppDbContext db,
        KeycloakAdminClient keycloakClient,
        EmailService emailService,
        CurrentUserService currentUserService,
        ILogger<UserInvitationService> logger)
    {
        _db = db;
        _keycloakClient = keycloakClient;
        _emailService = emailService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<UserInvitationDto> InviteAsync(string adminEmail, InviteUserDto dto)
    {
        if (dto.Role == UserRole.Admin)
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["role"] = ["Cannot invite a user as Admin."]
            });
        }

        var admin = await _currentUserService.GetCurrentUserAsync(adminEmail);

        var normalizedEmail = EmailAddressNormalizer.Canonicalize(dto.Email);

        var existingUser = await _db.Users
            .WhereEmailMatches(normalizedEmail)
            .AnyAsync();

        if (existingUser)
            throw new InvalidOperationException("A user with this email already exists in the platform.");

        var existingInvite = await _db.UserInvitations
            .AnyAsync(i =>
                i.CompanyId == admin.CompanyId &&
                i.AcceptedAt == null &&
                EF.Property<string>(i, "NormalizedEmail") == normalizedEmail);

        if (existingInvite)
            throw new InvalidOperationException("A pending invitation for this email already exists.");

        var company = await _db.Companies.FindAsync(admin.CompanyId)
            ?? throw new InvalidOperationException("Company not found.");

        var invitation = new UserInvitation
        {
            CompanyId = admin.CompanyId,
            Email = normalizedEmail,
            Role = dto.Role,
            CreatedAt = DateTime.UtcNow
        };

        _db.UserInvitations.Add(invitation);
        await _db.SaveChangesAsync();

        // Provision Keycloak account
        var existingKeycloakId = await _keycloakClient.FindUserByEmailAsync(normalizedEmail);
        if (existingKeycloakId == null)
        {
            var keycloakId = await _keycloakClient.CreateUserAsync(normalizedEmail);
            await _keycloakClient.SetTemporaryPasswordAsync(keycloakId, CreateBootstrapPassword());
        }

        // Issue setup token
        var token = CreateToken();
        invitation.InvitationTokenHash = HashToken(token);
        invitation.InvitationTokenExpiresAt = DateTime.UtcNow.Add(TokenLifetime);
        await _db.SaveChangesAsync();

        await _emailService.SendInvitationEmailAsync(normalizedEmail, company.Name, dto.Role, token);

        _logger.LogInformation(
            "Invitation sent: InvitationId={InvitationId}, Email={Email}, Role={Role}, CompanyId={CompanyId}",
            invitation.Id, normalizedEmail, dto.Role, admin.CompanyId);

        return MapToDto(invitation);
    }

    public async Task<List<UserInvitationDto>> GetPendingInvitationsAsync(string adminEmail)
    {
        var admin = await _currentUserService.GetCurrentUserAsync(adminEmail);

        return await _db.UserInvitations
            .Where(i => i.CompanyId == admin.CompanyId && i.AcceptedAt == null)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new UserInvitationDto
            {
                Id = i.Id,
                Email = i.Email,
                Role = i.Role,
                CreatedAt = i.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<CompanyMemberDto>> GetMembersAsync(string adminEmail)
    {
        var admin = await _currentUserService.GetCurrentUserAsync(adminEmail);

        return await _db.Users
            .Where(u => u.CompanyId == admin.CompanyId)
            .OrderBy(u => u.CreatedAt)
            .Select(u => new CompanyMemberDto
            {
                Id = u.Id,
                Email = u.Email,
                Role = u.Role,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();
    }

    public async Task CancelAsync(int invitationId, string adminEmail)
    {
        var admin = await _currentUserService.GetCurrentUserAsync(adminEmail);

        var invitation = await _db.UserInvitations.FindAsync(invitationId)
            ?? throw new KeyNotFoundException($"Invitation {invitationId} not found.");

        if (invitation.CompanyId != admin.CompanyId)
            throw new UnauthorizedAccessException("Invitation does not belong to your company.");

        if (invitation.AcceptedAt != null)
            throw new InvalidOperationException("Cannot cancel an already accepted invitation.");

        _db.UserInvitations.Remove(invitation);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Invitation cancelled: InvitationId={InvitationId}, CancelledBy={Email}",
            invitationId, adminEmail);
    }

    public async Task SetInviteeNameAsync(string email, string firstName, string lastName)
    {
        await _keycloakClient.UpdateUserNameAsync(email, firstName, lastName);
    }

    public async Task<string?> GetSetupContextEmailAsync(string token)
    {
        var invitation = await FindValidInvitationAsync(token);
        if (invitation is null)
            return null;

        var isFirstTime = await _keycloakClient.IsFirstTimeUserAsync(invitation.Email);
        if (!isFirstTime)
        {
            ClearToken(invitation);
            await _db.SaveChangesAsync();
            return null;
        }

        return invitation.Email;
    }

    public async Task<UserInvitationAcceptResult> AcceptAsync(string token, string password)
    {
        var invitation = await FindValidInvitationAsync(token);
        if (invitation is null)
            return UserInvitationAcceptResult.InvalidToken;

        var isFirstTime = await _keycloakClient.IsFirstTimeUserAsync(invitation.Email);
        if (!isFirstTime)
        {
            ClearToken(invitation);
            invitation.AcceptedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return UserInvitationAcceptResult.AlreadyCompleted;
        }

        await _keycloakClient.SetPermanentPasswordAsync(invitation.Email, password);

        var user = new User
        {
            CompanyId = invitation.CompanyId,
            Email = invitation.Email,
            Role = invitation.Role,
            CreatedAt = DateTime.UtcNow,
            OnboardingCompletedAt = DateTime.UtcNow
        };
        _db.Users.Add(user);

        ClearToken(invitation);
        invitation.AcceptedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Invitation accepted: InvitationId={InvitationId}, Email={Email}, Role={Role}, CompanyId={CompanyId}",
            invitation.Id, invitation.Email, invitation.Role, invitation.CompanyId);

        return UserInvitationAcceptResult.Success;
    }

    private async Task<UserInvitation?> FindValidInvitationAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return null;

        var tokenHash = HashToken(token);
        var now = DateTime.UtcNow;

        return await _db.UserInvitations.FirstOrDefaultAsync(i =>
            i.AcceptedAt == null &&
            i.InvitationTokenHash == tokenHash &&
            i.InvitationTokenExpiresAt != null &&
            i.InvitationTokenExpiresAt > now);
    }

    private static void ClearToken(UserInvitation invitation)
    {
        invitation.InvitationTokenHash = null;
        invitation.InvitationTokenExpiresAt = null;
    }

    private static string CreateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return WebEncoders.Base64UrlEncode(bytes);
    }

    private static string HashToken(string token)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(hash);
    }

    private static string CreateBootstrapPassword() =>
        $"{Convert.ToHexString(RandomNumberGenerator.GetBytes(16))}aA!";

    private static UserInvitationDto MapToDto(UserInvitation i) => new()
    {
        Id = i.Id,
        Email = i.Email,
        Role = i.Role,
        CreatedAt = i.CreatedAt
    };
}

public enum UserInvitationAcceptResult
{
    Success,
    InvalidToken,
    AlreadyCompleted
}
