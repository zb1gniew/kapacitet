using System.Reflection;
using DotNet.Testcontainers.Builders;
using FluentAssertions;
using Kapacitet.Application.Features.Retention;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Npgsql;
using Testcontainers.PostgreSql;
using Xunit.Sdk;

namespace Kapacitet.Tests.Integration;

public class DataRetentionServiceTests : IAsyncLifetime
{
    private PostgreSqlContainer _postgres = null!;
    private string _connectionString = null!;
    private bool _dockerUnavailable;

    public async Task InitializeAsync()
    {
        try
        {
            _postgres = new PostgreSqlBuilder()
                .WithImage("postgres:15-alpine")
                .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(5432))
                .Build();

            await _postgres.StartAsync();
            _connectionString = _postgres.GetConnectionString();

            await using var db = CreateDbContext(_connectionString);
            await db.Database.MigrateAsync();
        }
        catch (Exception ex) when (IsDockerUnavailable(ex))
        {
            _dockerUnavailable = true;
        }
    }

    public async Task DisposeAsync()
    {
        if (_postgres is not null)
        {
            await _postgres.DisposeAsync();
        }
    }

    [Fact]
    public async Task RunRetentionAsync_WhenRecordsAreOlderThanCutoff_DeletesTerminalDataAndOnlyAnonymizesInactiveUsers()
    {
        if (_dockerUnavailable)
        {
            throw SkipException.ForSkip(
                "Docker is unavailable for retention integration tests.");
        }

        var connectionString = CreateIsolatedConnectionString();
        await InitializeDatabaseAsync(connectionString);
        await using var db = CreateDbContext(connectionString);

        var oldDate = DateTime.UtcNow.AddMonths(-13);
        var recentDate = DateTime.UtcNow.AddMonths(-2);
        var company = AddCompany(db, "Retention Co", oldDate);
        var inactiveCompany = AddCompany(db, "Inactive Retention Co", oldDate);

        db.AccessRequests.AddRange(
            new AccessRequest
            {
                Name = "Old approved request",
                Location = "Aarhus",
                ContactEmail = "old-approved@test.local",
                Status = AccessRequestStatus.Approved,
                ReviewedAt = oldDate,
                CreatedAt = oldDate
            },
            new AccessRequest
            {
                Name = "Recent pending request",
                Location = "Aarhus",
                ContactEmail = "recent-pending@test.local",
                Status = AccessRequestStatus.Pending,
                CreatedAt = recentDate
            });

        var oldFulfilledRequest = new CapacityRequest
        {
            Company = company,
            ResourceType = ResourceType.Worker,
            StartDate = oldDate.AddDays(-5),
            EndDate = oldDate,
            LocationCity = "Aarhus",
            Quantity = 2,
            Status = ListingStatus.Fulfilled,
            Urgency = UrgencyLevel.Medium,
            CreatedAt = oldDate
        };
        var preservedActiveRequest = new CapacityRequest
        {
            Company = company,
            ResourceType = ResourceType.Worker,
            StartDate = oldDate.AddDays(-5),
            EndDate = oldDate,
            LocationCity = "Aarhus",
            Quantity = 2,
            Status = ListingStatus.Active,
            Urgency = UrgencyLevel.Medium,
            CreatedAt = oldDate
        };
        var oldCancelledAvailability = new AvailabilityDeclaration
        {
            Company = company,
            ResourceType = ResourceType.Worker,
            StartDate = oldDate.AddDays(-5),
            EndDate = oldDate,
            LocationCity = "Aarhus",
            Quantity = 1,
            Status = ListingStatus.Cancelled,
            CreatedAt = oldDate
        };
        var preservedActiveAvailability = new AvailabilityDeclaration
        {
            Company = company,
            ResourceType = ResourceType.Worker,
            StartDate = oldDate.AddDays(-5),
            EndDate = oldDate,
            LocationCity = "Aarhus",
            Quantity = 1,
            Status = ListingStatus.Active,
            CreatedAt = oldDate
        };
        var offerRequest = new CapacityRequest
        {
            Company = company,
            ResourceType = ResourceType.Worker,
            StartDate = oldDate.AddDays(-10),
            EndDate = oldDate.AddDays(-1),
            LocationCity = "Aarhus",
            Quantity = 1,
            Status = ListingStatus.Active,
            Urgency = UrgencyLevel.Medium,
            CreatedAt = oldDate
        };
        var offerAvailability = new AvailabilityDeclaration
        {
            Company = company,
            ResourceType = ResourceType.Worker,
            StartDate = oldDate.AddDays(-10),
            EndDate = oldDate.AddDays(-1),
            LocationCity = "Aarhus",
            Quantity = 1,
            Status = ListingStatus.Active,
            CreatedAt = oldDate
        };

        db.AddRange(
            oldFulfilledRequest,
            preservedActiveRequest,
            oldCancelledAvailability,
            preservedActiveAvailability,
            offerRequest,
            offerAvailability);
        await db.SaveChangesAsync();

        db.MatchOffers.AddRange(
            new MatchOffer
            {
                RequestId = offerRequest.Id,
                AvailabilityId = offerAvailability.Id,
                OfferedQuantity = 1,
                MatchScore = 80,
                Explanation = "Old expired offer",
                Status = MatchStatus.Expired,
                CreatedAt = oldDate,
                ExpiresAt = oldDate
            },
            new MatchOffer
            {
                RequestId = offerRequest.Id,
                AvailabilityId = offerAvailability.Id,
                OfferedQuantity = 1,
                MatchScore = 90,
                Explanation = "Still-open offer",
                Status = MatchStatus.PendingRequesterReview,
                CreatedAt = oldDate,
                ExpiresAt = oldDate
            });

        db.Notifications.AddRange(
            new Notification
            {
                CompanyId = company.Id,
                Type = NotificationType.NewMatch,
                Title = "Old notification",
                Body = "Delete me",
                CreatedAt = oldDate
            },
            new Notification
            {
                CompanyId = company.Id,
                Type = NotificationType.NewMatch,
                Title = "Recent notification",
                Body = "Keep me",
                CreatedAt = recentDate
            });

        db.Users.AddRange(
            new User
            {
                CompanyId = company.Id,
                Email = "historic-user@test.local",
                Role = UserRole.Admin,
                CreatedAt = oldDate
            },
            new User
            {
                CompanyId = company.Id,
                Email = "recent-user@test.local",
                Role = UserRole.Admin,
                CreatedAt = recentDate
            },
            new User
            {
                CompanyId = company.Id,
                Email = "anonymized-77@deleted.local",
                Role = UserRole.Admin,
                CreatedAt = oldDate
            },
            new User
            {
                CompanyId = inactiveCompany.Id,
                Email = "inactive-user@test.local",
                Role = UserRole.Admin,
                CreatedAt = oldDate
            });

        await db.SaveChangesAsync();
        await RunRetentionAsync(connectionString);

        await using var assertDb = CreateDbContext(connectionString);
        (await assertDb.AccessRequests.CountAsync()).Should().Be(1);
        (await assertDb.AccessRequests.SingleAsync()).Status.Should().Be(AccessRequestStatus.Pending);

        assertDb.CapacityRequests.Should().HaveCount(2);
        assertDb.CapacityRequests.Should().OnlyContain(r => r.Status == ListingStatus.Active);

        assertDb.AvailabilityDeclarations.Should().HaveCount(2);
        assertDb.AvailabilityDeclarations.Should().OnlyContain(d => d.Status == ListingStatus.Active);

        assertDb.MatchOffers.Should().HaveCount(1);
        (await assertDb.MatchOffers.SingleAsync()).Status.Should().Be(MatchStatus.PendingRequesterReview);

        assertDb.Notifications.Should().HaveCount(1);
        (await assertDb.Notifications.SingleAsync()).Title.Should().Be("Recent notification");

        var users = await assertDb.Users.OrderBy(u => u.Id).ToListAsync();
        users.Should().Contain(u => u.Email == "recent-user@test.local");
        users.Should().Contain(u => u.Email == "anonymized-77@deleted.local");
        users.Should().Contain(u => u.Email == "historic-user@test.local");
        users.Should().ContainSingle(u =>
            u.CompanyId == inactiveCompany.Id &&
            u.Email.StartsWith("anonymized-") &&
            u.Email.EndsWith("@deleted.local"));
    }

    [Fact]
    public async Task RunRetentionAsync_WhenOldRecordsAreNonTerminal_PreservesThem()
    {
        if (_dockerUnavailable)
        {
            throw SkipException.ForSkip(
                "Docker is unavailable for retention integration tests.");
        }

        var connectionString = CreateIsolatedConnectionString();
        await InitializeDatabaseAsync(connectionString);
        await using var db = CreateDbContext(connectionString);

        var oldDate = DateTime.UtcNow.AddMonths(-13);
        var company = AddCompany(db, "Preserve Co", oldDate);

        var draftRequest = new CapacityRequest
        {
            Company = company,
            ResourceType = ResourceType.Worker,
            StartDate = oldDate.AddDays(-7),
            EndDate = oldDate,
            LocationCity = "Aarhus",
            Quantity = 1,
            Status = ListingStatus.Draft,
            Urgency = UrgencyLevel.Medium,
            CreatedAt = oldDate
        };
        var draftAvailability = new AvailabilityDeclaration
        {
            Company = company,
            ResourceType = ResourceType.Worker,
            StartDate = oldDate.AddDays(-7),
            EndDate = oldDate,
            LocationCity = "Aarhus",
            Quantity = 1,
            Status = ListingStatus.Draft,
            CreatedAt = oldDate
        };

        db.AddRange(
            new AccessRequest
            {
                Name = "Unreviewed rejected request",
                Location = "Aarhus",
                ContactEmail = "unreviewed@test.local",
                Status = AccessRequestStatus.Rejected,
                ReviewedAt = null,
                CreatedAt = oldDate
            },
            draftRequest,
            draftAvailability);
        await db.SaveChangesAsync();

        db.MatchOffers.Add(new MatchOffer
        {
            RequestId = draftRequest.Id,
            AvailabilityId = draftAvailability.Id,
            OfferedQuantity = 1,
            MatchScore = 75,
            Explanation = "Agreement-created offer",
            Status = MatchStatus.AgreementCreated,
            CreatedAt = oldDate,
            ExpiresAt = oldDate
        });
        await db.SaveChangesAsync();

        await RunRetentionAsync(connectionString);

        await using var assertDb = CreateDbContext(connectionString);
        assertDb.AccessRequests.Should().HaveCount(1);
        assertDb.CapacityRequests.Should().HaveCount(1);
        assertDb.AvailabilityDeclarations.Should().HaveCount(1);
        assertDb.MatchOffers.Should().HaveCount(1);
    }

    private AppDbContext CreateDbContext(string connectionString)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new AppDbContext(options);
    }

    private string CreateIsolatedConnectionString()
    {
        var builder = new NpgsqlConnectionStringBuilder(_connectionString)
        {
            Database = $"kapacitet_retention_{Guid.NewGuid():N}"
        };

        return builder.ConnectionString;
    }

    private async Task InitializeDatabaseAsync(string connectionString)
    {
        await using var db = CreateDbContext(connectionString);
        await db.Database.MigrateAsync();
    }

    private async Task RunRetentionAsync(string connectionString)
    {
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
        await using var provider = services.BuildServiceProvider();

        var service = new DataRetentionService(
            provider.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<DataRetentionService>.Instance);

        var method = typeof(DataRetentionService).GetMethod(
            "RunRetentionAsync",
            BindingFlags.Instance | BindingFlags.NonPublic);

        method.Should().NotBeNull();
        var task = method!.Invoke(service, [CancellationToken.None]) as Task;
        task.Should().NotBeNull();
        await task!;
    }

    private static Company AddCompany(AppDbContext db, string name, DateTime createdAt)
    {
        var company = new Company
        {
            Name = name,
            Industry = "Construction",
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = createdAt
        };

        db.Companies.Add(company);
        return company;
    }

    private static bool IsDockerUnavailable(Exception ex)
    {
        if (ex is ArgumentException argumentException
            && argumentException.ParamName == "DockerEndpointAuthConfig")
        {
            return true;
        }

        return ex.Message.Contains("Docker is either not running or misconfigured", StringComparison.OrdinalIgnoreCase)
            || ex.Message.Contains("Docker daemon", StringComparison.OrdinalIgnoreCase)
            || ex.Message.Contains("Testcontainers", StringComparison.OrdinalIgnoreCase);
    }
}
