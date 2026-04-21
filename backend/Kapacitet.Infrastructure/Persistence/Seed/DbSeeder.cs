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

        var now = DateTime.UtcNow;
        var today = now.Date;

        var platformCompany = CreateCompany(
            "Kapacitet Platform Operations",
            "Platform services",
            "Copenhagen",
            now,
            "+45 70 20 30 40");
        var requesterCompany = CreateCompany(
            "Test Company A/S",
            "Construction",
            "Sonderborg",
            now,
            "+45 70 11 22 33");
        var supplierCompany = CreateCompany(
            "Nordic Capacity Partners",
            "Construction",
            "Sonderborg",
            now,
            "+45 70 44 55 66");
        var partnerCompany = CreateCompany(
            "Southern Field Services",
            "Industrial services",
            "Esbjerg",
            now,
            "+45 70 77 88 99");

        db.Companies.AddRange(
            platformCompany,
            requesterCompany,
            supplierCompany,
            partnerCompany);
        await db.SaveChangesAsync();

        db.CompanySettings.AddRange(
            CreateCompanySettings(platformCompany),
            CreateCompanySettings(requesterCompany),
            CreateCompanySettings(supplierCompany),
            CreateCompanySettings(partnerCompany));

        db.NotificationPreferences.AddRange(
            CreateNotificationPreferences(platformCompany),
            CreateNotificationPreferences(requesterCompany),
            CreateNotificationPreferences(supplierCompany),
            CreateNotificationPreferences(partnerCompany));

        db.Users.AddRange(
            CreateUser(platformCompany, "platform-admin@kapacitet.net", UserRole.Admin, now),
            CreateUser(requesterCompany, "testuser@kapacitet.net", UserRole.Admin, now),
            CreateUser(requesterCompany, "request.manager@kapacitet.net", UserRole.Manager, now),
            CreateUser(requesterCompany, "request.viewer@kapacitet.net", UserRole.Viewer, now),
            CreateUser(supplierCompany, "supplier@kapacitet.net", UserRole.Admin, now),
            CreateUser(supplierCompany, "supplier.manager@kapacitet.net", UserRole.Manager, now),
            CreateUser(supplierCompany, "supplier.viewer@kapacitet.net", UserRole.Viewer, now),
            CreateUser(partnerCompany, "partner.admin@kapacitet.net", UserRole.Admin, now),
            CreateUser(partnerCompany, "partner.manager@kapacitet.net", UserRole.Manager, now),
            CreateUser(partnerCompany, "partner.viewer@kapacitet.net", UserRole.Viewer, now));

        await db.SaveChangesAsync();

        var weldingSkill = await db.Skills.FirstAsync(skill => skill.Code == "welding");
        var scaffoldingSkill = await db.Skills.FirstAsync(skill => skill.Code == "scaffolding");
        var cablePullingSkill = await db.Skills.FirstAsync(skill => skill.Code == "cable-pulling");
        var hotWorkCertificate = await db.Certificates
            .FirstAsync(certificate => certificate.Code == "hot-work");
        var workingAtHeightsCertificate = await db.Certificates
            .FirstAsync(certificate => certificate.Code == "working-at-heights");
        var scaffoldUserCertificate = await db.Certificates
            .FirstAsync(certificate => certificate.Code == "scaffold-user");
        var lowVoltageSafetyCertificate = await db.Certificates
            .FirstAsync(certificate => certificate.Code == "low-voltage-safety");

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
            Certificates =
            [
                hotWorkCertificate,
                workingAtHeightsCertificate
            ]
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

    private static Company CreateCompany(
        string name,
        string industry,
        string defaultLocation,
        DateTime createdAt,
        string contactPhone)
    {
        return new Company
        {
            Name = name,
            Industry = industry,
            Categories = [],
            DefaultLocation = defaultLocation,
            ContactPhone = contactPhone,
            Status = CompanyStatus.Active,
            CreatedAt = createdAt
        };
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

    private static CompanySettings CreateCompanySettings(Company company)
    {
        return new CompanySettings
        {
            CompanyId = company.Id,
            ReceiveCapacityRequests = true,
            ParticipateInNetworkWide = true,
            AllowPartialMatches = true
        };
    }

    private static NotificationPreferences CreateNotificationPreferences(Company company)
    {
        return new NotificationPreferences
        {
            CompanyId = company.Id,
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
