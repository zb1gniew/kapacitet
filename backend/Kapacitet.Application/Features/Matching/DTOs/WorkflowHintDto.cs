namespace Kapacitet.Application.Features.Matching.DTOs;

public class WorkflowHintDto
{
    public string Id { get; set; } = null!;
    // "info" | "warning" | "positive"
    public string Severity { get; set; } = "info";
    public string Message { get; set; } = null!;
    public Dictionary<string, object?> Params { get; set; } = [];
}

public class WorkflowHintsResult
{
    public int EstimatedMatchCount { get; set; }
    public List<WorkflowHintDto> Hints { get; set; } = [];
}
