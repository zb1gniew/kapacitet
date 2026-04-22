namespace Kapacitet.Application.Features.CompanySettings.DTOs;

public class CompanyInformationDto
{
    public string Name { get; set; } = null!;
    public string? Cvr { get; set; }
    public List<string> Categories { get; set; } = [];
    public string DefaultLocation { get; set; } = null!;
    public string ContactEmail { get; set; } = null!;
    public string? ContactPhone { get; set; }
}
