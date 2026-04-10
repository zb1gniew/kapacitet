using Kapacitet.Application.Features.CompanySettings.DTOs;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.CompanySettings.Services;

public class CompanyService
{
    private readonly AppDbContext _db;

    public CompanyService(AppDbContext db)
    {
        _db = db;
    }

    // ── Company Information ──────────────────────────────────────────────────

    public async Task<CompanyInformationDto> GetInformationAsync(string email)
    {
        var user = await LoadUserWithCompanyAsync(email);
        return MapToInformationDto(user);
    }

    public async Task<CompanyInformationDto> UpdateInformationAsync(
        string email,
        UpdateCompanyInformationDto dto)
    {
        var user = await LoadUserWithCompanyAsync(email);
        var company = user.Company;

        if (dto.Industry is not null)
        {
            var industry = dto.Industry.Trim();
            if (industry.Length > 100)
                throw new ArgumentException("Industry must be 100 characters or fewer.");
            company.Industry = industry;
        }

        if (dto.DefaultLocation is not null)
        {
            var location = dto.DefaultLocation.Trim();
            if (location.Length > 100)
                throw new ArgumentException("Location must be 100 characters or fewer.");
            company.DefaultLocation = location;
        }

        if (dto.ContactPhone is not null)
        {
            var phone = dto.ContactPhone.Trim();
            if (phone.Length > 50)
                throw new ArgumentException("Contact phone must be 50 characters or fewer.");
            company.ContactPhone = string.IsNullOrWhiteSpace(phone) ? null : phone;
        }

        await _db.SaveChangesAsync();
        return MapToInformationDto(user);
    }

    // ── Participation Settings ───────────────────────────────────────────────

    public async Task<CompanyParticipationSettingsDto> GetParticipationSettingsAsync(string email)
    {
        var user = await LoadUserWithCompanyAsync(email);
        var settings = user.Company.CompanySettings;
        return settings is not null
            ? MapToParticipationDto(settings)
            : new CompanyParticipationSettingsDto
            {
                ReceiveCapacityRequests = true,
                ParticipateInNetworkWide = true,
                AllowPartialMatches = false
            };
    }

    public async Task<CompanyParticipationSettingsDto> UpdateParticipationSettingsAsync(
        string email,
        CompanyParticipationSettingsDto dto)
    {
        var user = await LoadUserWithCompanyAsync(email);
        var settings = await GetOrCreateCompanySettingsAsync(user.Company);

        settings.ReceiveCapacityRequests = dto.ReceiveCapacityRequests;
        settings.ParticipateInNetworkWide = dto.ParticipateInNetworkWide;
        settings.AllowPartialMatches = dto.AllowPartialMatches;

        await _db.SaveChangesAsync();
        return MapToParticipationDto(settings);
    }

    // ── Notification Preferences ─────────────────────────────────────────────

    public async Task<NotificationPreferencesDto> GetNotificationPreferencesAsync(string email)
    {
        var user = await LoadUserWithCompanyAsync(email);
        var prefs = user.Company.NotificationPreferences;
        return prefs is not null
            ? MapToNotificationDto(prefs)
            : new NotificationPreferencesDto
            {
                EmailNewMatches = true,
                EmailActionsRequired = true,
                EmailUpcomingCooperation = true,
                InAppNewMatches = true,
                InAppActionsRequired = true,
                InAppUpcomingCooperation = true
            };
    }

    public async Task<NotificationPreferencesDto> UpdateNotificationPreferencesAsync(
        string email,
        NotificationPreferencesDto dto)
    {
        var user = await LoadUserWithCompanyAsync(email);
        var prefs = await GetOrCreateNotificationPreferencesAsync(user.Company);

        prefs.EmailNewMatches = dto.EmailNewMatches;
        prefs.EmailActionsRequired = dto.EmailActionsRequired;
        prefs.EmailUpcomingCooperation = dto.EmailUpcomingCooperation;
        prefs.InAppNewMatches = dto.InAppNewMatches;
        prefs.InAppActionsRequired = dto.InAppActionsRequired;
        prefs.InAppUpcomingCooperation = dto.InAppUpcomingCooperation;

        await _db.SaveChangesAsync();
        return MapToNotificationDto(prefs);
    }

    // ── Activity Log ─────────────────────────────────────────────────────────

