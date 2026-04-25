namespace Kapacitet.Application.Features.Matching.DTOs;

public class WorkflowHintsRequest
{
    public List<int> SkillIds { get; set; } = [];
    public List<int> CertificateIds { get; set; } = [];
    public string? ExperienceLevel { get; set; }
    public string? LocationCity { get; set; }
    public int LocationRadiusKm { get; set; } = 50;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Quantity { get; set; } = 1;
    public string? Urgency { get; set; }
}
