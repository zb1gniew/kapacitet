using Kapacitet.Application.Features.Matching.DTOs;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.Matching.Services;

public class MatchingService
{
    private static readonly MatchStatus[] OpenStatuses =
    [
        MatchStatus.PendingRequesterReview,
        MatchStatus.PendingSupplierConfirmation
    ];

    private readonly AppDbContext _db;

    public MatchingService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<MatchOfferDto>> GenerateMatchesForRequestAsync(int requestId)
    {
        await ExpireStaleOffersAsync();

        var request = await _db.CapacityRequests
            .Include(r => r.Company)
            .Include(r => r.Skills)
            .Include(r => r.Certificates)
            .Include(r => r.MatchOffers)
            .FirstOrDefaultAsync(r => r.Id == requestId)
            ?? throw new KeyNotFoundException($"CapacityRequest {requestId} not found");

        if (request.Status != ListingStatus.Active || request.Company.Status != CompanyStatus.Active)
        {
            return [];
        }

        var requestRemainingQuantity = await GetRemainingRequestQuantityAsync(request.Id);
        if (requestRemainingQuantity <= 0)
        {
            await EnsureListingStatusConsistencyAsync(request);
            return [];
        }

        var candidates = await _db.AvailabilityDeclarations
            .Include(a => a.Company)
            .Include(a => a.Skills)
            .Include(a => a.Certificates)
            .Where(a =>
                a.Status == ListingStatus.Active &&
                a.Company.Status == CompanyStatus.Active &&
                a.CompanyId != request.CompanyId)
            .ToListAsync();

        var existingOffers = await _db.MatchOffers
            .Include(m => m.Request)
            .Include(m => m.Availability)
            .Where(m => m.RequestId == request.Id)
            .ToListAsync();

        var eligibleResults = new List<MatchEvaluation>();
        foreach (var availability in candidates)
        {
            var evaluation = await EvaluateAsync(request, availability, requestRemainingQuantity);
            if (evaluation is not null)
            {
                eligibleResults.Add(evaluation);
            }
        }

        foreach (var offer in existingOffers.Where(o => OpenStatuses.Contains(o.Status)))
        {
            if (eligibleResults.All(r => r.Availability.Id != offer.AvailabilityId))
            {
                offer.Status = MatchStatus.Withdrawn;
            }
        }

        foreach (var evaluation in eligibleResults.OrderByDescending(r => r.Score.TotalScore))
        {
            var existing = existingOffers.FirstOrDefault(o =>
                o.AvailabilityId == evaluation.Availability.Id &&
                OpenStatuses.Contains(o.Status));

            if (existing is null)
            {
                _db.MatchOffers.Add(CreateMatchOffer(request, evaluation));
                continue;
            }

            if (existing.Status == MatchStatus.PendingSupplierConfirmation)
            {
                continue;
            }

            ApplyEvaluation(existing, evaluation);
        }

        await UpsertEscalationAsync(request, eligibleResults.Count == 0);
        await _db.SaveChangesAsync();

        return await GetMatchesForRequestAsync(request.Id, request.CompanyId);
    }

    public async Task RefreshMatchesForAvailabilityAsync(int availabilityId)
    {
        await ExpireStaleOffersAsync();

        var availability = await _db.AvailabilityDeclarations
            .Include(a => a.Company)
            .FirstOrDefaultAsync(a => a.Id == availabilityId)
            ?? throw new KeyNotFoundException($"AvailabilityDeclaration {availabilityId} not found");

        if (availability.Status != ListingStatus.Active || availability.Company.Status != CompanyStatus.Active)
        {
            return;
        }

        var overlappingActiveRequestIds = await _db.CapacityRequests
            .Where(r =>
                r.Status == ListingStatus.Active &&
                r.CompanyId != availability.CompanyId &&
                r.Company.Status == CompanyStatus.Active &&
                r.StartDate >= availability.StartDate &&
                r.EndDate <= availability.EndDate)
            .Select(r => r.Id)
            .ToListAsync();

        foreach (var requestId in overlappingActiveRequestIds)
        {
            await GenerateMatchesForRequestAsync(requestId);
        }
    }

