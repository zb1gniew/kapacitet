using DotNet.Testcontainers.Builders;
using FluentAssertions;
using Kapacitet.Application.Features.Matching.Services;
using Kapacitet.Application.Features.Notifications;
using Kapacitet.Application.Features.Notifications.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Resend;
using Testcontainers.PostgreSql;

namespace Kapacitet.Tests.Integration;

public class MatchingGenerationConcurrencyTests : IAsyncLifetime
{
    private PostgreSqlContainer _postgres = null!;
    private string _connectionString = null!;

    public async Task InitializeAsync()
    {
        _postgres = new PostgreSqlBuilder()
            .WithImage("postgres:15-alpine")
            .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(5432))
            .Build();

        await _postgres.StartAsync();
        _connectionString = _postgres.GetConnectionString();

        await using var db = CreateDbContext();
        await db.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
    }

    [Fact]
    public async Task GenerateMatchesForRequest_WhenCalledConcurrently_ProducesExactlyOneOpenOfferPerPair()
    {
        // Arrange — seed one matching request/availability pair
        await using var seedDb = CreateDbContext();
        var (requestId, availabilityId) = await SeedMatchablePair(seedDb);

        // Two independent service instances = two simultaneous "publish" HTTP requests
        var svc1 = CreateGenerationService();
        var svc2 = CreateGenerationService();

        // Act
        await Task.WhenAll(
            svc1.GenerateMatchesForRequestAsync(requestId),
            svc2.GenerateMatchesForRequestAsync(requestId));

        // Assert
        await using var assertDb = CreateDbContext();
        var openOffers = await assertDb.MatchOffers
            .Where(m =>
                m.RequestId == requestId &&
                m.AvailabilityId == availabilityId &&
                (m.Status == MatchStatus.PendingRequesterReview ||
                 m.Status == MatchStatus.PendingSupplierConfirmation))
            .ToListAsync();

        openOffers.Should().HaveCount(1,
            "concurrent generation must not create duplicate open offers for the same (request, availability) pair");
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_connectionString)
            .Options;
        return new AppDbContext(options);
    }

    private MatchingGenerationService CreateGenerationService()
    {
        // Each call gets its own DbContext — simulating a separate HTTP request scope.
        var db = CreateDbContext();

        var allocationService = new MatchingAllocationService(db);
        var evaluationService = new MatchEvaluationService();
        var queryService = new MatchingQueryService(db);

        var emailOptions = Options.Create(new EmailOptions
        {
            DevMode = true,
            FromAddress = "noreply@test.local",
            FromName = "Test"
        });
        var emailService = new EmailService(
            db,
            new Mock<IResend>().Object,
            emailOptions,
            NullLogger<EmailService>.Instance);

        var notificationService = new NotificationService(db, emailService);
        var outreachService = new NetworkEscalationOutreachService(db, notificationService);
        var escalationService = new MatchingEscalationService(db, notificationService, outreachService);

        return new MatchingGenerationService(
            db,
            allocationService,
            evaluationService,
            escalationService,
            queryService,
            notificationService,
            NullLogger<MatchingGenerationService>.Instance);
    }

    private static async Task<(int requestId, int availabilityId)> SeedMatchablePair(AppDbContext db)
    {
        var requester = new Company
        {
            Name = "Requester Co",
            Industry = "Construction",
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        var supplier = new Company
        {
            Name = "Supplier Co",
            Industry = "Construction",
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        db.Companies.AddRange(requester, supplier);
        await db.SaveChangesAsync();

        // Availability dates fully cover the request period — required by MatchEvaluationService.
        // Same city on both sides → maximum location score → match is guaranteed.
        var start = new DateTime(2027, 6, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2027, 6, 30, 0, 0, 0, DateTimeKind.Utc);

        var request = new CapacityRequest
        {
            CompanyId = requester.Id,
            ResourceType = ResourceType.Worker,
            Quantity = 2,
            StartDate = start,
            EndDate = end,
            LocationCity = "Aarhus",
            LocationRadiusKm = 50,
            Urgency = UrgencyLevel.Low,
            Status = ListingStatus.Active,
            PublishedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        var availability = new AvailabilityDeclaration
        {
            CompanyId = supplier.Id,
            ResourceType = ResourceType.Worker,
            Quantity = 2,
            StartDate = start,
            EndDate = end,
            LocationCity = "Aarhus",
            Status = ListingStatus.Active,
            PublishedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        db.CapacityRequests.Add(request);
        db.AvailabilityDeclarations.Add(availability);
        await db.SaveChangesAsync();

        return (request.Id, availability.Id);
    }
}
