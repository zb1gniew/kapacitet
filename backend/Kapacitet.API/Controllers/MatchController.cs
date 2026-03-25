using Kapacitet.Application.Features.Common.Services;
using Kapacitet.Application.Features.Matching.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/matches")]
[Authorize]
public class MatchController : ControllerBase
{
    private readonly MatchingService _matchingService;
    private readonly CurrentUserService _currentUser;

    public MatchController(MatchingService matchingService, CurrentUserService currentUser)
    {
        _matchingService = matchingService;
        _currentUser = currentUser;
    }

    private string GetEmail() =>
        User.FindFirst("email")?.Value
            ?? throw new UnauthorizedAccessException("email claim missing");

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _matchingService.GetMatchesForCompanyAsync(companyId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _matchingService.GetMatchByIdAsync(id, companyId);
        return Ok(result);
    }

    [HttpGet("/api/requests/{requestId}/matches")]
    public async Task<IActionResult> GetForRequest(int requestId)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _matchingService.GetMatchesForRequestAsync(requestId, companyId);
        return Ok(result);
    }

    [HttpPost("{id}/accept")]
    public async Task<IActionResult> Accept(int id)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _matchingService.AcceptAsRequesterAsync(id, companyId);
        return Ok(result);
    }

    [HttpPost("{id}/decline")]
    public async Task<IActionResult> Decline(int id)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _matchingService.DeclineAsRequesterAsync(id, companyId);
        return Ok(result);
    }

    [HttpPost("{id}/supplier-confirm")]
    public async Task<IActionResult> SupplierConfirm(int id)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _matchingService.ConfirmAsSupplierAsync(id, companyId);
        return Ok(result);
    }

    [HttpPost("{id}/supplier-decline")]
    public async Task<IActionResult> SupplierDecline(int id)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _matchingService.DeclineAsSupplierAsync(id, companyId);
        return Ok(result);
    }
}
