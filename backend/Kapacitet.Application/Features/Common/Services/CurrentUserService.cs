using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.Common.Services;

public class CurrentUserService
{
    private readonly AppDbContext _db;

    public CurrentUserService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<int> GetCompanyIdAsync(string email)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == email)
            ?? throw new UnauthorizedAccessException($"User {email} not found");

        return user.CompanyId;
    }
}