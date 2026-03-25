using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.Matching.Services;

public sealed class MatchingEscalationService
{
    private readonly AppDbContext _db;

    public MatchingEscalationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task UpsertAsync(CapacityRequest request, bool noOpenOffers)
    {
        var escalation = await _db.NetworkEscalations
            .FirstOrDefaultAsync(e => e.RequestId == request.Id);

        var urgent = request.Urgency is UrgencyLevel.High or UrgencyLevel.Critical;
        if (!urgent)
        {
            if (escalation is not null && escalation.Status == NetworkEscalationStatus.Open)
            {
                escalation.Status = NetworkEscalationStatus.Resolved;
            }

            return;
        }

        if (noOpenOffers)
        {
            if (escalation is null)
            {
                _db.NetworkEscalations.Add(new NetworkEscalation
                {
                    RequestId = request.Id,
                    TriggeredAt = DateTime.UtcNow,
                    Status = NetworkEscalationStatus.Open
                });
            }
            else if (escalation.Status != NetworkEscalationStatus.Open)
            {
                escalation.TriggeredAt = DateTime.UtcNow;
                escalation.Status = NetworkEscalationStatus.Open;
            }

            return;
        }

        if (escalation is not null && escalation.Status == NetworkEscalationStatus.Open)
        {
            escalation.Status = NetworkEscalationStatus.Resolved;
        }
    }
}
