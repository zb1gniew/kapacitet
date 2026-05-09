using System.Net;
using System.Text.Json;
using FluentAssertions;
using Kapacitet.API.Auth;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.E2ETests.Infrastructure;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.E2ETests;

public class NotificationsApiTests
{
    [Fact]
    public async Task GetAll_WhenUnauthenticated_ReturnsUnauthorized()
    {
        await using var factory = new ApiTestApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/notifications");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetAll_ReturnsOnlyCurrentCompanyNotificationsOrderedNewestFirst()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var company = AddCompany(db, "Requester");
            var otherCompany = AddCompany(db, "Other");

            db.Users.Add(new User
            {
                Company = company,
                Email = "viewer@test.local",
                Role = UserRole.Viewer,
                CreatedAt = DateTime.UtcNow
            });

            db.Notifications.AddRange(
                new Notification
                {
                    Company = company,
                    Type = NotificationType.NewMatch,
                    Title = "Older",
                    Body = "Older body",
                    CreatedAt = DateTime.UtcNow.AddMinutes(-5)
                },
                new Notification
                {
                    Company = company,
                    Type = NotificationType.NetworkEscalation,
                    Title = "Newest",
                    Body = "Newest body",
                    CreatedAt = DateTime.UtcNow
                },
                new Notification
                {
                    Company = otherCompany,
                    Type = NotificationType.NewMatch,
                    Title = "Foreign",
                    Body = "Should not leak",
                    CreatedAt = DateTime.UtcNow.AddMinutes(1)
                });

            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("viewer@test.local", AuthorizationRoles.Viewer);

        var response = await client.GetAsync("/api/notifications");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var items = document.RootElement;
        items.GetArrayLength().Should().Be(2);
        items[0].GetProperty("title").GetString().Should().Be("Newest");
        items[1].GetProperty("title").GetString().Should().Be("Older");
    }

    [Fact]
    public async Task MarkRead_MarksOnlySelectedNotificationForCurrentCompany()
    {
        await using var factory = new ApiTestApplicationFactory();
        var notificationId = 0;
        await factory.SeedAsync(db =>
        {
            var company = AddCompany(db, "Requester");
            db.Users.Add(new User
            {
                Company = company,
                Email = "viewer@test.local",
                Role = UserRole.Viewer,
                CreatedAt = DateTime.UtcNow
            });

            var notification = new Notification
            {
                Company = company,
                Type = NotificationType.NewMatch,
                Title = "Read me",
                Body = "Body",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            db.Notifications.Add(notification);
            db.SaveChanges();
            notificationId = notification.Id;
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("viewer@test.local", AuthorizationRoles.Viewer);

        var response = await client.PostAsync($"/api/notifications/{notificationId}/read", null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        await factory.ExecuteDbAsync(async db =>
        {
            var notification = await db.Notifications.FindAsync(notificationId);
            notification!.IsRead.Should().BeTrue();
        });
    }

    [Fact]
    public async Task MarkAllRead_UpdatesUnreadNotificationsForCurrentCompany()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var company = AddCompany(db, "Requester");
            var otherCompany = AddCompany(db, "Other");
            db.Users.Add(new User
            {
                Company = company,
                Email = "viewer@test.local",
                Role = UserRole.Viewer,
                CreatedAt = DateTime.UtcNow
            });

            db.Notifications.AddRange(
                new Notification
                {
                    Company = company,
                    Type = NotificationType.NewMatch,
                    Title = "Unread one",
                    Body = "Body",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                },
                new Notification
                {
                    Company = company,
                    Type = NotificationType.NewMatch,
                    Title = "Unread two",
                    Body = "Body",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                },
                new Notification
                {
                    Company = otherCompany,
                    Type = NotificationType.NewMatch,
                    Title = "Other",
                    Body = "Body",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                });

            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("viewer@test.local", AuthorizationRoles.Viewer);

        var response = await client.PostAsync("/api/notifications/read-all", null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        await factory.ExecuteDbAsync(async db =>
        {
            var requesterReadStates = await db.Notifications
                .Where(n => n.Company.Name == "Requester")
                .Select(n => n.IsRead)
                .ToListAsync();
            requesterReadStates.Should().OnlyContain(isRead => isRead);

            var foreign = await db.Notifications.SingleAsync(n => n.Company.Name == "Other");
            foreign.IsRead.Should().BeFalse();
        });
    }

    [Fact]
    public async Task MarkRead_WhenNotificationBelongsToAnotherCompany_ReturnsNotFound()
    {
        await using var factory = new ApiTestApplicationFactory();
        var foreignNotificationId = 0;

        await factory.SeedAsync(db =>
        {
            var requester = AddCompany(db, "Requester");
            var supplier = AddCompany(db, "Supplier");

            db.Users.Add(new User
            {
                Company = requester,
                Email = "viewer@test.local",
                Role = UserRole.Viewer,
                CreatedAt = DateTime.UtcNow
            });

            var foreignNotification = new Notification
            {
                Company = supplier,
                Type = NotificationType.NewMatch,
                Title = "Foreign",
                Body = "Foreign body",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            db.Notifications.Add(foreignNotification);
            db.SaveChanges();
            foreignNotificationId = foreignNotification.Id;

            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("viewer@test.local", AuthorizationRoles.Viewer);

        var response = await client.PostAsync($"/api/notifications/{foreignNotificationId}/read", null);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        await factory.ExecuteDbAsync(async db =>
        {
            var notification = await db.Notifications.FindAsync(foreignNotificationId);
            notification!.IsRead.Should().BeFalse();
        });
    }

    private static Company AddCompany(AppDbContext db, string name)
    {
        var company = new Company
        {
            Name = name,
            Industry = "Construction",
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        db.Companies.Add(company);
        return company;
    }
}
