using Kapacitet.Application.Features.Notifications.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.Matching.Services;

public sealed class NetworkEscalationOutreachService
{
    private readonly AppDbContext _db;
    private readonly NotificationService _notificationService;

    public NetworkEscalationOutreachService(
        AppDbContext db,
        NotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async Task QueueOutreachNotificationsAsync(
        NetworkEscalation escalation,
        CapacityRequest request)
    {
        var recipientCompanyIds = await _db.Companies
            .AsNoTracking()
            .Include(c => c.CompanySettings)
            .Where(c =>
                c.Id != request.CompanyId &&
                c.Status == CompanyStatus.Active &&
                (c.CompanySettings == null || c.CompanySettings.ReceiveCapacityRequests) &&
                (c.CompanySettings == null || c.CompanySettings.ParticipateInNetworkWide))
            .Select(c => c.Id)
            .ToListAsync();

        foreach (var companyId in recipientCompanyIds)
        {
            await _notificationService.QueueNetworkEscalationOutreachNotificationAsync(
                companyId,
                request.Id,
                escalation.TriggeredAt);
        }
    }
}