    public async Task<List<MatchOfferDto>> GetMatchesForCompanyAsync(int companyId)
    {
        await ExpireStaleOffersAsync();

        var offers = await _db.MatchOffers
            .Include(m => m.Request).ThenInclude(r => r.Skills)
            .Include(m => m.Request).ThenInclude(r => r.Certificates)
            .Include(m => m.Request).ThenInclude(r => r.Company)
            .Include(m => m.Availability).ThenInclude(a => a.Company)
            .Include(m => m.CooperationAgreement)
            .Where(m => m.Request.CompanyId == companyId || m.Availability.CompanyId == companyId)
            .OrderByDescending(m => m.MatchScore)
            .ThenByDescending(m => m.CreatedAt)
            .ToListAsync();

        return offers.Select(o => MapToDto(o, companyId)).ToList();
    }

    public async Task<List<MatchOfferDto>> GetMatchesForRequestAsync(int requestId, int companyId)
    {
        await ExpireStaleOffersAsync();

        var request = await _db.CapacityRequests
            .FirstOrDefaultAsync(r => r.Id == requestId)
            ?? throw new KeyNotFoundException($"CapacityRequest {requestId} not found");

        if (request.CompanyId != companyId)
        {
            throw new UnauthorizedAccessException("Only the requesting company can view request matches");
        }

        var offers = await _db.MatchOffers
            .Include(m => m.Request).ThenInclude(r => r.Skills)
            .Include(m => m.Request).ThenInclude(r => r.Certificates)
            .Include(m => m.Request).ThenInclude(r => r.Company)
            .Include(m => m.Availability).ThenInclude(a => a.Company)
            .Include(m => m.CooperationAgreement)
            .Where(m => m.RequestId == requestId)
            .OrderByDescending(m => m.MatchScore)
            .ThenByDescending(m => m.CreatedAt)
            .ToListAsync();

        return offers.Select(o => MapToDto(o, companyId)).ToList();
    }

    public async Task<MatchOfferDto> GetMatchByIdAsync(int matchId, int companyId)
    {
        await ExpireStaleOffersAsync();

        var offer = await LoadMatchOfferAsync(matchId);
        EnsureCompanyCanAccess(offer, companyId);

        return MapToDto(offer, companyId);
    }

    public async Task<MatchOfferDto> AcceptAsRequesterAsync(int matchId, int companyId)
    {
        await ExpireStaleOffersAsync();

        var offer = await LoadMatchOfferAsync(matchId);
        if (offer.Request.CompanyId != companyId)
        {
            throw new UnauthorizedAccessException("Only the requesting company can accept this match");
        }

        if (offer.Status != MatchStatus.PendingRequesterReview)
        {
            throw new InvalidOperationException("Only pending matches can be accepted by the requester");
        }

        await ValidateOfferStillActionableAsync(offer);

        offer.Status = MatchStatus.PendingSupplierConfirmation;
        offer.RequesterReviewedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapToDto(offer, companyId);
    }

    public async Task<MatchOfferDto> DeclineAsRequesterAsync(int matchId, int companyId)
    {
        await ExpireStaleOffersAsync();

        var offer = await LoadMatchOfferAsync(matchId);
        if (offer.Request.CompanyId != companyId)
        {
            throw new UnauthorizedAccessException("Only the requesting company can decline this match");
        }

        if (offer.Status != MatchStatus.PendingRequesterReview)
        {
            throw new InvalidOperationException("Only pending matches can be declined by the requester");
        }

        offer.Status = MatchStatus.RequesterDeclined;
        offer.RequesterReviewedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await UpsertEscalationAsync(offer.Request, !await HasOpenOffersAsync(offer.RequestId));
        await _db.SaveChangesAsync();

        return MapToDto(offer, companyId);
    }

