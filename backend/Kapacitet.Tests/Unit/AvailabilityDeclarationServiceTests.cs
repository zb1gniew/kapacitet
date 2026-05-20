using FluentAssertions;
using Kapacitet.Application.Features.AvailabilityDeclarations.DTOs;
using Kapacitet.Application.Features.AvailabilityDeclarations.Services;
using Kapacitet.Application.Features.Common.Errors;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Tests.Helpers;

namespace Kapacitet.Tests.Unit;

public class AvailabilityDeclarationServiceTests
{
    private static DateTime FutureStartDate => DateTime.UtcNow.Date.AddDays(10);
    private static DateTime FutureEndDate => FutureStartDate.AddDays(10);

    private static AvailabilityDeclarationService CreateService(AppDbContext db) =>
        new(db, null!);

    private static CreateAvailabilityDeclarationDto CreateDto() => new()
    {
        StartDate = FutureStartDate,
        EndDate = FutureEndDate,
        LocationCity = "Aarhus",
        LocationRadiusKm = 25,
        Quantity = 4,
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

        var saved = db.AvailabilityDeclarations.Single();
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

        db.AvailabilityDeclarations.AddRange(
            new AvailabilityDeclaration
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
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                Skills = [db.Skills.Single()],
                Certificates = [db.Certificates.Single()]
            },
            new AvailabilityDeclaration
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
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                Skills = [db.Skills.Single()],
                Certificates = [db.Certificates.Single()]
            });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.GetAllByCompanyAsync(3);

        result.Select(declaration => declaration.Id).Should().Equal(2, 1);
    }

    [Fact]
    public async Task UpdateAsync_WhenDraftExists_UpdatesFields()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);
        db.AvailabilityDeclarations.Add(new AvailabilityDeclaration
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
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            Skills = [db.Skills.Single()],
            Certificates = [db.Certificates.Single()]
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.UpdateAsync(
            10,
            new UpdateAvailabilityDeclarationDto
            {
                StartDate = FutureStartDate.AddDays(30),
                EndDate = FutureStartDate.AddDays(39),
                LocationCity = "Odense",
                LocationRadiusKm = 35,
                Quantity = 6,
                ExperienceLevel = " Mid ",
                SkillIds = [1],
                CertificateIds = [1]
            },
            4);

        result.LocationCity.Should().Be("Odense");
        result.Quantity.Should().Be(6);
        result.ExperienceLevel.Should().Be("mid");

        var saved = db.AvailabilityDeclarations.Single(r => r.Id == 10);
        saved.LocationCity.Should().Be("Odense");
        saved.ExperienceLevel.Should().Be("mid");
        saved.Quantity.Should().Be(6);
    }

    [Fact]
    public async Task UpdateAsync_WhenDeclarationIsNotDraft_ThrowsInvalidOperationException()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);
        db.AvailabilityDeclarations.Add(new AvailabilityDeclaration
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
            CreatedAt = DateTime.UtcNow,
            Skills = [db.Skills.Single()],
            Certificates = [db.Certificates.Single()]
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var act = async () => await service.UpdateAsync(
            11,
            new UpdateAvailabilityDeclarationDto
            {
                StartDate = DateTime.UtcNow.AddDays(3),
                EndDate = DateTime.UtcNow.AddDays(4),
                LocationCity = "Aarhus",
                LocationRadiusKm = 10,
                Quantity = 2,
                SkillIds = [1],
                CertificateIds = [1]
            },
            4);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Only draft declarations can be edited");
    }

    [Fact]
    public async Task WithdrawAsync_WhenActive_ChangesStatusToCancelled()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);
        db.CapacityRequests.Add(new CapacityRequest
        {
            Id = 30,
            CompanyId = 12,
            ResourceType = ResourceType.Worker,
            StartDate = DateTime.UtcNow.AddDays(10),
            EndDate = DateTime.UtcNow.AddDays(20),
            LocationCity = "Aarhus",
            LocationRadiusKm = 20,
            Quantity = 2,
            Status = ListingStatus.Active,
            Urgency = UrgencyLevel.Medium,
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            Skills = [db.Skills.Single()],
            Certificates = [db.Certificates.Single()]
        });
        db.AvailabilityDeclarations.Add(new AvailabilityDeclaration
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
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            Skills = [db.Skills.Single()],
            Certificates = [db.Certificates.Single()]
        });
        db.MatchOffers.Add(new MatchOffer
        {
            Id = 40,
            RequestId = 30,
            AvailabilityId = 20,
            OfferedQuantity = 2,
            MatchScore = 90,
            Explanation = "Open offer",
            Status = MatchStatus.PendingRequesterReview,
            CreatedAt = DateTime.UtcNow.AddHours(-3),
            ExpiresAt = DateTime.UtcNow.AddDays(2)
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.WithdrawAsync(20, 9);

        result.Status.Should().Be(ListingStatus.Cancelled);
        db.AvailabilityDeclarations.Single().Status.Should().Be(ListingStatus.Cancelled);
        db.MatchOffers.Single().Status.Should().Be(MatchStatus.Withdrawn);
    }

    [Fact]
    public async Task WithdrawAsync_WhenNotActive_ThrowsInvalidOperationException()
    {
        var db = TestDbFactory.Create();
        SeedCatalog(db);
        db.AvailabilityDeclarations.Add(new AvailabilityDeclaration
        {
            Id = 21,
            CompanyId = 9,
            ResourceType = ResourceType.Worker,
            StartDate = DateTime.UtcNow.AddDays(10),
            EndDate = DateTime.UtcNow.AddDays(20),
            LocationCity = "Aarhus",
            LocationRadiusKm = 20,
            Quantity = 3,
            Status = ListingStatus.Draft,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            Skills = [db.Skills.Single()],
            Certificates = [db.Certificates.Single()]
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var act = async () => await service.WithdrawAsync(21, 9);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Only active declarations can be withdrawn");
    }
}
