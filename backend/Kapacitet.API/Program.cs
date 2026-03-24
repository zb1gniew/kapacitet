using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Kapacitet.Application.Features.AccessRequests.Services;
using Kapacitet.Application.Features.AvailabilityDeclarations.Services;
using Kapacitet.Infrastructure.Persistence.Seed;
using Kapacitet.Application.Features.Common.Services;

var builder = WebApplication.CreateBuilder(args);

// Keycloak JWT Auth
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Keycloak:Authority"];
        options.Audience = builder.Configuration["Keycloak:Audience"];
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            RoleClaimType = "roles"
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = ctx =>
            {
                Console.WriteLine("TOKEN VALIDATED OK");

                var identity = ctx.Principal?.Identity as System.Security.Claims.ClaimsIdentity;

                // Map roles with Keycloak
                var realmAccess = ctx.Principal?.FindFirst("realm_access")?.Value;
                if (realmAccess != null)
                {
                    var parsed = System.Text.Json.JsonDocument.Parse(realmAccess);
                    if (parsed.RootElement.TryGetProperty("roles", out var roles))
                    {
                        foreach (var role in roles.EnumerateArray())
                        {
                            identity?.AddClaim(new System.Security.Claims.Claim("roles", role.GetString()!));
                        }
                    }
                }

                // Map email
                var email = ctx.Principal?.FindFirst("email")?.Value
                    ?? ctx.Principal?.FindFirst("preferred_username")?.Value;
                if (email != null)
                    identity?.AddClaim(new System.Security.Claims.Claim("email", email));

                return Task.CompletedTask;
            },
            OnAuthenticationFailed = ctx =>
            {
                Console.WriteLine($"AUTH FAILED: {ctx.Exception.Message}");
                return Task.CompletedTask;
            }
        };
    });

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Access Request Service
builder.Services.AddScoped<AccessRequestService>();

// Current User Service
builder.Services.AddScoped<CurrentUserService>();

// Availability Declarations Service
builder.Services.AddScoped<AvailabilityDeclarationService>();

builder.Services.AddAuthorization();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Auto-migration when started
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db);
}

await app.RunAsync();
