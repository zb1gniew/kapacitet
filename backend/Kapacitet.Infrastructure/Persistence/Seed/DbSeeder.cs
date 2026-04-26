using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Infrastructure.Persistence.Seed;

public static class DevelopmentSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await ProductionSeeder.SeedAsync(db);
        await SeedDevAccountsAsync(db);

        if (await db.AvailabilityDeclarations.AnyAsync())
            return;

        var requesterCompany = await db.Companies.FirstAsync(c => c.Name == "Test Company A/S");
        var supplierCompany = await db.Companies.FirstAsync(c => c.Name == "Nordic Capacity Partners");
        var partnerCompany = await db.Companies.FirstAsync(c => c.Name == "Southern Field Services");

        var now = DateTime.UtcNow;
        var today = now.Date;

        var weldingSkill = await db.Skills.FirstAsync(s => s.Code == "welding");
        var scaffoldingSkill = await db.Skills.FirstAsync(s => s.Code == "scaffolding");
        var cablePullingSkill = await db.Skills.FirstAsync(s => s.Code == "cable-pulling");
        var hotWorkCertificate = await db.Certificates.FirstAsync(c => c.Code == "hot-work");
        var workingAtHeightsCertificate = await db.Certificates.FirstAsync(c => c.Code == "working-at-heights");
        var scaffoldUserCertificate = await db.Certificates.FirstAsync(c => c.Code == "scaffold-user");
        var lowVoltageSafetyCertificate = await db.Certificates.FirstAsync(c => c.Code == "low-voltage-safety");

        var supplierAvailability = new AvailabilityDeclaration
        {
            CompanyId = supplierCompany.Id,
            ResourceType = ResourceType.Worker,
            StartDate = today.AddDays(7),
            EndDate = today.AddDays(30),
            LocationCity = "Sonderborg",
            LocationRadiusKm = 50,
            Quantity = 3,
            Status = ListingStatus.Active,
            CreatedAt = now.AddDays(-3),
            PublishedAt = now.AddDays(-3),
            Skills = [weldingSkill],
            Certificates = [hotWorkCertificate, workingAtHeightsCertificate]
        };

        var supplierElectricalAvailability = new AvailabilityDeclaration
        {
            CompanyId = supplierCompany.Id,
            ResourceType = ResourceType.Worker,
            StartDate = today.AddDays(10),
            EndDate = today.AddDays(35),
            LocationCity = "Odense",
            LocationRadiusKm = 60,
            Quantity = 4,
            Status = ListingStatus.Active,
            CreatedAt = now.AddDays(-6),
            PublishedAt = now.AddDays(-6),
            Skills = [cablePullingSkill],
            Certificates = [lowVoltageSafetyCertificate]
        };

        var partnerAvailability = new AvailabilityDeclaration
        {
            CompanyId = partnerCompany.Id,
            ResourceType = ResourceType.Worker,
            StartDate = today.AddDays(12),
            EndDate = today.AddDays(40),
            LocationCity = "Esbjerg",
            LocationRadiusKm = 80,
            Quantity = 6,
            Status = ListingStatus.Active,
            CreatedAt = now.AddDays(-8),
            PublishedAt = now.AddDays(-8),
            Skills = [scaffoldingSkill],
            Certificates = [scaffoldUserCertificate]
        };

        var openCapacityRequest = new CapacityRequest
        {
            CompanyId = requesterCompany.Id,
            ResourceType = ResourceType.Worker,
            StartDate = today.AddDays(7),
            EndDate = today.AddDays(30),
            LocationCity = "Sonderborg",
            LocationRadiusKm = 50,
            Quantity = 2,
            Status = ListingStatus.Active,
            CreatedAt = now.AddDays(-1),
            PublishedAt = now.AddDays(-1),
            Urgency = UrgencyLevel.Medium,
            Skills = [weldingSkill],
            Certificates = [hotWorkCertificate]
        };

        var agreementCapacityRequest = new CapacityRequest
        {
            CompanyId = requesterCompany.Id,
            ResourceType = ResourceType.Worker,
            StartDate = today.AddDays(14),
            EndDate = today.AddDays(28),
            LocationCity = "Esbjerg",
            LocationRadiusKm = 75,
            Quantity = 3,
            Status = ListingStatus.Active,
            CreatedAt = now.AddDays(-5),
            PublishedAt = now.AddDays(-5),
            Urgency = UrgencyLevel.Low,
            Skills = [scaffoldingSkill],
            Certificates = [scaffoldUserCertificate]
        };

        db.AvailabilityDeclarations.AddRange(
            supplierAvailability,
            supplierElectricalAvailability,
            partnerAvailability);
        db.CapacityRequests.AddRange(openCapacityRequest, agreementCapacityRequest);
        await db.SaveChangesAsync();

        var openMatchOffer = new MatchOffer
        {
            RequestId = openCapacityRequest.Id,
            AvailabilityId = supplierAvailability.Id,
            OfferedQuantity = 2,
            MatchScore = 94,
            SkillScore = 100,
            CertificateScore = 100,
            DateScore = 95,
            LocationScore = 95,
            QuantityScore = 80,
            MatchedSkillCount = 1,
            RequiredSkillCount = 1,
            MatchedCertificateCount = 1,
            RequiredCertificateCount = 1,
            CoversFullPeriod = true,
            IsPartial = false,
            Explanation = "Strong overlap in skills, safety certifications, time window, and travel radius.",
            Status = MatchStatus.PendingRequesterReview,
            CreatedAt = now.AddHours(-18),
            ExpiresAt = now.AddDays(6)
        };

        var agreementMatchOffer = new MatchOffer
        {
            RequestId = agreementCapacityRequest.Id,
            AvailabilityId = partnerAvailability.Id,
            OfferedQuantity = 2,
            MatchScore = 89,
            SkillScore = 100,
            CertificateScore = 100,
            DateScore = 88,
            LocationScore = 84,
            QuantityScore = 75,
            MatchedSkillCount = 1,
            RequiredSkillCount = 1,
            MatchedCertificateCount = 1,
            RequiredCertificateCount = 1,
            CoversFullPeriod = true,
            IsPartial = true,
            Explanation = "Partner availability covers the requested scaffold work and required certification with enough partial capacity to proceed.",
            Status = MatchStatus.AgreementCreated,
            CreatedAt = now.AddDays(-4),
            ExpiresAt = now.AddDays(3),
            RequesterReviewedAt = now.AddDays(-4).AddHours(2),
            SupplierReviewedAt = now.AddDays(-4).AddHours(5)
        };

        db.MatchOffers.AddRange(openMatchOffer, agreementMatchOffer);
        await db.SaveChangesAsync();

        db.CooperationAgreements.Add(new CooperationAgreement
        {
            MatchOfferId = agreementMatchOffer.Id,
            RequestId = agreementCapacityRequest.Id,
            AvailabilityId = partnerAvailability.Id,
            SupplierCompanyId = partnerCompany.Id,
            RequesterCompanyId = requesterCompany.Id,
            StartDate = agreementCapacityRequest.StartDate,
            EndDate = agreementCapacityRequest.EndDate,
            Quantity = 2,
            Status = AgreementStatus.Active,
            CreatedAt = now.AddDays(-4),
            ConfirmedAt = now.AddDays(-4).AddHours(5)
        });

        await db.SaveChangesAsync();
    }

    private static async Task SeedDevAccountsAsync(AppDbContext db)
    {
        var now = DateTime.UtcNow;

        var requesterCompany = await ProductionSeeder.EnsureCompanyAsync(db, "Test Company A/S", "Construction", "Sonderborg", "+45 70 11 22 33", now);
        var supplierCompany = await ProductionSeeder.EnsureCompanyAsync(db, "Nordic Capacity Partners", "Construction", "Sonderborg", "+45 70 44 55 66", now);
        var partnerCompany = await ProductionSeeder.EnsureCompanyAsync(db, "Southern Field Services", "Industrial services", "Esbjerg", "+45 70 77 88 99", now);

        await ProductionSeeder.EnsureUserAsync(db, requesterCompany, "testuser@kapacitet.net", UserRole.Admin, now);
        await ProductionSeeder.EnsureUserAsync(db, requesterCompany, "request.manager@kapacitet.net", UserRole.Manager, now);
        await ProductionSeeder.EnsureUserAsync(db, requesterCompany, "request.viewer@kapacitet.net", UserRole.Viewer, now);
        await ProductionSeeder.EnsureUserAsync(db, supplierCompany, "supplier@kapacitet.net", UserRole.Admin, now);
        await ProductionSeeder.EnsureUserAsync(db, supplierCompany, "supplier.manager@kapacitet.net", UserRole.Manager, now);
        await ProductionSeeder.EnsureUserAsync(db, supplierCompany, "supplier.viewer@kapacitet.net", UserRole.Viewer, now);
        await ProductionSeeder.EnsureUserAsync(db, partnerCompany, "partner.admin@kapacitet.net", UserRole.Admin, now);
        await ProductionSeeder.EnsureUserAsync(db, partnerCompany, "partner.manager@kapacitet.net", UserRole.Manager, now);
        await ProductionSeeder.EnsureUserAsync(db, partnerCompany, "partner.viewer@kapacitet.net", UserRole.Viewer, now);
    }
}
