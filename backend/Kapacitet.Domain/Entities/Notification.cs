using Kapacitet.Domain.Enums;

namespace Kapacitet.Domain.Entities;

public class Notification
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = null!;
    public string Body { get; set; } = null!;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Metadata { get; set; }  // jsonb — stores matchOfferId etc.

    public Company Company { get; set; } = null!;
}