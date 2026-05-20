using Kapacitet.Domain.Enums;

namespace Kapacitet.Application.Features.NetworkEscalations.DTOs;

public class NetworkEscalationDto
{
    public int Id { get; set; }
    public int RequestId { get; set; }
    public DateTime TriggeredAt { get; set; }
    public NetworkEscalationStatus Status { get; set; }
    public int Quantity { get; set; }
    public UrgencyLevel Urgency { get; set; }
    public string LocationCity { get; set; } = null!;
    public int LocationRadiusKm { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public List<string> Skills { get; set; } = [];
    public List<string> Certificates { get; set; } = [];
    public int TotalResponses { get; set; }
    public int HelpResponses { get; set; }
    public int NeedCapacityResponses { get; set; }
    public bool HasResponded { get; set; }
    public NetworkResponseType? ResponseType { get; set; }
    public DateTime? RespondedAt { get; set; }
    public bool SharesCategory { get; set; }
}
