using FluentAssertions;
using Kapacitet.Application.Features.Notifications;
using Kapacitet.Application.Features.Notifications.Services;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Resend;

namespace Kapacitet.Tests.Integration;

public class CooperationReminderServiceTests
{
    private static ServiceProvider BuildProvider(AppDbContext db, Mock<IResend> resendMock)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton(db);
        services.AddSingleton(resendMock.Object);
        services.Configure<EmailOptions>(o => { o.DevMode = false; o.FromAddress = "test@resend.dev"; o.FromName = "Test"; });
        services.AddScoped<EmailService>();
        services.AddScoped<NotificationService>();
        return services.BuildServiceProvider();
    }

    private static async Task<CooperationAgreement> SeedAgreement(AppDbContext db, DateTime startDate, DateTime? reminderSentAt = null)
    {
        foreach (var (id, email) in new[] { (1, "req@test.com"), (2, "sup@test.com") })
        {
            if (!db.Companies.Any(c => c.Id == id))
            {
                db.Companies.Add(new Company { Id = id, Name = $"Firma{id}", Industry = "IT", DefaultLocation = "Warsaw", Status = CompanyStatus.Active, CreatedAt = DateTime.UtcNow });
                db.Users.Add(new User { Id = id, CompanyId = id, Email = email, Role = UserRole.Admin, CreatedAt = DateTime.UtcNow });
            }
        }

        var request = new CapacityRequest { Id = 1, CompanyId = 1, ResourceType = ResourceType.Worker, Quantity = 1, StartDate = startDate, EndDate = startDate.AddDays(30), LocationCity = "Warsaw", Status = ListingStatus.Active, CreatedAt = DateTime.UtcNow };
        var avail = new AvailabilityDeclaration { Id = 1, CompanyId = 2, ResourceType = ResourceType.Worker, Quantity = 1, StartDate = startDate, EndDate = startDate.AddDays(30), LocationCity = "Warsaw", Status = ListingStatus.Active, CreatedAt = DateTime.UtcNow };
        var offer = new MatchOffer { Id = 1, RequestId = 1, AvailabilityId = 1, OfferedQuantity = 1, Status = MatchStatus.AgreementCreated, Explanation = "Test match" };
        var agreement = new CooperationAgreement
        {
            Id = 1,
            MatchOfferId = 1,
            RequestId = 1,
            AvailabilityId = 1,
            RequesterCompanyId = 1,
            SupplierCompanyId = 2,
            StartDate = startDate,
            EndDate = startDate.AddDays(30),
            Quantity = 1,
            Status = AgreementStatus.Active,
            CreatedAt = DateTime.UtcNow,
            ConfirmedAt = DateTime.UtcNow,
            ReminderEmailSentAt = reminderSentAt
        };

        db.CapacityRequests.Add(request);
        db.AvailabilityDeclarations.Add(avail);
        db.MatchOffers.Add(offer);
        db.CooperationAgreements.Add(agreement);
        await db.SaveChangesAsync();
        return agreement;
    }

    [Fact]
    public async Task ProcessReminders_WhenAgreementIn48hWindow_SendsEmails()
    {
        var db = TestDbFactory.Create();
        var startDate = DateTime.UtcNow.AddHours(48);
        await SeedAgreement(db, startDate);

        var resendMock = new Mock<IResend>();
        var provider = BuildProvider(db, resendMock);
        var svc = new CooperationReminderService(provider.GetRequiredService<IServiceScopeFactory>(), NullLogger<CooperationReminderService>.Instance);

        await svc.TestProcessReminders(CancellationToken.None);

        resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        db.CooperationAgreements.Single().ReminderEmailSentAt.Should().NotBeNull();
        db.Notifications.Should().Contain(n => n.Type == NotificationType.UpcomingCooperation);
        db.Notifications.Count(n => n.Type == NotificationType.UpcomingCooperation).Should().Be(2);
    }

    [Fact]
    public async Task ProcessReminders_WhenReminderAlreadySent_SkipsEmail()
    {
        var db = TestDbFactory.Create();
        var startDate = DateTime.UtcNow.AddHours(48);
        await SeedAgreement(db, startDate, reminderSentAt: DateTime.UtcNow.AddHours(-1));

        var resendMock = new Mock<IResend>();
        var provider = BuildProvider(db, resendMock);
        var svc = new CooperationReminderService(provider.GetRequiredService<IServiceScopeFactory>(), NullLogger<CooperationReminderService>.Instance);

        await svc.TestProcessReminders(CancellationToken.None);

        resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessReminders_WhenAgreementOutsideWindow_SkipsEmail()
    {
        var db = TestDbFactory.Create();
        var startDate = DateTime.UtcNow.AddHours(72); // too far out
        await SeedAgreement(db, startDate);

        var resendMock = new Mock<IResend>();
        var provider = BuildProvider(db, resendMock);
        var svc = new CooperationReminderService(provider.GetRequiredService<IServiceScopeFactory>(), NullLogger<CooperationReminderService>.Instance);

        await svc.TestProcessReminders(CancellationToken.None);

        resendMock.Verify(r => r.EmailSendAsync(It.IsAny<EmailMessage>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