    public async Task<MatchOfferDto> ConfirmAsSupplierAsync(int matchId, int companyId)
    {
        await ExpireStaleOffersAsync();

        var offer = await LoadMatchOfferAsync(matchId);
        if (offer.Availability.CompanyId != companyId)
        {
            throw new UnauthorizedAccessException("Only the supplying company can confirm this match");
        }

        if (offer.Status != MatchStatus.PendingSupplierConfirmation)
        {
            throw new InvalidOperationException("Only requester-accepted matches can be confirmed by the supplier");
        }

        await using var transaction = await _db.Database.BeginTransactionAsync();

        offer = await LoadMatchOfferAsync(matchId);
        await ValidateOfferStillActionableAsync(offer);

        var requestRemaining = await GetRemainingRequestQuantityAsync(offer.RequestId);
        var availabilityRemaining = await GetRemainingAvailabilityQuantityAsync(offer.AvailabilityId);
        var confirmedQuantity = Math.Min(offer.OfferedQuantity, Math.Min(requestRemaining, availabilityRemaining));

        if (confirmedQuantity <= 0)
        {
            offer.Status = MatchStatus.Withdrawn;
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
            return MapToDto(offer, companyId);
        }

        var agreement = new CooperationAgreement
        {
            MatchOfferId = offer.Id,
            RequestId = offer.RequestId,
            AvailabilityId = offer.AvailabilityId,
            SupplierCompanyId = offer.Availability.CompanyId,
            RequesterCompanyId = offer.Request.CompanyId,
            StartDate = offer.Request.StartDate,
            EndDate = offer.Request.EndDate,
            Quantity = confirmedQuantity,
            Status = AgreementStatus.Active,
            CreatedAt = DateTime.UtcNow,
            ConfirmedAt = DateTime.UtcNow
        };

        _db.CooperationAgreements.Add(agreement);

        offer.Status = MatchStatus.AgreementCreated;
        offer.SupplierReviewedAt = DateTime.UtcNow;
        offer.OfferedQuantity = confirmedQuantity;

        await _db.SaveChangesAsync();

        await EnsureListingStatusConsistencyAsync(offer.Request);
        await EnsureListingStatusConsistencyAsync(offer.Availability);
        await WithdrawExhaustedOpenOffersAsync(offer.RequestId, offer.AvailabilityId);
        await UpsertEscalationAsync(offer.Request, false);

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return MapToDto(offer, companyId);
    }

    public async Task<MatchOfferDto> DeclineAsSupplierAsync(int matchId, int companyId)
    {
        await ExpireStaleOffersAsync();

        var offer = await LoadMatchOfferAsync(matchId);
        if (offer.Availability.CompanyId != companyId)
        {
            throw new UnauthorizedAccessException("Only the supplying company can decline this match");
        }

        if (offer.Status != MatchStatus.PendingSupplierConfirmation)
        {
            throw new InvalidOperationException("Only requester-accepted matches can be declined by the supplier");
        }

        offer.Status = MatchStatus.SupplierDeclined;
        offer.SupplierReviewedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await UpsertEscalationAsync(offer.Request, !await HasOpenOffersAsync(offer.RequestId));
        await _db.SaveChangesAsync();

        return MapToDto(offer, companyId);
    }

    public async Task<List<AgreementDto>> GetAgreementsForCompanyAsync(int companyId)
    {
        var agreements = await _db.CooperationAgreements
            .Include(a => a.SupplierCompany)
            .Include(a => a.RequesterCompany)
            .Where(a => a.SupplierCompanyId == companyId || a.RequesterCompanyId == companyId)
            .OrderByDescending(a => a.ConfirmedAt)
            .ToListAsync();

        return agreements.Select(MapAgreementToDto).ToList();
    }

    public async Task<AgreementDto> GetAgreementByIdAsync(int agreementId, int companyId)
    {
        var agreement = await _db.CooperationAgreements
            .Include(a => a.SupplierCompany)
            .Include(a => a.RequesterCompany)
            .FirstOrDefaultAsync(a => a.Id == agreementId)
            ?? throw new KeyNotFoundException($"Agreement {agreementId} not found");

        if (agreement.SupplierCompanyId != companyId && agreement.RequesterCompanyId != companyId)
        {
            throw new UnauthorizedAccessException("Only participating companies can view this agreement");
        }

        return MapAgreementToDto(agreement);
    }

