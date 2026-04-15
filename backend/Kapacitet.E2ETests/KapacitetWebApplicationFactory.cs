using System.Text;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Testcontainers.PostgreSql;

namespace Kapacitet.E2ETests;

public class KapacitetWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    // 32+ byte key for HMAC-SHA256
    private const string TestJwtKey = "kapacitet-e2e-test-signing-key-32b!";

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithDatabase("kapacitet_test")
        .WithUsername("test")
        .WithPassword("test")
        .Build();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
    }

    public new async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
        await base.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            // Replace DB with test container
            var dbDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (dbDescriptor != null)
                services.Remove(dbDescriptor);

            services.AddDbContext<AppDbContext>(opts =>
                opts.UseNpgsql(_postgres.GetConnectionString()));

            // Override JWT: skip Keycloak metadata fetch, use symmetric test key
            services.PostConfigure<JwtBearerOptions>(
                JwtBearerDefaults.AuthenticationScheme, opts =>
                {
                    opts.Authority = null;
                    opts.MetadataAddress = null;
                    opts.RequireHttpsMetadata = false;
                    opts.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ValidateLifetime = true,
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(TestJwtKey)),
                        RoleClaimType = "roles"
                    };
                });
        });
    }

    /// <summary>
    /// Mint a JWT token for a seeded test user. The email must match a seeded user in the DB.
    /// </summary>
    public string MintToken(string email, string role = "Admin")
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestJwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            claims:
            [
                new Claim("email", email),
                new Claim("roles", role),
                new Claim("sub", email)
            ],
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
