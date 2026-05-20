using Kapacitet.Domain.Enums;

namespace Kapacitet.Application.Features.UserInvitations.DTOs;

public class InviteUserDto
{
    public string Email { get; set; } = null!;
    public UserRole Role { get; set; }
}
