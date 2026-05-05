using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Kapacitet.Application.Features.Notifications.Services;

public class CooperationReminderService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CooperationReminderService> _logger;

    public CooperationReminderService(
        IServiceScopeFactory scopeFactory,
        ILogger<CooperationReminderService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessRemindersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing cooperation reminders");
            }

            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private async Task ProcessRemindersAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<EmailService>();
        var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

        var now = DateTime.UtcNow;
        var windowStart = now.AddHours(47);
        var windowEnd = now.AddHours(49);

        var agreements = await db.CooperationAgreements
            .Include(a => a.MatchOffer)
                .ThenInclude(o => o.Request)
            .Include(a => a.MatchOffer)
                .ThenInclude(o => o.Availability)
            .Where(a =>
                a.Status == AgreementStatus.Active &&
                a.StartDate >= windowStart &&
                a.StartDate <= windowEnd &&
                a.ReminderEmailSentAt == null)
            .ToListAsync(ct);

        foreach (var agreement in agreements)
        {
            var requesterCompanyId = agreement.MatchOffer.Request.CompanyId;
            var supplierCompanyId = agreement.MatchOffer.Availability.CompanyId;

            await emailService.SendCooperationReminderEmailIfEnabledAsync(
                requesterCompanyId, agreement.Id, agreement.StartDate);
            await emailService.SendCooperationReminderEmailIfEnabledAsync(
                supplierCompanyId, agreement.Id, agreement.StartDate);
            await notificationService.QueueUpcomingCooperationNotificationAsync(
                requesterCompanyId, agreement.Id, agreement.StartDate);
            await notificationService.QueueUpcomingCooperationNotificationAsync(
                supplierCompanyId, agreement.Id, agreement.StartDate);

            agreement.ReminderEmailSentAt = now;
            _logger.LogInformation("Sent 48h reminder for Agreement {AgreementId}", agreement.Id);
        }

        if (agreements.Count > 0)
            await db.SaveChangesAsync(ct);
    }

    // For testing only
    public Task TestProcessReminders(CancellationToken ct) => ProcessRemindersAsync(ct);
}
