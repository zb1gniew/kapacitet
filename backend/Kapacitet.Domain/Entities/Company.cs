using Kapacitet.Domain.Enums;

namespace Kapacitet.Domain.Entities;

public class Company
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? LogoUrl { get; set; }
    public string Industry { get; set; } = null!;
    public string DefaultLocation { get; set; } = null!;
    public CompanyStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<User> Users { get; set; } = [];
    public ICollection<AvailabilityDeclaration> AvailabilityDeclarations { get; set; } = [];
    public ICollection<CapacityRequest> CapacityRequests { get; set; } = [];
    public ICollection<NetworkResponse> NetworkResponses { get; set; } = [];
}