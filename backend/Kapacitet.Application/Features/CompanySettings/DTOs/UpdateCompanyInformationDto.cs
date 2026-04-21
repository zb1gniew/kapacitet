namespace Kapacitet.Application.Features.CompanySettings.DTOs;

public class UpdateCompanyInformationDto
{
    public List<string>? Categories { get; set; }
    public string? DefaultLocation { get; set; }
    public string? ContactPhone { get; set; }
}
