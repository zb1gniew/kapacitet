using Kapacitet.Application.Features.CapacityRequests.DTOs;
using Kapacitet.Application.Features.Common.Errors;
using Kapacitet.Application.Features.Matching.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.CapacityRequests.Services;

public class CapacityRequestService
{
    private readonly AppDbContext _db;
    private readonly MatchingService _matchingService;

    public CapacityRequestService(AppDbContext db, MatchingService matchingService)
    {
        _db = db;
        _matchingService = matchingService;
    }

    public async Task<CapacityRequestDto> CreateAsync(CreateCapacityRequestDto dto, int companyId)
    {
        ValidateCityName(dto.LocationCity);
        var startDate = NormalizeDateTime(dto.StartDate);
        var endDate = NormalizeDateTime(dto.EndDate);
        ValidateDateRange(startDate, endDate);

        var request = new CapacityRequest
        {
            CompanyId = companyId,
            ClientDraftKey = NormalizeClientDraftKey(dto.ClientDraftKey),
            ResourceType = ResourceType.Worker,
            StartDate = startDate,
            EndDate = endDate,
            LocationCity = dto.LocationCity,
            LocationRadiusKm = dto.LocationRadiusKm,
            Quantity = dto.Quantity,
            ExperienceLevel = NormalizeExperienceLevel(dto.ExperienceLevel),
            Urgency = dto.Urgency,
            Status = ListingStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            PublishedAt = null,
            Skills = await LoadSkillsAsync(dto.SkillIds),
            Certificates = await LoadCertificatesAsync(dto.CertificateIds)
        };

        _db.CapacityRequests.Add(request);
        await _db.SaveChangesAsync();

        return MapToDto(request);
    }

    public async Task<(CapacityRequestDto Result, bool Created)> PublishNewAsync(
        CreateCapacityRequestDto dto,
        int companyId)
    {
        ValidateCityName(dto.LocationCity);
        var startDate = NormalizeDateTime(dto.StartDate);
        var endDate = NormalizeDateTime(dto.EndDate);
        ValidateDateRange(startDate, endDate);
        var clientDraftKey = NormalizeClientDraftKey(dto.ClientDraftKey);
        if (clientDraftKey is not null)
        {
            var existing = await FindByClientDraftKeyAsync(companyId, clientDraftKey);
            if (existing is not null)
            {
                return (MapToDto(existing), false);
            }
        }

        var request = new CapacityRequest
        {
            CompanyId = companyId,
            ClientDraftKey = clientDraftKey,
            ResourceType = ResourceType.Worker,
            StartDate = startDate,
            EndDate = endDate,
            LocationCity = dto.LocationCity,
            LocationRadiusKm = dto.LocationRadiusKm,
            Quantity = dto.Quantity,
            ExperienceLevel = NormalizeExperienceLevel(dto.ExperienceLevel),
            Urgency = dto.Urgency,
            Status = ListingStatus.Active,
            CreatedAt = DateTime.UtcNow,
            PublishedAt = DateTime.UtcNow,
            Skills = await LoadSkillsAsync(dto.SkillIds),
            Certificates = await LoadCertificatesAsync(dto.CertificateIds)
        };

        _db.CapacityRequests.Add(request);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (
            clientDraftKey is not null &&
            IsUniqueClientDraftKeyViolation(ex))
        {
            var existing = await FindByClientDraftKeyAsync(companyId, clientDraftKey);
            if (existing is not null)
            {
                return (MapToDto(existing), false);
            }

            throw;
        }

        await _matchingService.GenerateMatchesForRequestAsync(request.Id);

        return (MapToDto(request), true);
    }

