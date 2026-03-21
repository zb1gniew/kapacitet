using Kapacitet.Domain.Enums;

namespace Kapacitet.Domain.Entities;

public class NetworkResponse
{
    public int Id { get; set; }
    public int EscalationId { get; set; }
    public int CompanyId { get; set; }
    public NetworkResponseType ResponseType { get; set; }
    public DateTime CreatedAt { get; set; }

    public NetworkEscalation Escalation { get; set; } = null!;
    public Company Company { get; set; } = null!;
}