    private async Task<MatchOffer> LoadMatchOfferAsync(int matchId)
    {
        return await _db.MatchOffers
            .Include(m => m.Request).ThenInclude(r => r.Skills)
            .Include(m => m.Request).ThenInclude(r => r.Certificates)
            .Include(m => m.Request).ThenInclude(r => r.Company)
            .Include(m => m.Availability).ThenInclude(a => a.Company)
            .Include(m => m.CooperationAgreement)
            .FirstOrDefaultAsync(m => m.Id == matchId)
            ?? throw new KeyNotFoundException($"MatchOffer {matchId} not found");
    }

    private async Task<MatchEvaluation?> EvaluateAsync(
        CapacityRequest request,
        AvailabilityDeclaration availability,
        int requestRemainingQuantity)
    {
        var availabilityRemainingQuantity = await GetRemainingAvailabilityQuantityAsync(availability.Id);
        if (availabilityRemainingQuantity <= 0)
        {
            return null;
        }

        if (!CoversRequestPeriod(request, availability))
        {
            return null;
        }

        if (!LocationMatches(request.LocationCity, availability.LocationCity))
        {
            return null;
        }

        var requestSkillIds = request.Skills.Select(s => s.Id).ToHashSet();
        var availabilitySkillIds = availability.Skills.Select(s => s.Id).ToHashSet();
        if (!requestSkillIds.IsSubsetOf(availabilitySkillIds))
        {
            return null;
        }

        var requestCertificateIds = request.Certificates.Select(c => c.Id).ToHashSet();
        var availabilityCertificateIds = availability.Certificates.Select(c => c.Id).ToHashSet();
        if (!requestCertificateIds.IsSubsetOf(availabilityCertificateIds))
        {
            return null;
        }

        var offeredQuantity = Math.Min(requestRemainingQuantity, availabilityRemainingQuantity);
        if (offeredQuantity <= 0)
        {
            return null;
        }

        var quantityScore = offeredQuantity >= requestRemainingQuantity
            ? 5
            : Math.Max(1, (int)Math.Round((double)offeredQuantity / requestRemainingQuantity * 5));

        var score = new MatchScoreBreakdown
        {
            SkillScore = requestSkillIds.Count == 0 ? 30 : 30,
            CertificateScore = requestCertificateIds.Count == 0 ? 35 : 35,
            DateScore = 20,
            LocationScore = 10,
            QuantityScore = quantityScore
        };

        return new MatchEvaluation
        {
            Availability = availability,
            OfferedQuantity = offeredQuantity,
            Explanation = BuildExplanation(request, availability, offeredQuantity, requestRemainingQuantity),
            Score = score
        };
    }

    private static bool CoversRequestPeriod(CapacityRequest request, AvailabilityDeclaration availability)
    {
        return availability.StartDate <= request.StartDate &&
               availability.EndDate >= request.EndDate;
    }

    private static bool LocationMatches(string requestCity, string availabilityCity)
    {
        return NormalizeLocation(requestCity) == NormalizeLocation(availabilityCity);
    }

    private static string NormalizeLocation(string value)
    {
        return value.Trim().ToUpperInvariant();
    }

    private static string BuildExplanation(
        CapacityRequest request,
        AvailabilityDeclaration availability,
        int offeredQuantity,
        int requestRemainingQuantity)
    {
        var skillNames = request.Skills.Select(s => s.Name).ToList();
        var certificateNames = request.Certificates.Select(c => c.Name).ToList();
        var quantityText = offeredQuantity >= requestRemainingQuantity
            ? $"Can cover the full requested quantity of {requestRemainingQuantity}."
            : $"Can partially cover the request with {offeredQuantity} out of {requestRemainingQuantity}.";

        return string.Join(" ", new[]
        {
            "Exact location match.",
            "Availability covers the full requested period.",
            skillNames.Count > 0
                ? $"Matches required skills: {string.Join(", ", skillNames)}."
                : "No mandatory skills were specified.",
            certificateNames.Count > 0
                ? $"Matches required certificates: {string.Join(", ", certificateNames)}."
                : "No mandatory certificates were specified.",
            quantityText
        });
    }

