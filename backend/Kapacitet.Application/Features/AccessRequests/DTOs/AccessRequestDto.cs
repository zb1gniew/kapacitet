using Kapacitet.Domain.Enums;

namespace Kapacitet.Application.Features.AccessRequests.DTOs;

public class AccessRequestDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Industry { get; set; } = null!;
    public string Location { get; set; } = null!;
    public string ContactEmail { get; set; } = null!;
    public string? Message { get; set; }
    public AccessRequestStatus Status { get; set; }
    public string? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? ProvisionedCompanyId { get; set; }
    public string? RejectionReason { get; set; }
    public string? TemporaryPassword { get; set; }
}
