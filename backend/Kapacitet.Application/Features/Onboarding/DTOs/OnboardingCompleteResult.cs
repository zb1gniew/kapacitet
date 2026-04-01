namespace Kapacitet.Application.Features.Onboarding.DTOs;

public class OnboardingCompleteResult
{
    public bool Succeeded { get; private init; }
    public bool IsAlreadyCompleted { get; private init; }
    public List<string> Errors { get; private init; } = [];

    public static OnboardingCompleteResult Success => new() { Succeeded = true };

    public static OnboardingCompleteResult AlreadyCompleted =>
        new() { IsAlreadyCompleted = true };

    public static OnboardingCompleteResult Invalid(List<string> errors) =>
        new() { Errors = errors };
}
