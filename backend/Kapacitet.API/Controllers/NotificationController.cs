using Kapacitet.Application.Features.Common.Services;
using Kapacitet.Application.Features.Notifications.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly NotificationService _notificationService;
    private readonly CurrentUserService _currentUser;

    public NotificationController(NotificationService notificationService, CurrentUserService currentUser)
    {
        _notificationService = notificationService;
        _currentUser = currentUser;
    }

    private string GetEmail() =>
        User.FindFirst("email")?.Value
            ?? throw new UnauthorizedAccessException("email claim missing");

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _notificationService.GetForCompanyAsync(companyId, ct);
        return Ok(result);
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkRead(int id, CancellationToken ct)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        await _notificationService.MarkAsReadAsync(id, companyId, ct);
        return Ok();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        await _notificationService.MarkAllAsReadAsync(companyId, ct);
        return Ok();
    }
}