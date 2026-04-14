using FluentAssertions;
using Kapacitet.Application.Features.Matching.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Tests.Helpers;

namespace Kapacitet.Tests.Unit;

public class MatchingAllocationServiceTests
{
    // ── EnsureListingStatusConsistency ───────────────────────────────────────

    private static MatchingAllocationSnapshot MakeSnapshot(int requestId, int qty, int allocated) =>
        new(
            new Dictionary<int, int> { [requestId] = qty },
            new Dictionary<int, int> { [requestId] = allocated },
            new Dictionary<int, int>(),
            new Dictionary<int, int>());

    [Fact]
    public async Task EnsureListingStatus_WhenRemainingZeroAndActive_TransitionsToFulfilled()
    {
        var db = TestDbFactory.Create();
        var svc = new MatchingAllocationService(db);
        var request = new CapacityRequest
        {
            Id = 1, CompanyId = 1, Quantity = 5,
            ResourceType = ResourceType.Worker,
            StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(30),
            LocationCity = "Warsaw", Status = ListingStatus.Active, CreatedAt = DateTime.UtcNow
        };

        // qty=5, allocated=5 → remaining=0
        await svc.EnsureListingStatusConsistencyAsync(request, MakeSnapshot(1, 5, 5));

        request.Status.Should().Be(ListingStatus.Fulfilled);
    }

    [Fact]
    public async Task EnsureListingStatus_WhenRemainingPositiveAndFulfilled_TransitionsToActive()
    {
        var db = TestDbFactory.Create();
        var svc = new MatchingAllocationService(db);
        var request = new CapacityRequest
        {
            Id = 1, CompanyId = 1, Quantity = 5,
            ResourceType = ResourceType.Worker,
            StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(30),
            LocationCity = "Warsaw", Status = ListingStatus.Fulfilled, CreatedAt = DateTime.UtcNow
        };

        // qty=5, allocated=2 → remaining=3
        await svc.EnsureListingStatusConsistencyAsync(request, MakeSnapshot(1, 5, 2));

        request.Status.Should().Be(ListingStatus.Active);
    }

    [Fact]
    public async Task EnsureListingStatus_WhenRemainingPositiveAndActive_NoChange()
    {
        var db = TestDbFactory.Create();
        var svc = new MatchingAllocationService(db);
        var request = new CapacityRequest
        {
            Id = 1, CompanyId = 1, Quantity = 5,
            ResourceType = ResourceType.Worker,
            StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(30),
            LocationCity = "Warsaw", Status = ListingStatus.Active, CreatedAt = DateTime.UtcNow
        };

        await svc.EnsureListingStatusConsistencyAsync(request, MakeSnapshot(1, 5, 2));

        request.Status.Should().Be(ListingStatus.Active);
    }

    // ── HasOpenOffersAsync ───────────────────────────────────────────────────

    [Fact]
    public async Task HasOpenOffers_WhenPendingRequesterReview_ReturnsTrue()
    {
        var db = TestDbFactory.Create();
        db.MatchOffers.Add(new MatchOffer
        {
            Id = 1, RequestId = 1, AvailabilityId = 1, OfferedQuantity = 1,
            Status = MatchStatus.PendingRequesterReview, Explanation = "Test"
        });
        await db.SaveChangesAsync();

        var result = await new MatchingAllocationService(db).HasOpenOffersAsync(1);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task HasOpenOffers_WhenPendingSupplierConfirmation_ReturnsTrue()
    {
        var db = TestDbFactory.Create();
        db.MatchOffers.Add(new MatchOffer
        {
            Id = 1, RequestId = 1, AvailabilityId = 1, OfferedQuantity = 1,
            Status = MatchStatus.PendingSupplierConfirmation, Explanation = "Test"
        });
        await db.SaveChangesAsync();

        var result = await new MatchingAllocationService(db).HasOpenOffersAsync(1);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task HasOpenOffers_WhenAllDeclined_ReturnsFalse()
    {
        var db = TestDbFactory.Create();
        db.MatchOffers.Add(new MatchOffer
        {
            Id = 1, RequestId = 1, AvailabilityId = 1, OfferedQuantity = 1,
            Status = MatchStatus.RequesterDeclined, Explanation = "Test"
        });
        await db.SaveChangesAsync();

        var result = await new MatchingAllocationService(db).HasOpenOffersAsync(1);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task HasOpenOffers_WhenNoOffers_ReturnsFalse()
    {
        var db = TestDbFactory.Create();
        var result = await new MatchingAllocationService(db).HasOpenOffersAsync(999);
        result.Should().BeFalse();
    }

    // ── ExpireStaleOffersAsync ───────────────────────────────────────────────

    [Fact]
    public async Task ExpireStaleOffers_WhenOfferPastExpiresAt_SetsExpired()
    {
        var db = TestDbFactory.Create();
        db.MatchOffers.Add(new MatchOffer
        {
            Id = 1, RequestId = 1, AvailabilityId = 1, OfferedQuantity = 1,
            Status = MatchStatus.PendingRequesterReview, Explanation = "Test",
            ExpiresAt = DateTime.UtcNow.AddMinutes(-1) // already past
        });
        await db.SaveChangesAsync();

        await new MatchingAllocationService(db).ExpireStaleOffersAsync();

        db.MatchOffers.Single().Status.Should().Be(MatchStatus.Expired);
    }

    [Fact]
    public async Task ExpireStaleOffers_WhenOfferNotYetExpired_LeavesUntouched()
    {
        var db = TestDbFactory.Create();
        db.MatchOffers.Add(new MatchOffer
        {
            Id = 1, RequestId = 1, AvailabilityId = 1, OfferedQuantity = 1,
            Status = MatchStatus.PendingRequesterReview, Explanation = "Test",
            ExpiresAt = DateTime.UtcNow.AddDays(7) // future
        });
        await db.SaveChangesAsync();

        await new MatchingAllocationService(db).ExpireStaleOffersAsync();

        db.MatchOffers.Single().Status.Should().Be(MatchStatus.PendingRequesterReview);
    }
}