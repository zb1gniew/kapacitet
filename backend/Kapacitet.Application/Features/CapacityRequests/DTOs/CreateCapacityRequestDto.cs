using System.ComponentModel.DataAnnotations;
using Kapacitet.Domain.Enums;

namespace Kapacitet.Application.Features.CapacityRequests.DTOs;

public class CreateCapacityRequestDto : IValidatableObject
{
    private const int MaxWorkerQuantity = 100;

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

    [MaxLength(16)]
    public string? ExperienceLevel { get; set; }

    [MaxLength(64)]
    public string? ClientDraftKey { get; set; }

    public List<int> SkillIds { get; set; } = [];
    public List<int> CertificateIds { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (SkillIds.Count == 0)
            yield return new ValidationResult(
                "At least one skill is required",
                [nameof(SkillIds)]);

        if (CertificateIds.Count == 0)
            yield return new ValidationResult(
                "At least one certificate is required",
                [nameof(CertificateIds)]);

        if (EndDate <= StartDate)
            yield return new ValidationResult(
                "EndDate must be after StartDate",
                [nameof(EndDate)]);

        if (Quantity <= 0)
            yield return new ValidationResult(
                "Quantity must be greater than zero",
                [nameof(Quantity)]);
        else if (Quantity > MaxWorkerQuantity)
            yield return new ValidationResult(
                $"Quantity must be less than or equal to {MaxWorkerQuantity}",
                [nameof(Quantity)]);

        if (!string.IsNullOrWhiteSpace(ExperienceLevel) &&
            ExperienceLevel is not ("junior" or "mid" or "senior"))
            yield return new ValidationResult(
                "ExperienceLevel must be one of: junior, mid, senior",
                [nameof(ExperienceLevel)]);
    }
}
