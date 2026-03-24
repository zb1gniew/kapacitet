using System.ComponentModel.DataAnnotations;

namespace Kapacitet.Application.Features.AccessRequests.DTOs;

public class SubmitAccessRequestDto
{
    [Required]
    [MaxLength(32)]
    public string Name { get; set; } = null!;

    [Required]
    [MaxLength(32)]
    public string Industry { get; set; } = null!;

    [Required]
    [MaxLength(32)]
    public string Location { get; set; } = null!;

    [Required]
    [EmailAddress]
    [MaxLength(32)]
    public string ContactEmail { get; set; } = null!;

    public string? Message { get; set; }
}