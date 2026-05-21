using FluentAssertions;
using Kapacitet.Application.Features.CapacityRequests.DTOs;
using Kapacitet.Application.Features.CapacityRequests.Services;
using Kapacitet.Application.Features.Common.Errors;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Tests.Helpers;

namespace Kapacitet.Tests.Unit;

public class CapacityRequestServiceTests
{
    private static DateTime FutureStartDate => DateTime.UtcNow.Date.AddDays(10);
    private static DateTime FutureEndDate => FutureStartDate.AddDays(10);

    private static CapacityRequestService CreateService(AppDbContext db) =>
        new(db, null!);

    private static CreateCapacityRequestDto CreateDto() => new()
    {
        StartDate = FutureStartDate,
        EndDate = FutureEndDate,
        LocationCity = "Aarhus",
        LocationRadiusKm = 25,
        Quantity = 4,
        Urgency = UrgencyLevel.Medium,
        ExperienceLevel = " Senior ",
        ClientDraftKey = " draft-123 ",
        SkillIds = [1],
        CertificateIds = [1]
    };

    private static void SeedCatalog(AppDbContext db)
    {
        db.Skills.Add(new Skill { Id = 1, Name = "Welding" });
        db.Certificates.Add(new Certificate { Id = 1, Name = "Safety" });
        db.SaveChanges();
    }

