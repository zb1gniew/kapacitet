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

/// <summary>
/// End-to-end acceptance flow: requester accepts a match offer, supplier confirms →
/// CooperationAgreement is created and listing statuses are updated.
/// Requires a real Postgres instance because ConfirmAsSupplierAsync uses SELECT FOR UPDATE.
/// </summary>
public class MatchingServiceAcceptanceFlowTests : IAsyncLifetime
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

            await using var db = CreateDbContext();
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
            await _postgres.DisposeAsync();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_connectionString)
            .Options;
        return new AppDbContext(options);
    }

    private MatchingService CreateMatchingService()
    {
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
            db, new Mock<IResend>().Object, emailOptions, NullLogger<EmailService>.Instance);

        var notificationService = new NotificationService(db, emailService);
        var outreachService = new NetworkEscalationOutreachService(db, notificationService);
        var escalationService = new MatchingEscalationService(db, notificationService, outreachService);
        var generationService = new MatchingGenerationService(
            db, allocationService, evaluationService, escalationService,
            queryService, notificationService, NullLogger<MatchingGenerationService>.Instance);

        return new MatchingService(
            db, allocationService, escalationService,
            generationService, queryService, notificationService, emailService);
    }

    private record SeedResult(
        int RequestId,
        int AvailabilityId,
        int OfferId,
        int RequesterCompanyId,
        int SupplierCompanyId);

    private async Task<SeedResult> SeedWithOffer(
        int requestQty = 5,
        int availQty = 5,
        int offeredQty = 5,
        MatchStatus offerStatus = MatchStatus.PendingRequesterReview)
    {
        await using var db = CreateDbContext();

        var requester = new Company
        {
            Name = $"Requester-{Guid.NewGuid():N}",
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        var supplier = new Company
        {
            Name = $"Supplier-{Guid.NewGuid():N}",
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        db.Companies.AddRange(requester, supplier);
        await db.SaveChangesAsync();

        db.Users.AddRange(
            new User { CompanyId = requester.Id, Email = $"req-{Guid.NewGuid():N}@test.com", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow },
            new User { CompanyId = supplier.Id, Email = $"sup-{Guid.NewGuid():N}@test.com", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow });

        var start = new DateTime(2027, 8, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2027, 8, 31, 0, 0, 0, DateTimeKind.Utc);

        var request = new CapacityRequest
        {
            CompanyId = requester.Id,
            ResourceType = ResourceType.Worker,
            Quantity = requestQty,
            StartDate = start,
            EndDate = end,
            LocationCity = "Aarhus",
            Status = ListingStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        var avail = new AvailabilityDeclaration
        {
            CompanyId = supplier.Id,
            ResourceType = ResourceType.Worker,
            Quantity = availQty,
            StartDate = start,
            EndDate = end,
            LocationCity = "Aarhus",
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
            OfferedQuantity = offeredQty,
            MatchScore = 80,
            Status = offerStatus,
            Explanation = "Integration test match",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        db.MatchOffers.Add(offer);
        await db.SaveChangesAsync();

        return new SeedResult(request.Id, avail.Id, offer.Id, requester.Id, supplier.Id);
    }

    // ── AcceptAsRequesterAsync ────────────────────────────────────────────────

    [Fact]
    public async Task AcceptAsRequester_WhenValid_TransitionsToPendingSupplierConfirmation()
    {
        if (_dockerUnavailable) return;

        var seed = await SeedWithOffer();
        var svc = CreateMatchingService();

        await svc.AcceptAsRequesterAsync(seed.OfferId, seed.RequesterCompanyId);

        await using var db = CreateDbContext();
        var offer = await db.MatchOffers.SingleAsync(o => o.Id == seed.OfferId);
        offer.Status.Should().Be(MatchStatus.PendingSupplierConfirmation);
        offer.RequesterReviewedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task AcceptAsRequester_WhenValid_QueuesInAppNotificationForSupplier()
    {
        if (_dockerUnavailable) return;

        var seed = await SeedWithOffer();
        var svc = CreateMatchingService();

        await svc.AcceptAsRequesterAsync(seed.OfferId, seed.RequesterCompanyId);

        await using var db = CreateDbContext();
        db.Notifications.Should().ContainSingle(n =>
            n.CompanyId == seed.SupplierCompanyId &&
            n.Type == NotificationType.SupplierConfirmationRequest);
    }

    [Fact]
    public async Task AcceptAsRequester_WhenWrongCompany_ThrowsUnauthorized()
    {
        if (_dockerUnavailable) return;

        var seed = await SeedWithOffer();
        var svc = CreateMatchingService();

        var act = async () => await svc.AcceptAsRequesterAsync(seed.OfferId, seed.SupplierCompanyId);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task AcceptAsRequester_WhenOfferAlreadyAccepted_ThrowsInvalidOperation()
    {
        if (_dockerUnavailable) return;

        var seed = await SeedWithOffer(offerStatus: MatchStatus.PendingSupplierConfirmation);
        var svc = CreateMatchingService();

        var act = async () => await svc.AcceptAsRequesterAsync(seed.OfferId, seed.RequesterCompanyId);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    // ── ConfirmAsSupplierAsync ────────────────────────────────────────────────

    [Fact]
    public async Task ConfirmAsSupplier_WhenValid_CreatesCooperationAgreement()
    {
        if (_dockerUnavailable) return;

        var seed = await SeedWithOffer();
        await CreateMatchingService().AcceptAsRequesterAsync(seed.OfferId, seed.RequesterCompanyId);

        await CreateMatchingService().ConfirmAsSupplierAsync(seed.OfferId, seed.SupplierCompanyId);

        await using var db = CreateDbContext();
        var agreement = await db.CooperationAgreements.SingleAsync(a => a.RequestId == seed.RequestId);
        agreement.SupplierCompanyId.Should().Be(seed.SupplierCompanyId);
        agreement.RequesterCompanyId.Should().Be(seed.RequesterCompanyId);
        agreement.Quantity.Should().Be(5);
        agreement.Status.Should().Be(AgreementStatus.Active);
    }

    [Fact]
    public async Task ConfirmAsSupplier_WhenValid_TransitionsOfferToAgreementCreated()
    {
        if (_dockerUnavailable) return;

        var seed = await SeedWithOffer();
        await CreateMatchingService().AcceptAsRequesterAsync(seed.OfferId, seed.RequesterCompanyId);

        await CreateMatchingService().ConfirmAsSupplierAsync(seed.OfferId, seed.SupplierCompanyId);

        await using var db = CreateDbContext();
        var offer = await db.MatchOffers.SingleAsync(o => o.Id == seed.OfferId);
        offer.Status.Should().Be(MatchStatus.AgreementCreated);
        offer.SupplierReviewedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task ConfirmAsSupplier_WhenFullyAllocated_FulfillsBothListings()
    {
        if (_dockerUnavailable) return;

        // qty=5 on both sides, offeredQty=5 → fully consumed after agreement
        var seed = await SeedWithOffer(requestQty: 5, availQty: 5, offeredQty: 5);
        await CreateMatchingService().AcceptAsRequesterAsync(seed.OfferId, seed.RequesterCompanyId);

        await CreateMatchingService().ConfirmAsSupplierAsync(seed.OfferId, seed.SupplierCompanyId);

        await using var db = CreateDbContext();
        var request = await db.CapacityRequests.SingleAsync(r => r.Id == seed.RequestId);
        var avail = await db.AvailabilityDeclarations.SingleAsync(a => a.Id == seed.AvailabilityId);
        request.Status.Should().Be(ListingStatus.Fulfilled, "all requested capacity is covered");
        avail.Status.Should().Be(ListingStatus.Fulfilled, "all available capacity is consumed");
    }

    [Fact]
    public async Task ConfirmAsSupplier_WhenPartialMatch_RequestRemainsActive()
    {
        if (_dockerUnavailable) return;

        // request wants 10, availability offers 4 → 6 still remaining → Active
        var seed = await SeedWithOffer(requestQty: 10, availQty: 4, offeredQty: 4);
        await CreateMatchingService().AcceptAsRequesterAsync(seed.OfferId, seed.RequesterCompanyId);

        await CreateMatchingService().ConfirmAsSupplierAsync(seed.OfferId, seed.SupplierCompanyId);

        await using var db = CreateDbContext();
        var request = await db.CapacityRequests.SingleAsync(r => r.Id == seed.RequestId);
        var avail = await db.AvailabilityDeclarations.SingleAsync(a => a.Id == seed.AvailabilityId);
        request.Status.Should().Be(ListingStatus.Active, "6 units of capacity still needed");
        avail.Status.Should().Be(ListingStatus.Fulfilled, "all 4 available units consumed");
    }

    [Fact]
    public async Task ConfirmAsSupplier_WhenWrongCompany_ThrowsUnauthorized()
    {
        if (_dockerUnavailable) return;

        var seed = await SeedWithOffer(offerStatus: MatchStatus.PendingSupplierConfirmation);
        var svc = CreateMatchingService();

        var act = async () => await svc.ConfirmAsSupplierAsync(seed.OfferId, seed.RequesterCompanyId);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task ConfirmAsSupplier_WhenOfferNotPendingSupplierConfirmation_ThrowsInvalidOperation()
    {
        if (_dockerUnavailable) return;

        // Offer is still PendingRequesterReview, supplier tries to confirm prematurely
        var seed = await SeedWithOffer();
        var svc = CreateMatchingService();

        var act = async () => await svc.ConfirmAsSupplierAsync(seed.OfferId, seed.SupplierCompanyId);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    // ── Decline paths ─────────────────────────────────────────────────────────

    [Fact]
    public async Task DeclineAsRequester_WhenValid_TransitionsToRequesterDeclined()
    {
        if (_dockerUnavailable) return;

        var seed = await SeedWithOffer();
        var svc = CreateMatchingService();

        await svc.DeclineAsRequesterAsync(seed.OfferId, seed.RequesterCompanyId);

        await using var db = CreateDbContext();
        db.MatchOffers.Single(o => o.Id == seed.OfferId).Status
            .Should().Be(MatchStatus.RequesterDeclined);
    }

    [Fact]
    public async Task DeclineAsSupplier_WhenValid_TransitionsToSupplierDeclined()
    {
        if (_dockerUnavailable) return;

        var seed = await SeedWithOffer(offerStatus: MatchStatus.PendingSupplierConfirmation);
        var svc = CreateMatchingService();

        await svc.DeclineAsSupplierAsync(seed.OfferId, seed.SupplierCompanyId);

        await using var db = CreateDbContext();
        db.MatchOffers.Single(o => o.Id == seed.OfferId).Status
            .Should().Be(MatchStatus.SupplierDeclined);
    }

    // ── Full round-trip ───────────────────────────────────────────────────────

    [Fact]
    public async Task FullFlow_AcceptThenConfirm_AgreementMatchesOfferDates()
    {
        if (_dockerUnavailable) return;

        var seed = await SeedWithOffer();
        await CreateMatchingService().AcceptAsRequesterAsync(seed.OfferId, seed.RequesterCompanyId);
        await CreateMatchingService().ConfirmAsSupplierAsync(seed.OfferId, seed.SupplierCompanyId);

        await using var db = CreateDbContext();
        var agreement = await db.CooperationAgreements.SingleAsync(a => a.RequestId == seed.RequestId);
        var request = await db.CapacityRequests.SingleAsync(r => r.Id == seed.RequestId);

        agreement.StartDate.Should().Be(request.StartDate);
        agreement.EndDate.Should().Be(request.EndDate);
        agreement.ConfirmedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(30));
    }

    // ── Utilities ─────────────────────────────────────────────────────────────

    private static bool IsDockerUnavailable(Exception ex)
    {
        if (ex is ArgumentException { ParamName: "DockerEndpointAuthConfig" })
            return true;

        return ex.Message.Contains("Docker is either not running or misconfigured", StringComparison.OrdinalIgnoreCase)
            || ex.Message.Contains("Docker daemon", StringComparison.OrdinalIgnoreCase)
            || ex.Message.Contains("Testcontainers", StringComparison.OrdinalIgnoreCase);
    }
}
