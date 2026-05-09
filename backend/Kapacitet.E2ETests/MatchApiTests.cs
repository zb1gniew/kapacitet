using System.Net;
using FluentAssertions;
using Kapacitet.API.Auth;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.E2ETests.Infrastructure;
using Kapacitet.Infrastructure.Persistence;

namespace Kapacitet.E2ETests;

public class MatchApiTests
{
    [Fact]
    public async Task Accept_WhenAuthenticatedAsViewer_ReturnsForbidden()
    {
        await using var factory = new ApiTestApplicationFactory();
        var offerId = 0;
        await factory.SeedAsync(db =>
        {
            offerId = SeedOffer(db, "viewer@test.local");
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("viewer@test.local", AuthorizationRoles.Viewer);

        var response = await client.PostAsync($"/api/matches/{offerId}/accept", content: null);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Accept_WhenAuthenticatedAsManager_ReturnsOkAndTransitionsOffer()
    {
        await using var factory = new ApiTestApplicationFactory();
        var offerId = 0;
        await factory.SeedAsync(db =>
        {
            offerId = SeedOffer(db, "manager@test.local");
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("manager@test.local", AuthorizationRoles.Manager);

        var response = await client.PostAsync($"/api/matches/{offerId}/accept", content: null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        await factory.ExecuteDbAsync(db =>
        {
            db.MatchOffers.Should().ContainSingle(offer =>
                offer.Id == offerId &&
                offer.Status == MatchStatus.PendingSupplierConfirmation &&
                offer.RequesterReviewedAt.HasValue);
            return Task.CompletedTask;
        });
    }

    [Fact]
    public async Task Accept_WhenOfferBelongsToDifferentCompany_ReturnsForbidden()
    {
        await using var factory = new ApiTestApplicationFactory();
        var offerId = 0;
        await factory.SeedAsync(db =>
        {
            offerId = SeedOffer(db, "other-requester@test.local");
            db.Users.Add(new User
            {
                CompanyId = 999,
                Email = "manager@test.local",
                Role = UserRole.Manager,
                CreatedAt = DateTime.UtcNow
            });
            db.Companies.Add(new Company
            {
                Id = 999,
                Name = "Foreign Company",
                Industry = "Construction",
                DefaultLocation = "Odense",
                Status = CompanyStatus.Active,
                CreatedAt = DateTime.UtcNow
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("manager@test.local", AuthorizationRoles.Manager);

        var response = await client.PostAsync($"/api/matches/{offerId}/accept", content: null);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Accept_WhenOfferDoesNotExistAndCompanyDoesNotOwnIt_ReturnsForbidden()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(_ => Task.CompletedTask);
        using var client = factory.CreateAuthenticatedClient("manager@test.local", AuthorizationRoles.Manager);

        var response = await client.PostAsync("/api/matches/9999/accept", content: null);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private static int SeedOffer(AppDbContext db, string requesterEmail)
    {
        var requester = new Company
        {
            Name = "Requester",
            Industry = "Construction",
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        var supplier = new Company
        {
            Name = "Supplier",
            Industry = "Construction",
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        db.Companies.AddRange(requester, supplier);

        db.Users.AddRange(
            new User
            {
                Company = requester,
                Email = requesterEmail,
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Company = supplier,
                Email = "supplier@test.local",
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            });

        var request = new CapacityRequest
        {
            Company = requester,
            ResourceType = ResourceType.Worker,
            StartDate = new DateTime(2027, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 8, 31, 0, 0, 0, DateTimeKind.Utc),
            LocationCity = "Aarhus",
            Quantity = 2,
            Status = ListingStatus.Active,
            Urgency = UrgencyLevel.Medium,
            CreatedAt = DateTime.UtcNow
        };
        var availability = new AvailabilityDeclaration
        {
            Company = supplier,
            ResourceType = ResourceType.Worker,
            StartDate = new DateTime(2027, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 8, 31, 0, 0, 0, DateTimeKind.Utc),
            LocationCity = "Aarhus",
            Quantity = 2,
            Status = ListingStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        db.CapacityRequests.Add(request);
        db.AvailabilityDeclarations.Add(availability);
        db.SaveChanges();

        var offer = new MatchOffer
        {
            RequestId = request.Id,
            AvailabilityId = availability.Id,
            OfferedQuantity = 2,
            MatchScore = 90,
            SkillScore = 100,
            CertificateScore = 100,
            DateScore = 100,
            LocationScore = 100,
            QuantityScore = 100,
            MatchedSkillCount = 0,
            RequiredSkillCount = 0,
            MatchedCertificateCount = 0,
            RequiredCertificateCount = 0,
            CoversFullPeriod = true,
            IsPartial = false,
            Explanation = "API test match",
            Status = MatchStatus.PendingRequesterReview,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        db.MatchOffers.Add(offer);
        db.SaveChanges();
        return offer.Id;
    }
}
