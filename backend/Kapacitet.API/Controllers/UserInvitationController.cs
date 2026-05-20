using Kapacitet.API.Auth;
using Kapacitet.Application.Features.UserInvitations.DTOs;
using Kapacitet.Application.Features.UserInvitations.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/company")]
[Authorize(Policy = AuthorizationRoles.CompanyAdminPolicy)]
public class UserInvitationController : ControllerBase
{
    private readonly UserInvitationService _service;

    public UserInvitationController(UserInvitationService service)
    {
        _service = service;
    }

    private string GetEmail() =>
        User.FindFirst("email")?.Value
            ?? throw new UnauthorizedAccessException("email claim missing");

    [HttpGet("members")]
    public async Task<IActionResult> GetMembers()
    {
        var result = await _service.GetMembersAsync(GetEmail());
        return Ok(result);
    }

    [HttpGet("invitations")]
    public async Task<IActionResult> GetInvitations()
    {
        var result = await _service.GetPendingInvitationsAsync(GetEmail());
        return Ok(result);
    }

    [HttpPost("invitations")]
    public async Task<IActionResult> Invite([FromBody] InviteUserDto dto)
    {
        var result = await _service.InviteAsync(GetEmail(), dto);
        return Ok(result);
    }

    [HttpDelete("invitations/{id:int}")]
    public async Task<IActionResult> Cancel(int id)
    {
        await _service.CancelAsync(id, GetEmail());
        return NoContent();
    }
}
