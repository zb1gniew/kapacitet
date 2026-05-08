using FluentAssertions;
using Kapacitet.Application.Features.AccountSetup.Services;
using Kapacitet.Application.Features.AccessRequests.DTOs;
using Kapacitet.Application.Features.AccessRequests.Services;
using Kapacitet.Application.Features.Common.Errors;
using Kapacitet.Application.Features.Notifications;
using Kapacitet.Application.Features.Notifications.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Keycloak;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Tests.Helpers;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Resend;
using System.Net;
using System.Net.Http.Json;

namespace Kapacitet.Tests.Unit;

public class AccessRequestServiceTests
{
    private static AccessRequestService CreateService(
        AppDbContext db,
        HttpMessageHandler? keycloakHandler = null)
    {
        var keycloakOptions = Options.Create(new KeycloakAdminOptions
        {
            BaseUrl = "https://auth.localhost",
            Realm = "kapacitet",
            AdminUsername = "admin",
            AdminPassword = "admin"
        });

        var keycloakClient = new KeycloakAdminClient(
            new HttpClient(keycloakHandler ?? new FakeNoOpKeycloakHandler())
            {
                BaseAddress = new Uri("https://auth.localhost")
            },
            keycloakOptions,
            NullLogger<KeycloakAdminClient>.Instance);

        var emailOptions = Options.Create(new EmailOptions
        {
            ApiKey = "test",
            FromAddress = "test@resend.dev",
            FromName = "Kapacitet",
            DevMode = true,
            AppUrl = "https://localhost"
        });

        var emailService = new EmailService(
            db,
            new Mock<IResend>().Object,
            emailOptions,
            NullLogger<EmailService>.Instance);

        var initialPasswordSetupService = new InitialPasswordSetupService(
            db,
            keycloakClient,
            NullLogger<InitialPasswordSetupService>.Instance);

        return new AccessRequestService(
            db,
            keycloakClient,
            NullLogger<AccessRequestService>.Instance,
            emailService,
            initialPasswordSetupService);
    }

    private static SubmitAccessRequestDto CreateSubmitDto() => new()
    {
        Name = "Nordic Build",
        Cvr = "12345678",
        Categories = ["construction"],
        Location = "Aarhus",
        ContactPhone = "+4512345678",
        ContactEmail = "  Admin@Test.com  ",
        Message = "We would like to join."
    };

    [Fact]
    public async Task SubmitAsync_WithValidData_PersistsPendingRequestAndTrimsEmail()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        var service = CreateService(db);

        var result = await service.SubmitAsync(CreateSubmitDto());

        result.Status.Should().Be(AccessRequestStatus.Pending);
        result.ContactEmail.Should().Be("Admin@Test.com");

