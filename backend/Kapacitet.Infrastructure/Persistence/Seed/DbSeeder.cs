using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Infrastructure.Persistence.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
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

        var skills = new[]
        {
            new Skill { Name = "Welding" },
            new Skill { Name = "Electrical work" },
            new Skill { Name = "Assembly" }
        };

        var certificates = new[]
        {
            new Certificate { Name = "Hot work certification" },
            new Certificate { Name = "Working at heights" },
            new Certificate { Name = "Electrical certification" }
        };

        db.Users.AddRange(users);
        db.Skills.AddRange(skills);
        db.Certificates.AddRange(certificates);
        await db.SaveChangesAsync();

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
            Skills = [skills[0]],
            Certificates = [certificates[0], certificates[1]]
        };

        db.AvailabilityDeclarations.Add(supplierAvailability);
        await db.SaveChangesAsync();
    }
}
