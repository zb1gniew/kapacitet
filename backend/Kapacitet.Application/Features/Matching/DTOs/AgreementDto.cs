using Kapacitet.Domain.Enums;

namespace Kapacitet.Application.Features.Matching.DTOs;

public class AgreementDto
{
    public int Id { get; set; }
    public int MatchOfferId { get; set; }
    public int RequestId { get; set; }
    public int AvailabilityId { get; set; }
    public int? PartnerCompanyId { get; set; }
    public string? PartnerCompanyName { get; set; }
    public string? PartnerContactPhone { get; set; }
    public string? PartnerContactEmail { get; set; }
    public int SupplierCompanyId { get; set; }
    public string SupplierCompanyName { get; set; } = null!;
    public int RequesterCompanyId { get; set; }
    public string RequesterCompanyName { get; set; } = null!;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Quantity { get; set; }
    public AgreementStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ConfirmedAt { get; set; }
}
