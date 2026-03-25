using System.ComponentModel.DataAnnotations;
using Kapacitet.Domain.Enums;

namespace Kapacitet.Application.Features.CapacityRequests.DTOs;

public class UpdateCapacityRequestDto : IValidatableObject
{
    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Required]
    [MaxLength(32)]
    public string LocationCity { get; set; } = null!;

    [Required]
    public int LocationRadiusKm { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    public UrgencyLevel Urgency { get; set; }

    public List<int> SkillIds { get; set; } = [];
    public List<int> CertificateIds { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (SkillIds.Count == 0 && CertificateIds.Count == 0)
            yield return new ValidationResult(
                "At least one skill or certificate is required",
                [nameof(SkillIds), nameof(CertificateIds)]);

        if (EndDate <= StartDate)
            yield return new ValidationResult(
                "EndDate must be after StartDate",
                [nameof(EndDate)]);

        if (Quantity <= 0)
            yield return new ValidationResult(
                "Quantity must be greater than zero",
                [nameof(Quantity)]);
    }
}
