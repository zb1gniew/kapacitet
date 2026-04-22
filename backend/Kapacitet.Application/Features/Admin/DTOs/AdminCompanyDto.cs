namespace Kapacitet.Application.Features.Admin.DTOs;

public class AdminCompanyDto
{
    public int? RequestId { get; set; }
    public int? CompanyId { get; set; }
    public string CompanyName { get; set; } = null!;
    public string? Cvr { get; set; }
    public List<string> Categories { get; set; } = [];
    public string Location { get; set; } = null!;
    public string? ContactPhone { get; set; }
    public string ContactEmail { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedBy { get; set; }
    public int? ProvisionedCompanyId { get; set; }
}
