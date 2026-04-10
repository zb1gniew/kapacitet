namespace Kapacitet.Domain.Entities;

public class CompanySettings
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public bool ReceiveCapacityRequests { get; set; } = true;
    public bool ParticipateInNetworkWide { get; set; } = true;
    public bool AllowPartialMatches { get; set; } = false;

    public Company Company { get; set; } = null!;
}
