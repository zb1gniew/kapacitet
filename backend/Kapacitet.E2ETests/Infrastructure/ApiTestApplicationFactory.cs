using System.Security.Claims;
using System.Text.Encodings.Web;
using Kapacitet.API.Auth;
using Kapacitet.Application.Features.Retention;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;
using Testcontainers.PostgreSql;

namespace Kapacitet.E2ETests.Infrastructure;

public sealed class ApiTestApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _connectionString;

    public ApiTestApplicationFactory()
    {
        var baseConnectionString = SharedPostgresContainer.GetConnectionStringAsync()
            .GetAwaiter()
            .GetResult();
        var builder = new NpgsqlConnectionStringBuilder(baseConnectionString)
        {
            Database = $"kapacitet_api_tests_{Guid.NewGuid():N}"
        };
        _connectionString = builder.ConnectionString;
        EnsureDatabaseExists(baseConnectionString, builder.Database);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DevelopmentFeatures:ApplyMigrations"] = "false",
                ["DevelopmentFeatures:SeedInitialData"] = "false",
                ["DevelopmentFeatures:SeedDemoData"] = "false",
                ["ConnectionStrings:DefaultConnection"] = _connectionString,
                ["Keycloak:Authority"] = "https://localhost/auth/realms/kapacitet",
                ["Keycloak:MetadataAddress"] = "http://localhost/auth/realms/kapacitet/.well-known/openid-configuration",
                ["Keycloak:Audience"] = "account",
                ["Keycloak:ClientId"] = "kapacitet-app",
                ["Email:ApiKey"] = "test-key",
                ["Email:FromAddress"] = "noreply@test.local",
                ["Email:FromName"] = "Kapacitet Tests",
                ["Email:DevMode"] = "true"
            });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IHostedService>();
            services.AddSingleton<IHostedService, NoOpHostedService>();

            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();
            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(_connectionString));

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
                options.DefaultScheme = TestAuthHandler.SchemeName;
            }).AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                TestAuthHandler.SchemeName,
                _ => { });
        });
    }

    public HttpClient CreateAuthenticatedClient(string email, string role)
    {
        var client = CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            AllowAutoRedirect = false
        });
        client.DefaultRequestHeaders.Add(TestAuthHandler.EmailHeader, email);
        client.DefaultRequestHeaders.Add(TestAuthHandler.RoleHeader, role);
        return client;
    }

    public async Task SeedAsync(Func<AppDbContext, Task> seed)
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        await seed(db);
        await db.SaveChangesAsync();
    }

    public async Task ExecuteDbAsync(Func<AppDbContext, Task> action)
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await action(db);
    }

    public override async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();
    }

    private static void EnsureDatabaseExists(string baseConnectionString, string databaseName)
    {
        using var connection = new NpgsqlConnection(baseConnectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = $"CREATE DATABASE \"{databaseName}\"";
        command.ExecuteNonQuery();
    }

    private sealed class NoOpHostedService : IHostedService
    {
        public Task StartAsync(CancellationToken cancellationToken) => Task.CompletedTask;

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private static class SharedPostgresContainer
    {
        private static readonly SemaphoreSlim Gate = new(1, 1);
        private static PostgreSqlContainer? _postgres;
        private static string? _connectionString;

        public static async Task<string> GetConnectionStringAsync()
        {
            if (_connectionString is not null)
            {
                return _connectionString;
            }

            await Gate.WaitAsync();

            try
            {
                if (_connectionString is not null)
                {
                    return _connectionString;
                }

                _postgres = new PostgreSqlBuilder()
                    .WithImage("postgres:15-alpine")
                    .Build();

                await _postgres.StartAsync();
                _connectionString = _postgres.GetConnectionString();
                return _connectionString;
            }
            finally
            {
                Gate.Release();
            }
        }
    }
}

internal sealed class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "TestAuth";
    public const string EmailHeader = "X-Test-Email";
    public const string RoleHeader = "X-Test-Role";

    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(EmailHeader, out var emailValues))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var email = emailValues.ToString();
        var role = Request.Headers.TryGetValue(RoleHeader, out var roleValues)
            ? roleValues.ToString()
            : string.Empty;

        var claims = new List<Claim>
        {
            new("email", email),
            new(ClaimTypes.Email, email)
        };

        if (!string.IsNullOrWhiteSpace(role))
        {
            claims.Add(new Claim(AuthorizationRoles.AppRoleClaimType, role));
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
