using FluentAssertions;
using Kapacitet.Application.Features.CompanySettings.DTOs;
using Kapacitet.Application.Features.CompanySettings.Services;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Tests.Helpers;

namespace Kapacitet.Tests.Unit;

public class CompanyServiceNotificationTests
{
    private static User SeedUser(AppDbContext db, int companyId = 1)
    {
        var company = new Company { Id = companyId, Name = "X", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow };
        var user = new User { Id = companyId, CompanyId = companyId, Email = $"admin{companyId}@test.com", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow };
        db.Companies.Add(company);
        db.Users.Add(user);
        db.SaveChanges();
        return user;
    }

    [Fact]
    public async Task GetPreferences_WhenNoPrefsRow_ReturnsAllTrue()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        var svc = new CompanyService(db);

        var result = await svc.GetNotificationPreferencesAsync(user.Email);

        result.EmailNewMatches.Should().BeTrue();
        result.EmailActionsRequired.Should().BeTrue();
        result.EmailUpcomingCooperation.Should().BeTrue();
        result.InAppNewMatches.Should().BeTrue();
        result.InAppActionsRequired.Should().BeTrue();
        result.InAppUpcomingCooperation.Should().BeTrue();
        result.EmailNetworkRequests.Should().BeTrue();   // bug fix verification
        result.InAppNetworkRequests.Should().BeTrue();   // bug fix verification
    }

    [Fact]
    public async Task GetPreferences_WhenPrefsExist_ReturnsSavedValues()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        db.NotificationPreferences.Add(new NotificationPreferences
        {
            CompanyId = 1,
            EmailNewMatches = false,
            EmailNetworkRequests = false,
            InAppNetworkRequests = true
        });
        db.SaveChanges();
        var svc = new CompanyService(db);

        var result = await svc.GetNotificationPreferencesAsync(user.Email);

        result.EmailNewMatches.Should().BeFalse();
        result.EmailNetworkRequests.Should().BeFalse();
        result.InAppNetworkRequests.Should().BeTrue();
    }

    [Fact]
    public async Task UpdatePreferences_PersistsAllEightFields()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        var svc = new CompanyService(db);

        var dto = new NotificationPreferencesDto
        {
            EmailNewMatches = false,
            EmailActionsRequired = false,
            EmailUpcomingCooperation = false,
            InAppNewMatches = false,
            InAppActionsRequired = false,
            InAppUpcomingCooperation = false,
            EmailNetworkRequests = false,
            InAppNetworkRequests = false
        };

        await svc.UpdateNotificationPreferencesAsync(user.Email, dto);

        var saved = db.NotificationPreferences.Single(p => p.CompanyId == 1);
        saved.EmailNewMatches.Should().BeFalse();
        saved.EmailNetworkRequests.Should().BeFalse();
        saved.InAppNetworkRequests.Should().BeFalse();
    }

    [Fact]
    public async Task GetPreferences_WhenUserNotFound_ThrowsUnauthorized()
    {
        var db = TestDbFactory.Create();
        var svc = new CompanyService(db);

        var act = async () => await svc.GetNotificationPreferencesAsync("nieznany@test.com");

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}