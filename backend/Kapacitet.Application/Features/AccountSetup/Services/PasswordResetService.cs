using System.Security.Cryptography;
using System.Text;
using Kapacitet.Infrastructure.Keycloak;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Kapacitet.Domain.Utilities;

namespace Kapacitet.Application.Features.AccountSetup.Services;

public class PasswordResetService
{
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(1);

    private readonly AppDbContext _db;
    private readonly KeycloakAdminClient _keycloakClient;
    private readonly ILogger<PasswordResetService> _logger;

    public PasswordResetService(
        AppDbContext db,
        KeycloakAdminClient keycloakClient,
        ILogger<PasswordResetService> logger)
    {
        _db = db;
        _keycloakClient = keycloakClient;
        _logger = logger;
    }

    // Returns token or null if email not found — caller always responds 200 to avoid email enumeration.
    public async Task<string?> IssueTokenAsync(string email)
    {
        var user = await _db.Users
            .WhereEmailMatches(email)
            .FirstOrDefaultAsync();

        if (user is null)
        {
            return null;
        }

        var token = CreateToken();
        user.PasswordResetTokenHash = HashToken(token);
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.Add(TokenLifetime);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Password reset token issued for user {UserId}", user.Id);

        return token;
    }

    public async Task<string?> GetEmailForTokenAsync(string token)
    {
        var user = await FindValidUserAsync(token);
        return user?.Email;
    }

    public async Task<PasswordResetResult> ResetPasswordAsync(string token, string password)
    {
        var user = await FindValidUserAsync(token);
        if (user is null)
        {
            return PasswordResetResult.InvalidToken;
        }

        await _keycloakClient.SetPermanentPasswordAsync(user.Email, password);

        user.PasswordResetTokenHash = null;
        user.PasswordResetTokenExpiresAt = null;
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Password reset successfully for user {UserId}", user.Id);

        return PasswordResetResult.Success;
    }

    private async Task<Kapacitet.Domain.Entities.User?> FindValidUserAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var tokenHash = HashToken(token);
        var now = DateTime.UtcNow;

        return await _db.Users.FirstOrDefaultAsync(u =>
            u.PasswordResetTokenHash == tokenHash &&
            u.PasswordResetTokenExpiresAt != null &&
            u.PasswordResetTokenExpiresAt > now);
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
}

public enum PasswordResetResult
{
    Success,
    InvalidToken,
}
