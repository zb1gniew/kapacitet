using FluentAssertions;
using Kapacitet.Application.Features.Matching.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;

namespace Kapacitet.Tests.Unit;

public class MatchEvaluationServiceTests
{
    private readonly MatchEvaluationService _svc = new();

    private static CapacityRequest BaseRequest() => new()
    {
        Id = 1,
        CompanyId = 1,
        ResourceType = ResourceType.Worker,
        StartDate = new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
        EndDate = new DateTime(2026, 5, 31, 0, 0, 0, DateTimeKind.Utc),
        LocationCity = "Warsaw",
        LocationRadiusKm = 0,
        Quantity = 5,
        Status = ListingStatus.Active,
        CreatedAt = DateTime.UtcNow,
        Skills = [],
        Certificates = []
    };

    private static AvailabilityDeclaration BaseAvailability() => new()
    {
        Id = 1,
        CompanyId = 2,
        ResourceType = ResourceType.Worker,
        StartDate = new DateTime(2026, 4, 30, 0, 0, 0, DateTimeKind.Utc),
        EndDate = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc),
        LocationCity = "Warsaw",
        LocationRadiusKm = 0,
        Quantity = 5,
        Status = ListingStatus.Active,
        CreatedAt = DateTime.UtcNow,
        Skills = [],
        Certificates = []
    };

    [Fact]
    public void Evaluate_WhenResourceTypeMismatch_ReturnsNull()
    {
        var avail = BaseAvailability();
        avail.ResourceType = (ResourceType)99;
        _svc.Evaluate(BaseRequest(), avail, 5, 5).Should().BeNull();
    }

    [Fact]
    public void Evaluate_WhenRequestRemainingZero_ReturnsNull()
        => _svc.Evaluate(BaseRequest(), BaseAvailability(), 0, 5).Should().BeNull();

    [Fact]
    public void Evaluate_WhenAvailabilityRemainingZero_ReturnsNull()
        => _svc.Evaluate(BaseRequest(), BaseAvailability(), 5, 0).Should().BeNull();

    [Fact]
    public void Evaluate_WhenAvailabilityStartsAfterRequest_ReturnsNull()
    {
        var avail = BaseAvailability();
        avail.StartDate = new DateTime(2026, 5, 5, 0, 0, 0, DateTimeKind.Utc);
        _svc.Evaluate(BaseRequest(), avail, 5, 5).Should().BeNull();
    }

    [Fact]
    public void Evaluate_WhenAvailabilityEndsBeforeRequest_ReturnsNull()
    {
        var avail = BaseAvailability();
        avail.EndDate = new DateTime(2026, 5, 25, 0, 0, 0, DateTimeKind.Utc);
        _svc.Evaluate(BaseRequest(), avail, 5, 5).Should().BeNull();
    }

    [Fact]
    public void Evaluate_WhenRequiredSkillMissingFromAvailability_ReturnsNull()
    {
        var request = BaseRequest();
        request.Skills = [new Skill { Id = 1, Name = "C#" }];
        // availability has no skills → required skill not covered
        _svc.Evaluate(request, BaseAvailability(), 5, 5).Should().BeNull();
    }

    [Fact]
    public void Evaluate_WhenAllSkillsMatch_ReturnsResult()
    {
        var request = BaseRequest();
        var avail = BaseAvailability();
        request.Skills = [new Skill { Id = 1, Name = "C#" }];
        avail.Skills = [new Skill { Id = 1, Name = "C#" }];
        _svc.Evaluate(request, avail, 5, 5).Should().NotBeNull();
    }

    [Fact]
    public void Evaluate_WhenPerfectMatch_ReturnsTotalScoreGreaterThanZero()
    {
        var result = _svc.Evaluate(BaseRequest(), BaseAvailability(), 5, 5);
        result.Should().NotBeNull();
        result!.Score.TotalScore.Should().BeGreaterThan(0);
    }

    [Fact]
    public void Evaluate_WhenAvailabilityQuantityLess_OffersAvailabilityQty()
    {
        var result = _svc.Evaluate(BaseRequest(), BaseAvailability(), 5, 3);
        result.Should().NotBeNull();
        result!.OfferedQuantity.Should().Be(3);
    }

    [Fact]
    public void Evaluate_WhenRequestQuantityLess_OffersRequestQty()
    {
        var result = _svc.Evaluate(BaseRequest(), BaseAvailability(), 2, 5);
        result.Should().NotBeNull();
        result!.OfferedQuantity.Should().Be(2);
    }

    [Fact]
    public void Evaluate_WhenNoRequirementsAndFullQuantity_IsNotPartial()
    {
        var result = _svc.Evaluate(BaseRequest(), BaseAvailability(), 5, 5);
        result.Should().NotBeNull();
        result!.IsPartial.Should().BeFalse();
    }

    [Fact]
    public void Evaluate_WhenAvailabilityCoversExactly_ReturnsResult()
    {
        // Start/End exactly match request
        var avail = BaseAvailability();
        avail.StartDate = new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc);
        avail.EndDate = new DateTime(2026, 5, 31, 0, 0, 0, DateTimeKind.Utc);
        _svc.Evaluate(BaseRequest(), avail, 5, 5).Should().NotBeNull();
    }
}