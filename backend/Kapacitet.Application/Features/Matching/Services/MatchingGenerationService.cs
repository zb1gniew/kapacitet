using Kapacitet.Application.Features.Matching.DTOs;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.Matching.Services;

public sealed class MatchingGenerationService
{
    private readonly AppDbContext _db;
    private readonly MatchingAllocationService _allocationService;
    private readonly MatchEvaluationService _evaluationService;
    private readonly MatchingEscalationService _escalationService;
    private readonly MatchingQueryService _queryService;

    public MatchingGenerationService(
        AppDbContext db,
        MatchingAllocationService allocationService,
        MatchEvaluationService evaluationService,
        MatchingEscalationService escalationService,
        MatchingQueryService queryService)
    {
        _db = db;
        _allocationService = allocationService;
        _evaluationService = evaluationService;
        _escalationService = escalationService;
        _queryService = queryService;
    }

    public async Task<List<MatchOfferDto>> GenerateMatchesForRequestAsync(int requestId)
    {
        await _allocationService.ExpireStaleOffersAsync();

        var request = await _queryService.LoadRequestAsync(requestId)
            ?? throw new KeyNotFoundException($"CapacityRequest {requestId} not found");

        if (request.Status != ListingStatus.Active || request.Company.Status != CompanyStatus.Active)
        {
            return [];
        }

        await RegenerateMatchesForRequestsAsync([requestId]);
        return await _queryService.GetMatchesForRequestAsync(request.Id, request.CompanyId);
    }

    public async Task RefreshMatchesForAvailabilityAsync(int availabilityId)
    {
        await _allocationService.ExpireStaleOffersAsync();

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
                r.Company.Status == CompanyStatus.Active &&
                r.CompanyId != availability.CompanyId &&
                r.ResourceType == availability.ResourceType &&
                r.StartDate >= availability.StartDate &&
                r.EndDate <= availability.EndDate)
            .Select(r => r.Id)
            .ToListAsync();

