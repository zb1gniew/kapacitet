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
using Kapacitet.Application.Features.Admin.Services;
using Kapacitet.Application.Features.CompanySettings.Services;
using Kapacitet.Application.Features.NetworkEscalations.Services;
using Kapacitet.Application.Features.Notifications.Services;
using Kapacitet.Application.Features.Retention;
using Kapacitet.API.Infrastructure;
using Kapacitet.API.Auth;
using Kapacitet.Infrastructure.Keycloak;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using Resend;
using System.Text.Json;

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
        // The browser-facing authority stays HTTPS, but Docker server-to-server
        // metadata is intentionally fetched over the internal HTTP network.
        options.RequireHttpsMetadata =
            string.IsNullOrWhiteSpace(metadataAddress) ||
            !metadataAddress.StartsWith("http://", StringComparison.OrdinalIgnoreCase);
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Keycloak:Authority"],
            ValidateAudience = true,
            // Accept both the Keycloak default audience ("account") and the client ID
            // ("kapacitet-app") to support Keycloak realms that add the client as audience.
            ValidAudiences = new[]
            {
                builder.Configuration["Keycloak:Audience"],
                builder.Configuration["Keycloak:ClientId"]
            }.Where(a => !string.IsNullOrWhiteSpace(a)),
            ValidateLifetime = true,
            RoleClaimType = "roles"
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = ctx =>
            {
                var logger = ctx.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("Kapacitet.API.Authentication");

                var identity = ctx.Principal?.Identity as System.Security.Claims.ClaimsIdentity;
                var subject = ctx.Principal?.FindFirst("sub")?.Value;

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
                {
                    identity?.AddClaim(new System.Security.Claims.Claim("email", email));
                }

                logger.LogDebug(
                    "JWT token validated for subject {Subject} with email {Email}",
                    subject,
                    email);

                return Task.CompletedTask;
            },
            OnAuthenticationFailed = ctx =>
            {
                var logger = ctx.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("Kapacitet.API.Authentication");

                logger.LogWarning(
                    ctx.Exception,
                    "JWT authentication failed for request {Method} {Path}",
                    ctx.Request.Method,
                    ctx.Request.Path);

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
builder.Services.AddScoped<AdminDataService>();

// Company settings
builder.Services.AddScoped<CompanyService>();

// Matching and agreements
builder.Services.AddScoped<MatchingService>();
builder.Services.AddScoped<MatchingAllocationService>();
builder.Services.AddScoped<MatchingEscalationService>();
builder.Services.AddScoped<NetworkEscalationOutreachService>();
builder.Services.AddScoped<MatchingGenerationService>();
builder.Services.AddScoped<MatchingQueryService>();
builder.Services.AddScoped<MatchEvaluationService>();
builder.Services.AddScoped<NotificationService>();

// Email
builder.Services.Configure<Kapacitet.Application.Features.Notifications.EmailOptions>(
    builder.Configuration.GetSection("Email"));
builder.Services.Configure<ResendClientOptions>(o =>
    o.ApiToken = builder.Configuration["Email:ApiKey"] ?? "");
builder.Services.AddHttpClient<ResendClient>();
builder.Services.AddTransient<IResend, ResendClient>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddHostedService<CooperationReminderService>();
builder.Services.AddHostedService<DataRetentionService>();
builder.Services.AddScoped<NetworkEscalationService>();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddHealthChecks()
    .AddNpgSql(
        builder.Configuration.GetConnectionString("DefaultConnection")!,
        name: "database",
        tags: ["ready"]);

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
else
{
    // HSTS: instruct browsers to only connect over HTTPS for 1 year.
    // Only active in production — dev uses HTTP internally.
    app.UseHsts();
}

// Redirect any stray HTTP requests to HTTPS.
// In production behind Caddy, the backend only ever receives internal HTTP
// from the Docker network, so this middleware is a safety net for direct access.
app.UseHttpsRedirection();

app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Liveness — always 200 if process is running
app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = _ => false,
    ResponseWriter = (ctx, _) =>
    {
        ctx.Response.ContentType = "text/plain";
        return ctx.Response.WriteAsync("OK");
    }
}).AllowAnonymous();

// Readiness — checks DB connectivity
app.MapHealthChecks("/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResponseWriter = async (ctx, report) =>
    {
        ctx.Response.ContentType = "application/json";
        ctx.Response.StatusCode = report.Status == HealthStatus.Healthy
            ? StatusCodes.Status200OK
            : StatusCodes.Status503ServiceUnavailable;
        var result = new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                description = e.Value.Description
            })
        };
        await ctx.Response.WriteAsync(JsonSerializer.Serialize(result));
    }
}).AllowAnonymous();

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

// Expose Program as public so WebApplicationFactory<Program> works in the E2E test project.
public partial class Program { protected Program() { } }
