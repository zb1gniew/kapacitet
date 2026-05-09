using FluentAssertions;
using Kapacitet.Application.Features.Onboarding.DTOs;
using Kapacitet.Application.Features.Onboarding.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Tests.Helpers;

namespace Kapacitet.Tests.Unit;

public class OnboardingServiceTests
{
    private static User SeedUser(AppDbContext db, bool completed = false)
    {
        var company = new Company
        {
            Id = 1,
            Name = "Test",
            Categories = ["construction"],
            DefaultLocation = "Warsaw",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        var user = new User
        {
            Id = 1,
            CompanyId = 1,
            Email = "admin@test.com",
            Role = UserRole.Admin,
            CreatedAt = DateTime.UtcNow,
            OnboardingCompletedAt = completed ? DateTime.UtcNow : null
        };
        db.Companies.Add(company);
        db.Users.Add(user);
        db.SaveChanges();
        return user;
    }

    [Fact]
    public async Task GetStatus_WhenNotCompleted_ReturnsIsCompletedFalse()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        var result = await new OnboardingService(db).GetOnboardingStatusAsync(user.Email);
        result.IsOnboardingCompleted.Should().BeFalse();
    }

    [Fact]
    public async Task GetStatus_WhenCompleted_ReturnsIsCompletedTrue()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db, completed: true);
        var result = await new OnboardingService(db).GetOnboardingStatusAsync(user.Email);
        result.IsOnboardingCompleted.Should().BeTrue();
    }

    [Fact]
    public async Task Complete_FirstTime_ReturnsSucceeded()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        var result = await new OnboardingService(db).CompleteOnboardingAsync(user.Email, null);
        result.Succeeded.Should().BeTrue();
    }

    [Fact]
    public async Task Complete_SetsOnboardingCompletedAt()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        await new OnboardingService(db).CompleteOnboardingAsync(user.Email, null);
        db.Users.Single().OnboardingCompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Complete_WhenAlreadyCompleted_ReturnsIsAlreadyCompleted()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db, completed: true);
        var result = await new OnboardingService(db).CompleteOnboardingAsync(user.Email, null);
        result.IsAlreadyCompleted.Should().BeTrue();
    }

    [Fact]
    public async Task Complete_WithTooManyCategories_ReturnsErrors()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        var dto = new CompleteOnboardingDto { Categories = ["construction", "electrical", "painting", "roofing"] };
        var result = await new OnboardingService(db).CompleteOnboardingAsync(user.Email, dto);
        result.Errors.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Complete_WithLocationTooLong_ReturnsErrors()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        var dto = new CompleteOnboardingDto { DefaultLocation = new string('A', 101) };
        var result = await new OnboardingService(db).CompleteOnboardingAsync(user.Email, dto);
        result.Errors.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Complete_WithDto_UpdatesCompanyFields()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        var dto = new CompleteOnboardingDto { Categories = ["electrical", "painting"], DefaultLocation = "Aarhus" };
        await new OnboardingService(db).CompleteOnboardingAsync(user.Email, dto);
        var company = db.Companies.Single();
        company.Categories.Should().BeEquivalentTo(new[] { "electrical", "painting" });
        company.DefaultLocation.Should().Be("Aarhus");
    }

    [Fact]
    public async Task Complete_WithUnsupportedCity_ReturnsErrorsAndDoesNotMarkCompleted()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        var dto = new CompleteOnboardingDto { DefaultLocation = "Atlantis" };

        var result = await new OnboardingService(db).CompleteOnboardingAsync(user.Email, dto);

        result.Errors.Should().ContainSingle(error => error.Contains("supported city"));
        db.Users.Single().OnboardingCompletedAt.Should().BeNull();
        db.Companies.Single().DefaultLocation.Should().Be("Warsaw");
    }

    [Fact]
    public async Task Complete_WithInvalidPhone_ReturnsErrorsAndKeepsExistingPhone()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        var company = db.Companies.Single();
        company.ContactPhone = "+4511111111";
        await db.SaveChangesAsync();

        var result = await new OnboardingService(db).CompleteOnboardingAsync(
            user.Email,
            new CompleteOnboardingDto { ContactPhone = "12345" });

        result.Errors.Should().ContainSingle(error => error.Contains("valid international phone number"));
        db.Users.Single().OnboardingCompletedAt.Should().BeNull();
        db.Companies.Single().ContactPhone.Should().Be("+4511111111");
    }

    [Fact]
    public async Task GetStatus_WhenUserNotFound_ThrowsUnauthorized()
    {
        var db = TestDbFactory.Create();
        var act = async () => await new OnboardingService(db).GetOnboardingStatusAsync("unknown@test.com");
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
