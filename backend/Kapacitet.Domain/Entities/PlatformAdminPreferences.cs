namespace Kapacitet.Domain.Entities;

public class PlatformAdminPreferences
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string DefaultAccessRequestsTab { get; set; } = "Pending";
    public string DefaultAuditFilter { get; set; } = "All";
    public bool PrioritizeFollowUpCompanies { get; set; } = true;
    public bool HighlightProvisioningAlerts { get; set; } = true;

    public User User { get; set; } = null!;
}
