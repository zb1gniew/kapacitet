using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kapacitet.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet("public")]
    public IActionResult Public()
    {
        return Ok(new { message = "Ten endpoint jest publiczny" });
    }

    [Authorize]
    [HttpGet("protected")]
    public IActionResult Protected()
    {
        var username = User.Identity?.Name;
        var claims = User.Claims.Select(c => new { c.Type, c.Value });
        return Ok(new { message = "Jesteœ zalogowany!", username, claims });
    }

    [Authorize(Roles = "admin")]
    [HttpGet("admin-only")]
    public IActionResult AdminOnly()
    {
        return Ok(new { message = "Tylko dla admina!" });
    }
}