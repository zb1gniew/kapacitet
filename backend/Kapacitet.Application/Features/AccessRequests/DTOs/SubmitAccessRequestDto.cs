using System.ComponentModel.DataAnnotations;

namespace Kapacitet.Application.Features.AccessRequests.DTOs;

public class SubmitAccessRequestDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = null!;

    [Required]
    [RegularExpression(@"^\d{8}$", ErrorMessage = "CVR must be exactly 8 digits.")]
    public string Cvr { get; set; } = null!;

    [Required]
    public List<string> Categories { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string Location { get; set; } = null!;

    [Required]
    [MaxLength(50)]
    public string ContactPhone { get; set; } = null!;

    [Required]
    [EmailAddress]
    [MaxLength(254)]
    public string ContactEmail { get; set; } = null!;

    [MaxLength(2000)]
    public string? Message { get; set; }
}