    private MatchOffer CreateMatchOffer(CapacityRequest request, MatchEvaluation evaluation)
    {
        return new MatchOffer
        {
            RequestId = request.Id,
            AvailabilityId = evaluation.Availability.Id,
            OfferedQuantity = evaluation.OfferedQuantity,
            MatchScore = evaluation.Score.TotalScore,
            SkillScore = evaluation.Score.SkillScore,
            CertificateScore = evaluation.Score.CertificateScore,
            DateScore = evaluation.Score.DateScore,
            LocationScore = evaluation.Score.LocationScore,
            QuantityScore = evaluation.Score.QuantityScore,
            MatchedSkillCount = request.Skills.Count,
            RequiredSkillCount = request.Skills.Count,
            MatchedCertificateCount = request.Certificates.Count,
            RequiredCertificateCount = request.Certificates.Count,
            CoversFullPeriod = true,
            IsPartial = evaluation.OfferedQuantity < request.Quantity,
            Explanation = evaluation.Explanation,
            Status = MatchStatus.PendingRequesterReview,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(48)
        };
    }

    private void ApplyEvaluation(MatchOffer offer, MatchEvaluation evaluation)
    {
        offer.OfferedQuantity = evaluation.OfferedQuantity;
        offer.MatchScore = evaluation.Score.TotalScore;
        offer.SkillScore = evaluation.Score.SkillScore;
        offer.CertificateScore = evaluation.Score.CertificateScore;
        offer.DateScore = evaluation.Score.DateScore;
        offer.LocationScore = evaluation.Score.LocationScore;
        offer.QuantityScore = evaluation.Score.QuantityScore;
        offer.Explanation = evaluation.Explanation;
        offer.CoversFullPeriod = true;
        offer.IsPartial = evaluation.OfferedQuantity < offer.Request.Quantity;
        offer.ExpiresAt = DateTime.UtcNow.AddHours(48);
    }

    private async Task ExpireStaleOffersAsync()
    {
        var staleOffers = await _db.MatchOffers
            .Where(m => OpenStatuses.Contains(m.Status) && m.ExpiresAt <= DateTime.UtcNow)
            .ToListAsync();

        if (staleOffers.Count == 0)
        {
            return;
        }

        foreach (var offer in staleOffers)
        {
            offer.Status = MatchStatus.Expired;
        }

        await _db.SaveChangesAsync();
    }

    private async Task ValidateOfferStillActionableAsync(MatchOffer offer)
    {
        if (offer.ExpiresAt <= DateTime.UtcNow)
        {
            offer.Status = MatchStatus.Expired;
            await _db.SaveChangesAsync();
            throw new InvalidOperationException("This match offer has expired");
        }

        if (offer.Request.Status != ListingStatus.Active || offer.Availability.Status != ListingStatus.Active)
        {
            offer.Status = MatchStatus.Withdrawn;
            await _db.SaveChangesAsync();
            throw new InvalidOperationException("This match is no longer available");
        }

        if (await GetRemainingRequestQuantityAsync(offer.RequestId) <= 0 ||
            await GetRemainingAvailabilityQuantityAsync(offer.AvailabilityId) <= 0)
        {
            offer.Status = MatchStatus.Withdrawn;
            await _db.SaveChangesAsync();
            throw new InvalidOperationException("This match can no longer be fulfilled");
        }
    }

    private async Task<int> GetRemainingRequestQuantityAsync(int requestId)
    {
        var requestQuantity = await _db.CapacityRequests
            .Where(r => r.Id == requestId)
            .Select(r => r.Quantity)
            .SingleAsync();

        var allocatedQuantity = await _db.CooperationAgreements
            .Where(a => a.RequestId == requestId && a.Status != AgreementStatus.Cancelled)
            .SumAsync(a => (int?)a.Quantity) ?? 0;

        return Math.Max(0, requestQuantity - allocatedQuantity);
    }

    private async Task<int> GetRemainingAvailabilityQuantityAsync(int availabilityId)
    {
        var availabilityQuantity = await _db.AvailabilityDeclarations
            .Where(a => a.Id == availabilityId)
            .Select(a => a.Quantity)
            .SingleAsync();

        var allocatedQuantity = await _db.CooperationAgreements
            .Where(a => a.AvailabilityId == availabilityId && a.Status != AgreementStatus.Cancelled)
            .SumAsync(a => (int?)a.Quantity) ?? 0;

        return Math.Max(0, availabilityQuantity - allocatedQuantity);
    }

