using Kapacitet.Application.Features.AvailabilityDeclarations.DTOs;
using Kapacitet.Application.Features.AvailabilityDeclarations.Services;
using Kapacitet.Application.Features.Common.Services;
using Kapacitet.API.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/availability")]
[Authorize(Policy = AuthorizationRoles.CompanyViewerPolicy)]
public class AvailabilityDeclarationController : ControllerBase
{
    private readonly AvailabilityDeclarationService _service;
    private readonly CurrentUserService _currentUser;

    public AvailabilityDeclarationController(
        AvailabilityDeclarationService service,
        CurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    private string GetEmail() =>
        User.FindFirst("email")?.Value
            ?? throw new UnauthorizedAccessException("email claim missing");

    [HttpPost]
    [Authorize(Policy = AuthorizationRoles.CompanyManagerPolicy)]
    public async Task<IActionResult> Create([FromBody] CreateAvailabilityDeclarationDto dto)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _service.CreateAsync(dto, companyId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("publish")]
    [Authorize(Policy = AuthorizationRoles.CompanyManagerPolicy)]
    public async Task<IActionResult> PublishNew([FromBody] CreateAvailabilityDeclarationDto dto)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var (result, created) = await _service.PublishNewAsync(dto, companyId);

        return created
            ? CreatedAtAction(nameof(GetById), new { id = result.Id }, result)
            : Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _service.GetAllByCompanyAsync(companyId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _service.GetByIdAsync(id, companyId);
        return Ok(result);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthorizationRoles.CompanyManagerPolicy)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAvailabilityDeclarationDto dto)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _service.UpdateAsync(id, dto, companyId);
        return Ok(result);
    }

    [HttpPost("{id}/publish")]
    [Authorize(Policy = AuthorizationRoles.CompanyManagerPolicy)]
    public async Task<IActionResult> Publish(int id)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _service.PublishAsync(id, companyId);
        return Ok(result);
    }

    [HttpPost("{id}/withdraw")]
    [Authorize(Policy = AuthorizationRoles.CompanyManagerPolicy)]
    public async Task<IActionResult> Withdraw(int id)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _service.WithdrawAsync(id, companyId);
        return Ok(result);
    }
}
