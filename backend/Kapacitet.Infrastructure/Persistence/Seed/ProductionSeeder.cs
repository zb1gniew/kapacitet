using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Infrastructure.Persistence.Seed;

public static class ProductionSeeder
{
    private static readonly SeedCompanyProfile PlatformAdminCompanyProfile = new(
        "Kapacitet Platform Operations",
        "00000001",
        "Platform services",
        ["facility_services", "logistics"],
        "Copenhagen",
        "+45 70 20 30 40");

    public static async Task SeedAsync(AppDbContext db)
    {
        await SeedCatalogAsync(db);
        await SeedPlatformAdminAsync(db);
        await BackfillExistingCompaniesAsync(db);
    }

    private static async Task SeedPlatformAdminAsync(AppDbContext db)
    {
        var now = DateTime.UtcNow;
        var company = await EnsureCompanyAsync(db, PlatformAdminCompanyProfile, now);
        await EnsureUserAsync(db, company, "platform-admin@kapacitet.net", UserRole.Admin, now);
    }

    internal static async Task<Company> EnsureCompanyAsync(
        AppDbContext db,
        SeedCompanyProfile profile,
        DateTime now)
    {
        var company = await db.Companies
            .Include(c => c.CompanySettings)
            .Include(c => c.NotificationPreferences)
            .FirstOrDefaultAsync(c => c.Name == profile.Name);
        var isNewCompany = company is null;

        if (company is null)
        {
            company = new Company
            {
                CreatedAt = now
            };
            db.Companies.Add(company);
        }

        ApplyCompanyProfile(company, profile);
        await db.SaveChangesAsync();

        if (company.CompanySettings is null)
        {
            company.CompanySettings = CreateCompanySettings(company.Id);
            db.CompanySettings.Add(company.CompanySettings);
        }

        if (company.NotificationPreferences is null)
        {
            company.NotificationPreferences = CreateNotificationPreferences(company.Id);
            db.NotificationPreferences.Add(company.NotificationPreferences);
        }

        if (isNewCompany || company.CompanySettings is not null || company.NotificationPreferences is not null)
        {
            await db.SaveChangesAsync();
        }

        return company;
    }