    public async Task<List<ActivityItemDto>> GetActivityAsync(string email, int limit = 10)
    {
        var user = await LoadUserWithCompanyAsync(email);
        var companyId = user.CompanyId;

        var activities = new List<ActivityItemDto>();

        var requests = await _db.CapacityRequests
            .Where(r => r.CompanyId == companyId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(limit)
            .ToListAsync();

        foreach (var r in requests)
        {
            if (r.PublishedAt.HasValue)
            {
                activities.Add(new ActivityItemDto
                {
                    Type = "capacity_request_published",
                    Title = "Published capacity request",
                    Description = $"{r.Quantity} {r.ResourceType.ToString().ToLower()}(s) in {r.LocationCity}",
                    OccurredAt = r.PublishedAt.Value
                });
            }
            else
            {
                activities.Add(new ActivityItemDto
                {
                    Type = "capacity_request_created",
                    Title = "Created capacity request",
                    Description = $"{r.Quantity} {r.ResourceType.ToString().ToLower()}(s) in {r.LocationCity}",
                    OccurredAt = r.CreatedAt
                });
            }
        }

        var availability = await _db.AvailabilityDeclarations
            .Where(a => a.CompanyId == companyId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .ToListAsync();

        foreach (var a in availability)
        {
            if (a.PublishedAt.HasValue)
            {
                activities.Add(new ActivityItemDto
                {
                    Type = "availability_published",
                    Title = "Declared availability",
                    Description = $"{a.Quantity} {a.ResourceType.ToString().ToLower()}(s), {a.StartDate:MMM d} – {a.EndDate:MMM d}",
                    OccurredAt = a.PublishedAt.Value
                });
            }
        }

        var matches = await _db.MatchOffers
            .Include(m => m.Request)
            .Where(m => m.Request.CompanyId == companyId && m.RequesterReviewedAt != null)
            .OrderByDescending(m => m.RequesterReviewedAt)
            .Take(limit)
            .ToListAsync();

        foreach (var m in matches)
        {
            var accepted = m.Status == MatchStatus.PendingSupplierConfirmation
                || m.Status == MatchStatus.AgreementCreated;
            activities.Add(new ActivityItemDto
            {
                Type = accepted ? "match_accepted" : "match_declined",
                Title = accepted ? "Accepted match offer" : "Declined match offer",
                Description = $"{m.OfferedQuantity} worker(s) match for request #{m.RequestId}",
                OccurredAt = m.RequesterReviewedAt!.Value
            });
        }

        var agreements = await _db.CooperationAgreements
            .Where(a => a.RequesterCompanyId == companyId || a.SupplierCompanyId == companyId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .ToListAsync();

        foreach (var a in agreements)
        {
            activities.Add(new ActivityItemDto
            {
                Type = "agreement_created",
                Title = "Cooperation agreement created",
                Description = $"Agreement #{a.Id} from {a.StartDate:MMM d} to {a.EndDate:MMM d}",
                OccurredAt = a.CreatedAt
            });
        }

        return activities
            .OrderByDescending(a => a.OccurredAt)
            .Take(limit)
            .ToList();
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private async Task<Domain.Entities.User> LoadUserWithCompanyAsync(string email)
    {
        return await _db.Users
            .Include(u => u.Company)
                .ThenInclude(c => c.CompanySettings)
            .Include(u => u.Company)
                .ThenInclude(c => c.NotificationPreferences)
            .FirstOrDefaultAsync(u => u.Email == email)
            ?? throw new UnauthorizedAccessException($"User {email} not found");
    }

    private async Task<Domain.Entities.CompanySettings> GetOrCreateCompanySettingsAsync(
        Domain.Entities.Company company)
    {
        if (company.CompanySettings is not null)
            return company.CompanySettings;

        var settings = new Domain.Entities.CompanySettings { CompanyId = company.Id };
        _db.CompanySettings.Add(settings);
        company.CompanySettings = settings;
        await _db.SaveChangesAsync();
        return settings;
    }

    private async Task<Domain.Entities.NotificationPreferences> GetOrCreateNotificationPreferencesAsync(
        Domain.Entities.Company company)
    {
        if (company.NotificationPreferences is not null)
            return company.NotificationPreferences;

        var prefs = new Domain.Entities.NotificationPreferences { CompanyId = company.Id };
        _db.NotificationPreferences.Add(prefs);
        company.NotificationPreferences = prefs;
        await _db.SaveChangesAsync();
        return prefs;
    }

    private static CompanyInformationDto MapToInformationDto(Domain.Entities.User user)
    {
        return new CompanyInformationDto
        {
            Name = user.Company.Name,
            Industry = user.Company.Industry,
            DefaultLocation = user.Company.DefaultLocation,
            ContactEmail = user.Email,
            ContactPhone = user.Company.ContactPhone
        };
    }

    private static CompanyParticipationSettingsDto MapToParticipationDto(
        Domain.Entities.CompanySettings s)
    {
        return new CompanyParticipationSettingsDto
        {
            ReceiveCapacityRequests = s.ReceiveCapacityRequests,
            ParticipateInNetworkWide = s.ParticipateInNetworkWide,
            AllowPartialMatches = s.AllowPartialMatches
        };
    }

    private static NotificationPreferencesDto MapToNotificationDto(
        Domain.Entities.NotificationPreferences n)
    {
        return new NotificationPreferencesDto
        {
            EmailNewMatches = n.EmailNewMatches,
            EmailActionsRequired = n.EmailActionsRequired,
            EmailUpcomingCooperation = n.EmailUpcomingCooperation,
            InAppNewMatches = n.InAppNewMatches,
            InAppActionsRequired = n.InAppActionsRequired,
            InAppUpcomingCooperation = n.InAppUpcomingCooperation
        };
    }
}
