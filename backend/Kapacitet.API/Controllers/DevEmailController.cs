using Kapacitet.API.Auth;
using Kapacitet.API.Infrastructure;
using Kapacitet.Application.Features.Notifications.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/dev/email")]
[Authorize(Policy = AuthorizationRoles.PlatformAdminPolicy)]
[ApiExplorerSettings(IgnoreApi = true)]
public class DevEmailController : ControllerBase
{
    private readonly EmailService _emailService;
    private readonly IHostEnvironment _environment;
    private readonly DevelopmentFeaturesOptions _developmentFeatures;

    public DevEmailController(
        EmailService emailService,
        IHostEnvironment environment,
        IOptions<DevelopmentFeaturesOptions> developmentFeatures)
    {
        _emailService = emailService;
        _environment = environment;
        _developmentFeatures = developmentFeatures.Value;
    }

    private bool IsEnabled =>
        _environment.IsDevelopment() && _developmentFeatures.EnableDevEndpoints;

    // Test Trigger 1: user approval
    // Body: { "toEmail": "test@example.com", "companyName": "Test Sp. z o.o.", "temporaryPassword": "Test1234!" }
    [HttpPost("approval")]
    public async Task<IActionResult> TestApproval([FromBody] TestApprovalRequest req)
    {
        if (!IsEnabled) return NotFound();
        await _emailService.SendApprovalEmailAsync(req.ToEmail, req.CompanyName, req.TemporaryPassword);
        return Ok(new { sent = true, to = req.ToEmail });
    }

    // Test Trigger 2: new match
    // Body: { "companyId": 1, "matchOfferId": 42 }
    [HttpPost("new-match")]
    public async Task<IActionResult> TestNewMatch([FromBody] TestMatchRequest req)
    {
        if (!IsEnabled) return NotFound();
        await _emailService.SendNewMatchEmailIfEnabledAsync(req.CompanyId, req.MatchOfferId);
        return Ok(new { sent = true, companyId = req.CompanyId });
    }

    // Test Trigger 3a: supplier must confirm
    // Body: { "supplierCompanyId": 2, "matchOfferId": 42 }
    [HttpPost("supplier-confirmation")]
    public async Task<IActionResult> TestSupplierConfirmation([FromBody] TestSupplierRequest req)
    {
        if (!IsEnabled) return NotFound();
        await _emailService.SendSupplierConfirmationEmailIfEnabledAsync(req.SupplierCompanyId, req.MatchOfferId);
        return Ok(new { sent = true, supplierCompanyId = req.SupplierCompanyId });
    }

    // Test Trigger 3b: agreement confirmed
    // Body: { "requesterCompanyId": 1, "supplierCompanyId": 2, "matchOfferId": 42, "startDate": "2026-05-01", "endDate": "2026-05-31" }
    [HttpPost("agreement-confirmed")]
    public async Task<IActionResult> TestAgreementConfirmed([FromBody] TestAgreementRequest req)
    {
        if (!IsEnabled) return NotFound();
        await _emailService.SendAgreementConfirmedEmailIfEnabledAsync(
            req.RequesterCompanyId, req.SupplierCompanyId, req.MatchOfferId,
            req.StartDate, req.EndDate);
        return Ok(new { sent = true });
    }

    // Test Trigger 4: 48h reminder
    // Body: { "companyId": 1, "agreementId": 7, "startDate": "2026-04-15" }
    [HttpPost("reminder")]
    public async Task<IActionResult> TestReminder([FromBody] TestReminderRequest req)
    {
        if (!IsEnabled) return NotFound();
        await _emailService.SendCooperationReminderEmailIfEnabledAsync(
            req.CompanyId, req.AgreementId, req.StartDate);
        return Ok(new { sent = true, companyId = req.CompanyId });
    }
    // Test Trigger 5a: requester — request escalated to network
    // Body: { "companyId": 1, "requestId": 5 }
    [HttpPost("network-escalation")]
    public async Task<IActionResult> TestNetworkEscalation([FromBody] TestNetworkRequest req)
    {
        if (!IsEnabled) return NotFound();
        await _emailService.SendNetworkEscalationEmailIfEnabledAsync(req.CompanyId, req.RequestId);
        return Ok(new { sent = true, companyId = req.CompanyId });
    }

    // Test Trigger 5b: recipient — urgent network request outreach
    // Body: { "companyId": 2, "requestId": 5 }
    [HttpPost("network-outreach")]
    public async Task<IActionResult> TestNetworkOutreach([FromBody] TestNetworkRequest req)
    {
        if (!IsEnabled) return NotFound();
        await _emailService.SendNetworkEscalationOutreachEmailIfEnabledAsync(req.CompanyId, req.RequestId);
        return Ok(new { sent = true, companyId = req.CompanyId });
    }
}

// ── Request DTOs ────────────────────────────────────────────────────────────
public record TestApprovalRequest(string ToEmail, string CompanyName, string TemporaryPassword);
public record TestMatchRequest(int CompanyId, int MatchOfferId);
public record TestSupplierRequest(int SupplierCompanyId, int MatchOfferId);
public record TestAgreementRequest(int RequesterCompanyId, int SupplierCompanyId, int MatchOfferId, DateTime StartDate, DateTime EndDate);
public record TestReminderRequest(int CompanyId, int AgreementId, DateTime StartDate);
public record TestNetworkRequest(int CompanyId, int RequestId);
