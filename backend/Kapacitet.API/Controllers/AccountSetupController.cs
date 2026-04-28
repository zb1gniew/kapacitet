using Kapacitet.Application.Features.AccountSetup.Services;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/account")]
public class AccountSetupController : ControllerBase
{
    private readonly InitialPasswordSetupService _setupService;

    public AccountSetupController(InitialPasswordSetupService setupService)
    {
        _setupService = setupService;
    }

    [HttpGet("setup-context")]
    public async Task<IActionResult> GetSetupContext([FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return CreateBadRequest("Token is required.");

        var context = await _setupService.GetContextAsync(token);
        if (context is null)
            return CreateBadRequest("This password setup link is invalid or expired.");

        return Ok(new InitialPasswordSetupContextResponse(context.Email));
    }

    [HttpPost("set-initial-password")]
    public async Task<IActionResult> SetInitialPassword(
        [FromBody] SetInitialPasswordRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Token))
            return CreateBadRequest("Token is required.");

        if (string.IsNullOrWhiteSpace(body.Password) || body.Password.Length < 8)
            return CreateBadRequest("Password must be at least 8 characters.");

        var result = await _setupService.SetInitialPasswordAsync(body.Token, body.Password);
        if (result == InitialPasswordSetupResult.InvalidToken)
            return CreateBadRequest("This password setup link is invalid or expired.");
        if (result == InitialPasswordSetupResult.AlreadyCompleted)
            return CreateBadRequest("This account has already been set up.");

        return Ok(new MessageResponse("Password set successfully. You can now sign in."));
    }

    private IActionResult CreateBadRequest(string message) =>
        BadRequest(new MessageResponse(message));
}

public sealed class SetInitialPasswordRequest
{
    public string Token { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public sealed record InitialPasswordSetupContextResponse(string Email);

public sealed record MessageResponse(string Message);
