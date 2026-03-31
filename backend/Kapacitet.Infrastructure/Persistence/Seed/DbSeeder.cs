using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Infrastructure.Persistence.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await SeedCatalogAsync(db);

        if (await db.Companies.AnyAsync())
            return;

        var requesterCompany = new Company
        {
            Name = "Test Company",
            Industry = "Construction",
            DefaultLocation = "Sonderborg",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        var supplierCompany = new Company
        {
            Name = "Nordic Capacity Partners",
            Industry = "Construction",
            DefaultLocation = "Sonderborg",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        db.Companies.AddRange(requesterCompany, supplierCompany);
        await db.SaveChangesAsync();

        var users = new[]
        {
            new User
            {
                CompanyId = requesterCompany.Id,
                Email = "testuser@kapacitet.net",
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                CompanyId = supplierCompany.Id,
                Email = "supplier@kapacitet.net",
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            }
        };

        db.Users.AddRange(users);
        await db.SaveChangesAsync();
        var weldingSkill = await db.Skills.FirstAsync(skill => skill.Code == "welding");
        var hotWorkCertificate = await db.Certificates
            .FirstAsync(certificate => certificate.Code == "hot-work");
        var workingAtHeightsCertificate = await db.Certificates
            .FirstAsync(certificate => certificate.Code == "working-at-heights");

        var supplierAvailability = new AvailabilityDeclaration
        {
            CompanyId = supplierCompany.Id,
            ResourceType = ResourceType.Worker,
            StartDate = DateTime.UtcNow.Date.AddDays(7),
            EndDate = DateTime.UtcNow.Date.AddDays(30),
            LocationCity = "Sonderborg",
            LocationRadiusKm = 50,
            Quantity = 3,
            Status = ListingStatus.Active,
            CreatedAt = DateTime.UtcNow,
            PublishedAt = DateTime.UtcNow,
            Skills = [weldingSkill],
            Certificates =
            [
                hotWorkCertificate,
                workingAtHeightsCertificate
            ]
        };

        db.AvailabilityDeclarations.Add(supplierAvailability);
        await db.SaveChangesAsync();
    }

    private static async Task SeedCatalogAsync(AppDbContext db)
    {
        var skillCatalog = new[]
        {
            new CatalogSeedItem("welding", "Welding", "fabrication"),
            new CatalogSeedItem("grinding-cutting", "Grinding and cutting", "fabrication"),
            new CatalogSeedItem("sheet-metal-work", "Sheet metal work", "fabrication"),
            new CatalogSeedItem("steel-erection", "Steel erection", "structural"),
            new CatalogSeedItem("rigging", "Rigging", "lifting"),
            new CatalogSeedItem("scaffolding", "Scaffolding", "access"),
            new CatalogSeedItem("electrical-installation", "Electrical installation", "electrical"),
            new CatalogSeedItem("cable-pulling", "Cable pulling", "electrical"),
            new CatalogSeedItem("electrical-termination", "Electrical termination", "electrical"),
            new CatalogSeedItem("panel-installation", "Panel installation", "electrical"),
            new CatalogSeedItem("control-panel-wiring", "Control panel wiring", "electrical"),
            new CatalogSeedItem("cable-tray-installation", "Cable tray installation", "electrical"),
            new CatalogSeedItem("lighting-installation", "Lighting installation", "electrical"),
            new CatalogSeedItem("power-distribution-installation", "Power distribution installation", "electrical"),
            new CatalogSeedItem("instrumentation-installation", "Instrumentation installation", "instrumentation"),
            new CatalogSeedItem("instrument-calibration", "Instrument calibration", "instrumentation"),
            new CatalogSeedItem("automation-installation", "Automation installation", "instrumentation"),
            new CatalogSeedItem("mechanical-assembly", "Mechanical assembly", "mechanical"),
            new CatalogSeedItem("mechanical-installation", "Mechanical installation", "mechanical"),
            new CatalogSeedItem("machine-installation", "Machine installation", "mechanical"),
            new CatalogSeedItem("equipment-mounting", "Equipment mounting", "mechanical"),
            new CatalogSeedItem("equipment-alignment", "Equipment alignment", "mechanical"),
            new CatalogSeedItem("bolting-torquing", "Bolting and torquing", "mechanical"),
            new CatalogSeedItem("industrial-maintenance", "Industrial maintenance", "maintenance"),
            new CatalogSeedItem("preventive-maintenance", "Preventive maintenance", "maintenance"),
            new CatalogSeedItem("pipe-fitting", "Pipe fitting", "piping"),
            new CatalogSeedItem("tube-installation", "Tube installation", "piping"),
            new CatalogSeedItem("valve-installation", "Valve installation", "piping"),
            new CatalogSeedItem("plumbing-installation", "Plumbing installation", "piping"),
            new CatalogSeedItem("hvac-installation", "HVAC installation", "hvac"),
            new CatalogSeedItem("duct-installation", "Duct installation", "hvac"),
            new CatalogSeedItem("ventilation-installation", "Ventilation installation", "hvac"),
            new CatalogSeedItem("concrete-work", "Concrete work", "civil"),
            new CatalogSeedItem("formwork", "Formwork", "civil"),
            new CatalogSeedItem("rebar-installation", "Rebar installation", "civil"),
            new CatalogSeedItem("carpentry", "Carpentry", "civil"),
            new CatalogSeedItem("insulation-installation", "Insulation installation", "finishing"),
            new CatalogSeedItem("painting-coating", "Painting and coating", "finishing"),
            new CatalogSeedItem("firestopping", "Firestopping", "finishing"),
            new CatalogSeedItem("commissioning-support", "Commissioning support", "commissioning"),
            new CatalogSeedItem("quality-inspection", "Quality inspection", "quality"),
            new CatalogSeedItem("industrial-cleaning", "Industrial cleaning", "operations"),
            new CatalogSeedItem("site-logistics-support", "Site logistics support", "operations")
        };

        var certificateCatalog = new[]
        {
            new CatalogSeedItem("hot-work", "Hot work certification", "safety"),
            new CatalogSeedItem("working-at-heights", "Working at heights", "access"),
            new CatalogSeedItem("confined-space-entry", "Confined space entry", "safety"),
            new CatalogSeedItem("first-aid-cpr", "First aid / CPR", "safety"),
            new CatalogSeedItem("fire-watch", "Fire watch", "safety"),
            new CatalogSeedItem("lockout-tagout", "Lockout / tagout", "safety"),
            new CatalogSeedItem("gas-testing", "Gas testing", "safety"),
            new CatalogSeedItem("manual-handling", "Manual handling", "safety"),
            new CatalogSeedItem("hazardous-material-handling", "Hazardous material handling", "safety"),
            new CatalogSeedItem("respirator-fit-test", "Respirator fit test", "safety"),
            new CatalogSeedItem("asbestos-awareness", "Asbestos awareness", "safety"),
            new CatalogSeedItem("site-safety-induction", "Site safety induction", "safety"),
            new CatalogSeedItem("electrical-certification", "Electrical certification", "trade"),
            new CatalogSeedItem("low-voltage-safety", "Low voltage safety", "electrical"),
            new CatalogSeedItem("high-voltage-safety", "High voltage safety", "electrical"),
            new CatalogSeedItem("arc-flash-safety", "Arc flash safety", "electrical"),
            new CatalogSeedItem("mewp-operator", "MEWP / boom lift operator", "equipment"),
            new CatalogSeedItem("forklift-operator", "Forklift operator", "equipment"),
            new CatalogSeedItem("telehandler-operator", "Telehandler operator", "equipment"),
            new CatalogSeedItem("crane-operator", "Crane operator", "equipment"),
            new CatalogSeedItem("overhead-crane-operator", "Overhead crane operator", "equipment"),
            new CatalogSeedItem("rigging-slinging-certification", "Rigging and slinging certification", "lifting"),
            new CatalogSeedItem("banksman-signalman", "Banksman / signalman certification", "lifting"),
            new CatalogSeedItem("scaffold-user", "Scaffold user certification", "access"),
            new CatalogSeedItem("scaffold-erector", "Scaffold erector certification", "access"),
            new CatalogSeedItem("rescue-at-height", "Rescue at height", "access"),
            new CatalogSeedItem("breathing-apparatus-user", "Breathing apparatus user", "safety"),
            new CatalogSeedItem("pressure-testing-awareness", "Pressure testing awareness", "trade"),
            new CatalogSeedItem("lifting-operations-safety", "Lifting operations safety", "lifting")
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
            var existingSkill = existingSkills.FirstOrDefault(skill =>
                skill.Code == item.Code ||
                (skill.Code is null && skill.Name == item.Name));

            if (existingSkill is null)
            {
                db.Skills.Add(new Skill
                {
                    Code = item.Code,
                    Name = item.Name,
                    Category = item.Category
                });

                continue;
            }

            existingSkill.Code = item.Code;
            existingSkill.Name = item.Name;
            existingSkill.Category = item.Category;
        }
    }

    private static async Task UpsertCertificatesAsync(AppDbContext db, IReadOnlyList<CatalogSeedItem> items)
    {
        var existingCertificates = await db.Certificates.ToListAsync();

        foreach (var item in items)
        {
            var existingCertificate = existingCertificates.FirstOrDefault(certificate =>
                certificate.Code == item.Code ||
                (certificate.Code is null && certificate.Name == item.Name));

            if (existingCertificate is null)
            {
                db.Certificates.Add(new Certificate
                {
                    Code = item.Code,
                    Name = item.Name,
                    Category = item.Category
                });

                continue;
            }

            existingCertificate.Code = item.Code;
            existingCertificate.Name = item.Name;
            existingCertificate.Category = item.Category;
        }
    }

    private sealed record CatalogSeedItem(string Code, string Name, string Category);
}
