namespace Kapacitet.Application.Features.CompanySettings.DTOs;

public class NotificationPreferencesDto
{
    public bool EmailNewMatches { get; set; }
    public bool EmailActionsRequired { get; set; }
    public bool EmailUpcomingCooperation { get; set; }
    public bool InAppNewMatches { get; set; }
    public bool InAppActionsRequired { get; set; }
    public bool InAppUpcomingCooperation { get; set; }
}
