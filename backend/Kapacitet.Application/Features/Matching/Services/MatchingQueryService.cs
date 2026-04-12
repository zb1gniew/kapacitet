using Kapacitet.Application.Features.Matching.DTOs;
using Kapacitet.Domain.Entities;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.Matching.Services;

public sealed class MatchingQueryService
{
    private readonly AppDbContext _db;

    public MatchingQueryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<MatchOfferDto>> GetMatchesForCompanyAsync(int companyId)
    {
        var offers = await _db.MatchOffers
            .AsSplitQuery()
            .Include(m => m.Request).ThenInclude(r => r.Skills)
            .Include(m => m.Request).ThenInclude(r => r.Certificates)
            .Include(m => m.Request).ThenInclude(r => r.Company)
            .Include(m => m.Availability).ThenInclude(a => a.Company)
            .Include(m => m.CooperationAgreement)
            .Where(m => m.Request.CompanyId == companyId || m.Availability.CompanyId == companyId)
            .OrderByDescending(m => m.MatchScore)
            .ThenByDescending(m => m.CreatedAt)
            .ToListAsync();

        return offers.Select(o => MatchOfferMapper.MapToDto(o, companyId)).ToList();
    }

    public async Task<List<MatchOfferDto>> GetMatchesForRequestAsync(int requestId, int companyId)
    {
        var request = await _db.CapacityRequests
            .FirstOrDefaultAsync(r => r.Id == requestId)
            ?? throw new KeyNotFoundException($"CapacityRequest {requestId} not found");

        if (request.CompanyId != companyId)
        {
            throw new UnauthorizedAccessException("Only the requesting company can view request matches");
        }

        var offers = await _db.MatchOffers
            .AsSplitQuery()
            .Include(m => m.Request).ThenInclude(r => r.Skills)
            .Include(m => m.Request).ThenInclude(r => r.Certificates)
            .Include(m => m.Request).ThenInclude(r => r.Company)
            .Include(m => m.Availability).ThenInclude(a => a.Company)
            .Include(m => m.CooperationAgreement)
            .Where(m => m.RequestId == requestId)
            .OrderByDescending(m => m.MatchScore)
            .ThenByDescending(m => m.CreatedAt)
            .ToListAsync();

        return offers.Select(o => MatchOfferMapper.MapToDto(o, companyId)).ToList();
    }

    public async Task<MatchOfferDto> GetMatchByIdAsync(int matchId, int companyId)
    {
        var offer = await LoadMatchOfferAsync(matchId);
        EnsureCompanyCanAccess(offer, companyId);
        return MatchOfferMapper.MapToDto(offer, companyId);
    }

    public async Task<List<AgreementDto>> GetAgreementsForCompanyAsync(int companyId)
    {
        var agreements = await _db.CooperationAgreements
            .Include(a => a.SupplierCompany)
            .ThenInclude(c => c.Users)
            .Include(a => a.RequesterCompany)
            .ThenInclude(c => c.Users)
            .Where(a => a.SupplierCompanyId == companyId || a.RequesterCompanyId == companyId)
            .OrderByDescending(a => a.ConfirmedAt)
            .ToListAsync();

        return agreements.Select(agreement => MatchOfferMapper.MapAgreementToDto(agreement, companyId)).ToList();
    }

    public async Task<AgreementDto> GetAgreementByIdAsync(int agreementId, int companyId)
    {
        var agreement = await _db.CooperationAgreements
            .Include(a => a.SupplierCompany)
            .ThenInclude(c => c.Users)
            .Include(a => a.RequesterCompany)
            .ThenInclude(c => c.Users)
            .FirstOrDefaultAsync(a => a.Id == agreementId)
            ?? throw new KeyNotFoundException($"Agreement {agreementId} not found");

        if (agreement.SupplierCompanyId != companyId && agreement.RequesterCompanyId != companyId)
        {
            throw new UnauthorizedAccessException("Only participating companies can view this agreement");
        }

        return MatchOfferMapper.MapAgreementToDto(agreement, companyId);
    }

    public async Task<CapacityRequest?> LoadRequestAsync(int requestId)
    {
        return await _db.CapacityRequests
            .AsSplitQuery()
            .Include(r => r.Company)
            .Include(r => r.Skills)
            .Include(r => r.Certificates)
            .FirstOrDefaultAsync(r => r.Id == requestId);
    }

    public async Task<MatchOffer> LoadMatchOfferAsync(int matchId, bool trackChanges = true)
    {
        IQueryable<MatchOffer> query = _db.MatchOffers;

        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        return await query
            .AsSplitQuery()
            .Include(m => m.Request).ThenInclude(r => r.Skills)
            .Include(m => m.Request).ThenInclude(r => r.Certificates)
            .Include(m => m.Request).ThenInclude(r => r.Company)
            .Include(m => m.Availability).ThenInclude(a => a.Company)
            .Include(m => m.Availability).ThenInclude(a => a.Skills)
            .Include(m => m.Availability).ThenInclude(a => a.Certificates)
            .Include(m => m.CooperationAgreement)
            .FirstOrDefaultAsync(m => m.Id == matchId)
            ?? throw new KeyNotFoundException($"MatchOffer {matchId} not found");
    }

    private static void EnsureCompanyCanAccess(MatchOffer offer, int companyId)
    {
        if (offer.Request.CompanyId != companyId && offer.Availability.CompanyId != companyId)
        {
            throw new UnauthorizedAccessException("This company cannot access the requested match");
        }
    }
}