    public async Task<List<CapacityRequestDto>> GetAllByCompanyAsync(int companyId)
    {
        var requests = await _db.CapacityRequests
            .Include(r => r.Skills)
            .Include(r => r.Certificates)
            .Where(r => r.CompanyId == companyId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return requests.Select(MapToDto).ToList();
    }

    public async Task<CapacityRequestDto> GetByIdAsync(int id, int companyId)
    {
        var request = await _db.CapacityRequests
            .Include(r => r.Skills)
            .Include(r => r.Certificates)
            .FirstOrDefaultAsync(r => r.Id == id && r.CompanyId == companyId)
            ?? throw new KeyNotFoundException($"CapacityRequest {id} not found");

        return MapToDto(request);
    }

    public async Task<CapacityRequestDto> UpdateAsync(int id, UpdateCapacityRequestDto dto, int companyId)
    {
        ValidateCityName(dto.LocationCity);
        var request = await _db.CapacityRequests
            .Include(r => r.Skills)
            .Include(r => r.Certificates)
            .FirstOrDefaultAsync(r => r.Id == id && r.CompanyId == companyId)
            ?? throw new KeyNotFoundException($"CapacityRequest {id} not found");

        if (request.Status != ListingStatus.Draft)
            throw new InvalidOperationException("Only draft requests can be edited");

        request.StartDate = NormalizeDateTime(dto.StartDate);
        request.EndDate = NormalizeDateTime(dto.EndDate);
        ValidateDateRange(request.StartDate, request.EndDate);
        request.LocationCity = dto.LocationCity;
        request.LocationRadiusKm = dto.LocationRadiusKm;
        request.Quantity = dto.Quantity;
        request.ExperienceLevel = NormalizeExperienceLevel(dto.ExperienceLevel);
        request.Urgency = dto.Urgency;
        request.Skills = await LoadSkillsAsync(dto.SkillIds);
        request.Certificates = await LoadCertificatesAsync(dto.CertificateIds);

        await _db.SaveChangesAsync();

        return MapToDto(request);
    }

    public async Task<CapacityRequestDto> CancelAsync(int id, int companyId)
    {
        var request = await _db.CapacityRequests
            .Include(r => r.Skills)
            .Include(r => r.Certificates)
            .FirstOrDefaultAsync(r => r.Id == id && r.CompanyId == companyId)
            ?? throw new KeyNotFoundException($"CapacityRequest {id} not found");

        if (request.Status == ListingStatus.Cancelled)
            throw new InvalidOperationException("Request is already cancelled");

        request.Status = ListingStatus.Cancelled;

        // Withdraw all open offers so suppliers cannot confirm against a cancelled request.
        var openOffers = await _db.MatchOffers
            .Where(m => m.RequestId == id && MatchingAllocationService.OpenStatuses.Contains(m.Status))
            .ToListAsync();
        foreach (var offer in openOffers)
            offer.Status = MatchStatus.Withdrawn;

        // Resolve any open network escalation tied to this request.
        var escalation = await _db.NetworkEscalations
            .FirstOrDefaultAsync(e => e.RequestId == id && e.Status == NetworkEscalationStatus.Open);
        if (escalation is not null)
            escalation.Status = NetworkEscalationStatus.Resolved;

        await _db.SaveChangesAsync();

        return MapToDto(request);
    }

    public async Task<CapacityRequestDto> PublishAsync(int id, int companyId)
    {
        var request = await _db.CapacityRequests
            .Include(r => r.Skills)
            .Include(r => r.Certificates)
            .FirstOrDefaultAsync(r => r.Id == id && r.CompanyId == companyId)
            ?? throw new KeyNotFoundException($"CapacityRequest {id} not found");

        if (request.Status != ListingStatus.Draft)
            throw new InvalidOperationException("Only draft requests can be published");

        request.Status = ListingStatus.Active;
        request.PublishedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _matchingService.GenerateMatchesForRequestAsync(request.Id);

        return MapToDto(request);
    }

    private static void ValidateCityName(string locationCity)
    {
        if (!MatchingCityCoordinateCatalog.IsSupportedCity(locationCity))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["locationCity"] = [$"'{locationCity}' is not a supported city. Please select a city from the suggestions."]
            });
        }
    }

    private static void ValidateDateRange(DateTime startDate, DateTime endDate)
    {
        if (startDate.Date < DateTime.UtcNow.Date)
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["startDate"] = ["Start date cannot be in the past."]
            });
        }

        if (endDate <= startDate)
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["endDate"] = ["End date must be after start date."]
            });
        }
    }

    private async Task<List<Skill>> LoadSkillsAsync(IEnumerable<int> requestedSkillIds)
    {
        var skillIds = requestedSkillIds.Distinct().ToArray();
        var skills = await _db.Skills
            .Where(skill => skillIds.Contains(skill.Id))
            .ToListAsync();

        ValidateRequestedIds(
            "skillIds",
            "Unknown skill IDs",
            skillIds,
            skills.Select(skill => skill.Id));

        return skills;
    }

    private async Task<List<Certificate>> LoadCertificatesAsync(IEnumerable<int> requestedCertificateIds)
    {
        var certificateIds = requestedCertificateIds.Distinct().ToArray();
        var certificates = await _db.Certificates
            .Where(certificate => certificateIds.Contains(certificate.Id))
            .ToListAsync();

        ValidateRequestedIds(
            "certificateIds",
            "Unknown certificate IDs",
            certificateIds,
            certificates.Select(certificate => certificate.Id));

        return certificates;
    }

    private static void ValidateRequestedIds(
        string fieldName,
        string errorPrefix,
        IReadOnlyCollection<int> requestedIds,
        IEnumerable<int> loadedIds)
    {
        var unknownIds = requestedIds.Except(loadedIds).ToArray();
        if (unknownIds.Length == 0)
        {
            return;
        }

        throw new ValidationException(new Dictionary<string, string[]>
        {
            [fieldName] = [$"{errorPrefix}: {string.Join(", ", unknownIds)}"]
        });
    }

    private async Task<CapacityRequest?> FindByClientDraftKeyAsync(int companyId, string clientDraftKey)
    {
        return await _db.CapacityRequests
            .Include(r => r.Skills)
            .Include(r => r.Certificates)
            .FirstOrDefaultAsync(r =>
                r.CompanyId == companyId &&
                r.ClientDraftKey == clientDraftKey);
    }

    private static bool IsUniqueClientDraftKeyViolation(DbUpdateException exception)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            var sqlState = current.GetType().GetProperty("SqlState")?.GetValue(current) as string;
            if (sqlState == "23505")
            {
                return true;
            }
        }

        return false;
    }

    private static string? NormalizeClientDraftKey(string? clientDraftKey)
    {
        return string.IsNullOrWhiteSpace(clientDraftKey)
            ? null
            : clientDraftKey.Trim();
    }

    private static string? NormalizeExperienceLevel(string? experienceLevel)
    {
        return string.IsNullOrWhiteSpace(experienceLevel)
            ? null
            : experienceLevel.Trim().ToLowerInvariant();
    }

    private static DateTime NormalizeDateTime(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Unspecified => DateTime.SpecifyKind(value, DateTimeKind.Utc),
            _ => value.ToUniversalTime()
        };
    }

    private static CapacityRequestDto MapToDto(CapacityRequest entity) => new()
    {
        Id = entity.Id,
        CompanyId = entity.CompanyId,
        ResourceType = entity.ResourceType,
        StartDate = entity.StartDate,
        EndDate = entity.EndDate,
        LocationCity = entity.LocationCity,
        LocationRadiusKm = entity.LocationRadiusKm,
        Quantity = entity.Quantity,
        ExperienceLevel = entity.ExperienceLevel,
        Status = entity.Status,
        Urgency = entity.Urgency,
        CreatedAt = entity.CreatedAt,
        PublishedAt = entity.PublishedAt,
        Skills = entity.Skills.Select(s => s.Name).ToList(),
        Certificates = entity.Certificates.Select(c => c.Name).ToList()
    };
}
