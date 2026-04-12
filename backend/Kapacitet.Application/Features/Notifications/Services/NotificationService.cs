using Kapacitet.Application.Features.Notifications.DTOs;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.Notifications.Services;

public class NotificationService
{
    private readonly AppDbContext _db;

    public NotificationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<NotificationDto>> GetForCompanyAsync(int companyId, CancellationToken ct = default)
    {
        return await _db.Notifications
            .Where(n => n.CompanyId == companyId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Body = n.Body,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                Metadata = n.Metadata
            })
            .ToListAsync(ct);
    }

    public async Task MarkAsReadAsync(int notificationId, int companyId, CancellationToken ct = default)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.CompanyId == companyId, ct)
            ?? throw new KeyNotFoundException($"Notification {notificationId} not found");

        notification.IsRead = true;
        await _db.SaveChangesAsync(ct);
    }

    public async Task MarkAllAsReadAsync(int companyId, CancellationToken ct = default)
    {
        await _db.Notifications
            .Where(n => n.CompanyId == companyId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);
    }

    // Internal — called by MatchingGenerationService AFTER SaveChangesAsync
    // so matchOfferId is already populated by EF.
    public async Task QueueNewMatchNotificationsAsync(
        int requesterCompanyId,
        int supplierCompanyId,
        int matchOfferId)
    {
        var metadata = $"{{\"matchOfferId\":{matchOfferId}}}";

        if (await IsInAppEnabledAsync(requesterCompanyId, p => p.InAppNewMatches))
        {
            _db.Notifications.Add(new Notification
            {
                CompanyId = requesterCompanyId,
                Type = NotificationType.NewMatch,
                Title = "New match found",
                Body = "A new capacity match has been found for your request.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                Metadata = metadata
            });
        }

        if (await IsInAppEnabledAsync(supplierCompanyId, p => p.InAppNewMatches))
        {
            _db.Notifications.Add(new Notification
            {
                CompanyId = supplierCompanyId,
                Type = NotificationType.NewMatch,
                Title = "New match found",
                Body = "Your availability has been matched with a capacity request.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                Metadata = metadata
            });
        }
        // Caller must call SaveChangesAsync.
    }

    // Internal — called by MatchingService.AcceptAsRequesterAsync BEFORE SaveChangesAsync.
    public async Task QueueSupplierConfirmationNotificationAsync(int supplierCompanyId, int matchOfferId)
    {
        if (!await IsInAppEnabledAsync(supplierCompanyId, p => p.InAppActionsRequired))
            return;

        _db.Notifications.Add(new Notification
        {
            CompanyId = supplierCompanyId,
            Type = NotificationType.SupplierConfirmationRequest,
            Title = "Action required: confirm a match",
            Body = "A company has accepted your availability offer. Please confirm or decline.",
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            Metadata = $"{{\"matchOfferId\":{matchOfferId}}}"
        });
        // Caller must call SaveChangesAsync.
    }

    // Internal — called by MatchingEscalationService when a new/re-opened escalation is created.
    public async Task QueueNetworkEscalationNotificationAsync(int requesterCompanyId, int requestId)
    {
        if (!await IsInAppEnabledAsync(requesterCompanyId, p => p.InAppActionsRequired))
            return;

        _db.Notifications.Add(new Notification
        {
            CompanyId = requesterCompanyId,
            Type = NotificationType.NetworkEscalation,
            Title = "Your request has been escalated",
            Body = "No matches were found. Your capacity request has been escalated to the broader network.",
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            Metadata = $"{{\"requestId\":{requestId}}}"
        });
        // Caller must call SaveChangesAsync.
    }

    // Internal — called when eligible recipient companies should be notified.
    public async Task QueueNetworkEscalationOutreachNotificationAsync(
        int recipientCompanyId,
        int requestId,
        DateTime triggeredAt)
    {
        if (!await IsInAppEnabledAsync(recipientCompanyId, p => p.InAppActionsRequired))
            return;

        var metadata =
            $"{{\"requestId\":{requestId},\"triggeredAt\":\"{triggeredAt:O}\"}}";

        var exists = await _db.Notifications.AnyAsync(n =>
            n.CompanyId == recipientCompanyId &&
            n.Type == NotificationType.NetworkEscalation &&
            n.Metadata == metadata);

        if (exists)
            return;

        _db.Notifications.Add(new Notification
        {
            CompanyId = recipientCompanyId,
            Type = NotificationType.NetworkEscalation,
            Title = "Action required: network request",
            Body = "A high-priority network request is awaiting your company's response.",
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            Metadata = metadata
        });
    }

    // Default to true if company has no preferences row yet.
    private async Task<bool> IsInAppEnabledAsync(int companyId, Func<NotificationPreferences, bool> selector)
    {
        var prefs = await _db.NotificationPreferences
            .FirstOrDefaultAsync(p => p.CompanyId == companyId);
        return prefs == null || selector(prefs);
    }
}
