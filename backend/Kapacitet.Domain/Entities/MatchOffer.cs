using Kapacitet.Domain.Enums;

namespace Kapacitet.Domain.Entities;

public class MatchOffer
{
    public int Id { get; set; }
    public int RequestId { get; set; }
    public int AvailabilityId { get; set; }
    public int MatchScore { get; set; }
    public MatchStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }

    public CapacityRequest Request { get; set; } = null!;
    public AvailabilityDeclaration Availability { get; set; } = null!;
    public CooperationAgreement? CooperationAgreement { get; set; }
}