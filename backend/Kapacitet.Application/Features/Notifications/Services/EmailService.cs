using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Resend;

namespace Kapacitet.Application.Features.Notifications.Services;

public class EmailService
{
    private readonly AppDbContext _db;
    private readonly IResend _resend;
    private readonly EmailOptions _options;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        AppDbContext db,
        IResend resend,
        IOptions<EmailOptions> options,
        ILogger<EmailService> logger)
    {
        _db = db;
        _resend = resend;
        _options = options.Value;
        _logger = logger;
    }

    // ── Trigger 1: User approved ──────────────────────────────────────────────
    public async Task SendApprovalEmailAsync(string toEmail, string companyName, string setupToken)
    {
        var loginUrl = System.Net.WebUtility.HtmlEncode(_options.AppUrl);
        var setupUrl = System.Net.WebUtility.HtmlEncode(
            $"{_options.AppUrl.TrimEnd('/')}/?setupToken={Uri.EscapeDataString(setupToken)}");
        var subject = "You're approved — welcome to Kapacitet";
        var body = $"""
            <h2>Welcome to Kapacitet, {System.Net.WebUtility.HtmlEncode(companyName)}!</h2>
            <p>Your access request has been approved and your account is ready.</p>
            <p>
              Start by setting your password here:
              <a href="{setupUrl}">{setupUrl}</a>
            </p>
            <p>This secure setup link is tied to <strong>{System.Net.WebUtility.HtmlEncode(toEmail)}</strong> and expires in 48 hours.</p>
            <p>After setting your password, sign in at <a href="{loginUrl}">{loginUrl}</a>.</p>
            """;

        await SendAsync(toEmail, subject, body);
    }

    // ── Trigger 2: New matches found ──────────────────────────────────────────
    public async Task SendNewMatchEmailIfEnabledAsync(int companyId, int matchOfferId)
    {
        if (!await IsEmailEnabledAsync(companyId, p => p.EmailNewMatches))
            return;

        var email = await GetCompanyAdminEmailAsync(companyId);
        if (email == null) return;

        var subject = "New capacity match found";
        var body = $"""
            <h2>A new match has been found</h2>
            <p>Log in to Kapacitet to review match #{matchOfferId} and accept or decline.</p>
            """;

        await SendAsync(email, subject, body);
    }

    // ── Trigger 3a: Supplier must confirm ────────────────────────────────────
    public async Task SendSupplierConfirmationEmailIfEnabledAsync(int supplierCompanyId, int matchOfferId)
    {
        if (!await IsEmailEnabledAsync(supplierCompanyId, p => p.EmailActionsRequired))
            return;

        var email = await GetCompanyAdminEmailAsync(supplierCompanyId);
        if (email == null) return;

        var subject = "Action required: confirm a capacity match";
        var body = $"""
            <h2>A company has accepted your availability offer</h2>
            <p>Please log in to Kapacitet to confirm or decline match #{matchOfferId}.</p>
            """;

        await SendAsync(email, subject, body);
    }

    // ── Trigger 3b: Both parties — agreement confirmed ────────────────────────
    public async Task SendAgreementConfirmedEmailIfEnabledAsync(
        int requesterCompanyId,
        int supplierCompanyId,
        int matchOfferId,
        DateTime startDate,
        DateTime endDate)
    {
        var formattedStart = startDate.ToString("yyyy-MM-dd");
        var formattedEnd = endDate.ToString("yyyy-MM-dd");
        var subject = "Cooperation confirmed";
        var body = $"""
            <h2>Cooperation agreement confirmed</h2>
            <p>Match #{matchOfferId} has been confirmed by both parties.</p>
            <p><strong>Start:</strong> {formattedStart}<br/>
               <strong>End:</strong> {formattedEnd}</p>
            <p>Log in to Kapacitet to view the full agreement details.</p>
            """;

        foreach (var companyId in new[] { requesterCompanyId, supplierCompanyId })
        {
            if (!await IsEmailEnabledAsync(companyId, p => p.EmailActionsRequired))
                continue;

            var email = await GetCompanyAdminEmailAsync(companyId);
            if (email == null) continue;

            try
            {
                await SendAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to send agreement confirmation email for company {CompanyId} and match {MatchOfferId}",
                    companyId,
                    matchOfferId);
            }
        }
    }

    // ── Trigger 4: 48h reminder ───────────────────────────────────────────────
    public async Task SendCooperationReminderEmailIfEnabledAsync(
        int companyId,
        int agreementId,
        DateTime startDate)
    {
        if (!await IsEmailEnabledAsync(companyId, p => p.EmailUpcomingCooperation))
            return;

        var email = await GetCompanyAdminEmailAsync(companyId);
        if (email == null) return;

        var subject = "Reminder: cooperation starts in 48 hours";
        var body = $"""
            <h2>Your cooperation starts soon</h2>
            <p>Agreement #{agreementId} begins on <strong>{startDate:yyyy-MM-dd}</strong>.</p>
            <p>Log in to Kapacitet to review the details.</p>
            """;

        await SendAsync(email, subject, body);
    }

    // ── Trigger 5a: Requester — their requests is in the network ──────────────────
    public async Task SendNetworkEscalationEmailIfEnabledAsync(int requesterCompanyId, int requestId)
    {
        if (!await IsEmailEnabledAsync(requesterCompanyId, p => p.EmailNetworkRequests))
            return;

        var email = await GetCompanyAdminEmailAsync(requesterCompanyId);
        if (email == null) return;

        var subject = "Your request has been escalated to the network";
        var body = $"""
            <h2>No immediate match found</h2>
            <p>Your capacity request #{requestId} has been escalated to the broader network.</p>
            <p>Log in to Kapacitet to monitor incoming responses.</p>
            """;

        await SendAsync(email, subject, body);
    }

    // ── Trigger 5b: Recipient — urgent request in the network waiting ───────────────────
    public async Task SendNetworkEscalationOutreachEmailIfEnabledAsync(int recipientCompanyId, int requestId)
    {
        if (!await IsEmailEnabledAsync(recipientCompanyId, p => p.EmailNetworkRequests))
            return;

        var email = await GetCompanyAdminEmailAsync(recipientCompanyId);
        if (email == null) return;

        var subject = "Urgent network request — action needed";
        var body = $"""
            <h2>A high-priority request needs your response</h2>
            <p>An urgent capacity request #{requestId} has been escalated to the network.</p>
            <p>Log in to Kapacitet to review and respond.</p>
            """;

        await SendAsync(email, subject, body);
    }

    // ── Shared helpers ────────────────────────────────────────────────────────
    private async Task SendAsync(string to, string subject, string htmlBody)
    {
        if (_options.DevMode)
        {
            _logger.LogInformation(
                "[EMAIL DEV] To={To} Subject={Subject} Body={Body}",
                to, subject, htmlBody);
            return;
        }

        var message = new EmailMessage
        {
            From = $"{_options.FromName} <{_options.FromAddress}>",
            Subject = subject,
            HtmlBody = htmlBody,
        };
        message.To.Add(to);

        await _resend.EmailSendAsync(message);
        _logger.LogInformation("Email sent to {To} — Subject: {Subject}", to, subject);
    }

    private async Task<string?> GetCompanyAdminEmailAsync(int companyId)
    {
        return await _db.Users
            .Where(u => u.CompanyId == companyId && u.Role == Domain.Enums.UserRole.Admin)
            .Select(u => u.Email)
            .FirstOrDefaultAsync();
    }

    private async Task<bool> IsEmailEnabledAsync(
        int companyId,
        Func<Domain.Entities.NotificationPreferences, bool> selector)
    {
        var prefs = await _db.NotificationPreferences
            .FirstOrDefaultAsync(p => p.CompanyId == companyId);
        return prefs == null || selector(prefs);
    }
}
