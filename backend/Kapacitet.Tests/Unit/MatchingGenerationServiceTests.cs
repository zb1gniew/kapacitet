using FluentAssertions;
using Kapacitet.Application.Features.Matching.Services;
using Kapacitet.Application.Features.Notifications;
using Kapacitet.Application.Features.Notifications.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Tests.Helpers;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Resend;

namespace Kapacitet.Tests.Unit;

public class MatchingGenerationServiceTests
{
    private static MatchingGenerationService CreateService(AppDbContext db)
    {
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
        var notificationService = new NotificationService(
            db,
            emailService,
            NullLogger<NotificationService>.Instance);
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

    [Fact]
    public async Task GenerateMatchesForRequestAsync_WhenPartialMatchesDisabled_SkipsPartialOffers()
    {
        var db = TestDbFactory.Create();
        var requester = new Company
        {
            Id = 1,
            Name = "Requester Co",
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow,
            CompanySettings = new CompanySettings
            {
                CompanyId = 1,
                AllowPartialMatches = false
            }
        };
        var supplier = new Company
        {
            Id = 2,
            Name = "Supplier Co",
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        db.Companies.AddRange(requester, supplier);
        db.CapacityRequests.Add(new CapacityRequest
        {
            Id = 1,
            CompanyId = requester.Id,
            ResourceType = ResourceType.Worker,
            Quantity = 3,
            StartDate = new DateTime(2027, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 6, 30, 0, 0, 0, DateTimeKind.Utc),
            LocationCity = "Aarhus",
            Status = ListingStatus.Active,
            PublishedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });
        db.AvailabilityDeclarations.Add(new AvailabilityDeclaration
        {
            Id = 1,
            CompanyId = supplier.Id,
            ResourceType = ResourceType.Worker,
            Quantity = 2,
            StartDate = new DateTime(2027, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 6, 30, 0, 0, 0, DateTimeKind.Utc),
            LocationCity = "Aarhus",
            Status = ListingStatus.Active,
            PublishedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.GenerateMatchesForRequestAsync(1);

        result.Should().BeEmpty();
        db.MatchOffers.Should().BeEmpty();
    }

    [Fact]
    public async Task GenerateMatchesForRequestAsync_WhenSettingsRowMissing_AllowsCrossCategoryMatchesByDefault()
    {
        var db = TestDbFactory.Create();
        var requester = new Company
        {
            Id = 1,
            Name = "Requester Co",
            Categories = ["construction"],
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        var supplier = new Company
        {
            Id = 2,
            Name = "Supplier Co",
            Categories = ["electrical"],
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        db.Companies.AddRange(requester, supplier);
        db.CapacityRequests.Add(new CapacityRequest
        {
            Id = 1,
            CompanyId = requester.Id,
            ResourceType = ResourceType.Worker,
            Quantity = 2,
            StartDate = new DateTime(2027, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 6, 30, 0, 0, 0, DateTimeKind.Utc),
            LocationCity = "Aarhus",
            Status = ListingStatus.Active,
            PublishedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });
        db.AvailabilityDeclarations.Add(new AvailabilityDeclaration
        {
            Id = 1,
            CompanyId = supplier.Id,
            ResourceType = ResourceType.Worker,
            Quantity = 2,
            StartDate = new DateTime(2027, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 6, 30, 0, 0, 0, DateTimeKind.Utc),
            LocationCity = "Aarhus",
            Status = ListingStatus.Active,
            PublishedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.GenerateMatchesForRequestAsync(1);

        result.Should().ContainSingle();
        db.MatchOffers.Should().ContainSingle();
    }
}
