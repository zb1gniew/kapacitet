using System.ComponentModel.DataAnnotations;
using Kapacitet.Domain.Enums;

namespace Kapacitet.Application.Features.AccessRequests.DTOs;

public class ReviewAccessRequestDto
{
    [Required]
    public AccessRequestStatus Decision { get; set; }

    [MaxLength(1000)]
    public string? RejectionReason { get; set; }
}