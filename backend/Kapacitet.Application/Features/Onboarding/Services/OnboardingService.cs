using Kapacitet.Application.Features.Onboarding.DTOs;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.Onboarding.Services;

public class OnboardingService
{
    private readonly AppDbContext _db;

    public OnboardingService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<OnboardingStatusDto> GetOnboardingStatusAsync(string email)
    {
        var user = await _db.Users
            .Include(u => u.Company)
            .WhereEmailMatches(email)
            .FirstOrDefaultAsync()
            ?? throw new UnauthorizedAccessException($"User {email} not found");

        return new OnboardingStatusDto
        {
            IsOnboardingCompleted = user.OnboardingCompletedAt.HasValue,
            Company = new CompanyDetailsDto
            {
                Name = user.Company.Name,
                Industry = user.Company.Industry,
                DefaultLocation = user.Company.DefaultLocation,
                ContactEmail = user.Email
            }
        };
    }

    public async Task<OnboardingCompleteResult> CompleteOnboardingAsync(string email, CompleteOnboardingDto? dto)
    {
        var user = await _db.Users
            .Include(u => u.Company)
            .WhereEmailMatches(email)
            .FirstOrDefaultAsync()
            ?? throw new UnauthorizedAccessException($"User {email} not found");

        if (user.OnboardingCompletedAt.HasValue)
            return OnboardingCompleteResult.AlreadyCompleted;

        var errors = new List<string>();

        if (dto is not null)
        {
            if (!string.IsNullOrWhiteSpace(dto.Industry))
            {
                if (dto.Industry.Length > 100)
                    errors.Add("Industry must be 100 characters or fewer.");
                else
                    user.Company.Industry = dto.Industry;
            }

            if (!string.IsNullOrWhiteSpace(dto.DefaultLocation))
            {
                if (dto.DefaultLocation.Length > 100)
                    errors.Add("Location must be 100 characters or fewer.");
                else
                    user.Company.DefaultLocation = dto.DefaultLocation;
            }
        }

        if (errors.Count > 0)
            return OnboardingCompleteResult.Invalid(errors);

        user.OnboardingCompletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return OnboardingCompleteResult.Success;
    }
}