        await RegenerateMatchesForRequestsAsync(overlappingActiveRequestIds);
    }

    private async Task RegenerateMatchesForRequestsAsync(IReadOnlyCollection<int> requestIds)
    {
        if (requestIds.Count == 0)
        {
            return;
        }

        var requests = await _db.CapacityRequests
            .AsSplitQuery()
            .Include(r => r.Company)
            .Include(r => r.Skills)
            .Include(r => r.Certificates)
            .Where(r => requestIds.Contains(r.Id))
            .ToListAsync();

        if (requests.Count == 0)
        {
            return;
        }

        var activeRequests = requests
            .Where(r => r.Status == ListingStatus.Active && r.Company.Status == CompanyStatus.Active)
            .ToList();

        if (activeRequests.Count == 0)
        {
            return;
        }

        var candidates = await LoadCandidateAvailabilitiesAsync(activeRequests);
        var existingOffers = await _db.MatchOffers
            .Where(m => requestIds.Contains(m.RequestId))
            .ToListAsync();

        var snapshot = await _allocationService.CreateSnapshotAsync(
            activeRequests.Select(r => r.Id),
            candidates.Select(c => c.Id));

        foreach (var request in activeRequests)
        {
            var requestRemainingQuantity = snapshot.GetRemainingRequestQuantity(request.Id);
            var requestOffers = existingOffers.Where(o => o.RequestId == request.Id).ToList();

            if (requestRemainingQuantity <= 0)
            {
                foreach (var offer in requestOffers.Where(o => MatchingAllocationService.OpenStatuses.Contains(o.Status)))
                {
                    offer.Status = MatchStatus.Withdrawn;
                }

                await _allocationService.EnsureListingStatusConsistencyAsync(request, snapshot);
                await _escalationService.UpsertAsync(request, false);
                continue;
            }

            var eligibleResults = candidates
                .Where(a => a.CompanyId != request.CompanyId)
                .Select(a => _evaluationService.Evaluate(
                    request,
                    a,
                    requestRemainingQuantity,
                    snapshot.GetRemainingAvailabilityQuantity(a.Id)))
                .Where(result => result is not null)
                .Cast<MatchEvaluationResult>()
                .OrderByDescending(result => result.Score.TotalScore)
                .ThenByDescending(result => result.OfferedQuantity)
                .ToList();

            foreach (var offer in requestOffers.Where(o => MatchingAllocationService.OpenStatuses.Contains(o.Status)))
            {
                if (eligibleResults.All(r => r.Availability.Id != offer.AvailabilityId))
                {
                    offer.Status = MatchStatus.Withdrawn;
                }
            }

            foreach (var evaluation in eligibleResults)
            {
                var existing = requestOffers.FirstOrDefault(o =>
                    o.AvailabilityId == evaluation.Availability.Id &&
                    MatchingAllocationService.OpenStatuses.Contains(o.Status));

                if (existing is null)
                {
                    var createdOffer = CreateMatchOffer(request, evaluation);
                    _db.MatchOffers.Add(createdOffer);
                    requestOffers.Add(createdOffer);
                    continue;
                }

                if (existing.Status == MatchStatus.PendingSupplierConfirmation)
                {
                    continue;
                }

                ApplyEvaluation(existing, evaluation);
            }

            await _escalationService.UpsertAsync(request, eligibleResults.Count == 0);
        }

        await _db.SaveChangesAsync();
    }

    private async Task<List<AvailabilityDeclaration>> LoadCandidateAvailabilitiesAsync(
        IReadOnlyCollection<CapacityRequest> requests)
    {
        var minStart = requests.Min(r => r.StartDate);
        var maxEnd = requests.Max(r => r.EndDate);
        var resourceTypes = requests.Select(r => r.ResourceType).Distinct().ToArray();

        return await _db.AvailabilityDeclarations
            .AsSplitQuery()
            .Include(a => a.Company)
            .Include(a => a.Skills)
            .Include(a => a.Certificates)
            .Where(a =>
                a.Status == ListingStatus.Active &&
                a.Company.Status == CompanyStatus.Active &&
                resourceTypes.Contains(a.ResourceType) &&
                a.EndDate >= minStart &&
                a.StartDate <= maxEnd)
            .ToListAsync();
    }

    private static MatchOffer CreateMatchOffer(CapacityRequest request, MatchEvaluationResult evaluation)
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
            MatchedSkillCount = evaluation.MatchedSkillCount,
            RequiredSkillCount = evaluation.RequiredSkillCount,
            MatchedCertificateCount = evaluation.MatchedCertificateCount,
            RequiredCertificateCount = evaluation.RequiredCertificateCount,
            CoversFullPeriod = evaluation.CoversFullPeriod,
            IsPartial = evaluation.IsPartial,
            Explanation = evaluation.Explanation,
            Status = MatchStatus.PendingRequesterReview,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(48)
        };
    }

    private static void ApplyEvaluation(MatchOffer offer, MatchEvaluationResult evaluation)
    {
        offer.OfferedQuantity = evaluation.OfferedQuantity;
        offer.MatchScore = evaluation.Score.TotalScore;
        offer.SkillScore = evaluation.Score.SkillScore;
        offer.CertificateScore = evaluation.Score.CertificateScore;
        offer.DateScore = evaluation.Score.DateScore;
        offer.LocationScore = evaluation.Score.LocationScore;
        offer.QuantityScore = evaluation.Score.QuantityScore;
        offer.MatchedSkillCount = evaluation.MatchedSkillCount;
        offer.RequiredSkillCount = evaluation.RequiredSkillCount;
        offer.MatchedCertificateCount = evaluation.MatchedCertificateCount;
        offer.RequiredCertificateCount = evaluation.RequiredCertificateCount;
        offer.Explanation = evaluation.Explanation;
        offer.CoversFullPeriod = evaluation.CoversFullPeriod;
        offer.IsPartial = evaluation.IsPartial;
        offer.ExpiresAt = DateTime.UtcNow.AddHours(48);
    }
}
