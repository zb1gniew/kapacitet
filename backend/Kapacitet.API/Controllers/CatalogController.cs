using Kapacitet.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/catalog")]
[Authorize]
public class CatalogController : ControllerBase
{
    private readonly AppDbContext _db;

    public CatalogController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("skills")]
    public async Task<IActionResult> GetSkills()
    {
        Response.Headers.CacheControl = "private, max-age=3600";

        var skills = await _db.Skills
            .OrderBy(skill => skill.Name)
            .Select(skill => new CatalogItemDto(
                skill.Id,
                skill.Name,
                skill.Code,
                skill.Category))
            .ToListAsync();

        return Ok(skills);
    }

    [HttpGet("certificates")]
    public async Task<IActionResult> GetCertificates()
    {
        Response.Headers.CacheControl = "private, max-age=3600";

        var certificates = await _db.Certificates
            .OrderBy(certificate => certificate.Name)
            .Select(certificate => new CatalogItemDto(
                certificate.Id,
                certificate.Name,
                certificate.Code,
                certificate.Category))
            .ToListAsync();

        return Ok(certificates);
    }

    private sealed record CatalogItemDto(
        int Id,
        string Name,
        string? Code,
        string? Category);
}
