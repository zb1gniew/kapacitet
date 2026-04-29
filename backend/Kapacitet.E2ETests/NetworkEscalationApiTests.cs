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

public class NetworkEscalationApiTests
{
    [Fact]
    public async Task GetAll_ReturnsEligibleEscalationsForCurrentCompany()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            var requester = AddCompany(db, "Requester");
            var responder = AddCompany(db, "Responder");
            db.Users.Add(new User
            {
                Company = responder,
                Email = "viewer@test.local",
                Role = UserRole.Viewer,
                CreatedAt = DateTime.UtcNow
            });

            var request = new CapacityRequest
            {
                Company = requester,
                ResourceType = ResourceType.Worker,
                StartDate = new DateTime(2027, 8, 1, 0, 0, 0, DateTimeKind.Utc),
                EndDate = new DateTime(2027, 8, 31, 0, 0, 0, DateTimeKind.Utc),
                LocationCity = "Aarhus",
                Quantity = 3,
                Status = ListingStatus.Active,
                Urgency = UrgencyLevel.High,
                CreatedAt = DateTime.UtcNow
            };

            db.CapacityRequests.Add(request);
            db.NetworkEscalations.Add(new NetworkEscalation
            {
                Request = request,
                TriggeredAt = DateTime.UtcNow,
                Status = NetworkEscalationStatus.Open
            });

            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("viewer@test.local", AuthorizationRoles.Viewer);

        var response = await client.GetAsync("/api/network-escalations");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        document.RootElement.GetArrayLength().Should().Be(1);
        document.RootElement[0].GetProperty("quantity").GetInt32().Should().Be(3);
        document.RootElement[0].GetProperty("hasResponded").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public async Task Respond_WhenManagerCanHelp_ReturnsOkAndPersistsResponse()
    {
        await using var factory = new ApiTestApplicationFactory();
        var escalationId = 0;
        await factory.SeedAsync(db =>
        {
            var requester = AddCompany(db, "Requester");
            var responder = AddCompany(db, "Responder");
            db.Users.Add(new User
            {
                Company = responder,
                Email = "manager@test.local",
                Role = UserRole.Manager,
                CreatedAt = DateTime.UtcNow
            });

            var request = new CapacityRequest
            {
                Company = requester,
                ResourceType = ResourceType.Worker,
                StartDate = new DateTime(2027, 8, 1, 0, 0, 0, DateTimeKind.Utc),
                EndDate = new DateTime(2027, 8, 31, 0, 0, 0, DateTimeKind.Utc),
                LocationCity = "Aarhus",
                Quantity = 2,
                Status = ListingStatus.Active,
                Urgency = UrgencyLevel.High,
                CreatedAt = DateTime.UtcNow
            };

            db.CapacityRequests.Add(request);
            var escalation = new NetworkEscalation
            {
                Request = request,
                TriggeredAt = DateTime.UtcNow,
                Status = NetworkEscalationStatus.Open
            };
            db.NetworkEscalations.Add(escalation);
            db.SaveChanges();
            escalationId = escalation.Id;
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("manager@test.local", AuthorizationRoles.Manager);

        var response = await client.PostAsJsonAsync($"/api/network-escalations/{escalationId}/respond", new
        {
            responseType = "CanHelp"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        await factory.ExecuteDbAsync(async db =>
        {
            var saved = await db.NetworkResponses.SingleAsync();
            saved.ResponseType.Should().Be(NetworkResponseType.CanHelp);
        });
    }

    [Fact]
    public async Task Respond_WhenNeedCapacity_CreatesDerivedCapacityRequest()
    {
        await using var factory = new ApiTestApplicationFactory();
        var escalationId = 0;
        await factory.SeedAsync(db =>
        {
            var requester = AddCompany(db, "Requester");
            var responder = AddCompany(db, "Responder");
            db.Users.Add(new User
            {
                Company = responder,
                Email = "manager@test.local",
                Role = UserRole.Manager,
                CreatedAt = DateTime.UtcNow
            });

            var skill = new Skill { Name = "Carpentry" };
            db.Skills.Add(skill);

            var request = new CapacityRequest
            {
                Company = requester,
                ResourceType = ResourceType.Worker,
                StartDate = new DateTime(2027, 9, 1, 0, 0, 0, DateTimeKind.Utc),
                EndDate = new DateTime(2027, 9, 15, 0, 0, 0, DateTimeKind.Utc),
                LocationCity = "Aarhus",
                Quantity = 4,
                Status = ListingStatus.Active,
                Urgency = UrgencyLevel.Critical,
                CreatedAt = DateTime.UtcNow,
                Skills = [skill]
            };

            db.CapacityRequests.Add(request);
            var escalation = new NetworkEscalation
            {
                Request = request,
                TriggeredAt = DateTime.UtcNow,
                Status = NetworkEscalationStatus.Open
            };
            db.NetworkEscalations.Add(escalation);
            db.SaveChanges();
            escalationId = escalation.Id;
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("manager@test.local", AuthorizationRoles.Manager);

        var response = await client.PostAsJsonAsync($"/api/network-escalations/{escalationId}/respond", new
        {
            responseType = "NeedCapacity"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        await factory.ExecuteDbAsync(async db =>
        {
            var derived = await db.CapacityRequests
                .Include(r => r.Company)
                .Where(r => r.Company.Name == "Responder")
                .OrderByDescending(r => r.Id)
                .FirstAsync();

            derived.Status.Should().Be(ListingStatus.Active);
            derived.Quantity.Should().Be(4);
            derived.LocationCity.Should().Be("Aarhus");
            derived.Urgency.Should().Be(UrgencyLevel.Critical);
        });
    }

    private static Company AddCompany(AppDbContext db, string name)
    {
        var company = new Company
        {
            Name = name,
            Industry = "Construction",
            DefaultLocation = "Aarhus",
            Categories = ["construction"],
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        db.Companies.Add(company);
        db.CompanySettings.Add(new CompanySettings
        {
            Company = company,
            ReceiveCapacityRequests = true,
            ParticipateInNetworkWide = true
        });
        return company;
    }
}
