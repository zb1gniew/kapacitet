using Kapacitet.Application.Features.Matching.Services;
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
                Categories = user.Company.Categories,
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
            if (dto.Categories is { Count: > 0 })
            {
                var error = CompanyCategoryCatalog.ValidateCategoriesField(dto.Categories);
                if (error is not null)
                    errors.Add(error);
                else
                    user.Company.Categories = dto.Categories;
            }

            if (!string.IsNullOrWhiteSpace(dto.DefaultLocation))
            {
                if (dto.DefaultLocation.Length > 100)
                    errors.Add("Location must be 100 characters or fewer.");
                else if (!MatchingCityCoordinateCatalog.IsSupportedCity(dto.DefaultLocation))
                    errors.Add($"'{dto.DefaultLocation}' is not a supported city. Please select a city from the suggestions.");
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
