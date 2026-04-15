using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Kapacitet.Domain.Enums;

namespace Kapacitet.E2ETests;

/// <summary>
/// E2E happy-path: supplier posts availability → requester publishes a capacity request
/// → matching generates a match offer → requester accepts → supplier confirms
/// → cooperation agreement is created with status Active.
///
/// Uses seeded data from DbSeeder:
///   requester: testuser@kapacitet.net  (Company "Test Company")
///   supplier:  supplier@kapacitet.net  (Company "Nordic Capacity Partners")
///   pre-seeded availability: welding + hot-work + working-at-heights, Sonderborg, 7–30 days from now
/// </summary>
public class MatchingFlowTests : IClassFixture<KapacitetWebApplicationFactory>
{
    private readonly KapacitetWebApplicationFactory _factory;

    public MatchingFlowTests(KapacitetWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task PublishCapacityRequest_GeneratesMatch_FullConfirmationFlowCreatesActiveAgreement()
    {
        // --- clients ---
        var requesterClient = CreateClient("testuser@kapacitet.net");
        var supplierClient = CreateClient("supplier@kapacitet.net");

        // --- resolve catalog IDs from seeded data ---
        var (weldingSkillId, hotWorkCertId) = await GetCatalogIdsAsync(requesterClient);

        // --- Act 1: requester publishes a capacity request ---
        // /api/requests/publish creates AND triggers matching in one call
        var publishDto = new
        {
            StartDate = DateTime.UtcNow.Date.AddDays(7),
            EndDate = DateTime.UtcNow.Date.AddDays(30),
            LocationCity = "Sonderborg",
            LocationRadiusKm = 50,
            Quantity = 2,
            Urgency = UrgencyLevel.Medium,
            SkillIds = new[] { weldingSkillId },
            CertificateIds = new[] { hotWorkCertId }
        };

        var publishResponse = await requesterClient.PostAsJsonAsync("/api/requests/publish", publishDto);
        publishResponse.StatusCode.Should().Be(HttpStatusCode.Created,
            "capacity request should be created and published");

        var requestBody = await publishResponse.Content.ReadFromJsonAsync<JsonElement>();
        var requestId = requestBody.GetProperty("id").GetInt32();

        // --- Act 2: poll matches for the newly published request ---
        var matchesResponse = await requesterClient.GetAsync($"/api/requests/{requestId}/matches");
        matchesResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var matches = await matchesResponse.Content.ReadFromJsonAsync<JsonElement>();
        matches.GetArrayLength().Should().BeGreaterThan(0,
            "the seeded supplier availability should produce at least one match offer");

        var matchId = matches[0].GetProperty("id").GetInt32();
        matches[0].GetProperty("status").GetString().Should().Be("PendingRequesterReview");

        // --- Act 3: requester accepts ---
        var acceptResponse = await requesterClient.PostAsync($"/api/matches/{matchId}/accept", null);
        acceptResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var accepted = await acceptResponse.Content.ReadFromJsonAsync<JsonElement>();
        accepted.GetProperty("status").GetString().Should().Be("PendingSupplierConfirmation");

        // --- Act 4: supplier confirms ---
        var confirmResponse = await supplierClient.PostAsync($"/api/matches/{matchId}/supplier-confirm", null);
        confirmResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // --- Assert: agreement exists and is Active ---
        var agreementsResponse = await requesterClient.GetAsync("/api/agreements");
        agreementsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var agreements = await agreementsResponse.Content.ReadFromJsonAsync<JsonElement>();
        agreements.GetArrayLength().Should().BeGreaterOrEqualTo(1,
            "confirming a match offer should create a cooperation agreement");
        agreements[0].GetProperty("status").GetString().Should().Be("Active");
    }

    // ---------------------------------------------------------------

    private HttpClient CreateClient(string email)
    {
        var client = _factory.CreateClient();
        var token = _factory.MintToken(email);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static async Task<(int SkillId, int CertId)> GetCatalogIdsAsync(HttpClient client)
    {
        var skillsResponse = await client.GetAsync("/api/catalog/skills");
        skillsResponse.EnsureSuccessStatusCode();
        var skills = await skillsResponse.Content.ReadFromJsonAsync<JsonElement>();

        var certsResponse = await client.GetAsync("/api/catalog/certificates");
        certsResponse.EnsureSuccessStatusCode();
        var certs = await certsResponse.Content.ReadFromJsonAsync<JsonElement>();

        var weldingId = skills.EnumerateArray()
            .First(s => s.GetProperty("code").GetString() == "welding")
            .GetProperty("id").GetInt32();

        var hotWorkId = certs.EnumerateArray()
            .First(c => c.GetProperty("code").GetString() == "hot-work")
            .GetProperty("id").GetInt32();

        return (weldingId, hotWorkId);
    }
}
