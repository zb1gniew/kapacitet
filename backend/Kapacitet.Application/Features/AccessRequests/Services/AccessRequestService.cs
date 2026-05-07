using Kapacitet.Application.Features.AccessRequests.DTOs;
using Kapacitet.Application.Features.AccountSetup.Services;
using Kapacitet.Application.Features.Common.Errors;
using Kapacitet.Application.Features.Matching.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Domain.Utilities;
using Kapacitet.Infrastructure.Keycloak;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Kapacitet.Application.Features.Notifications.Services;
using System.Security.Cryptography;

namespace Kapacitet.Application.Features.AccessRequests.Services;

public class AccessRequestService
{
    private readonly AppDbContext _db;
    private readonly KeycloakAdminClient _keycloakClient;
    private readonly ILogger<AccessRequestService> _logger;
    private readonly EmailService _emailService;
    private readonly InitialPasswordSetupService _initialPasswordSetupService;

    public AccessRequestService(
        AppDbContext db,
        KeycloakAdminClient keycloakClient,
        ILogger<AccessRequestService> logger,
        EmailService emailService,
        InitialPasswordSetupService initialPasswordSetupService)
    {
        _db = db;
        _keycloakClient = keycloakClient;
        _logger = logger;
        _emailService = emailService;
        _initialPasswordSetupService = initialPasswordSetupService;
    }

    public async Task<AccessRequestDto> SubmitAsync(SubmitAccessRequestDto dto)
    {
        if (!MatchingCityCoordinateCatalog.IsSupportedCity(dto.Location))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["location"] = [$"'{dto.Location}' is not a supported city. Please select a city from the suggestions."]
            });
        }

        if (!IsValidCvr(dto.Cvr))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["cvr"] = ["CVR must be exactly 8 digits."]
            });
        }

        var categoriesError = CompanyCategoryCatalog.ValidateCategoriesField(dto.Categories ?? []);
        if (categoriesError is not null)
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["categories"] = [categoriesError]
            });
        }

        if (!IsValidPhone(dto.ContactPhone))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["contactPhone"] = ["Enter a valid international phone number (e.g. +4512345678)."]
            });
        }

        var contactEmail = EmailAddressNormalizer.Canonicalize(dto.ContactEmail);

        var existingPending = await _db.AccessRequests
            .WhereContactEmailMatches(contactEmail)
            .AnyAsync(r => r.Status == AccessRequestStatus.Pending);

        if (existingPending)
            throw new InvalidOperationException("An access request with this email is already pending review.");

        var existingUser = await _db.Users
            .WhereEmailMatches(contactEmail)
            .AnyAsync();

        if (existingUser)
            throw new InvalidOperationException("An account with this email already exists.");

        var accessRequest = new AccessRequest
        {
            Name = dto.Name,
            Cvr = dto.Cvr,
            Categories = dto.Categories ?? [],
            Location = dto.Location,
            ContactPhone = dto.ContactPhone,
            ContactEmail = contactEmail,
            Message = dto.Message,
            Status = AccessRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _db.AccessRequests.Add(accessRequest);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsPendingAccessRequestDuplicate(ex))
        {
            throw new InvalidOperationException(
                "An access request with this email is already pending review.",
                ex);
        }

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
                if (request.Status == AccessRequestStatus.Approved)
                {
                    var setupToken = await _initialPasswordSetupService.IssueTokenAsync(request.Id);
                    await _emailService.SendApprovalEmailAsync(
                        request.ContactEmail,
                        request.Name,
                        setupToken);
                }

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
            await using var transaction = await _db.Database.BeginTransactionAsync();

            await ProvisionCompanyAndUserAsync(request);

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (IsUserEmailDuplicate(ex))
            {
                throw new InvalidOperationException(
                    $"A user with email {request.ContactEmail} already exists.",
                    ex);
            }

            // Keycloak is provisioned BEFORE committing the transaction.
            // If it throws, the transaction rolls back and no orphaned DB accounts are created.
            await ProvisionKeycloakUserAsync(request);

            await transaction.CommitAsync();

            var setupToken = await _initialPasswordSetupService.IssueTokenAsync(request.Id);

            _logger.LogInformation(
                "Access request approved: RequestId={RequestId}, ReviewedBy={ReviewedBy}, CompanyId={CompanyId}",
                request.Id, reviewedBy, request.ProvisionedCompanyId);

            await _emailService.SendApprovalEmailAsync(
                request.ContactEmail,
                request.Name,
                setupToken);
        }
        else
        {
            if (dto.Decision == AccessRequestStatus.Rejected)
            {
                request.RejectionReason = dto.RejectionReason;
            }

            await _db.SaveChangesAsync();

            if (dto.Decision == AccessRequestStatus.Rejected)
            {
                _logger.LogInformation(
                    "Access request rejected: RequestId={RequestId}, ReviewedBy={ReviewedBy}, Email={Email}, Reason={Reason}",
                    request.Id, reviewedBy, request.ContactEmail, request.RejectionReason);
            }
        }

        return CreateReviewResult(request);
    }

    private async Task ProvisionCompanyAndUserAsync(AccessRequest request)
    {
        var existingUser = await _db.Users
            .WhereEmailMatches(request.ContactEmail)
            .FirstOrDefaultAsync();

        if (existingUser != null)
            throw new InvalidOperationException(
                $"A user with email {request.ContactEmail} already exists.");

        var company = new Company
        {
            Name = request.Name,
            Cvr = request.Cvr,
            Categories = request.Categories,
            DefaultLocation = request.Location,
            ContactPhone = request.ContactPhone,
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

        await _keycloakClient.SetTemporaryPasswordAsync(
            keycloakUserId,
            CreateBootstrapPassword());
    }

    private static string CreateBootstrapPassword() =>
        $"{Convert.ToHexString(RandomNumberGenerator.GetBytes(16))}aA!";

    private static AccessRequestDto CreateReviewResult(
        AccessRequest entity)
    {
        return MapToDto(entity);
    }

    private static bool IsPendingAccessRequestDuplicate(DbUpdateException exception)
    {
        return IsUniqueConstraintViolation(
            exception,
            PersistenceModelConstants.AccessRequestsPendingNormalizedContactEmailIndex);
    }

    private static bool IsUserEmailDuplicate(DbUpdateException exception)
    {
        return IsUniqueConstraintViolation(
            exception,
            PersistenceModelConstants.UsersNormalizedEmailIndex);
    }

    private static bool IsUniqueConstraintViolation(
        DbUpdateException exception,
        string constraintName)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            var sqlState = current.GetType().GetProperty("SqlState")?.GetValue(current) as string;
            var currentConstraintName =
                current.GetType().GetProperty("ConstraintName")?.GetValue(current) as string;

            if (sqlState == "23505" && currentConstraintName == constraintName)
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsValidCvr(string? cvr) =>
        cvr is { Length: 8 } && cvr.All(char.IsAsciiDigit);

    private static bool IsValidPhone(string? phone)
    {
        if (string.IsNullOrEmpty(phone)) return false;
        return phone.StartsWith('+') &&
               phone.Length is >= 8 and <= 16 &&
               phone[1..].All(char.IsAsciiDigit);
    }

    private static AccessRequestDto MapToDto(AccessRequest entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        Cvr = entity.Cvr,
        Categories = entity.Categories,
        Location = entity.Location,
        ContactPhone = entity.ContactPhone,
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
