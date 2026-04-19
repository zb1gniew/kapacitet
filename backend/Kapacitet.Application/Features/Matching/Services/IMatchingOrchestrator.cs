using Kapacitet.Application.Features.Matching.DTOs;

namespace Kapacitet.Application.Features.Matching.Services;

/// <summary>
/// Minimal interface consumed by services that need to trigger match generation
/// without taking a full dependency on <see cref="MatchingService"/>.
/// </summary>
public interface IMatchingOrchestrator
{
    Task<List<MatchOfferDto>> GenerateMatchesForRequestAsync(int requestId);
}
