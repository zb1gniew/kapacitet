using Kapacitet.Application.Features.Onboarding.DTOs;
using Kapacitet.Application.Features.Onboarding.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/onboarding")]
[Authorize]
public class OnboardingController : ControllerBase
{
    private readonly OnboardingService _service;

    public OnboardingController(OnboardingService service)
    {
        _service = service;
    }

    private string GetEmail() =>
        User.FindFirst("email")?.Value
            ?? throw new UnauthorizedAccessException("email claim missing");

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var result = await _service.GetOnboardingStatusAsync(GetEmail());
        return Ok(result);
    }

    [HttpPost("complete")]
    public async Task<IActionResult> Complete([FromBody] CompleteOnboardingDto? dto)
    {
        var result = await _service.CompleteOnboardingAsync(GetEmail(), dto);

        if (result.IsAlreadyCompleted)
            return Conflict(new { message = "Onboarding has already been completed." });

        if (result.Errors.Count > 0)
            return BadRequest(new { message = string.Join(" ", result.Errors), errors = result.Errors });

        return Ok();
    }
}
