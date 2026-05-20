using Kapacitet.Domain.Enums;

namespace Kapacitet.Domain.Entities;

public class UserInvitation
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string Email { get; set; } = null!;
    public UserRole Role { get; set; }
    public string? InvitationTokenHash { get; set; }
    public DateTime? InvitationTokenExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }

    public Company Company { get; set; } = null!;
}
