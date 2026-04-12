using System.ComponentModel.DataAnnotations;
using Kapacitet.Domain.Enums;

namespace Kapacitet.Application.Features.NetworkEscalations.DTOs;

public class SubmitNetworkResponseDto
{
    [Required]
    public NetworkResponseType ResponseType { get; set; }
}
