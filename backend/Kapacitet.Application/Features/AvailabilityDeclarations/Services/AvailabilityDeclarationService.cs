using Kapacitet.Application.Features.AvailabilityDeclarations.DTOs;
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
        var skills = await _db.Skills
            .Where(s => dto.SkillIds.Contains(s.Id))
            .ToListAsync();

        var certificates = await _db.Certificates
            .Where(c => dto.CertificateIds.Contains(c.Id))
            .ToListAsync();

        var declaration = new AvailabilityDeclaration
        {
            CompanyId = companyId,
            ResourceType = ResourceType.Worker,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            LocationCity = dto.LocationCity,
            LocationRadiusKm = dto.LocationRadiusKm,
            Quantity = dto.Quantity,
            Status = ListingStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            PublishedAt = null,
            Skills = skills,
            Certificates = certificates
        };

        _db.AvailabilityDeclarations.Add(declaration);
        await _db.SaveChangesAsync();

        return MapToDto(declaration);
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

        var skills = await _db.Skills
            .Where(s => dto.SkillIds.Contains(s.Id))
            .ToListAsync();

        var certificates = await _db.Certificates
            .Where(c => dto.CertificateIds.Contains(c.Id))
            .ToListAsync();

        declaration.StartDate = dto.StartDate;
        declaration.EndDate = dto.EndDate;
        declaration.LocationCity = dto.LocationCity;
        declaration.LocationRadiusKm = dto.LocationRadiusKm;
        declaration.Quantity = dto.Quantity;
        declaration.Skills = skills;
        declaration.Certificates = certificates;

        await _db.SaveChangesAsync();

        return MapToDto(declaration);
    }

    public async Task<AvailabilityDeclarationDto> PublishAsync(int id, int companyId)
    {
        var declaration = await _db.AvailabilityDeclarations
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
            .FirstOrDefaultAsync(d => d.Id == id && d.CompanyId == companyId)
            ?? throw new KeyNotFoundException($"AvailabilityDeclaration {id} not found");

        if (declaration.Status != ListingStatus.Active)
            throw new InvalidOperationException("Only active declarations can be withdrawn");

        declaration.Status = ListingStatus.Cancelled;
        await _db.SaveChangesAsync();

        return MapToDto(declaration);
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
        Status = entity.Status,
        CreatedAt = entity.CreatedAt,
        PublishedAt = entity.PublishedAt,
        Skills = entity.Skills.Select(s => s.Name).ToList(),
        Certificates = entity.Certificates.Select(c => c.Name).ToList()
    };
}
