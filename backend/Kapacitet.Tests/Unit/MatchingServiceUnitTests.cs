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

/// <summary>
/// Unit tests for MatchingService authorization and status-validation branches.
/// Uses in-memory EF Core via TestDbFactory.Create() (no real Postgres needed).
/// ConfirmAsSupplierAsync is excluded because it requires Serializable transactions
/// (covered by Integration/MatchingServiceAcceptanceFlowTests.cs).
/// </summary>
public class MatchingServiceUnitTests
{
    // ── Factory ───────────────────────────────────────────────────────────────

    private static MatchingService CreateService(AppDbContext db)
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

    // ── Seed helper ───────────────────────────────────────────────────────────

    private record SeedData(
        int RequesterCompanyId,
        int SupplierCompanyId,
        int RequestId,
        int AvailabilityId,
        int OfferId);

    private static async Task<(AppDbContext db, SeedData seed)> SeedAsync(
        MatchStatus offerStatus = MatchStatus.PendingRequesterReview)
    {
        var db = TestDbFactory.Create();

        var requester = new Company
        {
            Id = 1,
            Name = "Requester Co",
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        var supplier = new Company
        {
            Id = 2,
            Name = "Supplier Co",
            DefaultLocation = "Copenhagen",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        db.Companies.AddRange(requester, supplier);
        await db.SaveChangesAsync();

        // Add minimal users so NotificationService can look them up
        db.Users.AddRange(
            new User { CompanyId = requester.Id, Email = "req@test.com", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow },
            new User { CompanyId = supplier.Id, Email = "sup@test.com", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow });

        var start = new DateTime(2027, 8, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2027, 8, 31, 0, 0, 0, DateTimeKind.Utc);

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

        return (db, new SeedData(requester.Id, supplier.Id, request.Id, avail.Id, offer.Id));
    }

    // ── AcceptAsRequesterAsync ────────────────────────────────────────────────

    [Fact]
    public async Task AcceptAsRequesterAsync_WhenWrongCompany_ThrowsUnauthorized()
    {
        var (db, seed) = await SeedAsync();
        var svc = CreateService(db);

        var act = async () => await svc.AcceptAsRequesterAsync(seed.OfferId, companyId: seed.SupplierCompanyId);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*requesting company*");
    }

    [Fact]
    public async Task AcceptAsRequesterAsync_WhenStatusNotPendingRequesterReview_ThrowsInvalidOperation()
    {
        var (db, seed) = await SeedAsync(offerStatus: MatchStatus.PendingSupplierConfirmation);
        var svc = CreateService(db);

        var act = async () => await svc.AcceptAsRequesterAsync(seed.OfferId, companyId: seed.RequesterCompanyId);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*pending*");
    }

    // ── DeclineAsRequesterAsync ───────────────────────────────────────────────

    [Fact]
    public async Task DeclineAsRequesterAsync_WhenWrongCompany_ThrowsUnauthorized()
    {
        var (db, seed) = await SeedAsync();
        var svc = CreateService(db);

        var act = async () => await svc.DeclineAsRequesterAsync(seed.OfferId, companyId: seed.SupplierCompanyId);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*requesting company*");
    }

    [Fact]
    public async Task DeclineAsRequesterAsync_WhenStatusNotPendingRequesterReview_ThrowsInvalidOperation()
    {
        var (db, seed) = await SeedAsync(offerStatus: MatchStatus.RequesterDeclined);
        var svc = CreateService(db);

        var act = async () => await svc.DeclineAsRequesterAsync(seed.OfferId, companyId: seed.RequesterCompanyId);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*pending*");
    }

    // ── DeclineAsSupplierAsync ────────────────────────────────────────────────

    [Fact]
    public async Task DeclineAsSupplierAsync_WhenWrongCompany_ThrowsUnauthorized()
    {
        var (db, seed) = await SeedAsync(offerStatus: MatchStatus.PendingSupplierConfirmation);
        var svc = CreateService(db);

        var act = async () => await svc.DeclineAsSupplierAsync(seed.OfferId, companyId: seed.RequesterCompanyId);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*supplying company*");
    }

    [Fact]
    public async Task DeclineAsSupplierAsync_WhenStatusNotPendingSupplierConfirmation_ThrowsInvalidOperation()
    {
        var (db, seed) = await SeedAsync(offerStatus: MatchStatus.PendingRequesterReview);
        var svc = CreateService(db);

        var act = async () => await svc.DeclineAsSupplierAsync(seed.OfferId, companyId: seed.SupplierCompanyId);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requester-accepted*");
    }
}
