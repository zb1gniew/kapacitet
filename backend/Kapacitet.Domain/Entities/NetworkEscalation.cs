using Kapacitet.Domain.Enums;

namespace Kapacitet.Domain.Entities;

public class NetworkEscalation
{
    public int Id { get; set; }
    public int RequestId { get; set; }
    public DateTime TriggeredAt { get; set; }
    public NetworkEscalationStatus Status { get; set; }

    public CapacityRequest Request { get; set; } = null!;
    public ICollection<NetworkResponse> Responses { get; set; } = [];
}