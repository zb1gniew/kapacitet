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

        var company = new Company
        {
            Name = "Test Company",
            Industry = "Construction",
            DefaultLocation = "Warsaw",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        db.Companies.Add(company);
        await db.SaveChangesAsync();

        var user = new User
        {
            CompanyId = company.Id,
            Email = "testuser@kapacitet.net",
            Role = UserRole.Admin,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
    }
}