        var saved = db.AccessRequests.Single();
        saved.Name.Should().Be("Nordic Build");
        saved.ContactEmail.Should().Be("Admin@Test.com");
        saved.Status.Should().Be(AccessRequestStatus.Pending);
    }

    [Fact]
    public async Task SubmitAsync_WhenLocationUnsupported_ThrowsValidationException()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        var service = CreateService(db);
        var dto = CreateSubmitDto();
        dto.Location = "Warsaw";

        var act = async () => await service.SubmitAsync(dto);

        var exception = await act.Should().ThrowAsync<ValidationException>();
        exception.Which.FieldErrors.Should().ContainKey("location");
    }

    [Fact]
    public async Task SubmitAsync_WhenCvrInvalid_ThrowsValidationException()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        var service = CreateService(db);
        var dto = CreateSubmitDto();
        dto.Cvr = "123";

        var act = async () => await service.SubmitAsync(dto);

        var exception = await act.Should().ThrowAsync<ValidationException>();
        exception.Which.FieldErrors.Should().ContainKey("cvr");
    }

    [Fact]
    public async Task SubmitAsync_WhenPhoneInvalid_ThrowsValidationException()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        var service = CreateService(db);
        var dto = CreateSubmitDto();
        dto.ContactPhone = "4512345678";

        var act = async () => await service.SubmitAsync(dto);

        var exception = await act.Should().ThrowAsync<ValidationException>();
        exception.Which.FieldErrors.Should().ContainKey("contactPhone");
    }

    [Fact]
    public async Task SubmitAsync_WhenCategoriesInvalid_ThrowsValidationException()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        var service = CreateService(db);
        var dto = CreateSubmitDto();
        dto.Categories = ["construction", "electrical", "painting", "roofing"];

        var act = async () => await service.SubmitAsync(dto);

        var exception = await act.Should().ThrowAsync<ValidationException>();
        exception.Which.FieldErrors.Should().ContainKey("categories");
    }

    [Fact]
    public async Task SubmitAsync_WhenPendingRequestExists_ThrowsInvalidOperationException()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        db.AccessRequests.Add(new AccessRequest
        {
            Id = 1,
            Name = "Existing",
            Cvr = "87654321",
            Categories = ["construction"],
            Location = "Aarhus",
            ContactPhone = "+4599999999",
            ContactEmail = "admin@test.com",
            Status = AccessRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var act = async () => await service.SubmitAsync(CreateSubmitDto());

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already pending review*");
    }

    [Fact]
    public async Task GetAllAsync_ReturnsRequestsOrderedNewestFirst()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        db.AccessRequests.AddRange(
            new AccessRequest
            {
                Id = 1,
                Name = "Older",
                Categories = ["construction"],
                Location = "Aarhus",
                ContactEmail = "older@test.com",
                Status = AccessRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new AccessRequest
            {
                Id = 2,
                Name = "Newer",
                Categories = ["electrical"],
                Location = "Odense",
                ContactEmail = "newer@test.com",
                Status = AccessRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.GetAllAsync();

        result.Select(request => request.Name).Should().Equal("Newer", "Older");
    }

    [Fact]
    public async Task ReviewAsync_WhenRejected_SetsReviewMetadataAndReason()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        db.AccessRequests.Add(new AccessRequest
        {
            Id = 10,
            Name = "Pending Request",
            Cvr = "12345678",
            Categories = ["construction"],
            Location = "Aarhus",
            ContactPhone = "+4512345678",
            ContactEmail = "pending@test.com",
            Status = AccessRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.ReviewAsync(
            10,
            new ReviewAccessRequestDto
            {
                Decision = AccessRequestStatus.Rejected,
                RejectionReason = "Missing documents"
            },
            "reviewer@test.com");

        result.Status.Should().Be(AccessRequestStatus.Rejected);
        result.ReviewedBy.Should().Be("reviewer@test.com");
        result.RejectionReason.Should().Be("Missing documents");
        result.ReviewedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task ReviewAsync_WhenAlreadyReviewedWithSameDecision_ReturnsExistingResult()
    {
        var reviewedAt = DateTime.UtcNow.AddHours(-1);
        await using var db = await TestDbFactory.CreatePostgresAsync();
        db.AccessRequests.Add(new AccessRequest
        {
            Id = 20,
            Name = "Reviewed Request",
            Cvr = "12345678",
            Categories = ["construction"],
            Location = "Aarhus",
            ContactPhone = "+4512345678",
            ContactEmail = "reviewed@test.com",
            Status = AccessRequestStatus.Rejected,
            ReviewedBy = "initial-reviewer@test.com",
            ReviewedAt = reviewedAt,
            RejectionReason = "Already rejected",
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.ReviewAsync(
            20,
            new ReviewAccessRequestDto
            {
                Decision = AccessRequestStatus.Rejected,
                RejectionReason = "Ignored"
            },
            "second-reviewer@test.com");

        result.Status.Should().Be(AccessRequestStatus.Rejected);
        result.ReviewedBy.Should().Be("initial-reviewer@test.com");
        result.ReviewedAt.Should().Be(reviewedAt);
        result.RejectionReason.Should().Be("Already rejected");
    }

    [Fact]
    public async Task ReviewAsync_WhenAlreadyApprovedWithSameDecision_ReissuesSetupToken()
    {
        var reviewedAt = DateTime.UtcNow.AddHours(-2);
        await using var db = await TestDbFactory.CreatePostgresAsync();
        db.AccessRequests.Add(new AccessRequest
        {
            Id = 25,
            Name = "Approved Request",
            Cvr = "12345678",
            Categories = ["construction"],
            Location = "Aarhus",
            ContactPhone = "+4512345678",
            ContactEmail = "approved@test.com",
            Status = AccessRequestStatus.Approved,
            ReviewedBy = "initial-reviewer@test.com",
            ReviewedAt = reviewedAt,
            InitialPasswordSetupTokenHash = "old-token-hash",
            InitialPasswordSetupTokenExpiresAt = DateTime.UtcNow.AddHours(-1),
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.ReviewAsync(
            25,
            new ReviewAccessRequestDto
            {
                Decision = AccessRequestStatus.Approved
            },
            "second-reviewer@test.com");

        result.Status.Should().Be(AccessRequestStatus.Approved);
        result.ReviewedBy.Should().Be("initial-reviewer@test.com");
        result.ReviewedAt.Should().Be(reviewedAt);

        var savedRequest = await db.AccessRequests.FindAsync(25);
        savedRequest.Should().NotBeNull();
        savedRequest!.InitialPasswordSetupTokenHash.Should().NotBe("old-token-hash");
        savedRequest.InitialPasswordSetupTokenExpiresAt.Should().BeAfter(DateTime.UtcNow.AddHours(47));
    }

    [Fact]
    public async Task ReviewAsync_WhenAlreadyReviewedWithDifferentDecision_ThrowsInvalidOperationException()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        db.AccessRequests.Add(new AccessRequest
        {
            Id = 30,
            Name = "Reviewed Request",
            Cvr = "12345678",
            Categories = ["construction"],
            Location = "Aarhus",
            ContactPhone = "+4512345678",
            ContactEmail = "reviewed@test.com",
            Status = AccessRequestStatus.Rejected,
            ReviewedBy = "reviewer@test.com",
            ReviewedAt = DateTime.UtcNow.AddHours(-1),
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var act = async () => await service.ReviewAsync(
            30,
            new ReviewAccessRequestDto
            {
                Decision = AccessRequestStatus.Approved
            },
            "another-reviewer@test.com");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Only pending requests can be reviewed");
    }

    [Fact]
    public async Task ReviewAsync_WhenApproved_ProvisionsCompanyUserAndInitialSetupToken()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        db.AccessRequests.Add(new AccessRequest
        {
            Id = 40,
            Name = "Approved Request",
            Cvr = "12345678",
            Categories = ["construction"],
            Location = "Aarhus",
            ContactPhone = "+4512345678",
            ContactEmail = "approved@test.com",
            Status = AccessRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db, new FakeProvisioningKeycloakHandler());

        var result = await service.ReviewAsync(
            40,
            new ReviewAccessRequestDto
            {
                Decision = AccessRequestStatus.Approved
            },
            "reviewer@test.com");

        result.Status.Should().Be(AccessRequestStatus.Approved);
        result.ReviewedBy.Should().Be("reviewer@test.com");

        var savedRequest = await db.AccessRequests.FindAsync(40);
        savedRequest.Should().NotBeNull();
        savedRequest!.ProvisionedCompanyId.Should().NotBeNull();
        savedRequest.InitialPasswordSetupTokenHash.Should().NotBeNullOrWhiteSpace();
        savedRequest.InitialPasswordSetupTokenExpiresAt.Should().BeAfter(DateTime.UtcNow.AddHours(47));

        db.Companies.Should().ContainSingle(company =>
            company.Id == savedRequest.ProvisionedCompanyId &&
            company.Name == "Approved Request");

        db.Users.Should().ContainSingle(user =>
            user.CompanyId == savedRequest.ProvisionedCompanyId &&
            user.Email == "approved@test.com" &&
            user.Role == UserRole.Admin);

        db.CompanySettings.Should().ContainSingle(settings =>
            settings.CompanyId == savedRequest.ProvisionedCompanyId &&
            settings.ReceiveCapacityRequests &&
            settings.ParticipateInNetworkWide &&
            settings.AllowPartialMatches &&
            settings.MatchOutsideCategory);
    }

    private sealed class FakeNoOpKeycloakHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            if (request.Method == HttpMethod.Post &&
                request.RequestUri?.AbsolutePath.EndsWith(
                    "/realms/master/protocol/openid-connect/token",
                    StringComparison.Ordinal) == true)
            {
                return Task.FromResult(Json(HttpStatusCode.OK, new { access_token = "admin-token" }));
            }

            if (request.Method == HttpMethod.Get &&
                request.RequestUri?.AbsolutePath.EndsWith(
                    "/admin/realms/kapacitet/users",
                    StringComparison.Ordinal) == true)
            {
                return Task.FromResult(Json(HttpStatusCode.OK, Array.Empty<object>()));
            }

            throw new InvalidOperationException(
                $"Unexpected Keycloak request in test: {request.Method} {request.RequestUri}");
        }
    }

    private sealed class FakeProvisioningKeycloakHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            if (request.Method == HttpMethod.Post &&
                request.RequestUri?.AbsolutePath.EndsWith(
                    "/realms/master/protocol/openid-connect/token",
                    StringComparison.Ordinal) == true)
            {
                return Task.FromResult(Json(HttpStatusCode.OK, new { access_token = "admin-token" }));
            }

            if (request.Method == HttpMethod.Get &&
                request.RequestUri?.AbsolutePath.EndsWith(
                    "/admin/realms/kapacitet/users",
                    StringComparison.Ordinal) == true)
            {
                return Task.FromResult(Json(HttpStatusCode.OK, Array.Empty<object>()));
            }

            if (request.Method == HttpMethod.Post &&
                request.RequestUri?.AbsolutePath.EndsWith(
                    "/admin/realms/kapacitet/users",
                    StringComparison.Ordinal) == true)
            {
                var response = new HttpResponseMessage(HttpStatusCode.Created);
                response.Headers.Location = new Uri("https://auth.localhost/admin/realms/kapacitet/users/kc-1");
                return Task.FromResult(response);
            }

            if (request.Method == HttpMethod.Put &&
                request.RequestUri?.AbsolutePath.EndsWith(
                    "/admin/realms/kapacitet/users/kc-1/reset-password",
                    StringComparison.Ordinal) == true)
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NoContent));
            }

            throw new InvalidOperationException(
                $"Unexpected Keycloak request in test: {request.Method} {request.RequestUri}");
        }
    }

    private static HttpResponseMessage Json<T>(HttpStatusCode statusCode, T body)
    {
        return new HttpResponseMessage(statusCode)
        {
            Content = JsonContent.Create(body)
        };
    }
}
