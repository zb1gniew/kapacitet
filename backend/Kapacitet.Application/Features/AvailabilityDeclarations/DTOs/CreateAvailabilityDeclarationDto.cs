using System.ComponentModel.DataAnnotations;

namespace Kapacitet.Application.Features.AvailabilityDeclarations.DTOs;

public class CreateAvailabilityDeclarationDto
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

    public List<int> SkillIds { get; set; } = [];
    public List<int> CertificateIds { get; set; } = [];
}