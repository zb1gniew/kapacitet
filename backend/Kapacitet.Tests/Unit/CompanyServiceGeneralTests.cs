using FluentAssertions;
using Kapacitet.Application.Features.Common.Errors;
using Kapacitet.Application.Features.CompanySettings.DTOs;
using Kapacitet.Application.Features.CompanySettings.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Tests.Helpers;

namespace Kapacitet.Tests.Unit;

public class CompanyServiceGeneralTests
{
    private static User SeedUser(AppDbContext db, int companyId = 1)
    {
        var company = new Company
        {
            Id = companyId,
            Name = "Kapacitet Co",
            Cvr = "12345678",
            Categories = ["construction"],
            DefaultLocation = "Aarhus",
            ContactPhone = "+4511111111",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        var user = new User
        {
            Id = companyId,
            CompanyId = companyId,
            Email = $"admin{companyId}@test.com",
            Role = UserRole.Admin,
            CreatedAt = DateTime.UtcNow
        };

        db.Companies.Add(company);
        db.Users.Add(user);
        db.SaveChanges();
        return user;
    }

    [Fact]
    public async Task GetParticipationSettingsAsync_WhenNoSettingsExist_ReturnsDefaults()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        var service = new CompanyService(db);

        var result = await service.GetParticipationSettingsAsync(user.Email);

        result.ReceiveCapacityRequests.Should().BeTrue();
        result.ParticipateInNetworkWide.Should().BeTrue();
        result.AllowPartialMatches.Should().BeTrue();
        result.MatchOutsideCategory.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateParticipationSettingsAsync_CreatesAndPersistsSettings()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        var service = new CompanyService(db);
        var dto = new CompanyParticipationSettingsDto
        {
            ReceiveCapacityRequests = false,
            ParticipateInNetworkWide = false,
            AllowPartialMatches = false,
            MatchOutsideCategory = false
        };

        var result = await service.UpdateParticipationSettingsAsync(user.Email, dto);

        result.ReceiveCapacityRequests.Should().BeFalse();
        result.ParticipateInNetworkWide.Should().BeFalse();
        result.AllowPartialMatches.Should().BeFalse();
        result.MatchOutsideCategory.Should().BeFalse();

        var saved = db.CompanySettings.Single(c => c.CompanyId == user.CompanyId);
        saved.ReceiveCapacityRequests.Should().BeFalse();
        saved.ParticipateInNetworkWide.Should().BeFalse();
        saved.AllowPartialMatches.Should().BeFalse();
        saved.MatchOutsideCategory.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateInformationAsync_WithValidData_UpdatesCompanyAndClearsBlankPhone()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        var service = new CompanyService(db);

        var result = await service.UpdateInformationAsync(
            user.Email,
            new UpdateCompanyInformationDto
            {
                Categories = ["electrical", "painting"],
                DefaultLocation = "Odense",
                ContactPhone = "   "
            });

        result.Categories.Should().BeEquivalentTo(["electrical", "painting"]);
        result.DefaultLocation.Should().Be("Odense");
        result.ContactPhone.Should().BeNull();

        var savedCompany = db.Companies.Single(c => c.Id == user.CompanyId);
        savedCompany.Categories.Should().BeEquivalentTo(["electrical", "painting"]);
        savedCompany.DefaultLocation.Should().Be("Odense");
        savedCompany.ContactPhone.Should().BeNull();
    }

    [Fact]
    public async Task UpdateInformationAsync_WithInvalidPhone_ThrowsValidationException()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        var service = new CompanyService(db);

        var act = async () => await service.UpdateInformationAsync(
            user.Email,
            new UpdateCompanyInformationDto
            {
                ContactPhone = "12345"
            });

        var exception = await act.Should().ThrowAsync<ValidationException>();
        exception.Which.FieldErrors.Should().ContainKey("contactPhone");
    }

    [Fact]
    public async Task GetActivityAsync_ReturnsMostRecentItemsAcrossSources()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        var now = DateTime.UtcNow;

        db.CapacityRequests.Add(new CapacityRequest
        {
            Id = 1,
            CompanyId = user.CompanyId,
            ResourceType = ResourceType.Worker,
            Quantity = 4,
            StartDate = now.AddDays(7),
            EndDate = now.AddDays(14),
            LocationCity = "Aarhus",
            Status = ListingStatus.Active,
            CreatedAt = now.AddDays(-3),
            PublishedAt = now.AddHours(-1)
        });
        db.AvailabilityDeclarations.Add(new AvailabilityDeclaration
        {
            Id = 2,
            CompanyId = user.CompanyId,
            ResourceType = ResourceType.Worker,
            Quantity = 2,
            StartDate = now.AddDays(5),
            EndDate = now.AddDays(10),
            LocationCity = "Odense",
            Status = ListingStatus.Active,
            CreatedAt = now.AddDays(-2),
            PublishedAt = now.AddHours(-2)
        });
        db.MatchOffers.Add(new MatchOffer
        {
            Id = 3,
            RequestId = 1,
            AvailabilityId = 2,
            OfferedQuantity = 2,
            Explanation = "Good overlap",
            Status = MatchStatus.PendingSupplierConfirmation,
            CreatedAt = now.AddDays(-1),
            ExpiresAt = now.AddDays(1),
            RequesterReviewedAt = now.AddHours(-3)
        });
        db.CooperationAgreements.Add(new CooperationAgreement
        {
            Id = 4,
            RequestId = 1,
            MatchOfferId = 3,
            RequesterCompanyId = user.CompanyId,
            SupplierCompanyId = 99,
            StartDate = now.AddDays(14),
            EndDate = now.AddDays(30),
            CreatedAt = now.AddHours(-4)
        });
        await db.SaveChangesAsync();

        var service = new CompanyService(db);

        var result = await service.GetActivityAsync(user.Email, limit: 10);

        result.Select(activity => activity.Type).Should().Contain([
            "capacity_request_published",
            "availability_published",
            "match_accepted",
            "agreement_created"
        ]);
        result.Single(activity => activity.Type == "match_accepted")
            .Params["resourceType"]
            .Should().Be("worker");
        result.Should().BeInDescendingOrder(activity => activity.OccurredAt);
    }
}
