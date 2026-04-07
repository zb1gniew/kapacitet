namespace Kapacitet.Application.Features.AdminPreferences.DTOs;

public class PlatformAdminPreferencesDto
{
    public string DefaultAccessRequestsTab { get; set; } = "Pending";
    public string DefaultAuditFilter { get; set; } = "All";
    public bool PrioritizeFollowUpCompanies { get; set; } = true;
    public bool HighlightProvisioningAlerts { get; set; } = true;
}
