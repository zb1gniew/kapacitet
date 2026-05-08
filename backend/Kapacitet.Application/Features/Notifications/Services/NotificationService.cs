using Kapacitet.Application.Features.Notifications.DTOs;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Kapacitet.Application.Features.Notifications.Services;

public class NotificationService
{
    private readonly AppDbContext _db;
    private readonly EmailService _emailService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        AppDbContext db,
        EmailService emailService,
        ILogger<NotificationService> logger)
    {
        _db = db;
        _emailService = emailService;
        _logger = logger;
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

        await TrySendEmailAsync(
            () => _emailService.SendNewMatchEmailIfEnabledAsync(requesterCompanyId, matchOfferId),
            $"new match notification for requester company {requesterCompanyId}, match {matchOfferId}");
        await TrySendEmailAsync(
            () => _emailService.SendNewMatchEmailIfEnabledAsync(supplierCompanyId, matchOfferId),
            $"new match notification for supplier company {supplierCompanyId}, match {matchOfferId}");
        // Caller must call SaveChangesAsync.
    }

    // Internal — called by MatchingService.AcceptAsRequesterAsync BEFORE SaveChangesAsync.
    public async Task QueueSupplierConfirmationNotificationAsync(int supplierCompanyId, int matchOfferId)
    {
        if (await IsInAppEnabledAsync(supplierCompanyId, p => p.InAppActionsRequired))
        {
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
        }

        await TrySendEmailAsync(
            () => _emailService.SendSupplierConfirmationEmailIfEnabledAsync(supplierCompanyId, matchOfferId),
            $"supplier confirmation request for company {supplierCompanyId}, match {matchOfferId}");
        // Caller must call SaveChangesAsync.
    }

    public async Task QueueUpcomingCooperationNotificationAsync(
        int companyId,
        int agreementId,
        DateTime startDate)
    {
        if (!await IsInAppEnabledAsync(companyId, p => p.InAppUpcomingCooperation))
            return;

        var metadata = $"{{\"agreementId\":{agreementId}}}";
        var exists = await _db.Notifications.AnyAsync(n =>
            n.CompanyId == companyId &&
            n.Type == NotificationType.UpcomingCooperation &&
            n.Metadata == metadata);

        if (exists)
            return;

        _db.Notifications.Add(new Notification
        {
            CompanyId = companyId,
            Type = NotificationType.UpcomingCooperation,
            Title = "Upcoming cooperation starts soon",
            Body = $"Agreement #{agreementId} begins on {startDate:yyyy-MM-dd}.",
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            Metadata = metadata
        });
    }

    // Internal — called by MatchingEscalationService when a new/re-opened escalation is created.
    public async Task QueueNetworkEscalationNotificationAsync(int requesterCompanyId, int requestId)
    {
        if (await IsInAppEnabledAsync(requesterCompanyId, p => p.InAppNetworkRequests))
        {
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
        }
        // Caller must call SaveChangesAsync.
        await TrySendEmailAsync(
            () => _emailService.SendNetworkEscalationEmailIfEnabledAsync(requesterCompanyId, requestId),
            $"network escalation for requester company {requesterCompanyId}, request {requestId}");
    }

    // Internal — called when eligible recipient companies should be notified.
    public async Task QueueNetworkEscalationOutreachNotificationAsync(
        int recipientCompanyId,
        int requestId,
        DateTime triggeredAt)
    {
        var metadata =
            $"{{\"requestId\":{requestId},\"triggeredAt\":\"{triggeredAt:O}\"}}";

        if (await IsInAppEnabledAsync(recipientCompanyId, p => p.InAppNetworkRequests))
        {
            var exists = await _db.Notifications.AnyAsync(n =>
                n.CompanyId == recipientCompanyId &&
                n.Type == NotificationType.NetworkEscalation &&
                n.Metadata == metadata);

            if (!exists)
            {
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
        }

        await TrySendEmailAsync(
            () => _emailService.SendNetworkEscalationOutreachEmailIfEnabledAsync(recipientCompanyId, requestId),
            $"network escalation outreach for company {recipientCompanyId}, request {requestId}");
    }

    public async Task SendAgreementConfirmedEmailBestEffortAsync(
        int requesterCompanyId,
        int supplierCompanyId,
        int matchOfferId,
        DateTime startDate,
        DateTime endDate)
    {
        await TrySendEmailAsync(
            () => _emailService.SendAgreementConfirmedEmailIfEnabledAsync(
                requesterCompanyId,
                supplierCompanyId,
                matchOfferId,
                startDate,
                endDate),
            $"agreement confirmation for match {matchOfferId}");
    }

    // Default to true if company has no preferences row yet.
    private async Task<bool> IsInAppEnabledAsync(int companyId, Func<NotificationPreferences, bool> selector)
    {
        var prefs = await _db.NotificationPreferences
            .FirstOrDefaultAsync(p => p.CompanyId == companyId);
        return prefs == null || selector(prefs);
    }

    private async Task TrySendEmailAsync(Func<Task> sendAsync, string context)
    {
        try
        {
            await sendAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Best-effort email dispatch failed for {Context}", context);
        }
    }
}
