using System.Data;
using Kapacitet.Application.Features.Matching.DTOs;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Kapacitet.Application.Features.Notifications.Services;

namespace Kapacitet.Application.Features.Matching.Services;

public class MatchingService
{
    private readonly AppDbContext _db;
    private readonly MatchingAllocationService _allocationService;
    private readonly MatchingEscalationService _escalationService;
    private readonly MatchingGenerationService _generationService;
    private readonly MatchingQueryService _queryService;
    private readonly NotificationService _notificationService;

    public MatchingService(
        AppDbContext db,
        MatchingAllocationService allocationService,
        MatchingEscalationService escalationService,
        MatchingGenerationService generationService,
        MatchingQueryService queryService,
        NotificationService notificationService)
    {
        _db = db;
        _allocationService = allocationService;
        _escalationService = escalationService;
        _generationService = generationService;
        _queryService = queryService;
        _notificationService = notificationService;
    }

    public async Task<List<MatchOfferDto>> GenerateMatchesForRequestAsync(int requestId)
    {
        return await _generationService.GenerateMatchesForRequestAsync(requestId);
    }

    public async Task RefreshMatchesForAvailabilityAsync(int availabilityId)
    {
        await _generationService.RefreshMatchesForAvailabilityAsync(availabilityId);
    }

    public async Task<List<MatchOfferDto>> GetMatchesForCompanyAsync(int companyId)
    {
        await _allocationService.ExpireStaleOffersAsync();
        return await _queryService.GetMatchesForCompanyAsync(companyId);
    }

    public async Task<List<MatchOfferDto>> GetMatchesForRequestAsync(int requestId, int companyId)
    {
        await _allocationService.ExpireStaleOffersAsync();
        return await _queryService.GetMatchesForRequestAsync(requestId, companyId);
    }

    public async Task<MatchOfferDto> GetMatchByIdAsync(int matchId, int companyId)
    {
        await _allocationService.ExpireStaleOffersAsync();
        return await _queryService.GetMatchByIdAsync(matchId, companyId);
    }

    public async Task<MatchOfferDto> AcceptAsRequesterAsync(int matchId, int companyId)
    {
        await _allocationService.ExpireStaleOffersAsync();

        var offer = await _queryService.LoadMatchOfferAsync(matchId);
        if (offer.Request.CompanyId != companyId)
        {
            throw new UnauthorizedAccessException("Only the requesting company can accept this match");
        }

        if (offer.Status != MatchStatus.PendingRequesterReview)
        {
            throw new InvalidOperationException("Only pending matches can be accepted by the requester");
        }

        await _allocationService.ValidateOfferStillActionableAsync(offer);

        offer.Status = MatchStatus.PendingSupplierConfirmation;
        offer.RequesterReviewedAt = DateTime.UtcNow;

        await _notificationService.QueueSupplierConfirmationNotificationAsync(
            offer.Availability.CompanyId, offer.Id);

        await _db.SaveChangesAsync();
        return MatchOfferMapper.MapToDto(offer, companyId);
    }

    public async Task<MatchOfferDto> DeclineAsRequesterAsync(int matchId, int companyId)
    {
        await _allocationService.ExpireStaleOffersAsync();

        var offer = await _queryService.LoadMatchOfferAsync(matchId);
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
        await _escalationService.UpsertAsync(offer.Request, !await _allocationService.HasOpenOffersAsync(offer.RequestId));
        await _db.SaveChangesAsync();

        return MatchOfferMapper.MapToDto(offer, companyId);
    }

    public async Task<MatchOfferDto> ConfirmAsSupplierAsync(int matchId, int companyId)
    {
        await _allocationService.ExpireStaleOffersAsync();

        var accessCheckedOffer = await _queryService.LoadMatchOfferAsync(matchId, trackChanges: false);
        if (accessCheckedOffer.Availability.CompanyId != companyId)
        {
            throw new UnauthorizedAccessException("Only the supplying company can confirm this match");
        }

        if (accessCheckedOffer.Status != MatchStatus.PendingSupplierConfirmation)
        {
            throw new InvalidOperationException("Only requester-accepted matches can be confirmed by the supplier");
        }

        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        try
        {
            _db.ChangeTracker.Clear();
            await _allocationService.LockAllocationAsync(accessCheckedOffer.RequestId, accessCheckedOffer.AvailabilityId);

            var offer = await _queryService.LoadMatchOfferAsync(matchId);
            await _allocationService.ValidateOfferStillActionableAsync(offer);

            var snapshot = await _allocationService.CreateSnapshotAsync([offer.RequestId], [offer.AvailabilityId]);
            var requestRemaining = snapshot.GetRemainingRequestQuantity(offer.RequestId);
            var availabilityRemaining = snapshot.GetRemainingAvailabilityQuantity(offer.AvailabilityId);
            var confirmedQuantity = Math.Min(offer.OfferedQuantity, Math.Min(requestRemaining, availabilityRemaining));

            if (confirmedQuantity <= 0)
            {
                offer.Status = MatchStatus.Withdrawn;
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
                return MatchOfferMapper.MapToDto(offer, companyId);
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

            var updatedSnapshot = await _allocationService.CreateSnapshotAsync([offer.RequestId], [offer.AvailabilityId]);
            await _allocationService.EnsureListingStatusConsistencyAsync(offer.Request, updatedSnapshot);
            await _allocationService.EnsureListingStatusConsistencyAsync(offer.Availability, updatedSnapshot);
            await _allocationService.WithdrawExhaustedOpenOffersAsync(offer.RequestId, offer.AvailabilityId, updatedSnapshot);
            await _escalationService.UpsertAsync(offer.Request, false);

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return MatchOfferMapper.MapToDto(offer, companyId);
        }
        catch (Exception ex) when (IsTransientAllocationConflict(ex))
        {
            await transaction.RollbackAsync();
            throw new InvalidOperationException("Capacity changed while confirming this match. Refresh and try again.", ex);
        }
    }

    public async Task<MatchOfferDto> DeclineAsSupplierAsync(int matchId, int companyId)
    {
        await _allocationService.ExpireStaleOffersAsync();

        var offer = await _queryService.LoadMatchOfferAsync(matchId);
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
        await _escalationService.UpsertAsync(offer.Request, !await _allocationService.HasOpenOffersAsync(offer.RequestId));
        await _db.SaveChangesAsync();

        return MatchOfferMapper.MapToDto(offer, companyId);
    }

    public async Task<List<AgreementDto>> GetAgreementsForCompanyAsync(int companyId)
    {
        return await _queryService.GetAgreementsForCompanyAsync(companyId);
    }

    public async Task<AgreementDto> GetAgreementByIdAsync(int agreementId, int companyId)
    {
        return await _queryService.GetAgreementByIdAsync(agreementId, companyId);
    }

    private static bool IsTransientAllocationConflict(Exception exception)
    {
        if (exception is DbUpdateConcurrencyException)
        {
            return true;
        }

        for (var current = exception; current is not null; current = current.InnerException)
        {
            if (current.GetType().FullName != "Npgsql.PostgresException")
            {
                continue;
            }

            var sqlState = current.GetType().GetProperty("SqlState")?.GetValue(current) as string;
            if (sqlState is "40001" or "40P01")
            {
                return true;
            }
        }

        return false;
    }
}
