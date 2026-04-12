using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Kapacitet.Application.Features.Notifications.Services;

namespace Kapacitet.Application.Features.Matching.Services;

public sealed class MatchingEscalationService
{
    private readonly AppDbContext _db;
    private readonly NotificationService _notificationService;
    private readonly NetworkEscalationOutreachService _outreachService;

    public MatchingEscalationService(
        AppDbContext db,
        NotificationService notificationService,
        NetworkEscalationOutreachService outreachService)
    {
        _db = db;
        _notificationService = notificationService;
        _outreachService = outreachService;
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
                escalation = new NetworkEscalation
                {
                    RequestId = request.Id,
                    TriggeredAt = DateTime.UtcNow,
                    Status = NetworkEscalationStatus.Open
                };
                _db.NetworkEscalations.Add(escalation);
                await _notificationService.QueueNetworkEscalationNotificationAsync(request.CompanyId, request.Id);
                await _outreachService.QueueOutreachNotificationsAsync(escalation, request);
            }
            else if (escalation.Status != NetworkEscalationStatus.Open)
            {
                escalation.TriggeredAt = DateTime.UtcNow;
                escalation.Status = NetworkEscalationStatus.Open;
                await _notificationService.QueueNetworkEscalationNotificationAsync(request.CompanyId, request.Id);
                await _outreachService.QueueOutreachNotificationsAsync(escalation, request);
            }

            return;
        }

        if (escalation is not null && escalation.Status == NetworkEscalationStatus.Open)
        {
            escalation.Status = NetworkEscalationStatus.Resolved;
        }
    }
}
