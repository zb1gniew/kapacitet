using Kapacitet.Application.Features.CapacityRequests.DTOs;
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
        var skills = await _db.Skills
            .Where(s => dto.SkillIds.Contains(s.Id))
            .ToListAsync();

        var certificates = await _db.Certificates
            .Where(c => dto.CertificateIds.Contains(c.Id))
            .ToListAsync();

        // TODO: implement certificate validation against external registry

        var request = new CapacityRequest
        {
            CompanyId = companyId,
            ResourceType = ResourceType.Worker,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            LocationCity = dto.LocationCity,
            LocationRadiusKm = dto.LocationRadiusKm,
            Quantity = dto.Quantity,
            Urgency = dto.Urgency,
            Status = ListingStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            PublishedAt = null,
            Skills = skills,
            Certificates = certificates
        };

        _db.CapacityRequests.Add(request);
        await _db.SaveChangesAsync();

        return MapToDto(request);
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
        var request = await _db.CapacityRequests
            .Include(r => r.Skills)
            .Include(r => r.Certificates)
            .FirstOrDefaultAsync(r => r.Id == id && r.CompanyId == companyId)
            ?? throw new KeyNotFoundException($"CapacityRequest {id} not found");

        if (request.Status != ListingStatus.Draft)
            throw new InvalidOperationException("Only draft requests can be edited");

        var skills = await _db.Skills
            .Where(s => dto.SkillIds.Contains(s.Id))
            .ToListAsync();

        var certificates = await _db.Certificates
            .Where(c => dto.CertificateIds.Contains(c.Id))
            .ToListAsync();

        request.StartDate = dto.StartDate;
        request.EndDate = dto.EndDate;
        request.LocationCity = dto.LocationCity;
        request.LocationRadiusKm = dto.LocationRadiusKm;
        request.Quantity = dto.Quantity;
        request.Urgency = dto.Urgency;
        request.Skills = skills;
        request.Certificates = certificates;

        await _db.SaveChangesAsync();

        return MapToDto(request);
    }

    public async Task<CapacityRequestDto> CancelAsync(int id, int companyId)
    {
        var request = await _db.CapacityRequests
            .FirstOrDefaultAsync(r => r.Id == id && r.CompanyId == companyId)
            ?? throw new KeyNotFoundException($"CapacityRequest {id} not found");

        if (request.Status == ListingStatus.Cancelled)
            throw new InvalidOperationException("Request is already cancelled");

        request.Status = ListingStatus.Cancelled;
        await _db.SaveChangesAsync();

        return MapToDto(request);
    }

    public async Task<CapacityRequestDto> PublishAsync(int id, int companyId)
    {
        var request = await _db.CapacityRequests
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
        Status = entity.Status,
        Urgency = entity.Urgency,
        CreatedAt = entity.CreatedAt,
        PublishedAt = entity.PublishedAt,
        Skills = entity.Skills.Select(s => s.Name).ToList(),
        Certificates = entity.Certificates.Select(c => c.Name).ToList()
    };
}
