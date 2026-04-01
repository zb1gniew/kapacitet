using Kapacitet.Application.Features.AccessRequests.DTOs;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Keycloak;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Kapacitet.Application.Features.AccessRequests.Services;

public class AccessRequestService
{
    private readonly AppDbContext _db;
    private readonly KeycloakAdminClient _keycloakClient;
    private readonly ILogger<AccessRequestService> _logger;

    public AccessRequestService(
        AppDbContext db,
        KeycloakAdminClient keycloakClient,
        ILogger<AccessRequestService> logger)
    {
        _db = db;
        _keycloakClient = keycloakClient;
        _logger = logger;
    }

    public async Task<AccessRequestDto> SubmitAsync(SubmitAccessRequestDto dto)
    {
        var existingPending = await _db.AccessRequests
            .AnyAsync(r => r.ContactEmail == dto.ContactEmail && r.Status == AccessRequestStatus.Pending);

        if (existingPending)
            throw new InvalidOperationException("An access request with this email is already pending review.");

        var accessRequest = new AccessRequest
        {
            Name = dto.Name,
            Industry = dto.Industry,
            Location = dto.Location,
            ContactEmail = dto.ContactEmail,
            Message = dto.Message,
            Status = AccessRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _db.AccessRequests.Add(accessRequest);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Access request submitted: RequestId={RequestId}, Email={Email}, CompanyName={CompanyName}",
            accessRequest.Id, accessRequest.ContactEmail, accessRequest.Name);

        return MapToDto(accessRequest);
    }

    public async Task<List<AccessRequestDto>> GetAllAsync()
    {
        var requests = await _db.AccessRequests
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return requests.Select(MapToDto).ToList();
    }

    public async Task<AccessRequestDto> ReviewAsync(int id, ReviewAccessRequestDto dto, string reviewedBy)
    {
        var request = await _db.AccessRequests.FindAsync(id)
            ?? throw new KeyNotFoundException($"AccessRequest {id} not found");

        if (request.Status != AccessRequestStatus.Pending)
        {
            if (request.Status == dto.Decision)
            {
                _logger.LogInformation(
                    "Idempotent re-review of AccessRequest {RequestId} with same decision {Decision}",
                    id, dto.Decision);
                return MapToDto(request);
            }

            throw new InvalidOperationException("Only pending requests can be reviewed");
        }

        request.Status = dto.Decision;
        request.ReviewedBy = reviewedBy;
        request.ReviewedAt = DateTime.UtcNow;

        if (dto.Decision == AccessRequestStatus.Approved)
        {
            await ProvisionCompanyAndUserAsync(request);
        }
        else if (dto.Decision == AccessRequestStatus.Rejected)
        {
            request.RejectionReason = dto.RejectionReason;
        }

        await _db.SaveChangesAsync();

        if (dto.Decision == AccessRequestStatus.Approved)
        {
            _logger.LogInformation(
                "Access request approved: RequestId={RequestId}, ReviewedBy={ReviewedBy}, CompanyId={CompanyId}",
                request.Id, reviewedBy, request.ProvisionedCompanyId);

            await ProvisionKeycloakUserAsync(request);
        }
        else if (dto.Decision == AccessRequestStatus.Rejected)
        {
            _logger.LogInformation(
                "Access request rejected: RequestId={RequestId}, ReviewedBy={ReviewedBy}, Email={Email}, Reason={Reason}",
                request.Id, reviewedBy, request.ContactEmail, request.RejectionReason);
        }

        return MapToDto(request);
    }

    private async Task ProvisionCompanyAndUserAsync(AccessRequest request)
    {
        var existingUser = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.ContactEmail);
        if (existingUser != null)
            throw new InvalidOperationException(
                $"A user with email {request.ContactEmail} already exists.");

        var company = new Company
        {
            Name = request.Name,
            Industry = request.Industry,
            DefaultLocation = request.Location,
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        _db.Companies.Add(company);
        await _db.SaveChangesAsync();

        var user = new User
        {
            CompanyId = company.Id,
            Email = request.ContactEmail,
            Role = UserRole.Admin,
            CreatedAt = DateTime.UtcNow
        };
        _db.Users.Add(user);

        request.ProvisionedCompanyId = company.Id;

        _logger.LogInformation(
            "Provisioned Company {CompanyId} ({CompanyName}) and User for email {Email} from AccessRequest {RequestId}",
            company.Id, company.Name, request.ContactEmail, request.Id);
    }

    private async Task ProvisionKeycloakUserAsync(AccessRequest request)
    {
        try
        {
            var existingKeycloakUserId = await _keycloakClient.FindUserByEmailAsync(request.ContactEmail);

            string keycloakUserId;
            if (existingKeycloakUserId != null)
            {
                _logger.LogInformation(
                    "Keycloak user already exists for {Email}, reusing {KeycloakUserId}",
                    request.ContactEmail, existingKeycloakUserId);
                keycloakUserId = existingKeycloakUserId;
            }
            else
            {
                keycloakUserId = await _keycloakClient.CreateUserAsync(request.ContactEmail);
            }

            await _keycloakClient.SendRequiredActionsEmailAsync(keycloakUserId, ["UPDATE_PASSWORD"]);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to provision Keycloak user for AccessRequest {RequestId}, Email={Email}. " +
                "DB entities were created successfully. Manual Keycloak intervention may be needed.",
                request.Id, request.ContactEmail);
        }
    }

    private static AccessRequestDto MapToDto(AccessRequest entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        Industry = entity.Industry,
        Location = entity.Location,
        ContactEmail = entity.ContactEmail,
        Message = entity.Message,
        Status = entity.Status,
        ReviewedBy = entity.ReviewedBy,
        ReviewedAt = entity.ReviewedAt,
        CreatedAt = entity.CreatedAt,
        ProvisionedCompanyId = entity.ProvisionedCompanyId,
        RejectionReason = entity.RejectionReason
    };
}
