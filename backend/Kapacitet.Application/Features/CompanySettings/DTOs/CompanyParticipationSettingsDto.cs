namespace Kapacitet.Application.Features.CompanySettings.DTOs;

public class CompanyParticipationSettingsDto
{
    public bool ReceiveCapacityRequests { get; set; }
    public bool ParticipateInNetworkWide { get; set; }
    public bool AllowPartialMatches { get; set; }
}
