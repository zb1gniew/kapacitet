using FluentAssertions;
using Kapacitet.Application.Features.Matching.DTOs;
using Kapacitet.Application.Features.Matching.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Tests.Helpers;

namespace Kapacitet.Tests.Unit;

public class WorkflowHintsServiceTests
{
    [Fact]
    public async Task GetRequestHintsAsync_WhenRadiusUrgencyAndQuantityLimitMatches_AddsHelpfulHints()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();

        var skill = new Skill { Name = "Carpentry" };
        db.Skills.Add(skill);

        var requester = AddCompany(db, "Requester");
        AddAvailability(
            db,
            "Exact match supplier",
            "Aarhus",
            quantity: 1,
            skills: [skill],
            startDate: DateTime.UtcNow.Date.AddDays(5),
            endDate: DateTime.UtcNow.Date.AddDays(15));
        AddAvailability(
            db,
            "Nearby supplier",
            "Horsens",
            quantity: 1,
            radiusKm: 10,
            skills: [skill],
            startDate: DateTime.UtcNow.Date.AddDays(5),
            endDate: DateTime.UtcNow.Date.AddDays(15));

        await db.SaveChangesAsync();

        var service = new WorkflowHintsService(db);
        var result = await service.GetRequestHintsAsync(requester.Id, new WorkflowHintsRequest
        {
            SkillIds = [skill.Id],
            LocationCity = "Aarhus",
            LocationRadiusKm = 10,
            Quantity = 3,
            Urgency = "normal",
            StartDate = DateTime.UtcNow.Date.AddDays(5),
            EndDate = DateTime.UtcNow.Date.AddDays(15)
        });

