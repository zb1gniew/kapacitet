using FluentAssertions;
using Kapacitet.Application.Features.Notifications;
using Kapacitet.Application.Features.Notifications.Services;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Tests.Helpers;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Resend;

namespace Kapacitet.Tests.Unit;

public class EmailServiceTests
{
    private readonly Mock<IResend> _resendMock = new();

    private EmailService CreateService(AppDbContext db, bool devMode = true)
    {
        var options = Options.Create(new EmailOptions
        {
            ApiKey = "test",
            FromAddress = "test@resend.dev",
            FromName = "Test",
            DevMode = devMode
        });
        return new EmailService(db, _resendMock.Object, options, NullLogger<EmailService>.Instance);
    }

    // ── DevMode ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task SendApprovalEmail_DevMode_DoesNotCallResend()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        var svc = CreateService(db, devMode: true);

        await svc.SendApprovalEmailAsync("test@test.com", "Firma", "setup-token");

        _resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SendApprovalEmail_NotDevMode_CallsResend()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        var svc = CreateService(db, devMode: false);

        EmailMessage? sentMessage = null;
        _resendMock
            .Setup(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()))
            .Callback<EmailMessage, CancellationToken>((message, _) => sentMessage = message)
            .Returns(Task.FromResult<ResendResponse<Guid>>(null!));

        await svc.SendApprovalEmailAsync("test@test.com", "Firma", "setup-token");

        _resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Once);
        sentMessage.Should().NotBeNull();
        sentMessage!.Subject.Should().Be("You're approved — welcome to Kapacitet");
        sentMessage.HtmlBody.Should().Contain("setupToken=setup-token");
        sentMessage.HtmlBody.Should().Contain("expires in 48 hours");
    }

    // ── Preference checks ────────────────────────────────────────────────────

    [Fact]
    public async Task SendNewMatch_WhenEmailNewMatchesFalse_SkipsEmail()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        var company = new Company { Id = 1, Name = "X", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow };
        var user = new User { Id = 1, CompanyId = 1, Email = "admin@firma.com", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow };
        var prefs = new NotificationPreferences { Id = 1, CompanyId = 1, EmailNewMatches = false };
        db.Companies.Add(company);
        db.Users.Add(user);
        db.NotificationPreferences.Add(prefs);
        await db.SaveChangesAsync();

        var svc = CreateService(db, devMode: false);
        await svc.SendNewMatchEmailIfEnabledAsync(1, 99);

        _resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SendNewMatch_WhenNoPrefRow_SendsEmail()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        var company = new Company { Id = 1, Name = "X", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow };
        var user = new User { Id = 1, CompanyId = 1, Email = "admin@firma.com", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow };
        db.Companies.Add(company);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var svc = CreateService(db, devMode: false);
        await svc.SendNewMatchEmailIfEnabledAsync(1, 99);

        _resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SendNewMatch_WhenNoAdminUser_SkipsEmail()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        var company = new Company { Id = 1, Name = "X", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow };
        db.Companies.Add(company);
        await db.SaveChangesAsync();

        var svc = CreateService(db, devMode: false);
        await svc.SendNewMatchEmailIfEnabledAsync(1, 99);

        _resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SendNetworkEscalation_WhenEmailNetworkRequestsFalse_SkipsEmail()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        var company = new Company { Id = 1, Name = "X", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow };
        var user = new User { Id = 1, CompanyId = 1, Email = "admin@firma.com", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow };
        var prefs = new NotificationPreferences { Id = 1, CompanyId = 1, EmailNetworkRequests = false };
        db.Companies.Add(company);
        db.Users.Add(user);
        db.NotificationPreferences.Add(prefs);
        await db.SaveChangesAsync();

        var svc = CreateService(db, devMode: false);
        await svc.SendNetworkEscalationEmailIfEnabledAsync(1, 5);

        _resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ── SendSupplierConfirmationEmailIfEnabledAsync ──────────────────────────

    [Fact]
    public async Task SendSupplierConfirmation_WhenEmailActionsRequiredTrue_SendsEmail()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        var company = new Company { Id = 1, Name = "X", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow };
        var user = new User { Id = 1, CompanyId = 1, Email = "sup@firma.com", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow };
        db.Companies.Add(company);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var svc = CreateService(db, devMode: false);
        await svc.SendSupplierConfirmationEmailIfEnabledAsync(1, 42);

        _resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SendSupplierConfirmation_WhenEmailActionsRequiredFalse_SkipsEmail()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        var company = new Company { Id = 1, Name = "X", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow };
        var user = new User { Id = 1, CompanyId = 1, Email = "sup@firma.com", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow };
        var prefs = new NotificationPreferences { Id = 1, CompanyId = 1, EmailActionsRequired = false };
        db.Companies.Add(company);
        db.Users.Add(user);
        db.NotificationPreferences.Add(prefs);
        await db.SaveChangesAsync();

        var svc = CreateService(db, devMode: false);
        await svc.SendSupplierConfirmationEmailIfEnabledAsync(1, 42);

        _resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SendSupplierConfirmation_WhenNoAdminUser_SkipsEmail()
    {
        var db = TestDbFactory.Create();
        var company = new Company { Id = 1, Name = "X", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow };
        db.Companies.Add(company);
        await db.SaveChangesAsync();

        var svc = CreateService(db, devMode: false);
        await svc.SendSupplierConfirmationEmailIfEnabledAsync(1, 42);

        _resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SendAgreementConfirmed_SendsEmailToBothCompanies()
    {
        await using var db = await TestDbFactory.CreatePostgresAsync();
        foreach (var (id, email) in new[] { (1, "req@firma.com"), (2, "sup@firma.com") })
        {
            db.Companies.Add(new Company { Id = id, Name = "X", Industry = "Y", DefaultLocation = "Z", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow });
            db.Users.Add(new User { Id = id, CompanyId = id, Email = email, Role = UserRole.Admin, CreatedAt = DateTime.UtcNow });
        }
        await db.SaveChangesAsync();

        var svc = CreateService(db, devMode: false);
        await svc.SendAgreementConfirmedEmailIfEnabledAsync(1, 2, 42, DateTime.UtcNow.AddDays(10), DateTime.UtcNow.AddDays(30));

        _resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }
}
