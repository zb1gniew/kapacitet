using FluentAssertions;
using Kapacitet.Application.Features.Matching.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Tests.Helpers;

namespace Kapacitet.Tests.Unit;

public class MatchingQueryServiceTests
{
    // ── Seed helpers ──────────────────────────────────────────────────────────

    private record SeedData(
        int RequesterCompanyId,
        int SupplierCompanyId,
        int RequestId,
        int AvailabilityId,
        int OfferId,
        int AgreementId);

    private static async Task<(Kapacitet.Infrastructure.Persistence.AppDbContext db, SeedData seed)> SeedAsync(
        MatchStatus offerStatus = MatchStatus.PendingRequesterReview,
        bool includeAgreement = false)
    {
        var db = TestDbFactory.Create();

        var requester = new Company { Id = 1, Name = "Requester Co", DefaultLocation = "Aarhus", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow };
        var supplier = new Company { Id = 2, Name = "Supplier Co", DefaultLocation = "Copenhagen", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow };
        db.Companies.AddRange(requester, supplier);
        await db.SaveChangesAsync();

        var start = new DateTime(2027, 6, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2027, 6, 30, 0, 0, 0, DateTimeKind.Utc);

        var request = new CapacityRequest
        {
            CompanyId = requester.Id,
            ResourceType = ResourceType.Worker,
            Quantity = 5,
            StartDate = start,
            EndDate = end,
            LocationCity = "Aarhus",
            Status = ListingStatus.Active,
            Urgency = UrgencyLevel.Medium,
            CreatedAt = DateTime.UtcNow
        };
        var avail = new AvailabilityDeclaration
        {
            CompanyId = supplier.Id,
            ResourceType = ResourceType.Worker,
            Quantity = 5,
            StartDate = start,
            EndDate = end,
            LocationCity = "Copenhagen",
            Status = ListingStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        db.CapacityRequests.Add(request);
        db.AvailabilityDeclarations.Add(avail);
        await db.SaveChangesAsync();

        var offer = new MatchOffer
        {
            RequestId = request.Id,
            AvailabilityId = avail.Id,
            Status = offerStatus,
            OfferedQuantity = 5,
            MatchScore = 80,
            Explanation = "Unit test offer",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        db.MatchOffers.Add(offer);
        await db.SaveChangesAsync();

        int agreementId = 0;
        if (includeAgreement)
        {
            var agreement = new CooperationAgreement
            {
                MatchOfferId = offer.Id,
                RequestId = request.Id,
                AvailabilityId = avail.Id,
                SupplierCompanyId = supplier.Id,
                RequesterCompanyId = requester.Id,
                StartDate = start,
                EndDate = end,
                Quantity = 5,
                Status = AgreementStatus.Active,
                CreatedAt = DateTime.UtcNow,
                ConfirmedAt = DateTime.UtcNow
            };
            db.CooperationAgreements.Add(agreement);
            await db.SaveChangesAsync();
            agreementId = agreement.Id;
        }

        return (db, new SeedData(requester.Id, supplier.Id, request.Id, avail.Id, offer.Id, agreementId));
    }

    // ── GetMatchesForRequestAsync ─────────────────────────────────────────────

    [Fact]
    public async Task GetMatchesForRequestAsync_WhenRequestNotFound_ThrowsKeyNotFound()
    {
        var db = TestDbFactory.Create();
        var svc = new MatchingQueryService(db);

        var act = async () => await svc.GetMatchesForRequestAsync(requestId: 999, companyId: 1);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task GetMatchesForRequestAsync_WhenWrongCompany_ThrowsUnauthorized()
    {
        var (db, seed) = await SeedAsync();
        var svc = new MatchingQueryService(db);

        // Supplier tries to list requester's request matches
        var act = async () => await svc.GetMatchesForRequestAsync(seed.RequestId, companyId: seed.SupplierCompanyId);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task GetMatchesForRequestAsync_WhenValidRequester_ReturnsOffersOrderedByMatchScoreDesc()
    {
        var db = TestDbFactory.Create();

        var requester = new Company { Id = 1, Name = "Req", DefaultLocation = "Aarhus", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow };
        var supplier = new Company { Id = 2, Name = "Sup", DefaultLocation = "Copenhagen", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow };
        db.Companies.AddRange(requester, supplier);
        await db.SaveChangesAsync();

        var start = new DateTime(2027, 6, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2027, 6, 30, 0, 0, 0, DateTimeKind.Utc);

        var request = new CapacityRequest
        {
            CompanyId = 1,
            ResourceType = ResourceType.Worker,
            Quantity = 10,
            StartDate = start,
            EndDate = end,
            LocationCity = "Aarhus",
            Status = ListingStatus.Active,
            Urgency = UrgencyLevel.Medium,
            CreatedAt = DateTime.UtcNow
        };
        var avail = new AvailabilityDeclaration
        {
            CompanyId = 2,
            ResourceType = ResourceType.Worker,
            Quantity = 10,
            StartDate = start,
            EndDate = end,
            LocationCity = "Copenhagen",
            Status = ListingStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        db.CapacityRequests.Add(request);
        db.AvailabilityDeclarations.Add(avail);
        await db.SaveChangesAsync();

        var offerLow = new MatchOffer
        {
            RequestId = request.Id,
            AvailabilityId = avail.Id,
            Status = MatchStatus.PendingRequesterReview,
            OfferedQuantity = 5,
            MatchScore = 40,
            Explanation = "Low score",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        var offerHigh = new MatchOffer
        {
            RequestId = request.Id,
            AvailabilityId = avail.Id,
            Status = MatchStatus.PendingRequesterReview,
            OfferedQuantity = 5,
            MatchScore = 90,
            Explanation = "High score",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        db.MatchOffers.AddRange(offerLow, offerHigh);
        await db.SaveChangesAsync();

        var svc = new MatchingQueryService(db);
        var results = await svc.GetMatchesForRequestAsync(request.Id, companyId: 1);

        results.Should().HaveCount(2);
        results[0].MatchScore.Should().Be(90);
        results[1].MatchScore.Should().Be(40);
    }

    // ── GetMatchByIdAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task GetMatchByIdAsync_WhenCompanyIsNeitherParticipant_ThrowsUnauthorized()
    {
        var (db, seed) = await SeedAsync();
        var svc = new MatchingQueryService(db);
        const int unrelatedCompanyId = 99;

        var act = async () => await svc.GetMatchByIdAsync(seed.OfferId, companyId: unrelatedCompanyId);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task GetMatchByIdAsync_WhenCallerIsRequester_ReturnsMatchDto()
    {
        var (db, seed) = await SeedAsync();
        var svc = new MatchingQueryService(db);

        var dto = await svc.GetMatchByIdAsync(seed.OfferId, companyId: seed.RequesterCompanyId);

        dto.Id.Should().Be(seed.OfferId);
        dto.Perspective.Should().Be("Requester");
    }

    [Fact]
    public async Task GetMatchByIdAsync_WhenCallerIsSupplier_ReturnsMatchDto()
    {
        var (db, seed) = await SeedAsync();
        var svc = new MatchingQueryService(db);

        var dto = await svc.GetMatchByIdAsync(seed.OfferId, companyId: seed.SupplierCompanyId);

        dto.Id.Should().Be(seed.OfferId);
        dto.Perspective.Should().Be("Supplier");
    }

    // ── GetAgreementByIdAsync ────────────────────────────────────────────────

    [Fact]
    public async Task GetAgreementByIdAsync_WhenCompanyIsNotParticipant_ThrowsUnauthorized()
    {
        var (db, seed) = await SeedAsync(includeAgreement: true);
        var svc = new MatchingQueryService(db);
        const int unrelatedCompanyId = 99;

        var act = async () => await svc.GetAgreementByIdAsync(seed.AgreementId, companyId: unrelatedCompanyId);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task GetAgreementByIdAsync_WhenCallerIsRequester_ReturnsAgreementDto()
    {
        var (db, seed) = await SeedAsync(includeAgreement: true);
        var svc = new MatchingQueryService(db);

        var dto = await svc.GetAgreementByIdAsync(seed.AgreementId, companyId: seed.RequesterCompanyId);

        dto.Id.Should().Be(seed.AgreementId);
        dto.RequesterCompanyId.Should().Be(seed.RequesterCompanyId);
        dto.SupplierCompanyId.Should().Be(seed.SupplierCompanyId);
    }

    [Fact]
    public async Task GetAgreementByIdAsync_WhenCallerIsSupplier_ReturnsAgreementDto()
    {
        var (db, seed) = await SeedAsync(includeAgreement: true);
        var svc = new MatchingQueryService(db);

        var dto = await svc.GetAgreementByIdAsync(seed.AgreementId, companyId: seed.SupplierCompanyId);

        dto.Id.Should().Be(seed.AgreementId);
        dto.SupplierCompanyId.Should().Be(seed.SupplierCompanyId);
    }

    [Fact]
    public async Task GetAgreementByIdAsync_WhenAgreementNotFound_ThrowsKeyNotFound()
    {
        var db = TestDbFactory.Create();
        var svc = new MatchingQueryService(db);

        var act = async () => await svc.GetAgreementByIdAsync(agreementId: 999, companyId: 1);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }
}
