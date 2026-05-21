using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using Kapacitet.Application.Features.AvailabilityDeclarations.DTOs;
using Kapacitet.Application.Features.CapacityRequests.DTOs;
using Kapacitet.Domain.Enums;

namespace Kapacitet.Tests.Unit;

public class WorkflowRequestValidationTests
{
    [Fact]
    public void CreateAvailabilityDeclarationDto_WithMultipleBoundaryViolations_ReturnsFieldErrors()
    {
        var dto = new CreateAvailabilityDeclarationDto
        {
            StartDate = new DateTime(2027, 8, 15, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 8, 15, 0, 0, 0, DateTimeKind.Utc),
            LocationCity = "Aarhus",
            LocationRadiusKm = 25,
            Quantity = 0,
            ExperienceLevel = "expert",
            SkillIds = [],
            CertificateIds = []
        };

        var results = Validate(dto);

        results.Should().Contain(result => result.MemberNames.Contains(nameof(CreateAvailabilityDeclarationDto.EndDate)));
        results.Should().Contain(result => result.MemberNames.Contains(nameof(CreateAvailabilityDeclarationDto.Quantity)));
        results.Should().Contain(result => result.MemberNames.Contains(nameof(CreateAvailabilityDeclarationDto.SkillIds)));
        results.Should().Contain(result => result.MemberNames.Contains(nameof(CreateAvailabilityDeclarationDto.CertificateIds)));
        results.Should().Contain(result => result.MemberNames.Contains(nameof(CreateAvailabilityDeclarationDto.ExperienceLevel)));
    }

    [Fact]
    public void CreateAvailabilityDeclarationDto_WithValidFields_PassesValidation()
    {
        var dto = new CreateAvailabilityDeclarationDto
        {
            StartDate = new DateTime(2027, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 8, 15, 0, 0, 0, DateTimeKind.Utc),
            LocationCity = "Aarhus",
            LocationRadiusKm = 25,
            Quantity = 2,
            ExperienceLevel = "mid",
            SkillIds = [1],
            CertificateIds = [1]
        };

        Validate(dto).Should().BeEmpty();
    }

    [Fact]
    public void CreateAvailabilityDeclarationDto_WithQuantityAboveMaximum_ReturnsQuantityError()
    {
        var dto = new CreateAvailabilityDeclarationDto
        {
            StartDate = new DateTime(2027, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 8, 15, 0, 0, 0, DateTimeKind.Utc),
            LocationCity = "Aarhus",
            LocationRadiusKm = 25,
            Quantity = 101,
            ExperienceLevel = "mid",
            SkillIds = [1],
            CertificateIds = [1]
        };

        var results = Validate(dto);

        results.Should().Contain(result =>
            result.MemberNames.Contains(nameof(CreateAvailabilityDeclarationDto.Quantity)) &&
            result.ErrorMessage == "Quantity must be less than or equal to 100");
    }

    [Fact]
    public void CreateCapacityRequestDto_WithMultipleBoundaryViolations_ReturnsFieldErrors()
    {
        var dto = new CreateCapacityRequestDto
        {
            StartDate = new DateTime(2027, 8, 15, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 8, 10, 0, 0, 0, DateTimeKind.Utc),
            LocationCity = "Odense",
            LocationRadiusKm = 30,
            Quantity = -1,
            Urgency = UrgencyLevel.High,
            ExperienceLevel = "lead",
            SkillIds = [],
            CertificateIds = []
        };

        var results = Validate(dto);

        results.Should().Contain(result => result.MemberNames.Contains(nameof(CreateCapacityRequestDto.EndDate)));
        results.Should().Contain(result => result.MemberNames.Contains(nameof(CreateCapacityRequestDto.Quantity)));
        results.Should().Contain(result => result.MemberNames.Contains(nameof(CreateCapacityRequestDto.SkillIds)));
        results.Should().Contain(result => result.MemberNames.Contains(nameof(CreateCapacityRequestDto.CertificateIds)));
        results.Should().Contain(result => result.MemberNames.Contains(nameof(CreateCapacityRequestDto.ExperienceLevel)));
    }

    [Fact]
    public void CreateCapacityRequestDto_WithValidFields_PassesValidation()
    {
        var dto = new CreateCapacityRequestDto
        {
            StartDate = new DateTime(2027, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 8, 20, 0, 0, 0, DateTimeKind.Utc),
            LocationCity = "Odense",
            LocationRadiusKm = 30,
            Quantity = 3,
            Urgency = UrgencyLevel.Critical,
            ExperienceLevel = "senior",
            SkillIds = [1],
            CertificateIds = [1]
        };

        Validate(dto).Should().BeEmpty();
    }

    [Fact]
    public void CreateCapacityRequestDto_WithQuantityAboveMaximum_ReturnsQuantityError()
    {
        var dto = new CreateCapacityRequestDto
        {
            StartDate = new DateTime(2027, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 8, 20, 0, 0, 0, DateTimeKind.Utc),
            LocationCity = "Odense",
            LocationRadiusKm = 30,
            Quantity = 101,
            Urgency = UrgencyLevel.Critical,
            ExperienceLevel = "senior",
            SkillIds = [1],
            CertificateIds = [1]
        };

        var results = Validate(dto);

        results.Should().Contain(result =>
            result.MemberNames.Contains(nameof(CreateCapacityRequestDto.Quantity)) &&
            result.ErrorMessage == "Quantity must be less than or equal to 100");
    }

    private static List<ValidationResult> Validate(object instance)
    {
        var context = new ValidationContext(instance);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(instance, context, results, validateAllProperties: true);
        return results;
    }
}
