using Kapacitet.Domain.Enums;

namespace Kapacitet.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string Email { get; set; } = null!;
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? OnboardingCompletedAt { get; set; }

    public Company Company { get; set; } = null!;
}