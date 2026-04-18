namespace Kapacitet.API.Infrastructure;

public sealed class DevelopmentFeaturesOptions
{
    public bool ApplyMigrations { get; set; }
    public bool SeedDemoData { get; set; }
    public bool EnableDevEndpoints { get; set; }
}
