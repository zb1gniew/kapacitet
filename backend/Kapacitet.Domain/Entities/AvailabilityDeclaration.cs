using Kapacitet.Domain.Enums;

namespace Kapacitet.Domain.Entities;

public class AvailabilityDeclaration
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public ResourceType ResourceType { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string LocationCity { get; set; } = null!;
    public int LocationRadiusKm { get; set; }
    public int Quantity { get; set; }
    public ListingStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }

    public Company Company { get; set; } = null!;
    public ICollection<Skill> Skills { get; set; } = [];
    public ICollection<Certificate> Certificates { get; set; } = [];
    public ICollection<MatchOffer> MatchOffers { get; set; } = [];
}