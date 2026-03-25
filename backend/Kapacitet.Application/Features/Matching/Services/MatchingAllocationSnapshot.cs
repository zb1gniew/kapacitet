namespace Kapacitet.Application.Features.Matching.Services;

public sealed class MatchingAllocationSnapshot
{
    private readonly IReadOnlyDictionary<int, int> _requestQuantities;
    private readonly IReadOnlyDictionary<int, int> _requestAllocatedQuantities;
    private readonly IReadOnlyDictionary<int, int> _availabilityQuantities;
    private readonly IReadOnlyDictionary<int, int> _availabilityAllocatedQuantities;

    public MatchingAllocationSnapshot(
        IReadOnlyDictionary<int, int> requestQuantities,
        IReadOnlyDictionary<int, int> requestAllocatedQuantities,
        IReadOnlyDictionary<int, int> availabilityQuantities,
        IReadOnlyDictionary<int, int> availabilityAllocatedQuantities)
    {
        _requestQuantities = requestQuantities;
        _requestAllocatedQuantities = requestAllocatedQuantities;
        _availabilityQuantities = availabilityQuantities;
        _availabilityAllocatedQuantities = availabilityAllocatedQuantities;
    }

    public int GetRemainingRequestQuantity(int requestId)
    {
        if (!_requestQuantities.TryGetValue(requestId, out var quantity))
        {
            return 0;
        }

        var allocated = _requestAllocatedQuantities.GetValueOrDefault(requestId);
        return Math.Max(0, quantity - allocated);
    }

    public int GetRemainingAvailabilityQuantity(int availabilityId)
    {
        if (!_availabilityQuantities.TryGetValue(availabilityId, out var quantity))
        {
            return 0;
        }

        var allocated = _availabilityAllocatedQuantities.GetValueOrDefault(availabilityId);
        return Math.Max(0, quantity - allocated);
    }
}