    private async Task EnsureListingStatusConsistencyAsync(CapacityRequest request)
    {
        var remaining = await GetRemainingRequestQuantityAsync(request.Id);
        if (request.Status == ListingStatus.Active && remaining <= 0)
        {
            request.Status = ListingStatus.Fulfilled;
        }
    }

    private async Task EnsureListingStatusConsistencyAsync(AvailabilityDeclaration availability)
    {
        var remaining = await GetRemainingAvailabilityQuantityAsync(availability.Id);
        if (availability.Status == ListingStatus.Active && remaining <= 0)
        {
            availability.Status = ListingStatus.Fulfilled;
        }
    }

    private async Task WithdrawExhaustedOpenOffersAsync(int requestId, int availabilityId)
    {
        var requestRemaining = await GetRemainingRequestQuantityAsync(requestId);
        var availabilityRemaining = await GetRemainingAvailabilityQuantityAsync(availabilityId);
        if (requestRemaining > 0 && availabilityRemaining > 0)
        {
            return;
        }

        var affectedOffers = await _db.MatchOffers
            .Where(m =>
                OpenStatuses.Contains(m.Status) &&
                (m.RequestId == requestId || m.AvailabilityId == availabilityId))
            .ToListAsync();

        foreach (var offer in affectedOffers)
        {
            offer.Status = MatchStatus.Withdrawn;
        }
    }

    private async Task<bool> HasOpenOffersAsync(int requestId)
    {
        return await _db.MatchOffers.AnyAsync(m =>
            m.RequestId == requestId &&
            OpenStatuses.Contains(m.Status));
    }

    private async Task UpsertEscalationAsync(CapacityRequest request, bool noOpenOffers)
    {
        var escalation = await _db.NetworkEscalations
            .FirstOrDefaultAsync(e => e.RequestId == request.Id);

        var urgent = request.Urgency is UrgencyLevel.High or UrgencyLevel.Critical;
        if (!urgent)
        {
            if (escalation is not null && escalation.Status == NetworkEscalationStatus.Open)
            {
                escalation.Status = NetworkEscalationStatus.Resolved;
            }

            return;
        }

        if (noOpenOffers)
        {
            if (escalation is null)
            {
                _db.NetworkEscalations.Add(new NetworkEscalation
                {
                    RequestId = request.Id,
                    TriggeredAt = DateTime.UtcNow,
                    Status = NetworkEscalationStatus.Open
                });
            }
            else if (escalation.Status != NetworkEscalationStatus.Open)
            {
                escalation.TriggeredAt = DateTime.UtcNow;
                escalation.Status = NetworkEscalationStatus.Open;
            }

            return;
        }

        if (escalation is not null && escalation.Status == NetworkEscalationStatus.Open)
        {
            escalation.Status = NetworkEscalationStatus.Resolved;
        }
    }

    private static void EnsureCompanyCanAccess(MatchOffer offer, int companyId)
    {
        if (offer.Request.CompanyId != companyId && offer.Availability.CompanyId != companyId)
        {
            throw new UnauthorizedAccessException("This company cannot access the requested match");
        }
    }

    private static MatchOfferDto MapToDto(MatchOffer offer, int companyId)
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

    private static AgreementDto MapAgreementToDto(CooperationAgreement agreement)
    {
        return new AgreementDto
        {
            Id = agreement.Id,
            MatchOfferId = agreement.MatchOfferId,
            RequestId = agreement.RequestId,
            AvailabilityId = agreement.AvailabilityId,
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

    private sealed class MatchEvaluation
    {
        public AvailabilityDeclaration Availability { get; init; } = null!;
        public int OfferedQuantity { get; init; }
        public string Explanation { get; init; } = null!;
        public MatchScoreBreakdown Score { get; init; } = null!;
    }

    private sealed class MatchScoreBreakdown
    {
        public int SkillScore { get; init; }
        public int CertificateScore { get; init; }
        public int DateScore { get; init; }
        public int LocationScore { get; init; }
        public int QuantityScore { get; init; }
        public int TotalScore => SkillScore + CertificateScore + DateScore + LocationScore + QuantityScore;
    }
}
