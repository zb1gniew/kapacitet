using Kapacitet.Application.Features.AvailabilityDeclarations.DTOs;
using Kapacitet.Application.Features.Common.Errors;
using Kapacitet.Application.Features.Matching.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.AvailabilityDeclarations.Services;

public class AvailabilityDeclarationService
{
    private readonly AppDbContext _db;
    private readonly MatchingService _matchingService;

    public AvailabilityDeclarationService(AppDbContext db, MatchingService matchingService)
    {
        _db = db;
        _matchingService = matchingService;
    }

    public async Task<AvailabilityDeclarationDto> CreateAsync(CreateAvailabilityDeclarationDto dto, int companyId)
    {
        var startDate = NormalizeDateTime(dto.StartDate);
        var endDate = NormalizeDateTime(dto.EndDate);

        var declaration = new AvailabilityDeclaration
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
            Status = ListingStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            PublishedAt = null,
            Skills = await LoadSkillsAsync(dto.SkillIds),
            Certificates = await LoadCertificatesAsync(dto.CertificateIds)
        };

        _db.AvailabilityDeclarations.Add(declaration);
        await _db.SaveChangesAsync();

        return MapToDto(declaration);
    }

    public async Task<(AvailabilityDeclarationDto Result, bool Created)> PublishNewAsync(
        CreateAvailabilityDeclarationDto dto,
        int companyId)
    {
        var startDate = NormalizeDateTime(dto.StartDate);
        var endDate = NormalizeDateTime(dto.EndDate);
        var clientDraftKey = NormalizeClientDraftKey(dto.ClientDraftKey);
        if (clientDraftKey is not null)
        {
            var existing = await FindByClientDraftKeyAsync(companyId, clientDraftKey);
            if (existing is not null)
            {
                return (MapToDto(existing), false);
            }
        }

        var declaration = new AvailabilityDeclaration
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
            Status = ListingStatus.Active,
            CreatedAt = DateTime.UtcNow,
            PublishedAt = DateTime.UtcNow,
            Skills = await LoadSkillsAsync(dto.SkillIds),
            Certificates = await LoadCertificatesAsync(dto.CertificateIds)
        };

        _db.AvailabilityDeclarations.Add(declaration);

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

        await _matchingService.RefreshMatchesForAvailabilityAsync(declaration.Id);

        return (MapToDto(declaration), true);
    }

    public async Task<List<AvailabilityDeclarationDto>> GetAllByCompanyAsync(int companyId)
    {
        var declarations = await _db.AvailabilityDeclarations
            .Include(d => d.Skills)
            .Include(d => d.Certificates)
            .Where(d => d.CompanyId == companyId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        return declarations.Select(MapToDto).ToList();
    }

    public async Task<AvailabilityDeclarationDto> GetByIdAsync(int id, int companyId)
    {
        var declaration = await _db.AvailabilityDeclarations
            .Include(d => d.Skills)
            .Include(d => d.Certificates)
            .FirstOrDefaultAsync(d => d.Id == id && d.CompanyId == companyId)
            ?? throw new KeyNotFoundException($"AvailabilityDeclaration {id} not found");

        return MapToDto(declaration);
    }

    public async Task<AvailabilityDeclarationDto> UpdateAsync(int id, UpdateAvailabilityDeclarationDto dto, int companyId)
    {
        var declaration = await _db.AvailabilityDeclarations
            .Include(d => d.Skills)
            .Include(d => d.Certificates)
            .FirstOrDefaultAsync(d => d.Id == id && d.CompanyId == companyId)
            ?? throw new KeyNotFoundException($"AvailabilityDeclaration {id} not found");

        if (declaration.Status != ListingStatus.Draft)
            throw new InvalidOperationException("Only draft declarations can be edited");

        declaration.StartDate = NormalizeDateTime(dto.StartDate);
        declaration.EndDate = NormalizeDateTime(dto.EndDate);
        declaration.LocationCity = dto.LocationCity;
        declaration.LocationRadiusKm = dto.LocationRadiusKm;
        declaration.Quantity = dto.Quantity;
        declaration.ExperienceLevel = NormalizeExperienceLevel(dto.ExperienceLevel);
        declaration.Skills = await LoadSkillsAsync(dto.SkillIds);
        declaration.Certificates = await LoadCertificatesAsync(dto.CertificateIds);

        await _db.SaveChangesAsync();

        return MapToDto(declaration);
    }

    public async Task<AvailabilityDeclarationDto> PublishAsync(int id, int companyId)
    {
        var declaration = await _db.AvailabilityDeclarations
            .Include(d => d.Skills)
            .Include(d => d.Certificates)
            .FirstOrDefaultAsync(d => d.Id == id && d.CompanyId == companyId)
            ?? throw new KeyNotFoundException($"AvailabilityDeclaration {id} not found");

        if (declaration.Status != ListingStatus.Draft)
            throw new InvalidOperationException("Only draft declarations can be published");

        declaration.Status = ListingStatus.Active;
        declaration.PublishedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _matchingService.RefreshMatchesForAvailabilityAsync(id);

        return MapToDto(declaration);
    }

    public async Task<AvailabilityDeclarationDto> WithdrawAsync(int id, int companyId)
    {
        var declaration = await _db.AvailabilityDeclarations
            .Include(d => d.Skills)
            .Include(d => d.Certificates)
            .FirstOrDefaultAsync(d => d.Id == id && d.CompanyId == companyId)
            ?? throw new KeyNotFoundException($"AvailabilityDeclaration {id} not found");

        if (declaration.Status != ListingStatus.Active)
            throw new InvalidOperationException("Only active declarations can be withdrawn");

        declaration.Status = ListingStatus.Cancelled;
        await _db.SaveChangesAsync();

        return MapToDto(declaration);
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

    private async Task<AvailabilityDeclaration?> FindByClientDraftKeyAsync(int companyId, string clientDraftKey)
    {
        return await _db.AvailabilityDeclarations
            .Include(d => d.Skills)
            .Include(d => d.Certificates)
            .FirstOrDefaultAsync(d =>
                d.CompanyId == companyId &&
                d.ClientDraftKey == clientDraftKey);
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

    private static AvailabilityDeclarationDto MapToDto(AvailabilityDeclaration entity) => new()
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
        CreatedAt = entity.CreatedAt,
        PublishedAt = entity.PublishedAt,
        Skills = entity.Skills.Select(s => s.Name).ToList(),
        Certificates = entity.Certificates.Select(c => c.Name).ToList()
    };
}
