using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Kapacitet.API.Auth;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.E2ETests.Infrastructure;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.E2ETests;

public class CompanyApiTests
{
    [Fact]
    public async Task GetInformation_ReturnsCurrentCompanyData()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var company = AddCompany(db, "Builders", "construction", "Aarhus");
            company.ContactPhone = "+4512345678";
            db.Users.Add(new User
            {
                Company = company,
                Email = "viewer@test.local",
                Role = UserRole.Viewer,
                CreatedAt = DateTime.UtcNow
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("viewer@test.local", AuthorizationRoles.Viewer);

        var response = await client.GetAsync("/api/company/information");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        document.RootElement.GetProperty("defaultLocation").GetString().Should().Be("Aarhus");
        document.RootElement.GetProperty("contactPhone").GetString().Should().Be("+4512345678");
    }

    [Fact]
    public async Task UpdateInformation_WhenManagerUpdatesValidPayload_PersistsValues()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var company = AddCompany(db, "Builders", "construction", "Aarhus");
            db.Users.Add(new User
            {
                Company = company,
                Email = "manager@test.local",
                Role = UserRole.Manager,
                CreatedAt = DateTime.UtcNow
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("manager@test.local", AuthorizationRoles.Manager);

        var response = await client.PutAsJsonAsync("/api/company/information", new
        {
            categories = new[] { "electrical", "painting" },
            defaultLocation = "Odense",
            contactPhone = "+4598765432"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        await factory.ExecuteDbAsync(async db =>
        {
            var company = await db.Companies.SingleAsync(c => c.Name == "Builders");
            company.Categories.Should().Equal("electrical", "painting");
            company.DefaultLocation.Should().Be("Odense");
            company.ContactPhone.Should().Be("+4598765432");
        });
    }

    [Fact]
    public async Task UpdateParticipationSettings_PersistsFlags()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var company = AddCompany(db, "Builders", "construction", "Aarhus");
            db.Users.Add(new User
            {
                Company = company,
                Email = "manager@test.local",
                Role = UserRole.Manager,
                CreatedAt = DateTime.UtcNow
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("manager@test.local", AuthorizationRoles.Manager);

        var response = await client.PutAsJsonAsync("/api/company/settings", new
        {
            receiveCapacityRequests = false,
            participateInNetworkWide = false,
            allowPartialMatches = false,
            matchOutsideCategory = false
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        await factory.ExecuteDbAsync(async db =>
        {
            var settings = await db.CompanySettings.SingleAsync();
            settings.ReceiveCapacityRequests.Should().BeFalse();
            settings.ParticipateInNetworkWide.Should().BeFalse();
            settings.AllowPartialMatches.Should().BeFalse();
            settings.MatchOutsideCategory.Should().BeFalse();
        });
    }

    [Fact]
    public async Task UpdateNotificationPreferences_PersistsAllFlags()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var company = AddCompany(db, "Builders", "construction", "Aarhus");
            db.Users.Add(new User
            {
                Company = company,
                Email = "manager@test.local",
                Role = UserRole.Manager,
                CreatedAt = DateTime.UtcNow
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("manager@test.local", AuthorizationRoles.Manager);

        var response = await client.PutAsJsonAsync("/api/company/notifications", new
        {
            emailNewMatches = false,
            emailActionsRequired = false,
            emailUpcomingCooperation = true,
            inAppNewMatches = false,
            inAppActionsRequired = true,
            inAppUpcomingCooperation = false,
            emailNetworkRequests = true,
            inAppNetworkRequests = false
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        await factory.ExecuteDbAsync(async db =>
        {
            var preferences = await db.NotificationPreferences.SingleAsync();
            preferences.EmailNewMatches.Should().BeFalse();
            preferences.EmailActionsRequired.Should().BeFalse();
            preferences.EmailUpcomingCooperation.Should().BeTrue();
            preferences.InAppNewMatches.Should().BeFalse();
            preferences.InAppActionsRequired.Should().BeTrue();
            preferences.InAppUpcomingCooperation.Should().BeFalse();
            preferences.EmailNetworkRequests.Should().BeTrue();
            preferences.InAppNetworkRequests.Should().BeFalse();
        });
    }

    [Fact]
    public async Task UpdateInformation_WhenAuthenticatedAsViewer_ReturnsForbidden()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var company = AddCompany(db, "Builders", "construction", "Aarhus");
            db.Users.Add(new User
            {
                Company = company,
                Email = "viewer@test.local",
                Role = UserRole.Viewer,
                CreatedAt = DateTime.UtcNow
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("viewer@test.local", AuthorizationRoles.Viewer);

        var response = await client.PutAsJsonAsync("/api/company/information", new
        {
            defaultLocation = "Odense"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task UpdateInformation_WhenPayloadContainsUnsupportedCity_ReturnsUnprocessableEntity()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var company = AddCompany(db, "Builders", "construction", "Aarhus");
            db.Users.Add(new User
            {
                Company = company,
                Email = "manager@test.local",
                Role = UserRole.Manager,
                CreatedAt = DateTime.UtcNow
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("manager@test.local", AuthorizationRoles.Manager);

        var response = await client.PutAsJsonAsync("/api/company/information", new
        {
            defaultLocation = "Atlantis"
        });

        response.StatusCode.Should().Be((HttpStatusCode)422);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("supported city");
    }

    private static Company AddCompany(AppDbContext db, string name, string category, string city)
    {
        var company = new Company
        {
            Name = name,
            Industry = "Construction",
            Categories = [category],
            DefaultLocation = city,
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        db.Companies.Add(company);
        return company;
    }
}
