namespace Kapacitet.Application.Features.Admin.DTOs;

public class AdminAuditEventDto
{
    public string Id { get; set; } = null!;
    public DateTime Timestamp { get; set; }
    public string Type { get; set; } = null!;
    public int? RequestId { get; set; }
    public int? CompanyId { get; set; }
    public string CompanyName { get; set; } = null!;
    public string ContactEmail { get; set; } = null!;
    public string? Actor { get; set; }
    public string Summary { get; set; } = null!;
    public string Detail { get; set; } = null!;
    public int? ProvisionedCompanyId { get; set; }
}