        result.EstimatedMatchCount.Should().Be(1);
        result.Hints.Should().Contain(h => h.Id == "radius");
        result.Hints.Should().Contain(h => h.Id == "urgency");
        result.Hints.Should().Contain(h => h.Id == "quantity");
        result.Hints.Should().Contain(h => h.Id == "match-count");
    }

    [Fact]
    public async Task GetRequestHintsAsync_WhenCertificateRequirementIsBottleneck_AddsCertificateHints()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();

        var skill = new Skill { Name = "Welding" };
        var certA = new Certificate { Name = "Forklift" };
        var certB = new Certificate { Name = "Scaffolding" };
        db.AddRange(skill, certA, certB);

        var requester = AddCompany(db, "Requester");
        AddAvailability(
            db,
            "Certified supplier",
            "Aarhus",
            quantity: 2,
            skills: [skill],
            certificates: [certA]);
        AddAvailability(
            db,
            "Uncertified supplier",
            "Aarhus",
            quantity: 2,
            skills: [skill]);

        await db.SaveChangesAsync();

        var service = new WorkflowHintsService(db);
        var result = await service.GetRequestHintsAsync(requester.Id, new WorkflowHintsRequest
        {
            SkillIds = [skill.Id],
            CertificateIds = [certA.Id, certB.Id],
            LocationCity = "Aarhus",
            StartDate = new DateTime(2027, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 8, 31, 0, 0, 0, DateTimeKind.Utc)
        });

        result.EstimatedMatchCount.Should().Be(0);
        result.Hints.Should().Contain(h => h.Id == "cert-bottleneck" && h.Message.Contains(certB.Name));
        result.Hints.Should().Contain(h => h.Id == "cert-all");
        result.Hints.Should().Contain(h => h.Id == "no-matches");
    }

    [Fact]
    public async Task GetRequestHintsAsync_WhenOnlyPartialOverlapExists_AddsDatePartialHint()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();

        var skill = new Skill { Name = "Roofing" };
        db.Skills.Add(skill);

        var requester = AddCompany(db, "Requester");
        AddAvailability(
            db,
            "Partial overlap supplier",
            "Aarhus",
            quantity: 2,
            skills: [skill],
            startDate: new DateTime(2027, 8, 5, 0, 0, 0, DateTimeKind.Utc),
            endDate: new DateTime(2027, 8, 31, 0, 0, 0, DateTimeKind.Utc));

        await db.SaveChangesAsync();

        var service = new WorkflowHintsService(db);
        var result = await service.GetRequestHintsAsync(requester.Id, new WorkflowHintsRequest
        {
            SkillIds = [skill.Id],
            LocationCity = "Aarhus",
            StartDate = new DateTime(2027, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 8, 31, 0, 0, 0, DateTimeKind.Utc)
        });

        result.EstimatedMatchCount.Should().Be(0);
        result.Hints.Should().Contain(h => h.Id == "date-partial");
    }

    [Fact]
    public async Task GetAvailabilityHintsAsync_WhenMissingSkillAndCertificateBlockRequests_AddsOpportunityHints()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();

        var baselineSkill = new Skill { Name = "Painting" };
        var missingSkill = new Skill { Name = "Demolition" };
        var baselineCert = new Certificate { Name = "Lift license" };
        var missingCert = new Certificate { Name = "Safety course" };
        db.AddRange(baselineSkill, missingSkill, baselineCert, missingCert);

        var supplier = AddCompany(db, "Supplier");
        AddRequest(
            db,
            "Requester A",
            "Aarhus",
            quantity: 1,
            skills: [missingSkill],
            certificates: [missingCert],
            startDate: new DateTime(2027, 9, 2, 0, 0, 0, DateTimeKind.Utc),
            endDate: new DateTime(2027, 9, 10, 0, 0, 0, DateTimeKind.Utc));
        AddRequest(
            db,
            "Requester B",
            "Aarhus",
            quantity: 1,
            skills: [missingSkill],
            certificates: [missingCert],
            startDate: new DateTime(2027, 9, 3, 0, 0, 0, DateTimeKind.Utc),
            endDate: new DateTime(2027, 9, 11, 0, 0, 0, DateTimeKind.Utc));

        await db.SaveChangesAsync();

        var service = new WorkflowHintsService(db);
        var result = await service.GetAvailabilityHintsAsync(supplier.Id, new WorkflowHintsRequest
        {
            SkillIds = [baselineSkill.Id],
            CertificateIds = [baselineCert.Id],
            LocationCity = "Aarhus",
            StartDate = new DateTime(2027, 9, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 9, 30, 0, 0, 0, DateTimeKind.Utc),
            Quantity = 1
        });

        result.EstimatedMatchCount.Should().Be(0);
        result.Hints.Should().Contain(h => h.Id == "cert-opportunity" && h.Message.Contains(missingCert.Name));
        result.Hints.Should().Contain(h => h.Id == "skill-opportunity" && h.Message.Contains(missingSkill.Name));
    }

    [Fact]
    public async Task GetAvailabilityHintsAsync_WhenDateCoverageAndDemandCouldImprove_AddsCoverageAndQuantityHints()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();

        var skill = new Skill { Name = "Electrical" };
        var cert = new Certificate { Name = "High voltage" };
        db.AddRange(skill, cert);

        var supplier = AddCompany(db, "Supplier");
        AddRequest(
            db,
            "Full coverage requester",
            "Aarhus",
            quantity: 5,
            skills: [skill],
            certificates: [cert],
            startDate: new DateTime(2027, 10, 2, 0, 0, 0, DateTimeKind.Utc),
            endDate: new DateTime(2027, 10, 20, 0, 0, 0, DateTimeKind.Utc));
        AddRequest(
            db,
            "Near miss requester",
            "Aarhus",
            quantity: 1,
            skills: [skill],
            certificates: [cert],
            startDate: new DateTime(2027, 10, 5, 0, 0, 0, DateTimeKind.Utc),
            endDate: new DateTime(2027, 11, 5, 0, 0, 0, DateTimeKind.Utc));

        await db.SaveChangesAsync();

        var service = new WorkflowHintsService(db);
        var result = await service.GetAvailabilityHintsAsync(supplier.Id, new WorkflowHintsRequest
        {
            SkillIds = [skill.Id],
            CertificateIds = [cert.Id],
            LocationCity = "Aarhus",
            StartDate = new DateTime(2027, 10, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 10, 31, 0, 0, 0, DateTimeKind.Utc),
            Quantity = 2
        });

        result.EstimatedMatchCount.Should().Be(1);
        result.Hints.Should().Contain(h => h.Id == "date-coverage");
        result.Hints.Should().Contain(h => h.Id == "quantity-demand");
    }

    private static Company AddCompany(AppDbContext db, string name)
    {
        var company = new Company
        {
            Name = name,
            Industry = "Construction",
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        db.Companies.Add(company);
        return company;
    }

    private static AvailabilityDeclaration AddAvailability(
        AppDbContext db,
        string supplierName,
        string city,
        int quantity,
        List<Skill> skills,
        List<Certificate>? certificates = null,
        int radiusKm = 0,
        DateTime? startDate = null,
        DateTime? endDate = null)
    {
        var company = AddCompany(db, supplierName);
        var availability = new AvailabilityDeclaration
        {
            Company = company,
            ResourceType = ResourceType.Worker,
            StartDate = startDate ?? new DateTime(2027, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = endDate ?? new DateTime(2027, 8, 31, 0, 0, 0, DateTimeKind.Utc),
            LocationCity = city,
            LocationRadiusKm = radiusKm,
            Quantity = quantity,
            Status = ListingStatus.Active,
            CreatedAt = DateTime.UtcNow,
            Skills = skills,
            Certificates = certificates ?? []
        };

        db.AvailabilityDeclarations.Add(availability);
        return availability;
    }

    private static CapacityRequest AddRequest(
        AppDbContext db,
        string requesterName,
        string city,
        int quantity,
        List<Skill> skills,
        List<Certificate>? certificates = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int radiusKm = 0)
    {
        var company = AddCompany(db, requesterName);
        var request = new CapacityRequest
        {
            Company = company,
            ResourceType = ResourceType.Worker,
            StartDate = startDate ?? new DateTime(2027, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = endDate ?? new DateTime(2027, 8, 31, 0, 0, 0, DateTimeKind.Utc),
            LocationCity = city,
            LocationRadiusKm = radiusKm,
            Quantity = quantity,
            Status = ListingStatus.Active,
            Urgency = UrgencyLevel.Medium,
            CreatedAt = DateTime.UtcNow,
            Skills = skills,
            Certificates = certificates ?? []
        };

        db.CapacityRequests.Add(request);
        return request;
    }
}
