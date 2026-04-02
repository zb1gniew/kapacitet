using Kapacitet.Infrastructure.Keycloak;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/account")]
public class AccountSetupController : ControllerBase
{
    private readonly KeycloakAdminClient _keycloakClient;

    public AccountSetupController(KeycloakAdminClient keycloakClient)
    {
        _keycloakClient = keycloakClient;
    }

    [HttpGet("check-new")]
    public async Task<IActionResult> CheckNewUser([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return CreateBadRequest("Email is required.");

        var isFirstTimeUser = await _keycloakClient.IsFirstTimeUserAsync(email);
        return Ok(new CheckNewUserResponse(isFirstTimeUser));
    }

    [HttpPost("set-initial-password")]
    public async Task<IActionResult> SetInitialPassword(
        [FromBody] SetInitialPasswordRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Email))
            return CreateBadRequest("Email is required.");

        if (string.IsNullOrWhiteSpace(body.Password) || body.Password.Length < 8)
            return CreateBadRequest("Password must be at least 8 characters.");

        var isFirstTimeUser = await _keycloakClient.IsFirstTimeUserAsync(body.Email);
        if (!isFirstTimeUser)
            return CreateBadRequest("This account has already been set up.");

        await _keycloakClient.SetPermanentPasswordAsync(body.Email, body.Password);

        return Ok(new MessageResponse("Password set successfully. You can now sign in."));
    }

    private IActionResult CreateBadRequest(string message) =>
        BadRequest(new MessageResponse(message));
}

public sealed class SetInitialPasswordRequest
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public sealed record CheckNewUserResponse(bool IsFirstTimeUser);

public sealed record MessageResponse(string Message);
