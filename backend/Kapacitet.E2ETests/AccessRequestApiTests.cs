using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Kapacitet.API.Auth;
using Kapacitet.Application.Features.AccessRequests.DTOs;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.E2ETests.Infrastructure;

namespace Kapacitet.E2ETests;

public class AccessRequestApiTests
{
    [Fact]
    public async Task Submit_WhenPayloadIsValid_ReturnsCreatedAndPersistsRequest()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(_ => Task.CompletedTask);
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });

        var response = await client.PostAsJsonAsync("/api/AccessRequest", new SubmitAccessRequestDto
        {
            Name = "Nordic Builders",
            Cvr = "12345678",
            Categories = ["construction"],
            Location = "Aarhus",
            ContactPhone = "+4512345678",
            ContactEmail = "hello@nordic.test",
            Message = "We need access."
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        await factory.ExecuteDbAsync(db =>
        {
            db.AccessRequests.Should().ContainSingle(request =>
                request.Name == "Nordic Builders" &&
                request.Status == AccessRequestStatus.Pending &&
                request.ContactEmail == "hello@nordic.test");
            return Task.CompletedTask;
        });
    }

    [Fact]
    public async Task Submit_WhenModelIsInvalid_ReturnsUnprocessableEntityWithFieldErrors()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(_ => Task.CompletedTask);
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });

        var response = await client.PostAsJsonAsync("/api/AccessRequest", new
        {
            name = "",
            cvr = "12",
            categories = Array.Empty<string>(),
            location = "",
            contactPhone = "",
            contactEmail = "not-an-email"
        });

        response.StatusCode.Should().Be((HttpStatusCode)422);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var fieldErrors = document.RootElement.GetProperty("fieldErrors");
        fieldErrors.TryGetProperty("name", out _).Should().BeTrue();
        fieldErrors.TryGetProperty("cvr", out _).Should().BeTrue();
        fieldErrors.TryGetProperty("location", out _).Should().BeTrue();
        fieldErrors.TryGetProperty("contactPhone", out _).Should().BeTrue();
        fieldErrors.TryGetProperty("contactEmail", out _).Should().BeTrue();
    }

    [Fact]
    public async Task GetAll_WhenAuthenticatedAsPlatformAdmin_ReturnsExistingRequests()
    {
        await using var factory = new ApiTestApplicationFactory();
        await factory.SeedAsync(db =>
        {
            db.AccessRequests.AddRange(
                new AccessRequest
                {
                    Name = "Request One",
                    Cvr = "12345678",
                    Categories = ["construction"],
                    Location = "Aarhus",
                    ContactEmail = "one@test.local",
                    ContactPhone = "+4511111111",
                    CreatedAt = DateTime.UtcNow
                },
                new AccessRequest
                {
                    Name = "Request Two",
                    Cvr = "87654321",
                    Categories = ["electrical"],
                    Location = "Odense",
                    ContactEmail = "two@test.local",
                    ContactPhone = "+4522222222",
                    CreatedAt = DateTime.UtcNow.AddMinutes(1)
                });
            return Task.CompletedTask;
        });
        using var client = factory.CreateAuthenticatedClient("admin@test.local", AuthorizationRoles.Admin);

        var response = await client.GetAsync("/api/AccessRequest");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var items = document.RootElement;
        items.GetArrayLength().Should().Be(2);
        items[0].GetProperty("name").GetString().Should().Be("Request Two");
        items[1].GetProperty("name").GetString().Should().Be("Request One");
    }
}
