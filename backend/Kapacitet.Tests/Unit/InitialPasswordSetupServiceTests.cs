using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Kapacitet.Application.Features.AccountSetup.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Keycloak;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Tests.Helpers;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Kapacitet.Tests.Unit;

public class InitialPasswordSetupServiceTests
{
    [Fact]
    public async Task IssueTokenAsync_ForApprovedRequest_PersistsHashedTokenAndExpiry()
    {
        var db = TestDbFactory.Create();
        db.AccessRequests.Add(new AccessRequest
        {
            Id = 1,
            Name = "Approved Company",
            ContactEmail = "approved@test.com",
            Location = "Aarhus",
            Status = AccessRequestStatus.Approved,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var token = await service.IssueTokenAsync(1);

        token.Should().NotBeNullOrWhiteSpace();
        var request = await db.AccessRequests.FindAsync(1);
        request!.InitialPasswordSetupTokenHash.Should().NotBeNullOrWhiteSpace();
        request.InitialPasswordSetupTokenHash.Should().NotBe(token);
        request.InitialPasswordSetupTokenExpiresAt.Should().BeAfter(DateTime.UtcNow.AddHours(47));
    }

    [Fact]
    public async Task GetContextAsync_WithValidToken_ReturnsEmail()
    {
        var db = TestDbFactory.Create();
        db.AccessRequests.Add(new AccessRequest
        {
            Id = 2,
            Name = "Approved Company",
            ContactEmail = "approved@test.com",
            Location = "Aarhus",
            Status = AccessRequestStatus.Approved,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var token = await service.IssueTokenAsync(2);

        var context = await service.GetContextAsync(token);

        context.Should().NotBeNull();
        context!.Email.Should().Be("approved@test.com");
    }

    [Fact]
    public async Task SetInitialPasswordAsync_WithValidToken_ResetsPasswordAndClearsToken()
    {
        var db = TestDbFactory.Create();
        db.AccessRequests.Add(new AccessRequest
        {
            Id = 3,
            Name = "Approved Company",
            ContactEmail = "approved@test.com",
            Location = "Aarhus",
            Status = AccessRequestStatus.Approved,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var token = await service.IssueTokenAsync(3);

        var result = await service.SetInitialPasswordAsync(token, "SecurePass123");

        result.Should().Be(InitialPasswordSetupResult.Success);
        var request = await db.AccessRequests.FindAsync(3);
        request!.InitialPasswordSetupTokenHash.Should().BeNull();
        request.InitialPasswordSetupTokenExpiresAt.Should().BeNull();
    }

    private static InitialPasswordSetupService CreateService(AppDbContext db)
    {
        var httpClient = new HttpClient(new FakeKeycloakHandler())
        {
            BaseAddress = new Uri("https://auth.localhost")
        };

        var keycloakClient = new KeycloakAdminClient(
            httpClient,
            Options.Create(new KeycloakAdminOptions
            {
                BaseUrl = "https://auth.localhost",
                Realm = "kapacitet",
                AdminUsername = "admin",
                AdminPassword = "admin"
            }),
            NullLogger<KeycloakAdminClient>.Instance);

        return new InitialPasswordSetupService(
            db,
            keycloakClient,
            NullLogger<InitialPasswordSetupService>.Instance);
    }

    private sealed class FakeKeycloakHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            if (request.Method == HttpMethod.Post &&
                request.RequestUri?.AbsolutePath.EndsWith(
                    "/realms/master/protocol/openid-connect/token",
                    StringComparison.Ordinal) == true)
            {
                return Task.FromResult(Json(HttpStatusCode.OK, new { access_token = "admin-token" }));
            }

            if (request.Method == HttpMethod.Get &&
                request.RequestUri?.AbsolutePath.EndsWith(
                    "/admin/realms/kapacitet/users",
                    StringComparison.Ordinal) == true)
            {
                return Task.FromResult(Json(HttpStatusCode.OK, new[]
                {
                    new
                    {
                        id = "kc-1",
                        requiredActions = new[] { "UPDATE_PASSWORD" }
                    }
                }));
            }

            if (request.Method == HttpMethod.Put &&
                request.RequestUri?.AbsolutePath.EndsWith(
                    "/admin/realms/kapacitet/users/kc-1/reset-password",
                    StringComparison.Ordinal) == true)
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NoContent));
            }

            throw new InvalidOperationException(
                $"Unexpected Keycloak request: {request.Method} {request.RequestUri}");
        }

        private static HttpResponseMessage Json<T>(HttpStatusCode statusCode, T body)
        {
            return new HttpResponseMessage(statusCode)
            {
                Content = JsonContent.Create(body)
            };
        }
    }
}