    internal static async Task EnsureUserAsync(
        AppDbContext db,
        Company company,
        string email,
        UserRole role,
        DateTime now)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user is null)
        {
            db.Users.Add(CreateUser(company, email, role, now));
            await db.SaveChangesAsync();
            return;
        }

        user.CompanyId = company.Id;
        user.Role = role;
        user.OnboardingCompletedAt ??= now;
        await db.SaveChangesAsync();
    }

    internal static void ApplyCompanyProfile(
        Company company,
        SeedCompanyProfile profile)
    {
        company.Name = profile.Name;
        company.Cvr = profile.Cvr;
        company.Industry = profile.Industry;
        company.Categories = profile.Categories
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        company.DefaultLocation = profile.DefaultLocation;
        company.ContactPhone = profile.ContactPhone;
        company.Status = CompanyStatus.Active;
    }

    private static User CreateUser(
        Company company,
        string email,
        UserRole role,
        DateTime createdAt)
    {
        return new User
        {
            CompanyId = company.Id,
            Email = email,
            Role = role,
            CreatedAt = createdAt,
            OnboardingCompletedAt = createdAt
        };
    }

    private static CompanySettings CreateCompanySettings(int companyId)
    {
        return new CompanySettings
        {
            CompanyId = companyId,
            ReceiveCapacityRequests = true,
            ParticipateInNetworkWide = true,
            AllowPartialMatches = true,
            MatchOutsideCategory = true
        };
    }

    private static NotificationPreferences CreateNotificationPreferences(int companyId)
    {
        return new NotificationPreferences
        {
            CompanyId = companyId,
            EmailNewMatches = true,
            EmailActionsRequired = true,
            EmailUpcomingCooperation = true,
            InAppNewMatches = true,
            InAppActionsRequired = true,
            InAppUpcomingCooperation = true,
            EmailNetworkRequests = true,
            InAppNetworkRequests = true
        };
    }

    private static async Task BackfillExistingCompaniesAsync(AppDbContext db)
    {
        var companies = await db.Companies
            .Include(c => c.CompanySettings)
            .Include(c => c.NotificationPreferences)
            .OrderBy(c => c.Id)
            .ToListAsync();

        var latestApprovedRequests = await db.AccessRequests
            .Where(request =>
                request.Status == AccessRequestStatus.Approved
                && request.ProvisionedCompanyId.HasValue)
            .OrderByDescending(request => request.ReviewedAt ?? request.CreatedAt)
            .ToListAsync();

        var latestApprovedRequestByCompanyId = latestApprovedRequests
            .GroupBy(request => request.ProvisionedCompanyId!.Value)
            .ToDictionary(group => group.Key, group => group.First());

        var changed = false;

        foreach (var company in companies)
        {
            if (company.CompanySettings is null)
            {
                company.CompanySettings = CreateCompanySettings(company.Id);
                db.CompanySettings.Add(company.CompanySettings);
                changed = true;
            }

            if (company.NotificationPreferences is null)
            {
                company.NotificationPreferences = CreateNotificationPreferences(company.Id);
                db.NotificationPreferences.Add(company.NotificationPreferences);
                changed = true;
            }

            if (!latestApprovedRequestByCompanyId.TryGetValue(company.Id, out var request))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(company.Cvr) && !string.IsNullOrWhiteSpace(request.Cvr))
            {
                company.Cvr = request.Cvr;
                changed = true;
            }

            if (company.Categories.Count == 0 && request.Categories.Count > 0)
            {
                company.Categories = request.Categories
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
                changed = true;
            }

            if (string.IsNullOrWhiteSpace(company.Industry) && !string.IsNullOrWhiteSpace(request.Industry))
            {
                company.Industry = request.Industry;
                changed = true;
            }

            if (string.IsNullOrWhiteSpace(company.DefaultLocation) && !string.IsNullOrWhiteSpace(request.Location))
            {
                company.DefaultLocation = request.Location;
                changed = true;
            }

            if (string.IsNullOrWhiteSpace(company.ContactPhone) && !string.IsNullOrWhiteSpace(request.ContactPhone))
            {
                company.ContactPhone = request.ContactPhone;
                changed = true;
            }
        }

        if (changed)
        {
            await db.SaveChangesAsync();
        }
    }

    private static async Task SeedCatalogAsync(AppDbContext db)
    {
        var skillCatalog = new[]
        {
            new CatalogSeedItem("welding", "Welding", "Metalwork"),
            new CatalogSeedItem("grinding-cutting", "Grinding and cutting", "Metalwork"),
            new CatalogSeedItem("sheet-metal-work", "Sheet metal work", "Metalwork"),
            new CatalogSeedItem("steel-erection", "Steel erection", "Metalwork"),
            new CatalogSeedItem("rigging", "Rigging", "Construction"),
            new CatalogSeedItem("scaffolding", "Scaffolding", "Scaffolding"),
            new CatalogSeedItem("electrical-installation", "Electrical installation", "Electrical"),
            new CatalogSeedItem("cable-pulling", "Cable pulling", "Electrical"),
            new CatalogSeedItem("electrical-termination", "Electrical termination", "Electrical"),
            new CatalogSeedItem("panel-installation", "Panel installation", "Electrical"),
            new CatalogSeedItem("control-panel-wiring", "Control panel wiring", "Electrical"),
            new CatalogSeedItem("cable-tray-installation", "Cable tray installation", "Electrical"),
            new CatalogSeedItem("lighting-installation", "Lighting installation", "Electrical"),
            new CatalogSeedItem("power-distribution-installation", "Power distribution installation", "Electrical"),
            new CatalogSeedItem("instrumentation-installation", "Instrumentation installation", "Electrical"),
            new CatalogSeedItem("instrument-calibration", "Instrument calibration", "Electrical"),
            new CatalogSeedItem("automation-installation", "Automation installation", "Electrical"),
            new CatalogSeedItem("mechanical-assembly", "Mechanical assembly", "Metalwork"),
            new CatalogSeedItem("mechanical-installation", "Mechanical installation", "Metalwork"),
            new CatalogSeedItem("machine-installation", "Machine installation", "Metalwork"),
            new CatalogSeedItem("equipment-mounting", "Equipment mounting", "Metalwork"),
            new CatalogSeedItem("equipment-alignment", "Equipment alignment", "Metalwork"),
            new CatalogSeedItem("bolting-torquing", "Bolting and torquing", "Metalwork"),
            new CatalogSeedItem("industrial-maintenance", "Industrial maintenance", "Facility Services"),
            new CatalogSeedItem("preventive-maintenance", "Preventive maintenance", "Facility Services"),
            new CatalogSeedItem("pipe-fitting", "Pipe fitting", "Plumbing"),
            new CatalogSeedItem("tube-installation", "Tube installation", "Plumbing"),
            new CatalogSeedItem("valve-installation", "Valve installation", "Plumbing"),
            new CatalogSeedItem("plumbing-installation", "Plumbing installation", "Plumbing"),
            new CatalogSeedItem("hvac-installation", "HVAC installation", "HVAC"),
            new CatalogSeedItem("duct-installation", "Duct installation", "HVAC"),
            new CatalogSeedItem("ventilation-installation", "Ventilation installation", "HVAC"),
            new CatalogSeedItem("concrete-work", "Concrete work", "Concrete Work"),
            new CatalogSeedItem("formwork", "Formwork", "Concrete Work"),
            new CatalogSeedItem("rebar-installation", "Rebar installation", "Concrete Work"),
            new CatalogSeedItem("carpentry", "Carpentry", "Carpentry"),
            new CatalogSeedItem("insulation-installation", "Insulation installation", "Insulation"),
            new CatalogSeedItem("painting-coating", "Painting and coating", "Painting"),
            new CatalogSeedItem("firestopping", "Firestopping", "Interior Finishing"),
            new CatalogSeedItem("commissioning-support", "Commissioning support", "Construction"),
            new CatalogSeedItem("quality-inspection", "Quality inspection", "Construction"),
            new CatalogSeedItem("industrial-cleaning", "Industrial cleaning", "Cleaning"),
            new CatalogSeedItem("site-logistics-support", "Site logistics support", "Logistics")
        };

        var certificateCatalog = new[]
        {
            new CatalogSeedItem("hot-work", "Hot work certification", "Construction"),
            new CatalogSeedItem("working-at-heights", "Working at heights", "Scaffolding"),
            new CatalogSeedItem("confined-space-entry", "Confined space entry", "Construction"),
            new CatalogSeedItem("first-aid-cpr", "First aid / CPR", "Construction"),
            new CatalogSeedItem("fire-watch", "Fire watch", "Construction"),
            new CatalogSeedItem("lockout-tagout", "Lockout / tagout", "Construction"),
            new CatalogSeedItem("gas-testing", "Gas testing", "Construction"),
            new CatalogSeedItem("manual-handling", "Manual handling", "Construction"),
            new CatalogSeedItem("hazardous-material-handling", "Hazardous material handling", "Construction"),
            new CatalogSeedItem("respirator-fit-test", "Respirator fit test", "Construction"),
            new CatalogSeedItem("asbestos-awareness", "Asbestos awareness", "Construction"),
            new CatalogSeedItem("site-safety-induction", "Site safety induction", "Construction"),
            new CatalogSeedItem("electrical-certification", "Electrical certification", "Electrical"),
            new CatalogSeedItem("low-voltage-safety", "Low voltage safety", "Electrical"),
            new CatalogSeedItem("high-voltage-safety", "High voltage safety", "Electrical"),
            new CatalogSeedItem("arc-flash-safety", "Arc flash safety", "Electrical"),
            new CatalogSeedItem("mewp-operator", "MEWP / boom lift operator", "Construction"),
            new CatalogSeedItem("forklift-operator", "Forklift operator", "Logistics"),
            new CatalogSeedItem("telehandler-operator", "Telehandler operator", "Construction"),
            new CatalogSeedItem("crane-operator", "Crane operator", "Construction"),
            new CatalogSeedItem("overhead-crane-operator", "Overhead crane operator", "Metalwork"),
            new CatalogSeedItem("rigging-slinging-certification", "Rigging and slinging certification", "Construction"),
            new CatalogSeedItem("banksman-signalman", "Banksman / signalman certification", "Construction"),
            new CatalogSeedItem("scaffold-user", "Scaffold user certification", "Scaffolding"),
            new CatalogSeedItem("scaffold-erector", "Scaffold erector certification", "Scaffolding"),
            new CatalogSeedItem("rescue-at-height", "Rescue at height", "Scaffolding"),
            new CatalogSeedItem("breathing-apparatus-user", "Breathing apparatus user", "Construction"),
            new CatalogSeedItem("pressure-testing-awareness", "Pressure testing awareness", "Plumbing"),
            new CatalogSeedItem("lifting-operations-safety", "Lifting operations safety", "Construction")
        };

        await UpsertSkillsAsync(db, skillCatalog);
        await UpsertCertificatesAsync(db, certificateCatalog);
        await db.SaveChangesAsync();
    }

    private static async Task UpsertSkillsAsync(AppDbContext db, IReadOnlyList<CatalogSeedItem> items)
    {
        var existingSkills = await db.Skills.ToListAsync();

        foreach (var item in items)
        {
            var existing = existingSkills.FirstOrDefault(s =>
                s.Code == item.Code || (s.Code is null && s.Name == item.Name));

            if (existing is null)
            {
                db.Skills.Add(new Skill { Code = item.Code, Name = item.Name, Category = item.Category });
                continue;
            }

            existing.Code = item.Code;
            existing.Name = item.Name;
            existing.Category = item.Category;
        }
    }

    private static async Task UpsertCertificatesAsync(AppDbContext db, IReadOnlyList<CatalogSeedItem> items)
    {
        var existingCertificates = await db.Certificates.ToListAsync();

        foreach (var item in items)
        {
            var existing = existingCertificates.FirstOrDefault(c =>
                c.Code == item.Code || (c.Code is null && c.Name == item.Name));

            if (existing is null)
            {
                db.Certificates.Add(new Certificate { Code = item.Code, Name = item.Name, Category = item.Category });
                continue;
            }

            existing.Code = item.Code;
            existing.Name = item.Name;
            existing.Category = item.Category;
        }
    }

    internal sealed record CatalogSeedItem(string Code, string Name, string Category);
    internal sealed record SeedCompanyProfile(
        string Name,
        string? Cvr,
        string Industry,
        IReadOnlyList<string> Categories,
        string DefaultLocation,
        string ContactPhone);
}
