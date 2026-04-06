using Kapacitet.API.Auth;
using Kapacitet.Application.Features.AdminPreferences.DTOs;
using Kapacitet.Application.Features.AdminPreferences.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/admin/preferences/platform")]
[Authorize(Policy = AuthorizationRoles.PlatformAdminPolicy)]
public class AdminPreferencesController : ControllerBase
{
    private readonly PlatformAdminPreferencesService _service;

    public AdminPreferencesController(PlatformAdminPreferencesService service)
    {
        _service = service;
    }

    private string GetEmail() =>
        User.FindFirst("email")?.Value
            ?? throw new UnauthorizedAccessException("email claim missing");

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var result = await _service.GetAsync(GetEmail());
        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update(
        [FromBody] PlatformAdminPreferencesDto dto)
    {
        var result = await _service.UpdateAsync(GetEmail(), dto);
        return Ok(result);
    }
}
