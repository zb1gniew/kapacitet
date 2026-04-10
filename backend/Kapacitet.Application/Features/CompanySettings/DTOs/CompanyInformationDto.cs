namespace Kapacitet.Application.Features.CompanySettings.DTOs;

public class CompanyInformationDto
{
    public string Name { get; set; } = null!;
    public string Industry { get; set; } = null!;
    public string DefaultLocation { get; set; } = null!;
    public string ContactEmail { get; set; } = null!;
    public string? ContactPhone { get; set; }
}
