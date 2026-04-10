namespace Kapacitet.Domain.Entities;

public class NotificationPreferences
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public bool EmailNewMatches { get; set; } = true;
    public bool EmailActionsRequired { get; set; } = true;
    public bool EmailUpcomingCooperation { get; set; } = true;
    public bool InAppNewMatches { get; set; } = true;
    public bool InAppActionsRequired { get; set; } = true;
    public bool InAppUpcomingCooperation { get; set; } = true;

    public Company Company { get; set; } = null!;
}
