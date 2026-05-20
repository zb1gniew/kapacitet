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
        var setupUrl = $"{_options.AppUrl.TrimEnd('/')}/?setupToken={Uri.EscapeDataString(setupToken)}";
        var subject = "Du er godkendt — velkommen til KapacitetNet / You're approved — welcome to KapacitetNet";

        var danish = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">Velkommen til KapacitetNet, {H(companyName)}!</h2>
            <p style="margin:0 0 16px;color:#374151;">Din adgangsanmodning er godkendt og din konto er klar.</p>
            <p style="margin:0 0 24px;color:#374151;">Start med at oprette din adgangskode ved at klikke på knappen nedenfor:</p>
            {Btn("Opret adgangskode", setupUrl)}
            <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Dette sikre opsætningslink er knyttet til <strong>{H(toEmail)}</strong> og udløber om 48 timer.</p>
            """;

        var english = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">Welcome to KapacitetNet, {H(companyName)}!</h2>
            <p style="margin:0 0 16px;color:#374151;">Your access request has been approved and your account is ready.</p>
            <p style="margin:0 0 24px;color:#374151;">Start by setting your password using the button below:</p>
            {Btn("Set password", setupUrl)}
            <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">This secure setup link is tied to <strong>{H(toEmail)}</strong> and expires in 48 hours.</p>
            """;

        await SendAsync(toEmail, subject, Wrap(danish, english));
    }

    // ── Trigger 1b: Access request rejected ──────────────────────────────────
    public async Task SendRejectionEmailAsync(string toEmail, string companyName)
    {
        var subject = "Din adgangsanmodning er ikke godkendt / Your access request was not approved";

        var danish = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">Vi har gennemgået din anmodning</h2>
            <p style="margin:0 0 16px;color:#374151;">Tak for din interesse i KapacitetNet, {H(companyName)}.</p>
            <p style="margin:0 0 16px;color:#374151;">Efter en gennemgang af dine oplysninger har vi besluttet ikke at godkende din adgangsanmodning på nuværende tidspunkt.</p>
            <p style="margin:0 0 0;color:#374151;">Du er velkommen til at søge igen på et senere tidspunkt, hvis dine omstændigheder ændrer sig.</p>
            """;

        var english = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">We've reviewed your application</h2>
            <p style="margin:0 0 16px;color:#374151;">Thank you for your interest in KapacitetNet, {H(companyName)}.</p>
            <p style="margin:0 0 16px;color:#374151;">After reviewing your credentials, we have decided not to approve your access request at this time.</p>
            <p style="margin:0 0 0;color:#374151;">You are welcome to apply again in the future if your circumstances change.</p>
            """;

        await SendAsync(toEmail, subject, Wrap(danish, english));
    }

    // ── Trigger 2: Password reset ─────────────────────────────────────────────
    public async Task SendPasswordResetEmailAsync(string toEmail, string resetToken)
    {
        var resetUrl = $"{_options.AppUrl.TrimEnd('/')}/?resetToken={Uri.EscapeDataString(resetToken)}";
        var subject = "Nulstil din adgangskode / Reset your KapacitetNet password";

        var danish = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">Nulstilling af adgangskode</h2>
            <p style="margin:0 0 16px;color:#374151;">Vi har modtaget en anmodning om at nulstille adgangskoden for <strong>{H(toEmail)}</strong>.</p>
            <p style="margin:0 0 24px;color:#374151;">Klik på knappen nedenfor for at oprette en ny adgangskode:</p>
            {Btn("Nulstil adgangskode", resetUrl)}
            <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Dette link udløber om 1 time. Hvis du ikke har anmodet om nulstilling, kan du se bort fra denne e-mail.</p>
            """;

        var english = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">Password reset request</h2>
            <p style="margin:0 0 16px;color:#374151;">We received a request to reset the password for <strong>{H(toEmail)}</strong>.</p>
            <p style="margin:0 0 24px;color:#374151;">Click the button below to set a new password:</p>
            {Btn("Reset password", resetUrl)}
            <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
            """;

        await SendAsync(toEmail, subject, Wrap(danish, english));
    }

    // ── Trigger 3: New matches found ──────────────────────────────────────────
    public async Task SendNewMatchEmailIfEnabledAsync(int companyId, int matchOfferId)
    {
        if (!await IsEmailEnabledAsync(companyId, p => p.EmailNewMatches))
            return;

        var email = await GetCompanyAdminEmailAsync(companyId);
        if (email == null) return;

        var dashboardUrl = $"{_options.AppUrl.TrimEnd('/')}/dashboard/matches";
        var subject = "Nyt kapacitetsmatch fundet / New capacity match found";

        var danish = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">Nyt match fundet</h2>
            <p style="margin:0 0 24px;color:#374151;">Der er fundet et nyt kapacitetsmatch til dig. Log ind på KapacitetNet for at se match #{matchOfferId} og acceptere eller afvise.</p>
            {Btn("Se match", dashboardUrl)}
            """;

        var english = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">New match found</h2>
            <p style="margin:0 0 24px;color:#374151;">A new capacity match has been found for you. Log in to KapacitetNet to review match #{matchOfferId} and accept or decline.</p>
            {Btn("View match", dashboardUrl)}
            """;

        await SendAsync(email, subject, Wrap(danish, english));
    }

    // ── Trigger 3a: Supplier must confirm ────────────────────────────────────
    public async Task SendSupplierConfirmationEmailIfEnabledAsync(int supplierCompanyId, int matchOfferId)
    {
        if (!await IsEmailEnabledAsync(supplierCompanyId, p => p.EmailActionsRequired))
            return;

        var email = await GetCompanyAdminEmailAsync(supplierCompanyId);
        if (email == null) return;

        var dashboardUrl = $"{_options.AppUrl.TrimEnd('/')}/dashboard/matches";
        var subject = "Handling påkrævet: bekræft kapacitetsmatch / Action required: confirm a capacity match";

        var danish = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">Handling påkrævet</h2>
            <p style="margin:0 0 16px;color:#374151;">En virksomhed har accepteret dit kapacitetstilbud.</p>
            <p style="margin:0 0 24px;color:#374151;">Log ind på KapacitetNet for at bekræfte eller afvise match #{matchOfferId}.</p>
            {Btn("Bekræft match", dashboardUrl)}
            """;

        var english = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">Action required</h2>
            <p style="margin:0 0 16px;color:#374151;">A company has accepted your availability offer.</p>
            <p style="margin:0 0 24px;color:#374151;">Please log in to KapacitetNet to confirm or decline match #{matchOfferId}.</p>
            {Btn("Confirm match", dashboardUrl)}
            """;

        await SendAsync(email, subject, Wrap(danish, english));
    }

    // ── Trigger 3b: Both parties — agreement confirmed ────────────────────────
    public async Task SendAgreementConfirmedEmailIfEnabledAsync(
        int requesterCompanyId,
        int supplierCompanyId,
        int matchOfferId,
        DateTime startDate,
        DateTime endDate)
    {
        var formattedStart = startDate.ToString("dd.MM.yyyy");
        var formattedEnd = endDate.ToString("dd.MM.yyyy");
        var dashboardUrl = $"{_options.AppUrl.TrimEnd('/')}/dashboard/matches";
        var subject = "Samarbejde bekræftet / Cooperation confirmed";

        var danish = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">Samarbejdsaftale bekræftet</h2>
            <p style="margin:0 0 16px;color:#374151;">Match #{matchOfferId} er bekræftet af begge parter.</p>
            <table style="margin:0 0 24px;border-collapse:collapse;">
              <tr><td style="padding:4px 16px 4px 0;color:#6b7280;font-size:14px;">Startdato</td><td style="padding:4px 0;font-weight:600;color:#0f2033;">{formattedStart}</td></tr>
              <tr><td style="padding:4px 16px 4px 0;color:#6b7280;font-size:14px;">Slutdato</td><td style="padding:4px 0;font-weight:600;color:#0f2033;">{formattedEnd}</td></tr>
            </table>
            {Btn("Se aftaledetaljer", dashboardUrl)}
            """;

        var english = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">Cooperation agreement confirmed</h2>
            <p style="margin:0 0 16px;color:#374151;">Match #{matchOfferId} has been confirmed by both parties.</p>
            <table style="margin:0 0 24px;border-collapse:collapse;">
              <tr><td style="padding:4px 16px 4px 0;color:#6b7280;font-size:14px;">Start date</td><td style="padding:4px 0;font-weight:600;color:#0f2033;">{formattedStart}</td></tr>
              <tr><td style="padding:4px 16px 4px 0;color:#6b7280;font-size:14px;">End date</td><td style="padding:4px 0;font-weight:600;color:#0f2033;">{formattedEnd}</td></tr>
            </table>
            {Btn("View agreement details", dashboardUrl)}
            """;

        foreach (var companyId in new[] { requesterCompanyId, supplierCompanyId })
        {
            if (!await IsEmailEnabledAsync(companyId, p => p.EmailActionsRequired))
                continue;

            var companyEmail = await GetCompanyAdminEmailAsync(companyId);
            if (companyEmail == null) continue;

            try
            {
                await SendAsync(companyEmail, subject, Wrap(danish, english));
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

        var dashboardUrl = $"{_options.AppUrl.TrimEnd('/')}/dashboard/matches";
        var subject = "Påmindelse: samarbejdet starter om 48 timer / Reminder: cooperation starts in 48 hours";

        var danish = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">Samarbejdet starter snart</h2>
            <p style="margin:0 0 24px;color:#374151;">Aftale #{agreementId} starter den <strong>{startDate:dd.MM.yyyy}</strong>. Log ind for at gennemgå detaljerne.</p>
            {Btn("Se aftale", dashboardUrl)}
            """;

        var english = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">Your cooperation starts soon</h2>
            <p style="margin:0 0 24px;color:#374151;">Agreement #{agreementId} begins on <strong>{startDate:dd.MM.yyyy}</strong>. Log in to review the details.</p>
            {Btn("View agreement", dashboardUrl)}
            """;

        await SendAsync(email, subject, Wrap(danish, english));
    }

    // ── Trigger 5a: Requester — request escalated to network ─────────────────
    public async Task SendNetworkEscalationEmailIfEnabledAsync(int requesterCompanyId, int requestId)
    {
        if (!await IsEmailEnabledAsync(requesterCompanyId, p => p.EmailNetworkRequests))
            return;

        var email = await GetCompanyAdminEmailAsync(requesterCompanyId);
        if (email == null) return;

        var dashboardUrl = $"{_options.AppUrl.TrimEnd('/')}/dashboard/matches";
        var subject = "Din anmodning er sendt til netværket / Your request has been escalated to the network";

        var danish = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">Ingen øjeblikkelig match</h2>
            <p style="margin:0 0 24px;color:#374151;">Din kapacitetsanmodning #{requestId} er sendt videre til det bredere netværk. Log ind for at følge med i indkomne svar.</p>
            {Btn("Se anmodning", dashboardUrl)}
            """;

        var english = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">No immediate match found</h2>
            <p style="margin:0 0 24px;color:#374151;">Your capacity request #{requestId} has been escalated to the broader network. Log in to monitor incoming responses.</p>
            {Btn("View request", dashboardUrl)}
            """;

        await SendAsync(email, subject, Wrap(danish, english));
    }

    // ── Trigger 5b: Recipient — urgent network request ───────────────────────
    public async Task SendNetworkEscalationOutreachEmailIfEnabledAsync(int recipientCompanyId, int requestId)
    {
        if (!await IsEmailEnabledAsync(recipientCompanyId, p => p.EmailNetworkRequests))
            return;

        var email = await GetCompanyAdminEmailAsync(recipientCompanyId);
        if (email == null) return;

        var dashboardUrl = $"{_options.AppUrl.TrimEnd('/')}/dashboard/matches";
        var subject = "Presserende netværksanmodning — handling påkrævet / Urgent network request — action needed";

        var danish = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">Anmodning med høj prioritet</h2>
            <p style="margin:0 0 24px;color:#374151;">En presserende kapacitetsanmodning #{requestId} er eskaleret til netværket. Log ind for at gennemgå og svare.</p>
            {Btn("Se anmodning", dashboardUrl)}
            """;

        var english = $"""
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f2033;">High-priority request needs your response</h2>
            <p style="margin:0 0 24px;color:#374151;">An urgent capacity request #{requestId} has been escalated to the network. Log in to review and respond.</p>
            {Btn("View request", dashboardUrl)}
            """;

        await SendAsync(email, subject, Wrap(danish, english));
    }

    // ── Layout helpers ────────────────────────────────────────────────────────

    private static string H(string value) => System.Net.WebUtility.HtmlEncode(value);

    private static string Btn(string label, string url)
    {
        var encodedUrl = System.Net.WebUtility.HtmlEncode(url);
        return $"""
            <a href="{encodedUrl}" style="display:inline-block;padding:13px 28px;background:#1d4ed8;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:-0.2px;">{label}</a>
            """;
    }

    private string Wrap(string danishContent, string englishContent)
    {
        var appUrl = System.Net.WebUtility.HtmlEncode(_options.AppUrl);
        return $"""
            <!DOCTYPE html>
            <html lang="da">
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
                <tr><td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

                    <!-- Header -->
                    <tr><td style="background:#0f2033;border-radius:12px 12px 0 0;padding:28px 40px;">
                      <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.4px;">KapacitetNet</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;letter-spacing:-0.1px;">Kapacitetskoordinering</p>
                    </td></tr>

                    <!-- Danish content -->
                    <tr><td style="background:#ffffff;padding:40px 40px 32px;">
                      {danishContent}
                    </td></tr>

                    <!-- Divider -->
                    <tr><td style="background:#ffffff;padding:0 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="border-top:1px solid #e5e7eb;padding-top:24px;padding-bottom:8px;">
                            <p style="margin:0;font-size:12px;color:#9ca3af;font-style:italic;">For English version see below</p>
                          </td>
                        </tr>
                      </table>
                    </td></tr>

                    <!-- English content -->
                    <tr><td style="background:#ffffff;padding:24px 40px 40px;border-top:1px solid #f3f4f6;">
                      {englishContent}
                    </td></tr>

                    <!-- Footer -->
                    <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:20px 40px;">
                      <p style="margin:0;font-size:12px;color:#9ca3af;">
                        KapacitetNet &mdash; <a href="{appUrl}" style="color:#6b7280;text-decoration:none;">{appUrl}</a>
                      </p>
                    </td></tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;
    }

    // ── Shared send ───────────────────────────────────────────────────────────
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
