using Kapacitet.Application.Features.Matching.DTOs;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;

namespace Kapacitet.Application.Features.Matching.Services;

internal static class MatchOfferMapper
{
    public static MatchOfferDto MapToDto(MatchOffer offer, int companyId)
    {
        var requesterPerspective = offer.Request.CompanyId == companyId;
        var agreementCreated = offer.CooperationAgreement is not null || offer.Status == MatchStatus.AgreementCreated;
        var partnerCompany = requesterPerspective ? offer.Availability.Company : offer.Request.Company;

        return new MatchOfferDto
        {
            Id = offer.Id,
            RequestId = offer.RequestId,
            AvailabilityId = offer.AvailabilityId,
            Perspective = requesterPerspective ? "Requester" : "Supplier",
            Status = offer.Status,
            OfferedQuantity = offer.OfferedQuantity,
            RequestQuantity = offer.Request.Quantity,
            AvailabilityQuantity = offer.Availability.Quantity,
            MatchScore = offer.MatchScore,
            SkillScore = offer.SkillScore,
            CertificateScore = offer.CertificateScore,
            DateScore = offer.DateScore,
            LocationScore = offer.LocationScore,
            QuantityScore = offer.QuantityScore,
            CoversFullPeriod = offer.CoversFullPeriod,
            IsPartial = offer.IsPartial,
            LocationCity = offer.Request.LocationCity,
            RequestLocationCity = offer.Request.LocationCity,
            RequestLocationRadiusKm = offer.Request.LocationRadiusKm,
            AvailabilityLocationCity = offer.Availability.LocationCity,
            AvailabilityLocationRadiusKm = offer.Availability.LocationRadiusKm,
            RequestUrgency = offer.Request.Urgency,
            RequestStartDate = offer.Request.StartDate,
            RequestEndDate = offer.Request.EndDate,
            AvailabilityStartDate = offer.Availability.StartDate,
            AvailabilityEndDate = offer.Availability.EndDate,
            CreatedAt = offer.CreatedAt,
            ExpiresAt = offer.ExpiresAt,
            Explanation = offer.Explanation,
            PartnerCompanyId = agreementCreated ? partnerCompany.Id : null,
            PartnerCompanyName = agreementCreated ? partnerCompany.Name : null,
            Skills = offer.Request.Skills.Select(s => s.Name).ToList(),
            Certificates = offer.Request.Certificates.Select(c => c.Name).ToList()
        };
    }

    public static AgreementDto MapAgreementToDto(CooperationAgreement agreement, int companyId)
    {
        var partnerCompany = agreement.SupplierCompanyId == companyId
            ? agreement.RequesterCompany
            : agreement.SupplierCompany;
        var partnerContactEmail = partnerCompany.Users
            .OrderBy(user => user.CreatedAt)
            .Select(user => user.Email)
            .FirstOrDefault();

        return new AgreementDto
        {
            Id = agreement.Id,
            MatchOfferId = agreement.MatchOfferId,
            RequestId = agreement.RequestId,
            AvailabilityId = agreement.AvailabilityId,
            PartnerCompanyId = partnerCompany.Id,
            PartnerCompanyName = partnerCompany.Name,
            PartnerCvr = partnerCompany.Cvr,
            PartnerContactPhone = partnerCompany.ContactPhone,
            PartnerContactEmail = partnerContactEmail,
            SupplierCompanyId = agreement.SupplierCompanyId,
            SupplierCompanyName = agreement.SupplierCompany.Name,
            RequesterCompanyId = agreement.RequesterCompanyId,
            RequesterCompanyName = agreement.RequesterCompany.Name,
            StartDate = agreement.StartDate,
            EndDate = agreement.EndDate,
            Quantity = agreement.Quantity,
            Status = agreement.Status,
            CreatedAt = agreement.CreatedAt,
            ConfirmedAt = agreement.ConfirmedAt
        };
    }
}
