using Kapacitet.Application.Features.CompanySettings.DTOs;
using Kapacitet.Application.Features.Common.Errors;
using Kapacitet.Application.Features.Matching.Services;
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
        var fieldErrors = new Dictionary<string, string[]>();

        if (dto.Categories is not null)
        {
            var error = CompanyCategoryCatalog.ValidateCategoriesField(dto.Categories);
            if (error is not null)
            {
                fieldErrors["categories"] = [error];
            }
            else
            {
                company.Categories = dto.Categories;
            }
        }

        if (dto.DefaultLocation is not null)
        {
            var location = dto.DefaultLocation.Trim();
            if (location.Length > 100)
            {
                fieldErrors["defaultLocation"] = ["Location must be 100 characters or fewer."];
            }
            else if (location.Length > 0 && !MatchingCityCoordinateCatalog.IsSupportedCity(location))
            {
                fieldErrors["defaultLocation"] = [$"'{location}' is not a supported city. Please select a city from the suggestions."];
            }
            else
            {
                company.DefaultLocation = location;
            }
        }

        if (dto.ContactPhone is not null)
        {
            var phone = dto.ContactPhone.Trim();
            if (string.IsNullOrWhiteSpace(phone))
            {
                company.ContactPhone = null;
            }
            else if (!phone.StartsWith('+') || phone.Length is < 8 or > 16 || !phone[1..].All(char.IsAsciiDigit))
            {
                fieldErrors["contactPhone"] = ["Enter a valid international phone number (e.g. +4512345678)."];
            }
            else
            {
                company.ContactPhone = phone;
            }
        }

        if (fieldErrors.Count > 0)
        {
            throw new ValidationException(fieldErrors, "Please correct the highlighted company details.");
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
                AllowPartialMatches = true,
                MatchOutsideCategory = true
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
        settings.MatchOutsideCategory = dto.MatchOutsideCategory;

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
                InAppUpcomingCooperation = true,
                EmailNetworkRequests = true,
                InAppNetworkRequests = true
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
        prefs.EmailNetworkRequests = dto.EmailNetworkRequests;
        prefs.InAppNetworkRequests = dto.InAppNetworkRequests;

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
                    OccurredAt = r.PublishedAt.Value,
                    Params = new Dictionary<string, string>
                    {
                        ["quantity"] = r.Quantity.ToString(),
                        ["resourceType"] = r.ResourceType.ToString().ToLower(),
                        ["city"] = r.LocationCity
                    }
                });
            }
            else
            {
                activities.Add(new ActivityItemDto
                {
                    Type = "capacity_request_created",
                    OccurredAt = r.CreatedAt,
                    Params = new Dictionary<string, string>
                    {
                        ["quantity"] = r.Quantity.ToString(),
                        ["resourceType"] = r.ResourceType.ToString().ToLower(),
                        ["city"] = r.LocationCity
                    }
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
                    OccurredAt = a.PublishedAt.Value,
                    Params = new Dictionary<string, string>
                    {
                        ["quantity"] = a.Quantity.ToString(),
                        ["resourceType"] = a.ResourceType.ToString().ToLower(),
                        ["start"] = a.StartDate.ToString("yyyy-MM-dd"),
                        ["end"] = a.EndDate.ToString("yyyy-MM-dd")
                    }
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
                OccurredAt = m.RequesterReviewedAt!.Value,
                Params = new Dictionary<string, string>
                {
                    ["quantity"] = m.OfferedQuantity.ToString(),
                    ["requestId"] = m.RequestId.ToString(),
                    ["resourceType"] = m.Request.ResourceType.ToString().ToLower()
                }
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
                OccurredAt = a.CreatedAt,
                Params = new Dictionary<string, string>
                {
                    ["agreementId"] = a.Id.ToString(),
                    ["start"] = a.StartDate.ToString("yyyy-MM-dd"),
                    ["end"] = a.EndDate.ToString("yyyy-MM-dd")
                }
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
            .WhereEmailMatches(email)
            .FirstOrDefaultAsync()
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
            Cvr = user.Company.Cvr,
            Categories = user.Company.Categories,
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
            AllowPartialMatches = s.AllowPartialMatches,
            MatchOutsideCategory = s.MatchOutsideCategory
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
            InAppUpcomingCooperation = n.InAppUpcomingCooperation,
            EmailNetworkRequests = n.EmailNetworkRequests,
            InAppNetworkRequests = n.InAppNetworkRequests
        };
    }
}
