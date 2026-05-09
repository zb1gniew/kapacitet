using Kapacitet.Application.Features.AccountSetup.Services;
using Kapacitet.Application.Features.Notifications.Services;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/account")]
public class AccountSetupController : ControllerBase
{
    private readonly InitialPasswordSetupService _setupService;
    private readonly PasswordResetService _passwordResetService;
    private readonly EmailService _emailService;

    public AccountSetupController(
        InitialPasswordSetupService setupService,
        PasswordResetService passwordResetService,
        EmailService emailService)
    {
        _setupService = setupService;
        _passwordResetService = passwordResetService;
        _emailService = emailService;
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

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Email))
            return CreateBadRequest("Email is required.");

        // Issue token — always return 200 regardless of whether email exists (avoid enumeration).
        var token = await _passwordResetService.IssueTokenAsync(body.Email);
        if (token is not null)
        {
            await _emailService.SendPasswordResetEmailAsync(body.Email.Trim(), token);
        }

        return Ok(new MessageResponse("If an account exists for this email, a reset link has been sent."));
    }

    [HttpGet("password-reset-context")]
    public async Task<IActionResult> GetPasswordResetContext([FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return CreateBadRequest("Token is required.");

        var email = await _passwordResetService.GetEmailForTokenAsync(token);
        if (email is null)
            return CreateBadRequest("This password reset link is invalid or expired.");

        return Ok(new InitialPasswordSetupContextResponse(email));
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Token))
            return CreateBadRequest("Token is required.");

        if (string.IsNullOrWhiteSpace(body.Password) || body.Password.Length < 8)
            return CreateBadRequest("Password must be at least 8 characters.");

        var result = await _passwordResetService.ResetPasswordAsync(body.Token, body.Password);
        if (result == PasswordResetResult.InvalidToken)
            return CreateBadRequest("This password reset link is invalid or expired.");

        return Ok(new MessageResponse("Password reset successfully. You can now sign in."));
    }

    private IActionResult CreateBadRequest(string message) =>
        BadRequest(new MessageResponse(message));
}

public sealed class SetInitialPasswordRequest
{
    public string Token { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public sealed class ForgotPasswordRequest
{
    public string Email { get; set; } = null!;
}

public sealed class ResetPasswordRequest
{
    public string Token { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public sealed record InitialPasswordSetupContextResponse(string Email);

public sealed record MessageResponse(string Message);
