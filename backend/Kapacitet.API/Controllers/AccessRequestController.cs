using Kapacitet.Application.Features.AccessRequests.DTOs;
using Kapacitet.Application.Features.AccessRequests.Services;
using Kapacitet.API.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccessRequestController : ControllerBase
{
    private readonly AccessRequestService _service;

    public AccessRequestController(AccessRequestService service)
    {
        _service = service;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Submit([FromBody] SubmitAccessRequestDto dto)
    {
        var result = await _service.SubmitAsync(dto);
        return CreatedAtAction(nameof(Submit), new { id = result.Id }, result);
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationRoles.PlatformAdminPolicy)]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    [HttpPost("{id}/resend-setup-email")]
    [Authorize(Policy = AuthorizationRoles.PlatformAdminPolicy)]
    public async Task<IActionResult> ResendSetupEmail(int id)
    {
        await _service.ResendSetupEmailAsync(id);
        return NoContent();
    }

    [HttpPost("{id}/review")]
    [Authorize(Policy = AuthorizationRoles.PlatformAdminPolicy)]
    public async Task<IActionResult> Review(int id, [FromBody] ReviewAccessRequestDto dto)
    {
        var reviewedBy = User.FindFirst("email")?.Value
        ?? User.FindFirst("preferred_username")?.Value
        ?? "unknown";

        var result = await _service.ReviewAsync(id, dto, reviewedBy);
        return Ok(result);
    }
}
