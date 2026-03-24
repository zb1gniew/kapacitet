using Kapacitet.Application.Features.AccessRequests.DTOs;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.AccessRequests.Services;

public class AccessRequestService
{
    private readonly AppDbContext _db;

    public AccessRequestService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<AccessRequestDto> SubmitAsync(SubmitAccessRequestDto dto)
    {
        var accessRequest = new AccessRequest
        {
            Name = dto.Name,
            Industry = dto.Industry,
            Location = dto.Location,
            ContactEmail = dto.ContactEmail,
            Message = dto.Message,
            Status = AccessRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _db.AccessRequests.Add(accessRequest);
        await _db.SaveChangesAsync();

        return MapToDto(accessRequest);
    }

    public async Task<List<AccessRequestDto>> GetAllAsync()
    {
        var requests = await _db.AccessRequests
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return requests.Select(MapToDto).ToList();
    }

    public async Task<AccessRequestDto> ReviewAsync(int id, ReviewAccessRequestDto dto, string reviewedBy)
    {
        var request = await _db.AccessRequests.FindAsync(id)
            ?? throw new KeyNotFoundException($"AccessRequest {id} not found");

        if (request.Status != AccessRequestStatus.Pending)
            throw new InvalidOperationException("Only pending requests can be reviewed");

        request.Status = dto.Decision;
        request.ReviewedBy = reviewedBy;
        request.ReviewedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return MapToDto(request);
    }

    private static AccessRequestDto MapToDto(AccessRequest entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        Industry = entity.Industry,
        Location = entity.Location,
        ContactEmail = entity.ContactEmail,
        Message = entity.Message,
        Status = entity.Status,
        ReviewedBy = entity.ReviewedBy,
        ReviewedAt = entity.ReviewedAt,
        CreatedAt = entity.CreatedAt
    };
}