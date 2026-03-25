using Kapacitet.Domain.Entities;

namespace Kapacitet.Application.Features.Matching.Services;

public sealed class MatchEvaluationResult
{
    public required AvailabilityDeclaration Availability { get; init; }
    public required MatchScoreBreakdown Score { get; init; }
    public required string Explanation { get; init; }
    public required int OfferedQuantity { get; init; }
    public required int MatchedSkillCount { get; init; }
    public required int RequiredSkillCount { get; init; }
    public required int MatchedCertificateCount { get; init; }
    public required int RequiredCertificateCount { get; init; }
    public required bool CoversFullPeriod { get; init; }
    public required bool IsPartial { get; init; }
}

public sealed class MatchScoreBreakdown
{
    public required int SkillScore { get; init; }
    public required int CertificateScore { get; init; }
    public required int DateScore { get; init; }
    public required int LocationScore { get; init; }
    public required int QuantityScore { get; init; }

    public int TotalScore => SkillScore + CertificateScore + DateScore + LocationScore + QuantityScore;
}
