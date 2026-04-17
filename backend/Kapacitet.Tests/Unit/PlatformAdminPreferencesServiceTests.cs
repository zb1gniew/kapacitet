using FluentAssertions;
using Kapacitet.Application.Features.AdminPreferences.DTOs;
using Kapacitet.Application.Features.AdminPreferences.Services;
using Kapacitet.Application.Features.Common.Errors;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Tests.Helpers;

namespace Kapacitet.Tests.Unit;

public class PlatformAdminPreferencesServiceTests
{
    // ── helpers ───────────────────────────────────────────────────────────────

    private static User SeedUser(
        Kapacitet.Infrastructure.Persistence.AppDbContext db,
        string email = "admin@test.com",
        PlatformAdminPreferences? preferences = null)
    {
        var company = new Company
        {
            Id = 1,
            Name = "Test Corp",
            Industry = "IT",
            DefaultLocation = "Warsaw",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        var user = new User
        {
            Id = 1,
            CompanyId = 1,
            Email = email,
            Role = UserRole.Admin,
            CreatedAt = DateTime.UtcNow,
            PlatformAdminPreferences = preferences
        };
        db.Companies.Add(company);
        db.Users.Add(user);
        db.SaveChanges();
        return user;
    }

    private static PlatformAdminPreferencesDto ValidDto() => new()
    {
        DefaultAccessRequestsTab = "Pending",
        DefaultAuditFilter = "All",
        PrioritizeFollowUpCompanies = true,
        HighlightProvisioningAlerts = false
    };

    // ── GetAsync ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAsync_WhenNoPreferencesRowExists_ReturnsDefaultDto()
    {
        var db = TestDbFactory.Create();
        SeedUser(db, preferences: null);
        var svc = new PlatformAdminPreferencesService(db);

        var result = await svc.GetAsync("admin@test.com");

        result.Should().NotBeNull();
        result.DefaultAccessRequestsTab.Should().Be("Pending");
        result.DefaultAuditFilter.Should().Be("All");
        result.PrioritizeFollowUpCompanies.Should().BeTrue();
        result.HighlightProvisioningAlerts.Should().BeTrue();
    }

    [Fact]
    public async Task GetAsync_WhenPreferencesRowExists_ReturnsStoredValues()
    {
        var db = TestDbFactory.Create();
        var existingPrefs = new PlatformAdminPreferences
        {
            DefaultAccessRequestsTab = "Approved",
            DefaultAuditFilter = "Submissions",
            PrioritizeFollowUpCompanies = false,
            HighlightProvisioningAlerts = false
        };
        SeedUser(db, preferences: existingPrefs);
        var svc = new PlatformAdminPreferencesService(db);

        var result = await svc.GetAsync("admin@test.com");

        result.DefaultAccessRequestsTab.Should().Be("Approved");
        result.DefaultAuditFilter.Should().Be("Submissions");
        result.PrioritizeFollowUpCompanies.Should().BeFalse();
        result.HighlightProvisioningAlerts.Should().BeFalse();
    }

    [Fact]
    public async Task GetAsync_WhenUserNotFound_ThrowsUnauthorizedAccessException()
    {
        var db = TestDbFactory.Create();
        var svc = new PlatformAdminPreferencesService(db);

        Func<Task> act = async () => await svc.GetAsync("nobody@test.com");

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    // ── UpdateAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateAsync_InvalidDefaultAccessRequestsTab_ThrowsValidationException()
    {
        var db = TestDbFactory.Create();
        SeedUser(db);
        var svc = new PlatformAdminPreferencesService(db);

        var dto = ValidDto();
        dto.DefaultAccessRequestsTab = "InvalidTab";

        Func<Task> act = async () => await svc.UpdateAsync("admin@test.com", dto);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.FieldErrors.ContainsKey("defaultAccessRequestsTab"));
    }

    [Fact]
    public async Task UpdateAsync_InvalidDefaultAuditFilter_ThrowsValidationException()
    {
        var db = TestDbFactory.Create();
        SeedUser(db);
        var svc = new PlatformAdminPreferencesService(db);

        var dto = ValidDto();
        dto.DefaultAuditFilter = "BadFilter";

        Func<Task> act = async () => await svc.UpdateAsync("admin@test.com", dto);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.FieldErrors.ContainsKey("defaultAuditFilter"));
    }

    [Fact]
    public async Task UpdateAsync_WhenNoRowExists_CreatesPreferencesLazily()
    {
        var db = TestDbFactory.Create();
        SeedUser(db, preferences: null);
        var svc = new PlatformAdminPreferencesService(db);

        var dto = new PlatformAdminPreferencesDto
        {
            DefaultAccessRequestsTab = "Rejected",
            DefaultAuditFilter = "Decisions",
            PrioritizeFollowUpCompanies = false,
            HighlightProvisioningAlerts = true
        };

        var result = await svc.UpdateAsync("admin@test.com", dto);

        result.DefaultAccessRequestsTab.Should().Be("Rejected");
        result.DefaultAuditFilter.Should().Be("Decisions");
        result.PrioritizeFollowUpCompanies.Should().BeFalse();
        result.HighlightProvisioningAlerts.Should().BeTrue();

        db.PlatformAdminPreferences.Should().ContainSingle();
    }

    [Fact]
    public async Task UpdateAsync_WhenRowExists_UpdatesExistingRow()
    {
        var db = TestDbFactory.Create();
        var existingPrefs = new PlatformAdminPreferences
        {
            DefaultAccessRequestsTab = "Pending",
            DefaultAuditFilter = "All",
            PrioritizeFollowUpCompanies = true,
            HighlightProvisioningAlerts = true
        };
        SeedUser(db, preferences: existingPrefs);
        var svc = new PlatformAdminPreferencesService(db);

        var dto = new PlatformAdminPreferencesDto
        {
            DefaultAccessRequestsTab = "All",
            DefaultAuditFilter = "Provisioning",
            PrioritizeFollowUpCompanies = false,
            HighlightProvisioningAlerts = false
        };

        var result = await svc.UpdateAsync("admin@test.com", dto);

        result.DefaultAccessRequestsTab.Should().Be("All");
        result.DefaultAuditFilter.Should().Be("Provisioning");
        result.PrioritizeFollowUpCompanies.Should().BeFalse();
        result.HighlightProvisioningAlerts.Should().BeFalse();

        // No duplicate rows created
        db.PlatformAdminPreferences.Should().ContainSingle();
    }
}
