using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Kapacitet.API.Auth;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.E2ETests.Infrastructure;

namespace Kapacitet.E2ETests;

public class AdminPreferencesApiTests
{
    [Fact]
    public async Task Get_WhenNoPreferencesExist_ReturnsDefaultValues()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var company = new Company
            {
                Name = "Platform",
                Industry = "Ops",
                DefaultLocation = "Aarhus",
                Status = CompanyStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            db.Companies.Add(company);
            db.Users.Add(new User
            {
                Company = company,
                Email = "platform-admin@test.local",
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("platform-admin@test.local", AuthorizationRoles.Admin);

        var response = await client.GetAsync("/api/admin/preferences/platform");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        document.RootElement.GetProperty("defaultAccessRequestsTab").GetString().Should().Be("Pending");
        document.RootElement.GetProperty("defaultAuditFilter").GetString().Should().Be("All");
        document.RootElement.GetProperty("prioritizeFollowUpCompanies").GetBoolean().Should().BeTrue();
        document.RootElement.GetProperty("highlightProvisioningAlerts").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task Update_WhenPayloadIsValid_PersistsPreferences()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var company = new Company
            {
                Name = "Platform",
                Industry = "Ops",
                DefaultLocation = "Aarhus",
                Status = CompanyStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            db.Companies.Add(company);
            db.Users.Add(new User
            {
                Company = company,
                Email = "platform-admin@test.local",
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("platform-admin@test.local", AuthorizationRoles.Admin);

        var response = await client.PutAsJsonAsync("/api/admin/preferences/platform", new
        {
            defaultAccessRequestsTab = "Approved",
            defaultAuditFilter = "Provisioning",
            prioritizeFollowUpCompanies = false,
            highlightProvisioningAlerts = false
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        await factory.ExecuteDbAsync(async db =>
        {
            var user = await db.Users.FindAsync(1);
            user.Should().NotBeNull();
            var preferences = await db.PlatformAdminPreferences.FindAsync(1);
            preferences.Should().NotBeNull();
            preferences!.DefaultAccessRequestsTab.Should().Be("Approved");
            preferences.DefaultAuditFilter.Should().Be("Provisioning");
            preferences.PrioritizeFollowUpCompanies.Should().BeFalse();
            preferences.HighlightProvisioningAlerts.Should().BeFalse();
        });
    }

    [Fact]
    public async Task Update_WhenPayloadIsInvalid_ReturnsValidationProblem()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var company = new Company
            {
                Name = "Platform",
                Industry = "Ops",
                DefaultLocation = "Aarhus",
                Status = CompanyStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            db.Companies.Add(company);
            db.Users.Add(new User
            {
                Company = company,
                Email = "platform-admin@test.local",
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("platform-admin@test.local", AuthorizationRoles.Admin);

        var response = await client.PutAsJsonAsync("/api/admin/preferences/platform", new
        {
            defaultAccessRequestsTab = "Later",
            defaultAuditFilter = "Provisioning",
            prioritizeFollowUpCompanies = true,
            highlightProvisioningAlerts = true
        });

        response.StatusCode.Should().Be((HttpStatusCode)422);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        document.RootElement.GetProperty("fieldErrors")
            .GetProperty("defaultAccessRequestsTab")[0]
            .GetString()
            .Should().Contain("Default access requests tab");
    }
}
