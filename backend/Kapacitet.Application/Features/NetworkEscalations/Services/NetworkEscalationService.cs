using Kapacitet.Application.Features.NetworkEscalations.DTOs;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.NetworkEscalations.Services;

public sealed class NetworkEscalationService
{
    private readonly AppDbContext _db;

    public NetworkEscalationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<NetworkEscalationDto>> GetForCompanyAsync(int companyId)
    {
        var company = await _db.Companies
            .Include(c => c.CompanySettings)
            .FirstOrDefaultAsync(c => c.Id == companyId)
            ?? throw new UnauthorizedAccessException($"Company {companyId} not found");

        var eligibleForNetworkWide =
            company.Status == CompanyStatus.Active &&
            (company.CompanySettings?.ReceiveCapacityRequests ?? true) &&
            (company.CompanySettings?.ParticipateInNetworkWide ?? true);

        var escalations = await _db.NetworkEscalations
            .AsNoTracking()
            .AsSplitQuery()
            .Include(e => e.Request).ThenInclude(r => r.Skills)
            .Include(e => e.Request).ThenInclude(r => r.Certificates)
            .Include(e => e.Responses)
            .Where(e =>
                e.Request.CompanyId != companyId &&
                (e.Status == NetworkEscalationStatus.Open ||
                 e.Responses.Any(r => r.CompanyId == companyId)) &&
                (eligibleForNetworkWide || e.Responses.Any(r => r.CompanyId == companyId)))
            .OrderByDescending(e => e.TriggeredAt)
            .ToListAsync();

        return escalations.Select(e => MapToDto(e, companyId)).ToList();
    }

    public async Task<NetworkEscalationDto> SubmitResponseAsync(
        int escalationId,
        int companyId,
        SubmitNetworkResponseDto dto)
    {
        var company = await _db.Companies
            .Include(c => c.CompanySettings)
            .FirstOrDefaultAsync(c => c.Id == companyId)
            ?? throw new UnauthorizedAccessException($"Company {companyId} not found");

        var escalation = await _db.NetworkEscalations
            .AsSplitQuery()
            .Include(e => e.Request).ThenInclude(r => r.Skills)
            .Include(e => e.Request).ThenInclude(r => r.Certificates)
            .Include(e => e.Responses)
            .FirstOrDefaultAsync(e => e.Id == escalationId)
            ?? throw new KeyNotFoundException($"NetworkEscalation {escalationId} not found");

        if (escalation.Request.CompanyId == companyId)
        {
            throw new UnauthorizedAccessException(
                "The requesting company cannot respond to its own escalation");
        }

        if (escalation.Status != NetworkEscalationStatus.Open)
        {
            throw new InvalidOperationException(
                "This network escalation is no longer accepting responses");
        }

        var eligibleForNetworkWide =
            company.Status == CompanyStatus.Active &&
            (company.CompanySettings?.ReceiveCapacityRequests ?? true) &&
            (company.CompanySettings?.ParticipateInNetworkWide ?? true);

        if (!eligibleForNetworkWide)
        {
            throw new UnauthorizedAccessException(
                "This company is not eligible to respond to network-wide requests");
        }

        if (escalation.Responses.Any(r => r.CompanyId == companyId))
        {
            throw new InvalidOperationException(
                "This company has already responded to the escalation");
        }

        escalation.Responses.Add(new NetworkResponse
        {
            CompanyId = companyId,
            ResponseType = dto.ResponseType,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        return MapToDto(escalation, companyId);
    }

    private static NetworkEscalationDto MapToDto(NetworkEscalation escalation, int companyId)
    {
        var companyResponse = escalation.Responses
            .Where(r => r.CompanyId == companyId)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefault();

        return new NetworkEscalationDto
        {
            Id = escalation.Id,
            RequestId = escalation.RequestId,
            TriggeredAt = escalation.TriggeredAt,
            Status = escalation.Status,
            Quantity = escalation.Request.Quantity,
            Urgency = escalation.Request.Urgency,
            LocationCity = escalation.Request.LocationCity,
            LocationRadiusKm = escalation.Request.LocationRadiusKm,
            StartDate = escalation.Request.StartDate,
            EndDate = escalation.Request.EndDate,
            Skills = escalation.Request.Skills
                .OrderBy(skill => skill.Name)
                .Select(skill => skill.Name)
                .ToList(),
            Certificates = escalation.Request.Certificates
                .OrderBy(certificate => certificate.Name)
                .Select(certificate => certificate.Name)
                .ToList(),
            TotalResponses = escalation.Responses.Count,
            HelpResponses = escalation.Responses.Count(r => r.ResponseType == NetworkResponseType.CanHelp),
            NeedCapacityResponses = escalation.Responses.Count(r => r.ResponseType == NetworkResponseType.NeedCapacity),
            HasResponded = companyResponse is not null,
            ResponseType = companyResponse?.ResponseType,
            RespondedAt = companyResponse?.CreatedAt
        };
    }
}
