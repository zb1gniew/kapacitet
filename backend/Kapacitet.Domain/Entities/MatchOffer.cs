using Kapacitet.Domain.Enums;

namespace Kapacitet.Domain.Entities;

public class MatchOffer
{
    public int Id { get; set; }
    public int RequestId { get; set; }
    public int AvailabilityId { get; set; }
    public int OfferedQuantity { get; set; }
    public int MatchScore { get; set; }
    public int SkillScore { get; set; }
    public int CertificateScore { get; set; }
    public int DateScore { get; set; }
    public int LocationScore { get; set; }
    public int QuantityScore { get; set; }
    public int MatchedSkillCount { get; set; }
    public int RequiredSkillCount { get; set; }
    public int MatchedCertificateCount { get; set; }
    public int RequiredCertificateCount { get; set; }
    public bool CoversFullPeriod { get; set; }
    public bool IsPartial { get; set; }
    public string Explanation { get; set; } = null!;
    public MatchStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? RequesterReviewedAt { get; set; }
    public DateTime? SupplierReviewedAt { get; set; }

    public CapacityRequest Request { get; set; } = null!;
    public AvailabilityDeclaration Availability { get; set; } = null!;
    public CooperationAgreement? CooperationAgreement { get; set; }
}
