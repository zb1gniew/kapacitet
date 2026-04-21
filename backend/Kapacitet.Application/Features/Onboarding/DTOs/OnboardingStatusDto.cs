namespace Kapacitet.Application.Features.Onboarding.DTOs;

public class OnboardingStatusDto
{
    public bool IsOnboardingCompleted { get; set; }
    public CompanyDetailsDto Company { get; set; } = null!;
}

public class CompanyDetailsDto
{
    public string Name { get; set; } = null!;
    public List<string> Categories { get; set; } = [];
    public string DefaultLocation { get; set; } = null!;
    public string ContactEmail { get; set; } = null!;
}
