using System.Net;
using FluentAssertions;
using Kapacitet.Application.Features.Retention;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace Kapacitet.E2ETests;

public class HealthEndpointTests : IClassFixture<HealthEndpointTests.TestApplicationFactory>
{
    private readonly TestApplicationFactory _factory;

    public HealthEndpointTests(TestApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task HealthEndpoint_ReturnsOk()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync()).Should().Be("OK");
    }

    public sealed class TestApplicationFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["DevelopmentFeatures:ApplyMigrations"] = "false",
                    ["DevelopmentFeatures:SeedInitialData"] = "false",
                    ["DevelopmentFeatures:SeedDemoData"] = "false",
                    ["Keycloak:Authority"] = "https://localhost/auth/realms/kapacitet",
                    ["Keycloak:MetadataAddress"] = "http://localhost/auth/realms/kapacitet/.well-known/openid-configuration"
                });
            });

            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IHostedService>();
                services.AddSingleton<IHostedService, NoOpHostedService>();
            });
        }
    }

    private sealed class NoOpHostedService : IHostedService
    {
        public Task StartAsync(CancellationToken cancellationToken) => Task.CompletedTask;

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
