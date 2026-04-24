using FluentAssertions;
using Kapacitet.Application.Features.Matching.Services;

namespace Kapacitet.Tests.Unit;

public class MatchingAllocationSnapshotTests
{
    private static readonly Dictionary<int, int> Empty = [];

    private static MatchingAllocationSnapshot Make(
        Dictionary<int, int>? reqQty = null,
        Dictionary<int, int>? reqAllocated = null,
        Dictionary<int, int>? availQty = null,
        Dictionary<int, int>? availAllocated = null) =>
        new(
            reqQty ?? Empty,
            reqAllocated ?? Empty,
            availQty ?? Empty,
            availAllocated ?? Empty);

    // ── GetRemainingRequestQuantity ──────────────────────────────────────────

    [Fact]
    public void GetRemainingRequestQuantity_WhenIdNotPresent_ReturnsZero()
        => Make().GetRemainingRequestQuantity(1).Should().Be(0);

    [Fact]
    public void GetRemainingRequestQuantity_WhenNoAllocation_ReturnsFullQuantity()
        => Make(reqQty: new() { [1] = 10 }).GetRemainingRequestQuantity(1).Should().Be(10);

    [Fact]
    public void GetRemainingRequestQuantity_WhenPartiallyAllocated_ReturnsRemainder()
        => Make(reqQty: new() { [1] = 10 }, reqAllocated: new() { [1] = 4 })
            .GetRemainingRequestQuantity(1).Should().Be(6);

    [Fact]
    public void GetRemainingRequestQuantity_WhenFullyAllocated_ReturnsZero()
        => Make(reqQty: new() { [1] = 5 }, reqAllocated: new() { [1] = 5 })
            .GetRemainingRequestQuantity(1).Should().Be(0);

    [Fact]
    public void GetRemainingRequestQuantity_WhenOverAllocated_ClampsToZero()
        => Make(reqQty: new() { [1] = 3 }, reqAllocated: new() { [1] = 5 })
            .GetRemainingRequestQuantity(1).Should().Be(0);

    // ── GetRemainingAvailabilityQuantity ─────────────────────────────────────

    [Fact]
    public void GetRemainingAvailabilityQuantity_WhenIdNotPresent_ReturnsZero()
        => Make().GetRemainingAvailabilityQuantity(99).Should().Be(0);

    [Fact]
    public void GetRemainingAvailabilityQuantity_WhenNoAllocation_ReturnsFullQuantity()
        => Make(availQty: new() { [2] = 8 }).GetRemainingAvailabilityQuantity(2).Should().Be(8);

    [Fact]
    public void GetRemainingAvailabilityQuantity_WhenPartiallyAllocated_ReturnsRemainder()
        => Make(availQty: new() { [2] = 8 }, availAllocated: new() { [2] = 3 })
            .GetRemainingAvailabilityQuantity(2).Should().Be(5);

    [Fact]
    public void GetRemainingAvailabilityQuantity_WhenOverAllocated_ClampsToZero()
        => Make(availQty: new() { [2] = 2 }, availAllocated: new() { [2] = 10 })
            .GetRemainingAvailabilityQuantity(2).Should().Be(0);
}
