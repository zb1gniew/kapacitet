using Kapacitet.Domain.Enums;

namespace Kapacitet.Application.Features.AvailabilityDeclarations.DTOs;

public class AvailabilityDeclarationDto
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
    public DateTime? PublishedAt { get; set; }
    public List<string> Skills { get; set; } = [];
    public List<string> Certificates { get; set; } = [];
}
