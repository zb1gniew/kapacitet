using FluentAssertions;
using Kapacitet.Application.Features.Matching.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Tests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Tests.Unit;

public class MatchingAllocationServiceValidationTests
{
    // ── ValidateOfferStillActionableAsync ─────────────────────────────────────

    private static async Task<AppDbContext> SeedOfferContext(
        DateTime expiresAt,
        ListingStatus requestStatus = ListingStatus.Active,
        ListingStatus availabilityStatus = ListingStatus.Active,
        int qty = 5,
        int allocatedQty = 0)
    {
        var db = TestDbFactory.Create();

        db.CapacityRequests.Add(new CapacityRequest
        {
            Id = 1,
            CompanyId = 1,
            ResourceType = ResourceType.Worker,
            Quantity = qty,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            LocationCity = "Aarhus",
            Status = requestStatus,
            CreatedAt = DateTime.UtcNow
        });

        db.AvailabilityDeclarations.Add(new AvailabilityDeclaration
        {
            Id = 1,
            CompanyId = 2,
            ResourceType = ResourceType.Worker,
            Quantity = qty,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            LocationCity = "Aarhus",
            Status = availabilityStatus,
            CreatedAt = DateTime.UtcNow
        });

        db.MatchOffers.Add(new MatchOffer
        {
            Id = 1,
            RequestId = 1,
            AvailabilityId = 1,
            OfferedQuantity = 1,
            Status = MatchStatus.PendingRequesterReview,
            Explanation = "Test",
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow
        });

        if (allocatedQty > 0)
        {
            db.CooperationAgreements.Add(new CooperationAgreement
            {
                Id = 1,
                MatchOfferId = 1,
                RequestId = 1,
                AvailabilityId = 1,
                RequesterCompanyId = 1,
                SupplierCompanyId = 2,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(30),
                Quantity = allocatedQty,
                Status = AgreementStatus.Active,
                CreatedAt = DateTime.UtcNow,
                ConfirmedAt = DateTime.UtcNow
            });
        }

        await db.SaveChangesAsync();
        return db;
    }

    [Fact]
    public async Task ValidateOffer_WhenExpired_ThrowsAndSetsExpired()
    {
        var db = await SeedOfferContext(expiresAt: DateTime.UtcNow.AddMinutes(-1));
        var offer = await db.MatchOffers.Include(o => o.Request).Include(o => o.Availability).SingleAsync();

        var act = async () => await new MatchingAllocationService(db).ValidateOfferStillActionableAsync(offer);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*expired*");
        offer.Status.Should().Be(MatchStatus.Expired);
    }

    [Fact]
    public async Task ValidateOffer_WhenRequestInactive_ThrowsAndSetsWithdrawn()
    {
        var db = await SeedOfferContext(
            expiresAt: DateTime.UtcNow.AddDays(7),
            requestStatus: ListingStatus.Fulfilled);
        var offer = await db.MatchOffers.Include(o => o.Request).Include(o => o.Availability).SingleAsync();

        var act = async () => await new MatchingAllocationService(db).ValidateOfferStillActionableAsync(offer);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*no longer available*");
        offer.Status.Should().Be(MatchStatus.Withdrawn);
    }

    [Fact]
    public async Task ValidateOffer_WhenAvailabilityInactive_ThrowsAndSetsWithdrawn()
    {
        var db = await SeedOfferContext(
            expiresAt: DateTime.UtcNow.AddDays(7),
            availabilityStatus: ListingStatus.Fulfilled);
        var offer = await db.MatchOffers.Include(o => o.Request).Include(o => o.Availability).SingleAsync();

        var act = async () => await new MatchingAllocationService(db).ValidateOfferStillActionableAsync(offer);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*no longer available*");
        offer.Status.Should().Be(MatchStatus.Withdrawn);
    }

