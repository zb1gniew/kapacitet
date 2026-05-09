using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Kapacitet.API.Auth;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.E2ETests.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.E2ETests;

public class OnboardingApiTests
{
    [Fact]
    public async Task GetStatus_WhenUnauthenticated_ReturnsUnauthorized()
    {
        await using var factory = new ApiTestApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/onboarding/status");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetStatus_WhenAuthenticated_ReturnsCurrentCompanyDetails()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var company = new Company
            {
                Name = "Kapacitet Partner",
                Cvr = "12345678",
                Categories = ["Concrete work"],
                DefaultLocation = "Aarhus",
                ContactPhone = "+4512345678",
                Industry = "Construction",
                Status = CompanyStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            db.Companies.Add(company);
            db.Users.Add(new User
            {
                Company = company,
                Email = "user@test.local",
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("user@test.local", AuthorizationRoles.Admin);

        var response = await client.GetAsync("/api/onboarding/status");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Kapacitet Partner");
        body.Should().Contain("Aarhus");
    }

    [Fact]
    public async Task Complete_WhenPayloadIsInvalid_ReturnsBadRequest()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var company = new Company
            {
                Name = "Kapacitet Partner",
                DefaultLocation = "Aarhus",
                Industry = "Construction",
                Status = CompanyStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            db.Companies.Add(company);
            db.Users.Add(new User
            {
                Company = company,
                Email = "user@test.local",
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("user@test.local", AuthorizationRoles.Admin);

        var response = await client.PostAsJsonAsync("/api/onboarding/complete", new
        {
            categories = new[] { "Concrete work", "Electrical", "Roofing", "Painting" },
            defaultLocation = "Atlantis"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("A maximum of 3 categories is allowed.");
    }

    [Fact]
    public async Task Complete_WhenAlreadyCompleted_ReturnsConflict()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var company = new Company
            {
                Name = "Kapacitet Partner",
                DefaultLocation = "Aarhus",
                Industry = "Construction",
                Status = CompanyStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            db.Companies.Add(company);
            db.Users.Add(new User
            {
                Company = company,
                Email = "user@test.local",
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow,
                OnboardingCompletedAt = DateTime.UtcNow.AddDays(-1)
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("user@test.local", AuthorizationRoles.Admin);

        var response = await client.PostAsJsonAsync("/api/onboarding/complete", new
        {
            defaultLocation = "Aarhus"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Complete_WhenPayloadIsValid_UpdatesCompanyDetailsAndMarksOnboardingCompleted()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var company = new Company
            {
                Name = "Kapacitet Partner",
                Categories = ["Concrete work"],
                DefaultLocation = "Aarhus",
                ContactPhone = "+4511111111",
                Industry = "Construction",
                Status = CompanyStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            db.Companies.Add(company);
            db.Users.Add(new User
            {
                Company = company,
                Email = "user@test.local",
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("user@test.local", AuthorizationRoles.Admin);

        var response = await client.PostAsJsonAsync("/api/onboarding/complete", new
        {
            categories = new[] { "concrete_work", "electrical" },
            defaultLocation = "Odense",
            contactPhone = "+4522222222"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        await factory.ExecuteDbAsync(async db =>
        {
            var user = await db.Users
                .Include(currentUser => currentUser.Company)
                .SingleAsync(currentUser => currentUser.Email == "user@test.local");

            user.OnboardingCompletedAt.Should().NotBeNull();
            user.Company.Categories.Should().BeEquivalentTo(["concrete_work", "electrical"]);
            user.Company.DefaultLocation.Should().Be("Odense");
            user.Company.ContactPhone.Should().Be("+4522222222");
        });

        var statusResponse = await client.GetAsync("/api/onboarding/status");
        statusResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        using var document = JsonDocument.Parse(await statusResponse.Content.ReadAsStringAsync());
        document.RootElement.GetProperty("isOnboardingCompleted").GetBoolean().Should().BeTrue();
        document.RootElement.GetProperty("company").GetProperty("defaultLocation").GetString().Should().Be("Odense");
    }
}
