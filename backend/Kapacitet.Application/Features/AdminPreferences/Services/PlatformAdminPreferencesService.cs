using Kapacitet.Application.Features.AdminPreferences.DTOs;
using Kapacitet.Application.Features.Common.Errors;
using Kapacitet.Domain.Entities;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.AdminPreferences.Services;

public class PlatformAdminPreferencesService
{
    private static readonly HashSet<string> AllowedAccessRequestTabs =
    [
        "Pending",
        "Approved",
        "Rejected",
        "All"
    ];

    private static readonly HashSet<string> AllowedAuditFilters =
    [
        "All",
        "Submissions",
        "Decisions",
        "Provisioning"
    ];

    private readonly AppDbContext _db;

    public PlatformAdminPreferencesService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PlatformAdminPreferencesDto> GetAsync(string email)
    {
        var user = await LoadUserAsync(email);
        return user.PlatformAdminPreferences is not null
            ? MapToDto(user.PlatformAdminPreferences)
            : CreateDefaultDto();
    }

    public async Task<PlatformAdminPreferencesDto> UpdateAsync(
        string email,
        PlatformAdminPreferencesDto dto)
    {
        var user = await LoadUserAsync(email);
        var preferences = await GetOrCreatePreferencesAsync(user);

        preferences.DefaultAccessRequestsTab = NormalizeAccessRequestTab(
            dto.DefaultAccessRequestsTab);
        preferences.DefaultAuditFilter = NormalizeAuditFilter(
            dto.DefaultAuditFilter);
        preferences.PrioritizeFollowUpCompanies =
            dto.PrioritizeFollowUpCompanies;
        preferences.HighlightProvisioningAlerts =
            dto.HighlightProvisioningAlerts;

        await _db.SaveChangesAsync();

        return MapToDto(preferences);
    }

    private async Task<Kapacitet.Domain.Entities.User> LoadUserAsync(string email)
    {
        return await _db.Users
            .Include(user => user.PlatformAdminPreferences)
            .WhereEmailMatches(email)
            .FirstOrDefaultAsync()
            ?? throw new UnauthorizedAccessException($"User {email} not found");
    }

    private async Task<PlatformAdminPreferences> GetOrCreatePreferencesAsync(User user)
    {
        if (user.PlatformAdminPreferences is not null)
        {
            return user.PlatformAdminPreferences;
        }

        var preferences = new PlatformAdminPreferences
        {
            UserId = user.Id
        };

        _db.PlatformAdminPreferences.Add(preferences);
        user.PlatformAdminPreferences = preferences;
        await _db.SaveChangesAsync();

        return preferences;
    }

    private static PlatformAdminPreferencesDto CreateDefaultDto()
    {
        return new PlatformAdminPreferencesDto();
    }

    private static string NormalizeAccessRequestTab(string? value)
    {
        var normalized = value?.Trim();
        if (!string.IsNullOrWhiteSpace(normalized) &&
            AllowedAccessRequestTabs.Contains(normalized))
        {
            return normalized;
        }

        throw new ValidationException(new Dictionary<string, string[]>
        {
            ["defaultAccessRequestsTab"] =
            [
                "Default access requests tab must be one of: Pending, Approved, Rejected, All."
            ]
        });
    }

    private static string NormalizeAuditFilter(string? value)
    {
        var normalized = value?.Trim();
        if (!string.IsNullOrWhiteSpace(normalized) &&
            AllowedAuditFilters.Contains(normalized))
        {
            return normalized;
        }

        throw new ValidationException(new Dictionary<string, string[]>
        {
            ["defaultAuditFilter"] =
            [
                "Default audit filter must be one of: All, Submissions, Decisions, Provisioning."
            ]
        });
    }

    private static PlatformAdminPreferencesDto MapToDto(
        PlatformAdminPreferences preferences)
    {
        return new PlatformAdminPreferencesDto
        {
            DefaultAccessRequestsTab = preferences.DefaultAccessRequestsTab,
            DefaultAuditFilter = preferences.DefaultAuditFilter,
            PrioritizeFollowUpCompanies =
                preferences.PrioritizeFollowUpCompanies,
            HighlightProvisioningAlerts =
                preferences.HighlightProvisioningAlerts
        };
    }
}
