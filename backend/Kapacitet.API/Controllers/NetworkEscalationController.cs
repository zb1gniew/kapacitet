using Kapacitet.Application.Features.Common.Services;
using Kapacitet.Application.Features.NetworkEscalations.DTOs;
using Kapacitet.Application.Features.NetworkEscalations.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/network-escalations")]
[Authorize]
public class NetworkEscalationController : ControllerBase
{
    private readonly NetworkEscalationService _service;
    private readonly CurrentUserService _currentUser;

    public NetworkEscalationController(
        NetworkEscalationService service,
        CurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    private string GetEmail() =>
        User.FindFirst("email")?.Value
            ?? throw new UnauthorizedAccessException("email claim missing");

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _service.GetForCompanyAsync(companyId);
        return Ok(result);
    }

    [HttpPost("{id}/respond")]
    public async Task<IActionResult> Respond(
        int id,
        [FromBody] SubmitNetworkResponseDto dto)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _service.SubmitResponseAsync(id, companyId, dto);
        return Ok(result);
    }
}
