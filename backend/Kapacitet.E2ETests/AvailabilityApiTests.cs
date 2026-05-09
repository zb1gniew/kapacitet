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

public class AvailabilityApiTests
{
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

        var response = await client.PostAsJsonAsync("/api/availability", new
        {
            startDate = "2027-08-01T00:00:00Z",
            endDate = "2027-08-15T00:00:00Z",
            locationCity = "Aarhus",
            locationRadiusKm = 30,
            quantity = 4,
            experienceLevel = "senior",
            clientDraftKey = "avail-draft-1",
            skillIds = new[] { 1 },
            certificateIds = new[] { 1 }
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        await factory.ExecuteDbAsync(async db =>
        {
            var declaration = await db.AvailabilityDeclarations.SingleAsync();
            declaration.Status.Should().Be(ListingStatus.Draft);
            declaration.ClientDraftKey.Should().Be("avail-draft-1");
            declaration.Quantity.Should().Be(4);
        });
    }

    [Fact]
    public async Task PublishNew_WhenPayloadIsValid_ReturnsCreatedActiveDeclaration()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            SeedCompanyAndCatalog(db, "manager@test.local");
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("manager@test.local", AuthorizationRoles.Manager);

        var response = await client.PostAsJsonAsync("/api/availability/publish", new
        {
            startDate = "2027-09-01T00:00:00Z",
            endDate = "2027-09-10T00:00:00Z",
            locationCity = "Aarhus",
            locationRadiusKm = 30,
            quantity = 2,
            skillIds = new[] { 1 },
            certificateIds = new[] { 1 }
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        document.RootElement.GetProperty("status").GetString().Should().Be("Active");
    }

    [Fact]
    public async Task GetHints_ReturnsAvailabilityHintPayload()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var (_, skill, certificate) = SeedCompanyAndCatalog(db, "viewer@test.local");
            var requester = new Company
            {
                Name = "Requester",
                Industry = "Construction",
                DefaultLocation = "Aarhus",
                Status = CompanyStatus.Active,
                CreatedAt = DateTime.UtcNow
            };
            db.Companies.Add(requester);
            db.CapacityRequests.Add(new CapacityRequest
            {
                Company = requester,
                ResourceType = ResourceType.Worker,
                StartDate = new DateTime(2027, 8, 1, 0, 0, 0, DateTimeKind.Utc),
                EndDate = new DateTime(2027, 8, 31, 0, 0, 0, DateTimeKind.Utc),
                LocationCity = "Aarhus",
                Quantity = 1,
                Status = ListingStatus.Active,
                Urgency = UrgencyLevel.High,
                CreatedAt = DateTime.UtcNow,
                Skills = [skill],
                Certificates = [certificate]
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("viewer@test.local", AuthorizationRoles.Viewer);

        var response = await client.PostAsJsonAsync("/api/availability/hints", new
        {
            skillIds = new[] { 1 },
            certificateIds = new[] { 1 },
            locationCity = "Aarhus",
            locationRadiusKm = 10,
            quantity = 1,
            startDate = "2027-08-01T00:00:00Z",
            endDate = "2027-08-31T00:00:00Z"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        document.RootElement.GetProperty("estimatedMatchCount").GetInt32().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Create_WhenAuthenticatedAsViewer_ReturnsForbidden()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            SeedCompanyAndCatalog(db, "viewer@test.local");
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("viewer@test.local", AuthorizationRoles.Viewer);

        var response = await client.PostAsJsonAsync("/api/availability", new
        {
            startDate = "2027-08-01T00:00:00Z",
            endDate = "2027-08-15T00:00:00Z",
            locationCity = "Aarhus",
            locationRadiusKm = 30,
            quantity = 4,
            skillIds = new[] { 1 },
            certificateIds = new[] { 1 }
        });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task PublishNew_WhenPayloadIsInvalid_ReturnsUnprocessableEntity()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            SeedCompanyAndCatalog(db, "manager@test.local");
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("manager@test.local", AuthorizationRoles.Manager);

        var response = await client.PostAsJsonAsync("/api/availability/publish", new
        {
            startDate = "2027-09-10T00:00:00Z",
            endDate = "2027-09-01T00:00:00Z",
            locationCity = "Aarhus",
            locationRadiusKm = 30,
            quantity = 0,
            skillIds = Array.Empty<int>(),
            certificateIds = Array.Empty<int>()
        });

        response.StatusCode.Should().Be((HttpStatusCode)422);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("At least one skill is required");
        body.Should().Contain("Quantity must be greater than zero");
    }

    private static (Company company, Skill skill, Certificate certificate) SeedCompanyAndCatalog(AppDbContext db, string email)
    {
        var company = new Company
        {
            Name = "Supplier",
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
