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

public class CapacityRequestApiTests
{
    [Fact]
    public async Task Create_WhenViewerAttemptsToCreate_ReturnsForbidden()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            SeedCompanyAndCatalog(db, "viewer@test.local");
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("viewer@test.local", AuthorizationRoles.Viewer);

        var response = await client.PostAsJsonAsync("/api/requests", new
        {
            startDate = "2027-08-01T00:00:00Z",
            endDate = "2027-08-15T00:00:00Z",
            locationCity = "Aarhus",
            locationRadiusKm = 25,
            quantity = 3,
            urgency = "High",
            experienceLevel = "mid",
            skillIds = new[] { 1 },
            certificateIds = new[] { 1 }
        });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Create_WhenManagerPostsValidDraft_ReturnsCreated()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            SeedCompanyAndCatalog(db, "manager@test.local");
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("manager@test.local", AuthorizationRoles.Manager);

        var response = await client.PostAsJsonAsync("/api/requests", new
        {
            startDate = "2027-08-01T00:00:00Z",
            endDate = "2027-08-15T00:00:00Z",
            locationCity = "Aarhus",
            locationRadiusKm = 25,
            quantity = 3,
            urgency = "High",
            experienceLevel = "mid",
            clientDraftKey = "draft-1",
            skillIds = new[] { 1 },
            certificateIds = new[] { 1 }
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        await factory.ExecuteDbAsync(async db =>
        {
            var request = await db.CapacityRequests.SingleAsync();
            request.Status.Should().Be(ListingStatus.Draft);
            request.Quantity.Should().Be(3);
            request.ClientDraftKey.Should().Be("draft-1");
        });
    }

    [Fact]
    public async Task PublishNew_WhenPayloadIsValid_ReturnsCreatedActiveRequest()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            SeedCompanyAndCatalog(db, "manager@test.local");
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("manager@test.local", AuthorizationRoles.Manager);

        var response = await client.PostAsJsonAsync("/api/requests/publish", new
        {
            startDate = "2027-09-01T00:00:00Z",
            endDate = "2027-09-10T00:00:00Z",
            locationCity = "Aarhus",
            locationRadiusKm = 25,
            quantity = 2,
            urgency = "Critical",
            skillIds = new[] { 1 },
            certificateIds = new[] { 1 }
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        document.RootElement.GetProperty("status").GetString().Should().Be("Active");
    }

    [Fact]
    public async Task PublishNew_WhenPayloadIsInvalid_ReturnsValidationProblem()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            SeedCompanyAndCatalog(db, "manager@test.local");
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("manager@test.local", AuthorizationRoles.Manager);

        var response = await client.PostAsJsonAsync("/api/requests/publish", new
        {
            startDate = "2027-09-01T00:00:00Z",
            endDate = "2027-09-10T00:00:00Z",
            locationCity = "Atlantis",
            locationRadiusKm = 25,
            quantity = 1,
            urgency = "Critical",
            skillIds = new[] { 1 },
            certificateIds = new[] { 1 }
        });

        response.StatusCode.Should().Be((HttpStatusCode)422);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var fieldErrors = document.RootElement.GetProperty("fieldErrors");
        fieldErrors.GetProperty("locationCity")[0].GetString().Should().Contain("supported city");
    }

    [Fact]
    public async Task GetHints_ReturnsWorkflowHintPayload()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var (_, skill, certificate) = SeedCompanyAndCatalog(db, "viewer@test.local");
            var supplier = new Company
            {
                Name = "Supplier",
                Industry = "Construction",
                DefaultLocation = "Aarhus",
                Status = CompanyStatus.Active,
                CreatedAt = DateTime.UtcNow
            };
            db.Companies.Add(supplier);
            db.AvailabilityDeclarations.Add(new AvailabilityDeclaration
            {
                Company = supplier,
                ResourceType = ResourceType.Worker,
                StartDate = new DateTime(2027, 8, 1, 0, 0, 0, DateTimeKind.Utc),
                EndDate = new DateTime(2027, 8, 31, 0, 0, 0, DateTimeKind.Utc),
                LocationCity = "Aarhus",
                Quantity = 1,
                Status = ListingStatus.Active,
                CreatedAt = DateTime.UtcNow,
                Skills = [skill],
                Certificates = [certificate]
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("viewer@test.local", AuthorizationRoles.Viewer);

        var response = await client.PostAsJsonAsync("/api/requests/hints", new
        {
            skillIds = new[] { 1 },
            certificateIds = new[] { 1 },
            locationCity = "Aarhus",
            locationRadiusKm = 10,
            quantity = 1,
            urgency = "normal",
            startDate = "2027-08-01T00:00:00Z",
            endDate = "2027-08-31T00:00:00Z"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        document.RootElement.GetProperty("estimatedMatchCount").GetInt32().Should().BeGreaterThan(0);
    }

    private static (Company company, Skill skill, Certificate certificate) SeedCompanyAndCatalog(AppDbContext db, string email)
    {
        var company = new Company
        {
            Name = "Requester",
            Industry = "Construction",
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        db.Companies.Add(company);
        db.Users.Add(new User
        {
            Company = company,
            Email = email,
            Role = email.Contains("manager") ? UserRole.Manager : UserRole.Viewer,
            CreatedAt = DateTime.UtcNow
        });
        var skill = new Skill { Id = 1, Name = "Carpentry" };
        var certificate = new Certificate { Id = 1, Name = "Lift" };
        db.Skills.Add(skill);
        db.Certificates.Add(certificate);
        return (company, skill, certificate);
    }
}