    [Fact]
    public async Task ValidateOffer_WhenQuantityFullyAllocated_ThrowsAndSetsWithdrawn()
    {
        var db = await SeedOfferContext(
            expiresAt: DateTime.UtcNow.AddDays(7),
            qty: 5,
            allocatedQty: 5);
        var offer = await db.MatchOffers.Include(o => o.Request).Include(o => o.Availability).SingleAsync();

        var act = async () => await new MatchingAllocationService(db).ValidateOfferStillActionableAsync(offer);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*can no longer be fulfilled*");
        offer.Status.Should().Be(MatchStatus.Withdrawn);
    }

    // ── WithdrawExhaustedOpenOffersAsync ─────────────────────────────────────

    private static readonly Dictionary<int, int> NoneAllocated = [];

    private static MatchingAllocationSnapshot BothRemainingSnapshot() =>
        new(new Dictionary<int, int> { [1] = 5 }, NoneAllocated,
            new Dictionary<int, int> { [1] = 5 }, NoneAllocated);

    private static MatchingAllocationSnapshot RequestExhaustedSnapshot() =>
        new(new Dictionary<int, int> { [1] = 5 }, new Dictionary<int, int> { [1] = 5 },
            new Dictionary<int, int> { [1] = 5 }, NoneAllocated);

    private static MatchingAllocationSnapshot AvailabilityExhaustedSnapshot() =>
        new(new Dictionary<int, int> { [1] = 5 }, NoneAllocated,
            new Dictionary<int, int> { [1] = 5 }, new Dictionary<int, int> { [1] = 5 });

    private static async Task<AppDbContext> SeedOpenOffer()
    {
        var db = TestDbFactory.Create();
        db.MatchOffers.Add(new MatchOffer
        {
            Id = 1,
            RequestId = 1,
            AvailabilityId = 1,
            OfferedQuantity = 1,
            Status = MatchStatus.PendingRequesterReview,
            Explanation = "Test",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        return db;
    }

    [Fact]
    public async Task WithdrawExhaustedOffers_WhenBothHaveRemaining_LeavesOffersOpen()
    {
        var db = await SeedOpenOffer();
        await new MatchingAllocationService(db).WithdrawExhaustedOpenOffersAsync(1, 1, BothRemainingSnapshot());

        db.MatchOffers.Single().Status.Should().Be(MatchStatus.PendingRequesterReview);
    }

    [Fact]
    public async Task WithdrawExhaustedOffers_WhenRequestExhausted_WithdrawsOpenOffers()
    {
        var db = await SeedOpenOffer();
        await new MatchingAllocationService(db).WithdrawExhaustedOpenOffersAsync(1, 1, RequestExhaustedSnapshot());

        db.MatchOffers.Single().Status.Should().Be(MatchStatus.Withdrawn);
    }

    [Fact]
    public async Task WithdrawExhaustedOffers_WhenAvailabilityExhausted_WithdrawsOpenOffers()
    {
        var db = await SeedOpenOffer();
        await new MatchingAllocationService(db).WithdrawExhaustedOpenOffersAsync(1, 1, AvailabilityExhaustedSnapshot());

        db.MatchOffers.Single().Status.Should().Be(MatchStatus.Withdrawn);
    }

    [Fact]
    public async Task WithdrawExhaustedOffers_WhenAlreadyDeclined_LeavesStatusUnchanged()
    {
        var db = TestDbFactory.Create();
        db.MatchOffers.Add(new MatchOffer
        {
            Id = 1,
            RequestId = 1,
            AvailabilityId = 1,
            OfferedQuantity = 1,
            Status = MatchStatus.RequesterDeclined,
            Explanation = "Test",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        await new MatchingAllocationService(db).WithdrawExhaustedOpenOffersAsync(1, 1, RequestExhaustedSnapshot());

        db.MatchOffers.Single().Status.Should().Be(MatchStatus.RequesterDeclined,
            "WithdrawExhausted only targets open statuses");
    }
}
