using Kapacitet.Domain.Enums;

namespace Kapacitet.Application.Features.Matching.DTOs;

public class MatchOfferDto
{
    public int Id { get; set; }
    public int RequestId { get; set; }
    public int AvailabilityId { get; set; }
    public string Perspective { get; set; } = null!;
    public MatchStatus Status { get; set; }
    public int OfferedQuantity { get; set; }
    public int RequestQuantity { get; set; }
    public int AvailabilityQuantity { get; set; }
    public int MatchScore { get; set; }
    public int SkillScore { get; set; }
    public int CertificateScore { get; set; }
    public int DateScore { get; set; }
    public int LocationScore { get; set; }
    public int QuantityScore { get; set; }
    public bool CoversFullPeriod { get; set; }
    public bool IsPartial { get; set; }
    public string LocationCity { get; set; } = null!;
    public string RequestLocationCity { get; set; } = null!;
    public int RequestLocationRadiusKm { get; set; }
    public string AvailabilityLocationCity { get; set; } = null!;
    public int AvailabilityLocationRadiusKm { get; set; }
    public UrgencyLevel RequestUrgency { get; set; }
    public DateTime RequestStartDate { get; set; }
    public DateTime RequestEndDate { get; set; }
    public DateTime AvailabilityStartDate { get; set; }
    public DateTime AvailabilityEndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string Explanation { get; set; } = null!;
    public string? PartnerCompanyName { get; set; }
    public int? PartnerCompanyId { get; set; }
    public List<string> Skills { get; set; } = [];
    public List<string> Certificates { get; set; } = [];
}
