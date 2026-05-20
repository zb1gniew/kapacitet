using Kapacitet.Domain.Enums;

namespace Kapacitet.Application.Features.UserInvitations.DTOs;

public class CompanyMemberDto
{
    public int Id { get; set; }
    public string Email { get; set; } = null!;
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; }
}
