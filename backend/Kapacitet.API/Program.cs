using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Kapacitet.Application.Features.AccessRequests.Services;
using Kapacitet.Application.Features.AvailabilityDeclarations.Services;
using Kapacitet.Infrastructure.Persistence.Seed;
using Kapacitet.Application.Features.Common.Services;
using Kapacitet.Application.Features.CapacityRequests.Services;
using Kapacitet.Application.Features.Matching.Services;
using Kapacitet.Application.Features.Onboarding.Services;
using Kapacitet.Application.Features.AdminPreferences.Services;
using Kapacitet.API.Infrastructure;
using Kapacitet.API.Auth;
using Kapacitet.Infrastructure.Keycloak;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

// Keycloak JWT Auth
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Keycloak:Authority"];
        var metadataAddress = builder.Configuration["Keycloak:MetadataAddress"];
        if (!string.IsNullOrWhiteSpace(metadataAddress))
        {
            options.MetadataAddress = metadataAddress;
        }
        var audience = builder.Configuration["Keycloak:Audience"];
        if (!string.IsNullOrWhiteSpace(audience))
        {
            options.Audience = audience;
        }
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Keycloak:Authority"],
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
                var email = ctx.Principal?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value
                    ?? ctx.Principal?.FindFirst("email")?.Value
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
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
        .ConfigureWarnings(warnings =>
            warnings.Ignore(RelationalEventId.PendingModelChangesWarning)));

// Keycloak Admin Client
builder.Services.Configure<KeycloakAdminOptions>(builder.Configuration.GetSection("KeycloakAdmin"));
builder.Services.AddHttpClient<KeycloakAdminClient>();

// Access Request Service
builder.Services.AddScoped<AccessRequestService>();

// Current User Service
builder.Services.AddScoped<CurrentUserService>();

// Capacity Request Service
builder.Services.AddScoped<CapacityRequestService>();

// Availability Declarations Service
builder.Services.AddScoped<AvailabilityDeclarationService>();

// Onboarding Service
builder.Services.AddScoped<OnboardingService>();

// Admin preferences
builder.Services.AddScoped<PlatformAdminPreferencesService>();

// Matching and agreements
builder.Services.AddScoped<MatchingService>();
builder.Services.AddScoped<MatchingAllocationService>();
builder.Services.AddScoped<MatchingEscalationService>();
builder.Services.AddScoped<MatchingGenerationService>();
builder.Services.AddScoped<MatchingQueryService>();
builder.Services.AddSingleton<MatchEvaluationService>();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(
        AuthorizationRoles.PlatformAdminPolicy,
        policy => policy.RequireRole(AuthorizationRoles.Admin, AuthorizationRoles.LegacyOperatorAdmin));
});
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var fieldErrors = context.ModelState
            .Where(entry => entry.Value?.Errors.Count > 0)
            .ToDictionary(
                entry => ToCamelCase(entry.Key),
                entry => entry.Value!.Errors
                    .Select(error => error.ErrorMessage)
                    .ToArray());

        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status422UnprocessableEntity,
            Title = "Validation failed",
            Type = "validation-error",
            Detail = "One or more validation errors occurred."
        };
        problemDetails.Extensions["fieldErrors"] = fieldErrors;

        return new ObjectResult(problemDetails)
        {
            StatusCode = StatusCodes.Status422UnprocessableEntity
        };
    };
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseExceptionHandler();
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

static string ToCamelCase(string value)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return "general";
    }

    return value.Length == 1
        ? value.ToLowerInvariant()
        : char.ToLowerInvariant(value[0]) + value[1..];
}
