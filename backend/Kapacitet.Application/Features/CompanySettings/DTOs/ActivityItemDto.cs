namespace Kapacitet.Application.Features.CompanySettings.DTOs;

public class ActivityItemDto
{
    public string Type { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public DateTime OccurredAt { get; set; }
}
