using System.ComponentModel.DataAnnotations;
using Kapacitet.Domain.Enums;

namespace Kapacitet.Application.Features.AccessRequests.DTOs;

public class ReviewAccessRequestDto
{
    [Required]
    public AccessRequestStatus Decision { get; set; }
}