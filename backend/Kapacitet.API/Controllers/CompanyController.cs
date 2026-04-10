using Kapacitet.Application.Features.CompanySettings.DTOs;
using Kapacitet.Application.Features.CompanySettings.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/company")]
[Authorize]
public class CompanyController : ControllerBase
{
    private readonly CompanyService _service;

    public CompanyController(CompanyService service)
    {
        _service = service;
    }

    private string GetEmail() =>
        User.FindFirst("email")?.Value
            ?? throw new UnauthorizedAccessException("email claim missing");

    [HttpGet("information")]
    public async Task<IActionResult> GetInformation()
    {
        var result = await _service.GetInformationAsync(GetEmail());
        return Ok(result);
    }

    [HttpPut("information")]
    public async Task<IActionResult> UpdateInformation(
        [FromBody] UpdateCompanyInformationDto dto)
    {
        var result = await _service.UpdateInformationAsync(GetEmail(), dto);
        return Ok(result);
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetParticipationSettings()
    {
        var result = await _service.GetParticipationSettingsAsync(GetEmail());
        return Ok(result);
    }

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateParticipationSettings(
        [FromBody] CompanyParticipationSettingsDto dto)
    {
        var result = await _service.UpdateParticipationSettingsAsync(GetEmail(), dto);
        return Ok(result);
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotificationPreferences()
    {
        var result = await _service.GetNotificationPreferencesAsync(GetEmail());
        return Ok(result);
    }

    [HttpPut("notifications")]
    public async Task<IActionResult> UpdateNotificationPreferences(
        [FromBody] NotificationPreferencesDto dto)
    {
        var result = await _service.UpdateNotificationPreferencesAsync(GetEmail(), dto);
        return Ok(result);
    }

    [HttpGet("activity")]
    public async Task<IActionResult> GetActivity([FromQuery] int limit = 10)
    {
        var result = await _service.GetActivityAsync(GetEmail(), limit);
        return Ok(result);
    }
}
