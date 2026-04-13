using Kapacitet.API.Auth;
using Kapacitet.Application.Features.Admin.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = AuthorizationRoles.PlatformAdminPolicy)]
public class AdminDataController : ControllerBase
{
    private readonly AdminDataService _service;

    public AdminDataController(AdminDataService service)
    {
        _service = service;
    }

    [HttpGet("companies")]
    public async Task<IActionResult> GetCompanies()
    {
        var result = await _service.GetCompaniesAsync();
        return Ok(result);
    }

    [HttpGet("audit")]
    public async Task<IActionResult> GetAudit()
    {
        var result = await _service.GetAuditEventsAsync();
        return Ok(result);
    }
}
