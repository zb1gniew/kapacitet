using Kapacitet.Application.Features.Common.Services;
using Kapacitet.Application.Features.Matching.Services;
using Kapacitet.API.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/agreements")]
[Authorize(Policy = AuthorizationRoles.CompanyViewerPolicy)]
public class AgreementController : ControllerBase
{
    private readonly MatchingService _matchingService;
    private readonly CurrentUserService _currentUser;

    public AgreementController(MatchingService matchingService, CurrentUserService currentUser)
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
        var result = await _matchingService.GetAgreementsForCompanyAsync(companyId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _matchingService.GetAgreementByIdAsync(id, companyId);
        return Ok(result);
    }
}
