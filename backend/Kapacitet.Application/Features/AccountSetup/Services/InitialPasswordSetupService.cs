using System.Security.Cryptography;
using System.Text;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Keycloak;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Kapacitet.Application.Features.AccountSetup.Services;

public class InitialPasswordSetupService
{
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(48);

    private readonly AppDbContext _db;
    private readonly KeycloakAdminClient _keycloakClient;
    private readonly ILogger<InitialPasswordSetupService> _logger;

    public InitialPasswordSetupService(
        AppDbContext db,
        KeycloakAdminClient keycloakClient,
        ILogger<InitialPasswordSetupService> logger)
    {
        _db = db;
        _keycloakClient = keycloakClient;
        _logger = logger;
    }

    public async Task<string> IssueTokenAsync(int accessRequestId)
    {
        var request = await _db.AccessRequests.FindAsync(accessRequestId)
            ?? throw new KeyNotFoundException($"AccessRequest {accessRequestId} not found");

        if (request.Status != AccessRequestStatus.Approved)
        {
            throw new InvalidOperationException(
                "Only approved access requests can receive an account setup link.");
        }

        var token = CreateToken();
        request.InitialPasswordSetupTokenHash = HashToken(token);
        request.InitialPasswordSetupTokenExpiresAt = DateTime.UtcNow.Add(TokenLifetime);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Issued initial password setup token for AccessRequest {AccessRequestId} expiring at {ExpiresAt}",
            accessRequestId,
            request.InitialPasswordSetupTokenExpiresAt);

        return token;
    }

    public async Task<InitialPasswordSetupContext?> GetContextAsync(string token)
    {
        var request = await FindValidRequestAsync(token);
        if (request is null)
        {
            return null;
        }

        var isFirstTimeUser = await _keycloakClient.IsFirstTimeUserAsync(request.ContactEmail);
        if (!isFirstTimeUser)
        {
            ClearToken(request);
            await _db.SaveChangesAsync();
            return null;
        }

        return new InitialPasswordSetupContext(request.ContactEmail);
    }

    public async Task<InitialPasswordSetupResult> SetInitialPasswordAsync(
        string token,
        string password)
    {
        var request = await FindValidRequestAsync(token);
        if (request is null)
        {
            return InitialPasswordSetupResult.InvalidToken;
        }

        var isFirstTimeUser = await _keycloakClient.IsFirstTimeUserAsync(request.ContactEmail);
        if (!isFirstTimeUser)
        {
            ClearToken(request);
            await _db.SaveChangesAsync();
            return InitialPasswordSetupResult.AlreadyCompleted;
        }

        await _keycloakClient.SetPermanentPasswordAsync(request.ContactEmail, password);
        ClearToken(request);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Initial password set successfully for approved access request {AccessRequestId}",
            request.Id);

        return InitialPasswordSetupResult.Success;
    }

    private async Task<Kapacitet.Domain.Entities.AccessRequest?> FindValidRequestAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var tokenHash = HashToken(token);
        var now = DateTime.UtcNow;

        return await _db.AccessRequests.FirstOrDefaultAsync(request =>
            request.Status == AccessRequestStatus.Approved &&
            request.InitialPasswordSetupTokenHash == tokenHash &&
            request.InitialPasswordSetupTokenExpiresAt != null &&
            request.InitialPasswordSetupTokenExpiresAt > now);
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

    private static void ClearToken(Kapacitet.Domain.Entities.AccessRequest request)
    {
        request.InitialPasswordSetupTokenHash = null;
        request.InitialPasswordSetupTokenExpiresAt = null;
    }
}

public sealed record InitialPasswordSetupContext(string Email);

public enum InitialPasswordSetupResult
{
    Success,
    InvalidToken,
    AlreadyCompleted
}
