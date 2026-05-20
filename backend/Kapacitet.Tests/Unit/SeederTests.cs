using FluentAssertions;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence.Seed;
using Kapacitet.Tests.Helpers;

namespace Kapacitet.Tests.Unit;

public class SeederTests
{
    [Fact]
    public async Task ProductionSeeder_UpdatesExistingPlatformAdminCompanyToCurrentModel()
    {
        var db = TestDbFactory.Create();
        var staleCompany = new Company
        {
            Id = 1,
            Name = "Kapacitet Platform Operations",
            Cvr = null,
            Categories = [],
            Industry = "Legacy industry",
            DefaultLocation = "Aalborg",
            ContactPhone = null,
            Status = CompanyStatus.Inactive,
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };
        db.Companies.Add(staleCompany);
        db.Users.Add(new User
        {
            Id = 1,
            CompanyId = staleCompany.Id,
            Email = "platform-admin@kapacitet.net",
            Role = UserRole.Viewer,
            CreatedAt = DateTime.UtcNow.AddDays(-10),
            OnboardingCompletedAt = null
        });
        await db.SaveChangesAsync();

        await ProductionSeeder.SeedAsync(db);

        var company = db.Companies.Single(c => c.Name == "Kapacitet Platform Operations");
        company.Cvr.Should().Be("00000001");
        company.Categories.Should().BeEquivalentTo(["facility_services", "logistics"]);
        company.Industry.Should().Be("Platform services");
        company.DefaultLocation.Should().Be("Copenhagen");
        company.ContactPhone.Should().Be("+45 70 20 30 40");
        company.Status.Should().Be(CompanyStatus.Active);

        db.CompanySettings.Should().ContainSingle(s => s.CompanyId == company.Id);
        db.NotificationPreferences.Should().ContainSingle(p => p.CompanyId == company.Id);

        var adminUser = db.Users.Single(u => u.Email == "platform-admin@kapacitet.net");
        adminUser.CompanyId.Should().Be(company.Id);
        adminUser.Role.Should().Be(UserRole.Admin);
        adminUser.OnboardingCompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task DevelopmentSeeder_NormalizesDemoCompaniesAndUsersToCurrentModel()
    {
        var db = TestDbFactory.Create();

        await SeedLegacyDemoUsersAsync(
            db,
            "Test Company A/S",
            "testuser@kapacitet.net",
            "request.manager@kapacitet.net",
            "request.viewer@kapacitet.net");
        await SeedLegacyDemoUsersAsync(
            db,
            "Nordic Capacity Partners",
            "supplier@kapacitet.net",
            "supplier.manager@kapacitet.net",
            "supplier.viewer@kapacitet.net");
        await SeedLegacyDemoUsersAsync(
            db,
            "Southern Field Services",
            "partner.admin@kapacitet.net",
            "partner.manager@kapacitet.net",
            "partner.viewer@kapacitet.net");

        await DevelopmentSeeder.SeedAsync(db);

        AssertDemoCompany(
            db,
            "Test Company A/S",
            "00000002",
            ["construction", "metal_work"],
            "Sonderborg",
            "+45 70 11 22 33",
            [
                ("testuser@kapacitet.net", UserRole.Admin),
                ("request.manager@kapacitet.net", UserRole.Manager),
                ("request.viewer@kapacitet.net", UserRole.Viewer)
            ]);
        AssertDemoCompany(
            db,
            "Nordic Capacity Partners",
            "00000003",
            ["electrical", "construction"],
            "Sonderborg",
            "+45 70 44 55 66",
            [
                ("supplier@kapacitet.net", UserRole.Admin),
                ("supplier.manager@kapacitet.net", UserRole.Manager),
                ("supplier.viewer@kapacitet.net", UserRole.Viewer)
            ]);
        AssertDemoCompany(
            db,
            "Southern Field Services",
            "00000004",
            ["scaffolding", "facility_services"],
            "Esbjerg",
            "+45 70 77 88 99",
            [
                ("partner.admin@kapacitet.net", UserRole.Admin),
                ("partner.manager@kapacitet.net", UserRole.Manager),
                ("partner.viewer@kapacitet.net", UserRole.Viewer)
            ]);
    }

    [Fact]
    public async Task ProductionSeeder_BackfillsProvisionedCompaniesFromApprovedRequests_AndCreatesDefaults()
    {
        var db = TestDbFactory.Create();
        var company = new Company
        {
            Id = 200,
            Name = "Legacy Provisioned Co",
            Cvr = null,
            Categories = [],
            Industry = null,
            DefaultLocation = "Aarhus",
            ContactPhone = null,
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow.AddDays(-5)
        };
        db.Companies.Add(company);
        db.AccessRequests.Add(new AccessRequest
        {
            Id = 300,
            Name = "Legacy Provisioned Co",
            Cvr = "87654321",
            Categories = ["construction", "electrical"],
            Industry = "Engineering",
            Location = "Odense",
            ContactEmail = "legacy@example.com",
            ContactPhone = "+4512345678",
            Status = AccessRequestStatus.Approved,
            ProvisionedCompanyId = company.Id,
            CreatedAt = DateTime.UtcNow.AddDays(-4),
            ReviewedAt = DateTime.UtcNow.AddDays(-3)
        });
        await db.SaveChangesAsync();

        await ProductionSeeder.SeedAsync(db);

        var savedCompany = db.Companies.Single(c => c.Id == company.Id);
        savedCompany.Cvr.Should().Be("87654321");
        savedCompany.Categories.Should().BeEquivalentTo(["construction", "electrical"]);
        savedCompany.Industry.Should().Be("Engineering");
        savedCompany.DefaultLocation.Should().Be("Aarhus");
        savedCompany.ContactPhone.Should().Be("+4512345678");

        db.CompanySettings.Should().ContainSingle(s => s.CompanyId == company.Id);
        db.NotificationPreferences.Should().ContainSingle(p => p.CompanyId == company.Id);
    }

    private static async Task SeedLegacyDemoUsersAsync(
        Kapacitet.Infrastructure.Persistence.AppDbContext db,
        string companyName,
        string adminEmail,
        string managerEmail,
        string viewerEmail)
    {
        var company = new Company
        {
            Name = companyName,
            Industry = "Legacy industry",
            DefaultLocation = "Aalborg",
            Status = CompanyStatus.Inactive,
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };
        db.Companies.Add(company);
        await db.SaveChangesAsync();

        db.Users.AddRange(
            new User
            {
                CompanyId = company.Id,
                Email = adminEmail,
                Role = UserRole.Viewer,
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new User
            {
                CompanyId = company.Id,
                Email = managerEmail,
                Role = UserRole.Viewer,
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new User
            {
                CompanyId = company.Id,
                Email = viewerEmail,
                Role = UserRole.Viewer,
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            });
        await db.SaveChangesAsync();
    }

    private static void AssertDemoCompany(
        Kapacitet.Infrastructure.Persistence.AppDbContext db,
        string companyName,
        string cvr,
        string[] categories,
        string location,
        string phone,
        (string Email, UserRole Role)[] expectedUsers)
    {
        var company = db.Companies.Single(c => c.Name == companyName);
        company.Cvr.Should().Be(cvr);
        company.Categories.Should().BeEquivalentTo(categories);
        company.DefaultLocation.Should().Be(location);
        company.ContactPhone.Should().Be(phone);
        company.Status.Should().Be(CompanyStatus.Active);

        db.CompanySettings.Should().ContainSingle(s => s.CompanyId == company.Id);
        db.NotificationPreferences.Should().ContainSingle(p => p.CompanyId == company.Id);

        foreach (var (email, role) in expectedUsers)
        {
            var user = db.Users.Single(u => u.Email == email);
            user.CompanyId.Should().Be(company.Id);
            user.Role.Should().Be(role);
            user.OnboardingCompletedAt.Should().NotBeNull();
        }
    }
}
