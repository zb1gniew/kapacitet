using Kapacitet.Application.Features.Admin.DTOs;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.Admin.Services;

public sealed class AdminDataService
{
    private readonly AppDbContext _db;

    public AdminDataService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<AdminCompanyDto>> GetCompaniesAsync()
    {
        var companies = await _db.Companies
            .AsNoTracking()
            .Include(company => company.Users)
            .OrderByDescending(company => company.CreatedAt)
            .ToListAsync();

        var approvedRequests = await _db.AccessRequests
            .AsNoTracking()
            .Where(request => request.Status == Domain.Enums.AccessRequestStatus.Approved)
            .OrderByDescending(request => request.ReviewedAt ?? request.CreatedAt)
            .ToListAsync();

        var latestApprovedRequestByCompanyId = approvedRequests
            .Where(request => request.ProvisionedCompanyId.HasValue)
            .GroupBy(request => request.ProvisionedCompanyId!.Value)
            .ToDictionary(
                group => group.Key,
                group => group
                    .OrderByDescending(request => request.ReviewedAt ?? request.CreatedAt)
                    .First());

        var provisionedRecords = companies.Select(company =>
        {
            latestApprovedRequestByCompanyId.TryGetValue(company.Id, out var linkedRequest);
            var contactEmail = company.Users
                .OrderBy(user => user.CreatedAt)
                .Select(user => user.Email)
                .FirstOrDefault()
                ?? linkedRequest?.ContactEmail
                ?? "Not available";

            return new AdminCompanyDto
            {
                RequestId = linkedRequest?.Id,
                CompanyId = company.Id,
                CompanyName = company.Name,
                Cvr = company.Cvr ?? linkedRequest?.Cvr,
                Categories = company.Categories,
                Location = company.DefaultLocation,
                ContactPhone = company.ContactPhone ?? linkedRequest?.ContactPhone,
                ContactEmail = contactEmail,
                Status = "Provisioned",
                CreatedAt = company.CreatedAt,
                ReviewedAt = linkedRequest?.ReviewedAt,
                ReviewedBy = linkedRequest?.ReviewedBy,
                ProvisionedCompanyId = company.Id
            };
        });

        return provisionedRecords
            .OrderByDescending(record => record.ReviewedAt ?? record.CreatedAt)
            .ToList();
    }

    public async Task<List<AdminAuditEventDto>> GetAuditEventsAsync()
    {
        var requests = await _db.AccessRequests
            .AsNoTracking()
            .OrderByDescending(request => request.CreatedAt)
            .ToListAsync();

        var companies = await _db.Companies
            .AsNoTracking()
            .Include(company => company.Users)
            .OrderByDescending(company => company.CreatedAt)
            .ToListAsync();

        var requestByProvisionedCompanyId = requests
            .Where(request => request.ProvisionedCompanyId.HasValue)
            .GroupBy(request => request.ProvisionedCompanyId!.Value)
            .ToDictionary(
                group => group.Key,
                group => group
                    .OrderByDescending(request => request.ReviewedAt ?? request.CreatedAt)
                    .First());

        var events = new List<AdminAuditEventDto>();

        foreach (var request in requests)
        {
            events.Add(new AdminAuditEventDto
            {
                Id = $"submission-{request.Id}",
                Timestamp = request.CreatedAt,
                Type = "Submission",
                RequestId = request.Id,
                CompanyId = request.ProvisionedCompanyId,
                CompanyName = request.Name,
                ContactEmail = request.ContactEmail,
                Summary = "Access request submitted",
                Detail = $"{request.Name} submitted a new company access request.",
                ProvisionedCompanyId = request.ProvisionedCompanyId
            });

            if (request.ReviewedAt.HasValue && request.Status == Domain.Enums.AccessRequestStatus.Approved)
            {
                events.Add(new AdminAuditEventDto
                {
                    Id = $"approval-{request.Id}",
                    Timestamp = request.ReviewedAt.Value,
                    Type = "Approval",
                    RequestId = request.Id,
                    CompanyId = request.ProvisionedCompanyId,
                    CompanyName = request.Name,
                    ContactEmail = request.ContactEmail,
                    Actor = request.ReviewedBy,
                    Summary = "Access request approved",
                    Detail = $"{request.Name} was approved for platform onboarding.",
                    ProvisionedCompanyId = request.ProvisionedCompanyId
                });
            }

            if (request.ReviewedAt.HasValue && request.Status == Domain.Enums.AccessRequestStatus.Rejected)
            {
                events.Add(new AdminAuditEventDto
                {
                    Id = $"rejection-{request.Id}",
                    Timestamp = request.ReviewedAt.Value,
                    Type = "Rejection",
                    RequestId = request.Id,
                    CompanyId = null,
                    CompanyName = request.Name,
                    ContactEmail = request.ContactEmail,
                    Actor = request.ReviewedBy,
                    Summary = "Access request rejected",
                    Detail = string.IsNullOrWhiteSpace(request.RejectionReason)
                        ? $"{request.Name} was rejected during review."
                        : $"Rejected with note: {request.RejectionReason}",
                    ProvisionedCompanyId = null
                });
            }
        }

        foreach (var company in companies)
        {
            requestByProvisionedCompanyId.TryGetValue(company.Id, out var linkedRequest);
            var contactEmail = company.Users
                .OrderBy(user => user.CreatedAt)
                .Select(user => user.Email)
                .FirstOrDefault()
                ?? linkedRequest?.ContactEmail
                ?? "Not available";

            events.Add(new AdminAuditEventDto
            {
                Id = $"provisioning-company-{company.Id}",
                Timestamp = company.CreatedAt,
                Type = "Provisioning",
                RequestId = linkedRequest?.Id,
                CompanyId = company.Id,
                CompanyName = company.Name,
                ContactEmail = contactEmail,
                Actor = linkedRequest?.ReviewedBy,
                Summary = "Company provisioned",
                Detail = linkedRequest is not null
                    ? $"Company ID {company.Id} was created and linked to approved request {linkedRequest.Id}."
                    : $"Company ID {company.Id} exists in the platform company registry.",
                ProvisionedCompanyId = company.Id
            });
        }

        return events
            .OrderByDescending(@event => @event.Timestamp)
            .ToList();
    }
}
