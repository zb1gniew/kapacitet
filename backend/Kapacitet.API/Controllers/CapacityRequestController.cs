using Kapacitet.Application.Features.CapacityRequests.DTOs;
using Kapacitet.Application.Features.CapacityRequests.Services;
using Kapacitet.Application.Features.Common.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/requests")]
[Authorize]
public class CapacityRequestController : ControllerBase
{
    private readonly CapacityRequestService _service;
    private readonly CurrentUserService _currentUser;

    public CapacityRequestController(
        CapacityRequestService service,
        CurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    private string GetEmail() =>
        User.FindFirst("email")?.Value
            ?? throw new UnauthorizedAccessException("email claim missing");

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCapacityRequestDto dto)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _service.CreateAsync(dto, companyId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("publish")]
    public async Task<IActionResult> PublishNew([FromBody] CreateCapacityRequestDto dto)
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
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCapacityRequestDto dto)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _service.UpdateAsync(id, dto, companyId);
        return Ok(result);
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _service.CancelAsync(id, companyId);
        return Ok(result);
    }

    [HttpPost("{id}/publish")]
    public async Task<IActionResult> Publish(int id)
    {
        var companyId = await _currentUser.GetCompanyIdAsync(GetEmail());
        var result = await _service.PublishAsync(id, companyId);
        return Ok(result);
    }
}
