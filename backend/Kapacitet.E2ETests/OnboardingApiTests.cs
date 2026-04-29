using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Kapacitet.API.Auth;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.E2ETests.Infrastructure;

namespace Kapacitet.E2ETests;

public class OnboardingApiTests
{
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
}
