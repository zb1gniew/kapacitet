using System.Data;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Kapacitet.Application.Features.Matching.Services;

public sealed class MatchingAllocationService
{
    public static readonly MatchStatus[] OpenStatuses =
    [
        MatchStatus.PendingRequesterReview,
        MatchStatus.PendingSupplierConfirmation
    ];

    private readonly AppDbContext _db;

    public MatchingAllocationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task ExpireStaleOffersAsync()
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

    public async Task ValidateOfferStillActionableAsync(MatchOffer offer)
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

        var snapshot = await CreateSnapshotAsync([offer.RequestId], [offer.AvailabilityId]);
        if (snapshot.GetRemainingRequestQuantity(offer.RequestId) <= 0 ||
            snapshot.GetRemainingAvailabilityQuantity(offer.AvailabilityId) <= 0)
        {
            offer.Status = MatchStatus.Withdrawn;
            await _db.SaveChangesAsync();
            throw new InvalidOperationException("This match can no longer be fulfilled");
        }
    }

    public async Task<MatchingAllocationSnapshot> CreateSnapshotAsync(
        IEnumerable<int> requestIds,
        IEnumerable<int> availabilityIds)
    {
        var requestIdList = requestIds.Distinct().ToArray();
        var availabilityIdList = availabilityIds.Distinct().ToArray();

        var requestQuantities = requestIdList.Length == 0
            ? new Dictionary<int, int>()
            : await _db.CapacityRequests
                .Where(r => requestIdList.Contains(r.Id))
                .ToDictionaryAsync(r => r.Id, r => r.Quantity);

        var requestAllocatedQuantities = requestIdList.Length == 0
            ? new Dictionary<int, int>()
            : await _db.CooperationAgreements
                .Where(a => requestIdList.Contains(a.RequestId) && a.Status != AgreementStatus.Cancelled)
                .GroupBy(a => a.RequestId)
                .Select(group => new { group.Key, Quantity = group.Sum(x => x.Quantity) })
                .ToDictionaryAsync(x => x.Key, x => x.Quantity);

        var availabilityQuantities = availabilityIdList.Length == 0
            ? new Dictionary<int, int>()
            : await _db.AvailabilityDeclarations
                .Where(a => availabilityIdList.Contains(a.Id))
                .ToDictionaryAsync(a => a.Id, a => a.Quantity);

        var availabilityAllocatedQuantities = availabilityIdList.Length == 0
            ? new Dictionary<int, int>()
            : await _db.CooperationAgreements
                .Where(a => availabilityIdList.Contains(a.AvailabilityId) && a.Status != AgreementStatus.Cancelled)
                .GroupBy(a => a.AvailabilityId)
                .Select(group => new { group.Key, Quantity = group.Sum(x => x.Quantity) })
                .ToDictionaryAsync(x => x.Key, x => x.Quantity);

        return new MatchingAllocationSnapshot(
            requestQuantities,
            requestAllocatedQuantities,
            availabilityQuantities,
            availabilityAllocatedQuantities);
    }

    public Task EnsureListingStatusConsistencyAsync(CapacityRequest request, MatchingAllocationSnapshot snapshot)
    {
        var remaining = snapshot.GetRemainingRequestQuantity(request.Id);

        if (remaining <= 0 && request.Status == ListingStatus.Active)
        {
            request.Status = ListingStatus.Fulfilled;
        }
        else if (remaining > 0 && request.Status == ListingStatus.Fulfilled)
        {
            request.Status = ListingStatus.Active;
        }

        return Task.CompletedTask;
    }

    public Task EnsureListingStatusConsistencyAsync(AvailabilityDeclaration availability, MatchingAllocationSnapshot snapshot)
    {
        var remaining = snapshot.GetRemainingAvailabilityQuantity(availability.Id);

        if (remaining <= 0 && availability.Status == ListingStatus.Active)
        {
            availability.Status = ListingStatus.Fulfilled;
        }
        else if (remaining > 0 && availability.Status == ListingStatus.Fulfilled)
        {
            availability.Status = ListingStatus.Active;
        }

        return Task.CompletedTask;
    }

    public async Task WithdrawExhaustedOpenOffersAsync(int requestId, int availabilityId, MatchingAllocationSnapshot snapshot)
    {
        var requestRemaining = snapshot.GetRemainingRequestQuantity(requestId);
        var availabilityRemaining = snapshot.GetRemainingAvailabilityQuantity(availabilityId);

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

    public Task<bool> HasOpenOffersAsync(int requestId)
    {
        return _db.MatchOffers.AnyAsync(m =>
            m.RequestId == requestId &&
            OpenStatuses.Contains(m.Status));
    }

    public async Task LockAllocationAsync(int requestId, int availabilityId)
    {
        if (_db.Database.CurrentTransaction is null)
        {
            throw new InvalidOperationException("Allocation locks require an active transaction");
        }

        await LockRowAsync("capacity_requests", requestId);
        await LockRowAsync("availability_declarations", availabilityId);
    }

    private async Task LockRowAsync(string tableName, int id)
    {
        var connection = _db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        await using var command = connection.CreateCommand();
        command.Transaction = _db.Database.CurrentTransaction!.GetDbTransaction();
        command.CommandText = $"SELECT id FROM {tableName} WHERE id = @id FOR UPDATE";

        var parameter = command.CreateParameter();
        parameter.ParameterName = "@id";
        parameter.Value = id;
        command.Parameters.Add(parameter);

        var result = await command.ExecuteScalarAsync();
        if (result is null)
        {
            throw new KeyNotFoundException($"{tableName} row {id} not found");
        }
    }
}
