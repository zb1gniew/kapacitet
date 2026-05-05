using FluentAssertions;
using Kapacitet.Application.Features.Matching.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;

namespace Kapacitet.Tests.Unit;

public class MatchOfferMapperTests
{
    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Company MakeCompany(int id, string name = "Company") => new()
    {
        Id = id,
        Name = name,
        DefaultLocation = "Aarhus",
        Status = CompanyStatus.Active,
        CreatedAt = DateTime.UtcNow,
        Users = []
    };

    private static CapacityRequest MakeRequest(int id, int companyId, Company company) => new()
    {
        Id = id,
        CompanyId = companyId,
        Company = company,
        ResourceType = ResourceType.Worker,
        Quantity = 10,
        StartDate = new DateTime(2027, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        EndDate = new DateTime(2027, 1, 31, 0, 0, 0, DateTimeKind.Utc),
        LocationCity = "Aarhus",
        LocationRadiusKm = 50,
        Status = ListingStatus.Active,
        Urgency = UrgencyLevel.Medium,
        CreatedAt = DateTime.UtcNow,
        Skills = [],
        Certificates = []
    };

    private static AvailabilityDeclaration MakeAvailability(int id, int companyId, Company company) => new()
    {
        Id = id,
        CompanyId = companyId,
        Company = company,
        ResourceType = ResourceType.Worker,
        Quantity = 5,
        StartDate = new DateTime(2027, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        EndDate = new DateTime(2027, 1, 31, 0, 0, 0, DateTimeKind.Utc),
        LocationCity = "Copenhagen",
        LocationRadiusKm = 30,
        Status = ListingStatus.Active,
        CreatedAt = DateTime.UtcNow,
        Skills = [],
        Certificates = []
    };

    private static MatchOffer MakeOffer(
        CapacityRequest request,
        AvailabilityDeclaration availability,
        MatchStatus status = MatchStatus.PendingRequesterReview,
        CooperationAgreement? agreement = null) => new()
    {
        Id = 1,
        RequestId = request.Id,
        AvailabilityId = availability.Id,
        Request = request,
        Availability = availability,
        CooperationAgreement = agreement,
        Status = status,
        OfferedQuantity = 5,
        MatchScore = 85,
        SkillScore = 90,
        CertificateScore = 80,
        DateScore = 95,
        LocationScore = 70,
        QuantityScore = 75,
        CoversFullPeriod = true,
        IsPartial = false,
        Explanation = "Test offer",
        CreatedAt = DateTime.UtcNow,
        ExpiresAt = DateTime.UtcNow.AddDays(7)
    };

    // ── MapToDto: perspective ────────────────────────────────────────────────

    [Fact]
    public void MapToDto_WhenCompanyIdMatchesRequest_SetsRequesterPerspective()
    {
        var requesterCompany = MakeCompany(1, "Requester");
        var supplierCompany = MakeCompany(2, "Supplier");
        var request = MakeRequest(10, 1, requesterCompany);
        var avail = MakeAvailability(20, 2, supplierCompany);
        var offer = MakeOffer(request, avail);

        var dto = MatchOfferMapper.MapToDto(offer, companyId: 1);

        dto.Perspective.Should().Be("Requester");
    }

    [Fact]
    public void MapToDto_WhenCompanyIdMatchesAvailability_SetsSupplierPerspective()
    {
        var requesterCompany = MakeCompany(1, "Requester");
        var supplierCompany = MakeCompany(2, "Supplier");
        var request = MakeRequest(10, 1, requesterCompany);
        var avail = MakeAvailability(20, 2, supplierCompany);
        var offer = MakeOffer(request, avail);

        var dto = MatchOfferMapper.MapToDto(offer, companyId: 2);

        dto.Perspective.Should().Be("Supplier");
    }

    // ── MapToDto: partner fields when agreement present ──────────────────────

    [Fact]
    public void MapToDto_WhenAgreementPresent_RequesterSeesSupplierAsPartner()
    {
        var requesterCompany = MakeCompany(1, "Requester Co");
        var supplierCompany = MakeCompany(2, "Supplier Co");
        var request = MakeRequest(10, 1, requesterCompany);
        var avail = MakeAvailability(20, 2, supplierCompany);
        var agreement = new CooperationAgreement
        {
            Id = 1,
            MatchOfferId = 1,
            RequestId = 10,
            AvailabilityId = 20,
            SupplierCompanyId = 2,
            RequesterCompanyId = 1,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Quantity = 5,
            Status = AgreementStatus.Active,
            CreatedAt = DateTime.UtcNow,
            ConfirmedAt = DateTime.UtcNow,
            SupplierCompany = supplierCompany,
            RequesterCompany = requesterCompany
        };
        var offer = MakeOffer(request, avail, MatchStatus.AgreementCreated, agreement);

        var dto = MatchOfferMapper.MapToDto(offer, companyId: 1);

        dto.PartnerCompanyId.Should().Be(2);
        dto.PartnerCompanyName.Should().Be("Supplier Co");
    }

    [Fact]
    public void MapToDto_WhenAgreementPresent_SupplierSeesRequesterAsPartner()
    {
        var requesterCompany = MakeCompany(1, "Requester Co");
        var supplierCompany = MakeCompany(2, "Supplier Co");
        var request = MakeRequest(10, 1, requesterCompany);
        var avail = MakeAvailability(20, 2, supplierCompany);
        var agreement = new CooperationAgreement
        {
            Id = 1,
            MatchOfferId = 1,
            RequestId = 10,
            AvailabilityId = 20,
            SupplierCompanyId = 2,
            RequesterCompanyId = 1,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Quantity = 5,
            Status = AgreementStatus.Active,
            CreatedAt = DateTime.UtcNow,
            ConfirmedAt = DateTime.UtcNow,
            SupplierCompany = supplierCompany,
            RequesterCompany = requesterCompany
        };
        var offer = MakeOffer(request, avail, MatchStatus.AgreementCreated, agreement);

        var dto = MatchOfferMapper.MapToDto(offer, companyId: 2);

        dto.PartnerCompanyId.Should().Be(1);
        dto.PartnerCompanyName.Should().Be("Requester Co");
    }

    // ── MapToDto: partner fields when no agreement ───────────────────────────

    [Fact]
    public void MapToDto_WhenNoAgreementAndStatusPending_PartnerFieldsAreNull()
    {
        var requesterCompany = MakeCompany(1, "Requester");
        var supplierCompany = MakeCompany(2, "Supplier");
        var request = MakeRequest(10, 1, requesterCompany);
        var avail = MakeAvailability(20, 2, supplierCompany);
        var offer = MakeOffer(request, avail, MatchStatus.PendingRequesterReview);

        var dto = MatchOfferMapper.MapToDto(offer, companyId: 1);

        dto.PartnerCompanyId.Should().BeNull();
        dto.PartnerCompanyName.Should().BeNull();
    }

    [Fact]
    public void MapToDto_WhenStatusIsAgreementCreatedButNoAgreementObject_PartnerFieldsPopulated()
    {
        var requesterCompany = MakeCompany(1, "Requester");
        var supplierCompany = MakeCompany(2, "Supplier");
        var request = MakeRequest(10, 1, requesterCompany);
        var avail = MakeAvailability(20, 2, supplierCompany);
        // Status == AgreementCreated but no agreement navigation property
        var offer = MakeOffer(request, avail, MatchStatus.AgreementCreated, agreement: null);

        var dto = MatchOfferMapper.MapToDto(offer, companyId: 1);

        // requester perspective → partner is supplier
        dto.PartnerCompanyId.Should().Be(2);
        dto.PartnerCompanyName.Should().Be("Supplier");
    }

    // ── MapToDto: skills and certificates ───────────────────────────────────

    [Fact]
    public void MapToDto_MapsSkillsAndCertificatesFromRequest()
    {
        var requesterCompany = MakeCompany(1, "Requester");
        var supplierCompany = MakeCompany(2, "Supplier");
        var request = MakeRequest(10, 1, requesterCompany);
        request.Skills = [new Skill { Id = 1, Name = "Welding" }, new Skill { Id = 2, Name = "Forklift" }];
        request.Certificates = [new Certificate { Id = 1, Name = "ISO-9001" }];
        var avail = MakeAvailability(20, 2, supplierCompany);
        var offer = MakeOffer(request, avail);

        var dto = MatchOfferMapper.MapToDto(offer, companyId: 1);

        dto.Skills.Should().BeEquivalentTo(["Welding", "Forklift"]);
        dto.Certificates.Should().BeEquivalentTo(["ISO-9001"]);
    }

    // ── MapToDto: score passthrough ──────────────────────────────────────────

    [Fact]
    public void MapToDto_PassesThroughAllScoreFields()
    {
        var requesterCompany = MakeCompany(1, "Requester");
        var supplierCompany = MakeCompany(2, "Supplier");
        var request = MakeRequest(10, 1, requesterCompany);
        var avail = MakeAvailability(20, 2, supplierCompany);
        var offer = MakeOffer(request, avail);
        offer.MatchScore = 85;
        offer.SkillScore = 90;
        offer.CertificateScore = 80;
        offer.DateScore = 95;
        offer.LocationScore = 70;
        offer.QuantityScore = 75;

        var dto = MatchOfferMapper.MapToDto(offer, companyId: 1);

        dto.MatchScore.Should().Be(85);
        dto.SkillScore.Should().Be(90);
        dto.CertificateScore.Should().Be(80);
        dto.DateScore.Should().Be(95);
        dto.LocationScore.Should().Be(70);
        dto.QuantityScore.Should().Be(75);
    }

    // ── MapAgreementToDto: partner selection ─────────────────────────────────

    [Fact]
    public void MapAgreementToDto_WhenCallerIsSupplier_PartnerIsRequester()
    {
        var requesterCompany = MakeCompany(1, "Requester Co");
        var supplierCompany = MakeCompany(2, "Supplier Co");
        var agreement = MakeAgreement(requesterCompany, supplierCompany);

        var dto = MatchOfferMapper.MapAgreementToDto(agreement, companyId: 2);

        dto.PartnerCompanyId.Should().Be(1);
        dto.PartnerCompanyName.Should().Be("Requester Co");
    }

    [Fact]
    public void MapAgreementToDto_WhenCallerIsRequester_PartnerIsSupplier()
    {
        var requesterCompany = MakeCompany(1, "Requester Co");
        var supplierCompany = MakeCompany(2, "Supplier Co");
        var agreement = MakeAgreement(requesterCompany, supplierCompany);

        var dto = MatchOfferMapper.MapAgreementToDto(agreement, companyId: 1);

        dto.PartnerCompanyId.Should().Be(2);
        dto.PartnerCompanyName.Should().Be("Supplier Co");
    }

    // ── MapAgreementToDto: partner contact email ─────────────────────────────

    [Fact]
    public void MapAgreementToDto_PartnerContactEmail_PicksEarliestCreatedUser()
    {
        var requesterCompany = MakeCompany(1, "Requester Co");
        var supplierCompany = MakeCompany(2, "Supplier Co");
        var baseTime = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        requesterCompany.Users = [
            new User { Id = 10, CompanyId = 1, Email = "later@example.com", Role = UserRole.Admin, CreatedAt = baseTime.AddHours(5) },
            new User { Id = 11, CompanyId = 1, Email = "first@example.com", Role = UserRole.Admin, CreatedAt = baseTime }
        ];
        var agreement = MakeAgreement(requesterCompany, supplierCompany);

        // Caller is supplier → partner is requester
        var dto = MatchOfferMapper.MapAgreementToDto(agreement, companyId: 2);

        dto.PartnerContactEmail.Should().Be("first@example.com");
    }

    [Fact]
    public void MapAgreementToDto_PartnerContactEmail_IsNullWhenPartnerHasNoUsers()
    {
        var requesterCompany = MakeCompany(1, "Requester Co");
        requesterCompany.Users = [];
        var supplierCompany = MakeCompany(2, "Supplier Co");
        var agreement = MakeAgreement(requesterCompany, supplierCompany);

        // Caller is supplier → partner is requester (no users)
        var dto = MatchOfferMapper.MapAgreementToDto(agreement, companyId: 2);

        dto.PartnerContactEmail.Should().BeNull();
    }

    // ── Private helper ────────────────────────────────────────────────────────

    private static CooperationAgreement MakeAgreement(Company requesterCompany, Company supplierCompany) => new()
    {
        Id = 1,
        MatchOfferId = 1,
        RequestId = 10,
        AvailabilityId = 20,
        SupplierCompanyId = supplierCompany.Id,
        RequesterCompanyId = requesterCompany.Id,
        SupplierCompany = supplierCompany,
        RequesterCompany = requesterCompany,
        StartDate = new DateTime(2027, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        EndDate = new DateTime(2027, 1, 31, 0, 0, 0, DateTimeKind.Utc),
        Quantity = 5,
        Status = AgreementStatus.Active,
        CreatedAt = DateTime.UtcNow,
        ConfirmedAt = DateTime.UtcNow
    };
}
