using FluentAssertions;
using Kapacitet.Application.Features.Notifications;
using Kapacitet.Application.Features.Notifications.Services;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Tests.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Resend;

namespace Kapacitet.Tests.Unit;

public class NotificationServiceTests
{
    private static (NotificationService notifications, Mock<IResend> resendMock) CreateServices(AppDbContext db)
    {
        var resendMock = new Mock<IResend>();
        var emailOptions = Options.Create(new EmailOptions { DevMode = false, FromAddress = "test@resend.dev", FromName = "Test" });
        var emailSvc = new EmailService(db, resendMock.Object, emailOptions, NullLogger<EmailService>.Instance);
        var notifSvc = new NotificationService(db, emailSvc, NullLogger<NotificationService>.Instance);
        return (notifSvc, resendMock);
    }

    [Fact]
    public async Task QueueNewMatch_CreatesTwoNotificationsAndCallsEmailTwice()
    {
        var db = TestDbFactory.Create();
        foreach (var (id, email) in new[] { (1, "a@a.com"), (2, "b@b.com") })
        {
            db.Companies.Add(new Company { Id = id, Name = "X", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow });
            db.Users.Add(new User { Id = id, CompanyId = id, Email = email, Role = UserRole.Admin, CreatedAt = DateTime.UtcNow });
        }
        await db.SaveChangesAsync();

        var (svc, resendMock) = CreateServices(db);
        await svc.QueueNewMatchNotificationsAsync(1, 2, 99);
        await db.SaveChangesAsync();

        db.Notifications.Count().Should().Be(2);
        resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task QueueNewMatch_WhenInAppDisabled_SkipsNotificationButStillSendsEmail()
    {
        var db = TestDbFactory.Create();
        db.Companies.Add(new Company { Id = 1, Name = "X", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow });
        db.Users.Add(new User { Id = 1, CompanyId = 1, Email = "a@a.com", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow });
        db.NotificationPreferences.Add(new NotificationPreferences { CompanyId = 1, InAppNewMatches = false, EmailNewMatches = true });

        db.Companies.Add(new Company { Id = 2, Name = "Y", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow });
        db.Users.Add(new User { Id = 2, CompanyId = 2, Email = "b@b.com", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var (svc, resendMock) = CreateServices(db);
        await svc.QueueNewMatchNotificationsAsync(1, 2, 99);
        await db.SaveChangesAsync();

        // Firma 1 ma wyłączone InApp — brak notyfikacji in-app dla niej
        db.Notifications.Count(n => n.CompanyId == 1).Should().Be(0);
        // Firma 2 ma włączone — dostaje notyfikację
        db.Notifications.Count(n => n.CompanyId == 2).Should().Be(1);
        // Email nadal idzie do obu firm
        resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task QueueNetworkOutreach_DeduplicatesForSameMetadata()
    {
        var db = TestDbFactory.Create();
        db.Companies.Add(new Company { Id = 1, Name = "X", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow });
        db.Users.Add(new User { Id = 1, CompanyId = 1, Email = "a@a.com", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var triggeredAt = new DateTime(2026, 5, 1, 10, 0, 0, DateTimeKind.Utc);
        var (svc, _) = CreateServices(db);

        await svc.QueueNetworkEscalationOutreachNotificationAsync(1, 42, triggeredAt);
        await db.SaveChangesAsync();
        await svc.QueueNetworkEscalationOutreachNotificationAsync(1, 42, triggeredAt);
        await db.SaveChangesAsync();

        db.Notifications.Count().Should().Be(1);
    }

    [Fact]
    public async Task QueueSupplierConfirmation_WhenInAppDisabled_StillSendsEmail()
    {
        var db = TestDbFactory.Create();
        db.Companies.Add(new Company { Id = 1, Name = "X", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow });
        db.Users.Add(new User { Id = 1, CompanyId = 1, Email = "supplier@test.com", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow });
        db.NotificationPreferences.Add(new NotificationPreferences
        {
            CompanyId = 1,
            InAppActionsRequired = false,
            EmailActionsRequired = true
        });
        await db.SaveChangesAsync();

        var (svc, resendMock) = CreateServices(db);
        await svc.QueueSupplierConfirmationNotificationAsync(1, 42);
        await db.SaveChangesAsync();

        db.Notifications.Should().BeEmpty();
        resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task QueueNetworkEscalation_WhenInAppDisabled_StillSendsEmail()
    {
        var db = TestDbFactory.Create();
        db.Companies.Add(new Company { Id = 1, Name = "X", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow });
        db.Users.Add(new User { Id = 1, CompanyId = 1, Email = "requester@test.com", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow });
        db.NotificationPreferences.Add(new NotificationPreferences
        {
            CompanyId = 1,
            InAppNetworkRequests = false,
            EmailNetworkRequests = true
        });
        await db.SaveChangesAsync();

        var (svc, resendMock) = CreateServices(db);
        await svc.QueueNetworkEscalationNotificationAsync(1, 17);
        await db.SaveChangesAsync();

        db.Notifications.Should().BeEmpty();
        resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task QueueNewMatch_WhenEmailProviderFails_StillCreatesInAppNotifications()
    {
        var db = TestDbFactory.Create();
        foreach (var (id, email) in new[] { (1, "a@a.com"), (2, "b@b.com") })
        {
            db.Companies.Add(new Company { Id = id, Name = "X", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow });
            db.Users.Add(new User { Id = id, CompanyId = id, Email = email, Role = UserRole.Admin, CreatedAt = DateTime.UtcNow });
        }
        await db.SaveChangesAsync();

        var (svc, resendMock) = CreateServices(db);
        resendMock
            .Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("email down"));

        await svc.QueueNewMatchNotificationsAsync(1, 2, 99);
        await db.SaveChangesAsync();

        db.Notifications.Count().Should().Be(2);
    }

    [Fact]
    public async Task QueueUpcomingCooperation_WhenEnabled_CreatesSingleInAppNotification()
    {
        var db = TestDbFactory.Create();
        db.Companies.Add(new Company { Id = 1, Name = "X", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow });
        db.Users.Add(new User { Id = 1, CompanyId = 1, Email = "a@a.com", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var (svc, _) = CreateServices(db);
        var startDate = new DateTime(2027, 6, 1, 0, 0, 0, DateTimeKind.Utc);

        await svc.QueueUpcomingCooperationNotificationAsync(1, 42, startDate);
        await db.SaveChangesAsync();
        await svc.QueueUpcomingCooperationNotificationAsync(1, 42, startDate);
        await db.SaveChangesAsync();

        db.Notifications.Should().ContainSingle(n =>
            n.CompanyId == 1 &&
            n.Type == NotificationType.UpcomingCooperation &&
            n.Metadata == "{\"agreementId\":42}");
    }

    [Fact]
    public async Task MarkAsRead_WhenNotificationExists_SetsIsReadTrue()
    {
        var db = TestDbFactory.Create();
        db.Notifications.Add(new Notification { Id = 1, CompanyId = 1, Type = NotificationType.NewMatch, Title = "T", Body = "B", IsRead = false, CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var (svc, _) = CreateServices(db);
        await svc.MarkAsReadAsync(1, 1);

        db.Notifications.Single().IsRead.Should().BeTrue();
    }

    [Fact]
    public async Task MarkAsRead_WhenNotificationNotFound_ThrowsKeyNotFound()
    {
        var db = TestDbFactory.Create();
        var (svc, _) = CreateServices(db);

        var act = async () => await svc.MarkAsReadAsync(999, 1);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task MarkAllAsRead_UpdatesOnlyUnreadNotificationsForTheTargetCompany()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        db.Companies.AddRange(
            new Company
            {
                Id = 1,
                Name = "Requester",
                Industry = "Construction",
                DefaultLocation = "Aarhus",
                Status = CompanyStatus.Active,
                CreatedAt = DateTime.UtcNow
            },
            new Company
            {
                Id = 2,
                Name = "Supplier",
                Industry = "Construction",
                DefaultLocation = "Odense",
                Status = CompanyStatus.Active,
                CreatedAt = DateTime.UtcNow
            });
        db.Notifications.AddRange(
            new Notification
            {
                Id = 1,
                CompanyId = 1,
                Type = NotificationType.NewMatch,
                Title = "Unread",
                Body = "B",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            },
            new Notification
            {
                Id = 2,
                CompanyId = 1,
                Type = NotificationType.NewMatch,
                Title = "Already read",
                Body = "B",
                IsRead = true,
                CreatedAt = DateTime.UtcNow
            },
            new Notification
            {
                Id = 3,
                CompanyId = 2,
                Type = NotificationType.NewMatch,
                Title = "Other company",
                Body = "B",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        await db.SaveChangesAsync();

        var (svc, _) = CreateServices(db);
        await svc.MarkAllAsReadAsync(1);

        db.ChangeTracker.Clear();

        var notifications = db.Notifications
            .AsNoTracking()
            .OrderBy(notification => notification.Id)
            .ToList();
        notifications.Single(notification => notification.Id == 1).IsRead.Should().BeTrue();
        notifications.Single(notification => notification.Id == 2).IsRead.Should().BeTrue();
        notifications.Single(notification => notification.Id == 3).IsRead.Should().BeFalse();
    }
}
