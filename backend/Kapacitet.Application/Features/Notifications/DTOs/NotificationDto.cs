using Kapacitet.Domain.Enums;

namespace Kapacitet.Application.Features.Notifications.DTOs;

public class NotificationDto
{
    public int Id { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = null!;
    public string Body { get; set; } = null!;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Metadata { get; set; }
}