    [Fact]
    public async Task CreateAsync_WithValidData_CreatesDraftAndNormalizesFields()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);
        var service = CreateService(db);

        var result = await service.CreateAsync(CreateDto(), 7);

        result.CompanyId.Should().Be(7);
        result.Status.Should().Be(ListingStatus.Draft);
        result.LocationCity.Should().Be("Aarhus");
        result.ExperienceLevel.Should().Be("senior");
        result.PublishedAt.Should().BeNull();
        result.Skills.Should().ContainSingle().Which.Should().Be("Welding");
        result.Certificates.Should().ContainSingle().Which.Should().Be("Safety");

        var saved = db.CapacityRequests.Single();
        saved.ClientDraftKey.Should().Be("draft-123");
        saved.ExperienceLevel.Should().Be("senior");
        saved.Status.Should().Be(ListingStatus.Draft);
    }

    [Fact]
    public async Task CreateAsync_WhenCityUnsupported_ThrowsValidationException()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);
        var service = CreateService(db);
        var dto = CreateDto();
        dto.LocationCity = "Warsaw";

        var act = async () => await service.CreateAsync(dto, 1);

        var exception = await act.Should().ThrowAsync<ValidationException>();
        exception.Which.FieldErrors.Should().ContainKey("locationCity");
    }

    [Fact]
    public async Task CreateAsync_WhenEndDateBeforeStart_ThrowsValidationException()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);
        var service = CreateService(db);
        var dto = CreateDto();
        dto.EndDate = dto.StartDate;

        var act = async () => await service.CreateAsync(dto, 1);

        var exception = await act.Should().ThrowAsync<ValidationException>();
        exception.Which.FieldErrors.Should().ContainKey("endDate");
    }

    [Fact]
    public async Task CreateAsync_WhenStartDateMoreThanOneHundredYearsAhead_ThrowsValidationException()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);
        var service = CreateService(db);
        var dto = CreateDto();
        dto.StartDate = DateTime.UtcNow.Date.AddYears(101);
        dto.EndDate = dto.StartDate.AddDays(1);

        var act = async () => await service.CreateAsync(dto, 1);

        var exception = await act.Should().ThrowAsync<ValidationException>();
        exception.Which.FieldErrors.Should().ContainKey("startDate");
        exception.Which.FieldErrors["startDate"].Should().Contain("Start date cannot be more than 100 years from now.");
    }

    [Fact]
    public async Task CreateAsync_WhenSkillIdsUnknown_ThrowsValidationException()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);
        var service = CreateService(db);
        var dto = CreateDto();
        dto.SkillIds = [999];

        var act = async () => await service.CreateAsync(dto, 1);

        var exception = await act.Should().ThrowAsync<ValidationException>();
        exception.Which.FieldErrors.Should().ContainKey("skillIds");
    }

    [Fact]
    public async Task CreateAsync_WhenCertificateIdsUnknown_ThrowsValidationException()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);
        var service = CreateService(db);
        var dto = CreateDto();
        dto.CertificateIds = [999];

        var act = async () => await service.CreateAsync(dto, 1);

        var exception = await act.Should().ThrowAsync<ValidationException>();
        exception.Which.FieldErrors.Should().ContainKey("certificateIds");
    }

    [Fact]
    public async Task GetAllByCompanyAsync_ReturnsNewestFirst()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);

        db.CapacityRequests.AddRange(
            new CapacityRequest
            {
                Id = 1,
                CompanyId = 3,
                ResourceType = ResourceType.Worker,
                StartDate = DateTime.UtcNow.AddDays(10),
                EndDate = DateTime.UtcNow.AddDays(20),
                LocationCity = "Aarhus",
                LocationRadiusKm = 10,
                Quantity = 1,
                Status = ListingStatus.Draft,
                Urgency = UrgencyLevel.Low,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                Skills = [db.Skills.Single()],
                Certificates = [db.Certificates.Single()]
            },
            new CapacityRequest
            {
                Id = 2,
                CompanyId = 3,
                ResourceType = ResourceType.Worker,
                StartDate = DateTime.UtcNow.AddDays(15),
                EndDate = DateTime.UtcNow.AddDays(25),
                LocationCity = "Odense",
                LocationRadiusKm = 15,
                Quantity = 2,
                Status = ListingStatus.Active,
                Urgency = UrgencyLevel.High,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                Skills = [db.Skills.Single()],
                Certificates = [db.Certificates.Single()]
            });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.GetAllByCompanyAsync(3);

        result.Select(request => request.Id).Should().Equal(2, 1);
    }

    [Fact]
    public async Task UpdateAsync_WhenDraftExists_UpdatesFields()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);
        db.CapacityRequests.Add(new CapacityRequest
        {
            Id = 10,
            CompanyId = 4,
            ClientDraftKey = "old-key",
            ResourceType = ResourceType.Worker,
            StartDate = FutureStartDate,
            EndDate = FutureStartDate.AddDays(4),
            LocationCity = "Aarhus",
            LocationRadiusKm = 10,
            Quantity = 1,
            ExperienceLevel = "junior",
            Status = ListingStatus.Draft,
            Urgency = UrgencyLevel.Low,
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            Skills = [db.Skills.Single()],
            Certificates = [db.Certificates.Single()]
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.UpdateAsync(
            10,
            new UpdateCapacityRequestDto
            {
                StartDate = FutureStartDate.AddDays(30),
                EndDate = FutureStartDate.AddDays(39),
                LocationCity = "Odense",
                LocationRadiusKm = 35,
                Quantity = 6,
                ExperienceLevel = " Mid ",
                Urgency = UrgencyLevel.High,
                SkillIds = [1],
                CertificateIds = [1]
            },
            4);

        result.LocationCity.Should().Be("Odense");
        result.Quantity.Should().Be(6);
        result.ExperienceLevel.Should().Be("mid");
        result.Urgency.Should().Be(UrgencyLevel.High);

        var saved = db.CapacityRequests.Single(r => r.Id == 10);
        saved.LocationCity.Should().Be("Odense");
        saved.ExperienceLevel.Should().Be("mid");
        saved.Quantity.Should().Be(6);
    }

    [Fact]
    public async Task UpdateAsync_WhenRequestIsNotDraft_ThrowsInvalidOperationException()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);
        db.CapacityRequests.Add(new CapacityRequest
        {
            Id = 11,
            CompanyId = 4,
            ResourceType = ResourceType.Worker,
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(2),
            LocationCity = "Aarhus",
            LocationRadiusKm = 10,
            Quantity = 1,
            Status = ListingStatus.Active,
            Urgency = UrgencyLevel.Low,
            CreatedAt = DateTime.UtcNow,
            Skills = [db.Skills.Single()],
            Certificates = [db.Certificates.Single()]
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var act = async () => await service.UpdateAsync(
            11,
            new UpdateCapacityRequestDto
            {
                StartDate = DateTime.UtcNow.AddDays(3),
                EndDate = DateTime.UtcNow.AddDays(4),
                LocationCity = "Aarhus",
                LocationRadiusKm = 10,
                Quantity = 2,
                Urgency = UrgencyLevel.Medium,
                SkillIds = [1],
                CertificateIds = [1]
            },
            4);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Only draft requests can be edited");
    }

    [Fact]
    public async Task GetByIdAsync_WhenRequestBelongsToDifferentCompany_ThrowsKeyNotFoundException()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);
        db.CapacityRequests.Add(new CapacityRequest
        {
            Id = 12,
            CompanyId = 4,
            ResourceType = ResourceType.Worker,
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(2),
            LocationCity = "Aarhus",
            LocationRadiusKm = 10,
            Quantity = 1,
            Status = ListingStatus.Draft,
            Urgency = UrgencyLevel.Low,
            CreatedAt = DateTime.UtcNow,
            Skills = [db.Skills.Single()],
            Certificates = [db.Certificates.Single()]
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var act = async () => await service.GetByIdAsync(12, 99);

        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("CapacityRequest 12 not found");
    }

    [Fact]
    public async Task CancelAsync_WithdrawsOpenOffersAndResolvesOpenEscalation()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);

        db.CapacityRequests.Add(new CapacityRequest
        {
            Id = 20,
            CompanyId = 9,
            ResourceType = ResourceType.Worker,
            StartDate = DateTime.UtcNow.AddDays(10),
            EndDate = DateTime.UtcNow.AddDays(20),
            LocationCity = "Aarhus",
            LocationRadiusKm = 20,
            Quantity = 3,
            Status = ListingStatus.Active,
            Urgency = UrgencyLevel.High,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            Skills = [db.Skills.Single()],
            Certificates = [db.Certificates.Single()]
        });
        db.MatchOffers.AddRange(
            new MatchOffer
            {
                Id = 1,
                RequestId = 20,
                AvailabilityId = 100,
                OfferedQuantity = 1,
                MatchScore = 10,
                SkillScore = 10,
                CertificateScore = 10,
                DateScore = 10,
                LocationScore = 10,
                QuantityScore = 10,
                MatchedSkillCount = 1,
                RequiredSkillCount = 1,
                MatchedCertificateCount = 1,
                RequiredCertificateCount = 1,
                CoversFullPeriod = true,
                IsPartial = false,
                Explanation = "Open offer",
                Status = MatchStatus.PendingRequesterReview,
                CreatedAt = DateTime.UtcNow.AddHours(-3),
                ExpiresAt = DateTime.UtcNow.AddDays(1)
            },
            new MatchOffer
            {
                Id = 2,
                RequestId = 20,
                AvailabilityId = 101,
                OfferedQuantity = 1,
                MatchScore = 10,
                SkillScore = 10,
                CertificateScore = 10,
                DateScore = 10,
                LocationScore = 10,
                QuantityScore = 10,
                MatchedSkillCount = 1,
                RequiredSkillCount = 1,
                MatchedCertificateCount = 1,
                RequiredCertificateCount = 1,
                CoversFullPeriod = true,
                IsPartial = false,
                Explanation = "Already closed",
                Status = MatchStatus.SupplierDeclined,
                CreatedAt = DateTime.UtcNow.AddHours(-2),
                ExpiresAt = DateTime.UtcNow.AddDays(1)
            });
        db.NetworkEscalations.Add(new NetworkEscalation
        {
            Id = 1,
            RequestId = 20,
            TriggeredAt = DateTime.UtcNow.AddHours(-1),
            Status = NetworkEscalationStatus.Open
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.CancelAsync(20, 9);

        result.Status.Should().Be(ListingStatus.Cancelled);
        db.MatchOffers.Single(m => m.Id == 1).Status.Should().Be(MatchStatus.Withdrawn);
        db.MatchOffers.Single(m => m.Id == 2).Status.Should().Be(MatchStatus.SupplierDeclined);
        db.NetworkEscalations.Single().Status.Should().Be(NetworkEscalationStatus.Resolved);
        db.CapacityRequests.Single().Status.Should().Be(ListingStatus.Cancelled);
    }

    [Fact]
    public async Task CancelAsync_WhenAlreadyCancelled_ThrowsInvalidOperationException()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);
        db.CapacityRequests.Add(new CapacityRequest
        {
            Id = 21,
            CompanyId = 9,
            ResourceType = ResourceType.Worker,
            StartDate = DateTime.UtcNow.AddDays(10),
            EndDate = DateTime.UtcNow.AddDays(20),
            LocationCity = "Aarhus",
            LocationRadiusKm = 20,
            Quantity = 3,
            Status = ListingStatus.Cancelled,
            Urgency = UrgencyLevel.High,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            Skills = [db.Skills.Single()],
            Certificates = [db.Certificates.Single()]
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var act = async () => await service.CancelAsync(21, 9);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Request is already cancelled");
    }

    [Fact]
    public async Task CancelAsync_WhenRequestBelongsToDifferentCompany_ThrowsKeyNotFoundException()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);
        db.CapacityRequests.Add(new CapacityRequest
        {
            Id = 22,
            CompanyId = 9,
            ResourceType = ResourceType.Worker,
            StartDate = DateTime.UtcNow.AddDays(10),
            EndDate = DateTime.UtcNow.AddDays(20),
            LocationCity = "Aarhus",
            LocationRadiusKm = 20,
            Quantity = 3,
            Status = ListingStatus.Active,
            Urgency = UrgencyLevel.High,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            Skills = [db.Skills.Single()],
            Certificates = [db.Certificates.Single()]
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var act = async () => await service.CancelAsync(22, 3);

        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("CapacityRequest 22 not found");
    }
}
