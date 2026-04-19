using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Kapacitet.Infrastructure.Persistence;

public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? "Development";

        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? LoadConnectionStringFromSettings(environment)
            ?? throw new InvalidOperationException(
                "Could not resolve ConnectionStrings:DefaultConnection for EF Core design-time operations.");

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new AppDbContext(options);
    }

    private static string? LoadConnectionStringFromSettings(string environment)
    {
        var settingsPaths = new[]
        {
            FindApiSettingsPath("appsettings.json"),
            FindApiSettingsPath($"appsettings.{environment}.json")
        };

        foreach (var path in settingsPaths.Where(path => path is not null))
        {
            using var stream = File.OpenRead(path!);
            using var document = JsonDocument.Parse(stream);

            if (document.RootElement.TryGetProperty("ConnectionStrings", out var connectionStrings)
                && connectionStrings.TryGetProperty("DefaultConnection", out var value)
                && value.ValueKind == JsonValueKind.String)
            {
                return value.GetString();
            }
        }

        return null;
    }

    private static string? FindApiSettingsPath(string fileName)
    {
        foreach (var root in EnumerateSearchRoots())
        {
            var directPath = Path.Combine(root, "Kapacitet.API", fileName);
            if (File.Exists(directPath))
            {
                return directPath;
            }

            var backendPath = Path.Combine(root, "backend", "Kapacitet.API", fileName);
            if (File.Exists(backendPath))
            {
                return backendPath;
            }
        }

        return null;
    }

    private static IEnumerable<string> EnumerateSearchRoots()
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
        {
            if (string.IsNullOrWhiteSpace(start))
            {
                continue;
            }

            var directory = new DirectoryInfo(start);
            while (directory is not null)
            {
                if (seen.Add(directory.FullName))
                {
                    yield return directory.FullName;
                }

                directory = directory.Parent;
            }
        }
    }
}
