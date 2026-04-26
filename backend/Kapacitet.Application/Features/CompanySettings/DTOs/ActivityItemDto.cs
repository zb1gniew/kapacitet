namespace Kapacitet.Application.Features.CompanySettings.DTOs;

public class ActivityItemDto
{
    public string Type { get; set; } = null!;
    public DateTime OccurredAt { get; set; }
    public Dictionary<string, string> Params { get; set; } = new();
}
