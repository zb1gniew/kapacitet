using FluentAssertions;
using Kapacitet.Application.Features.Matching.Services;
using Kapacitet.Application.Features.Notifications;
using Kapacitet.Application.Features.Notifications.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Tests.Helpers;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Resend;

namespace Kapacitet.Tests.Unit;

public class MatchingEscalationServiceTests
{
    private static MatchingEscalationService CreateService(Kapacitet.Infrastructure.Persistence.AppDbContext db)
    {
        var emailOptions = Options.Create(new EmailOptions
        {
            DevMode = true,
            FromAddress = "test@resend.dev",
            FromName = "Test"
        });
        var emailSvc = new EmailService(db, new Mock<IResend>().Object, emailOptions, NullLogger<EmailService>.Instance);
        var notifSvc = new NotificationService(db, emailSvc, NullLogger<NotificationService>.Instance);
        var outreachSvc = new NetworkEscalationOutreachService(db, notifSvc);
        return new MatchingEscalationService(db, notifSvc, outreachSvc);
    }

    private static CapacityRequest MakeRequest(int id = 1, UrgencyLevel urgency = UrgencyLevel.High) => new()
    {
        Id = id,
        CompanyId = 1,
        ResourceType = ResourceType.Worker,
        Quantity = 1,
        StartDate = DateTime.UtcNow,
        EndDate = DateTime.UtcNow.AddDays(30),
        LocationCity = "Aarhus",
        Status = ListingStatus.Active,
        Urgency = urgency,
        CreatedAt = DateTime.UtcNow
    };

    // ── Low urgency ───────────────────────────────────────────────────────────

    [Fact]
    public async Task UpsertAsync_WhenUrgencyLow_NoOpenOffers_DoesNotCreateEscalation()
    {
        var db = TestDbFactory.Create();
        await CreateService(db).UpsertAsync(MakeRequest(urgency: UrgencyLevel.Low), noOpenOffers: true);
        await db.SaveChangesAsync();

        db.NetworkEscalations.Should().BeEmpty();
    }

    [Fact]
    public async Task UpsertAsync_WhenUrgencyMedium_NoOpenOffers_DoesNotCreateEscalation()
    {
        var db = TestDbFactory.Create();
        await CreateService(db).UpsertAsync(MakeRequest(urgency: UrgencyLevel.Medium), noOpenOffers: true);
        await db.SaveChangesAsync();

        db.NetworkEscalations.Should().BeEmpty();
    }

    [Fact]
    public async Task UpsertAsync_WhenUrgencyLow_ExistingOpenEscalation_ResolvesIt()
    {
        var db = TestDbFactory.Create();
        db.NetworkEscalations.Add(new NetworkEscalation
        {
            Id = 1,
            RequestId = 1,
            TriggeredAt = DateTime.UtcNow.AddHours(-1),
            Status = NetworkEscalationStatus.Open
        });
        await db.SaveChangesAsync();

        await CreateService(db).UpsertAsync(MakeRequest(urgency: UrgencyLevel.Low), noOpenOffers: false);
        await db.SaveChangesAsync();

        db.NetworkEscalations.Single().Status.Should().Be(NetworkEscalationStatus.Resolved);
    }

    // ── High urgency, no open offers ─────────────────────────────────────────

    [Fact]
    public async Task UpsertAsync_WhenUrgencyHigh_NoOpenOffers_NoExistingEscalation_CreatesOpenEscalation()
    {
        var db = TestDbFactory.Create();
        await CreateService(db).UpsertAsync(MakeRequest(urgency: UrgencyLevel.High), noOpenOffers: true);
        await db.SaveChangesAsync();

        db.NetworkEscalations.Should().ContainSingle()
            .Which.Status.Should().Be(NetworkEscalationStatus.Open);
    }

    [Fact]
    public async Task UpsertAsync_WhenUrgencyCritical_NoOpenOffers_NoExistingEscalation_CreatesOpenEscalation()
    {
        var db = TestDbFactory.Create();
        await CreateService(db).UpsertAsync(MakeRequest(urgency: UrgencyLevel.Critical), noOpenOffers: true);
        await db.SaveChangesAsync();

        db.NetworkEscalations.Should().ContainSingle()
            .Which.Status.Should().Be(NetworkEscalationStatus.Open);
    }

    [Fact]
    public async Task UpsertAsync_WhenUrgencyHigh_NoOpenOffers_NoExistingEscalation_QueuesInAppNotificationForRequester()
    {
        var db = TestDbFactory.Create();
        await CreateService(db).UpsertAsync(MakeRequest(urgency: UrgencyLevel.High), noOpenOffers: true);
        await db.SaveChangesAsync();

        db.Notifications.Should().ContainSingle(n =>
            n.CompanyId == 1 &&
            n.Type == NotificationType.NetworkEscalation);
    }

    [Fact]
    public async Task UpsertAsync_WhenUrgencyHigh_NoOpenOffers_ExistingResolvedEscalation_ReOpensIt()
    {
        var db = TestDbFactory.Create();
        db.NetworkEscalations.Add(new NetworkEscalation
        {
            Id = 1,
            RequestId = 1,
            TriggeredAt = DateTime.UtcNow.AddHours(-24),
            Status = NetworkEscalationStatus.Resolved
        });
        await db.SaveChangesAsync();

        await CreateService(db).UpsertAsync(MakeRequest(urgency: UrgencyLevel.High), noOpenOffers: true);
        await db.SaveChangesAsync();

        db.NetworkEscalations.Should().ContainSingle()
            .Which.Status.Should().Be(NetworkEscalationStatus.Open);
    }

    [Fact]
    public async Task UpsertAsync_WhenUrgencyHigh_NoOpenOffers_ExistingOpenEscalation_DoesNotDuplicate()
    {
        var db = TestDbFactory.Create();
        db.NetworkEscalations.Add(new NetworkEscalation
        {
            Id = 1,
            RequestId = 1,
            TriggeredAt = DateTime.UtcNow.AddHours(-1),
            Status = NetworkEscalationStatus.Open
        });
        await db.SaveChangesAsync();

        await CreateService(db).UpsertAsync(MakeRequest(urgency: UrgencyLevel.High), noOpenOffers: true);
        await db.SaveChangesAsync();

        db.NetworkEscalations.Should().ContainSingle();
    }

    // ── High urgency, has open offers ────────────────────────────────────────

    [Fact]
    public async Task UpsertAsync_WhenUrgencyHigh_HasOpenOffers_ExistingOpenEscalation_ResolvesIt()
    {
        var db = TestDbFactory.Create();
        db.NetworkEscalations.Add(new NetworkEscalation
        {
            Id = 1,
            RequestId = 1,
            TriggeredAt = DateTime.UtcNow.AddHours(-2),
            Status = NetworkEscalationStatus.Open
        });
        await db.SaveChangesAsync();

        await CreateService(db).UpsertAsync(MakeRequest(urgency: UrgencyLevel.High), noOpenOffers: false);
        await db.SaveChangesAsync();

        db.NetworkEscalations.Single().Status.Should().Be(NetworkEscalationStatus.Resolved);
    }

    [Fact]
    public async Task UpsertAsync_WhenUrgencyHigh_HasOpenOffers_NoExistingEscalation_DoesNotCreate()
    {
        var db = TestDbFactory.Create();

        await CreateService(db).UpsertAsync(MakeRequest(urgency: UrgencyLevel.High), noOpenOffers: false);
        await db.SaveChangesAsync();

        db.NetworkEscalations.Should().BeEmpty();
    }
}
