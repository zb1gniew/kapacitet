using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Kapacitet.Application.Features.Retention;

public class DataRetentionService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DataRetentionService> _logger;

    public DataRetentionService(
        IServiceScopeFactory scopeFactory,
        ILogger<DataRetentionService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await RunRetentionAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Data retention job failed");
            }

            await Task.Delay(TimeSpan.FromHours(24), ct);
        }
    }

    internal async Task RunRetentionAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var cutoff = DateTime.UtcNow.AddMonths(-12);

        // Hard delete: terminal access requests older than 12 months
        var deletedAccessRequests = await db.AccessRequests
            .Where(r => r.ReviewedAt <= cutoff &&
                (r.Status == AccessRequestStatus.Approved ||
                 r.Status == AccessRequestStatus.Rejected))
            .ExecuteDeleteAsync(ct);

        // Hard delete: closed/cancelled capacity requests older than 12 months
        var deletedCapacityRequests = await db.CapacityRequests
            .Where(r => r.EndDate <= cutoff &&
                (r.Status == ListingStatus.Fulfilled ||
                 r.Status == ListingStatus.Cancelled ||
                 r.Status == ListingStatus.Expired))
            .ExecuteDeleteAsync(ct);

        // Hard delete: closed/cancelled availability declarations older than 12 months
        var deletedAvailability = await db.AvailabilityDeclarations
            .Where(d => d.EndDate <= cutoff &&
                (d.Status == ListingStatus.Fulfilled ||
                 d.Status == ListingStatus.Cancelled ||
                 d.Status == ListingStatus.Expired))
            .ExecuteDeleteAsync(ct);

        // Hard delete: terminal match offers older than 12 months
        var deletedMatchOffers = await db.MatchOffers
            .Where(o => o.ExpiresAt <= cutoff &&
                (o.Status == MatchStatus.Expired ||
                 o.Status == MatchStatus.RequesterDeclined ||
                 o.Status == MatchStatus.SupplierDeclined ||
                 o.Status == MatchStatus.Withdrawn))
            .ExecuteDeleteAsync(ct);

        // Hard delete: notifications older than 12 months
        var deletedNotifications = await db.Notifications
            .Where(n => n.CreatedAt <= cutoff)
            .ExecuteDeleteAsync(ct);

        // Anonymize user emails older than 12 months
        // Uses format "anonymized-{id}@deleted.local" to satisfy NOT NULL + unique constraints
        var anonymizedUsers = await db.Users
            .Where(u => u.CreatedAt <= cutoff &&
                !u.Email.StartsWith("anonymized-"))
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.Email, u => "anonymized-" + u.Id + "@deleted.local"), ct);

        _logger.LogInformation(
            "Data retention pass completed. Deleted: {AccessRequests} access requests, " +
            "{CapacityRequests} capacity requests, {Availability} availability declarations, " +
            "{MatchOffers} match offers, {Notifications} notifications. " +
            "Anonymized: {Users} users.",
            deletedAccessRequests, deletedCapacityRequests, deletedAvailability,
            deletedMatchOffers, deletedNotifications, anonymizedUsers);
    }
}
