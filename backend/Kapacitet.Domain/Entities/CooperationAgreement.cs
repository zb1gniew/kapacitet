using Kapacitet.Domain.Enums;

namespace Kapacitet.Domain.Entities;

public class CooperationAgreement
{
    public int Id { get; set; }
    public int MatchOfferId { get; set; }
    public int RequestId { get; set; }
    public int AvailabilityId { get; set; }
    public int SupplierCompanyId { get; set; }
    public int RequesterCompanyId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Quantity { get; set; }
    public AgreementStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ConfirmedAt { get; set; }
    public DateTime? ReminderEmailSentAt { get; set; }

    public MatchOffer MatchOffer { get; set; } = null!;
    public CapacityRequest Request { get; set; } = null!;
    public AvailabilityDeclaration Availability { get; set; } = null!;
    public Company SupplierCompany { get; set; } = null!;
    public Company RequesterCompany { get; set; } = null!;
}
