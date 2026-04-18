using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Kapacitet.Application.Features.Common.Services;

public class CurrentUserService
{
    private readonly AppDbContext _db;

    public CurrentUserService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<CurrentUserContext> GetCurrentUserAsync(string email)
    {
        var user = await _db.Users
            .AsNoTracking()
            .WhereEmailMatches(email)
            .Select(u => new CurrentUserContext(u.Id, u.CompanyId, u.Role))
            .FirstOrDefaultAsync()
            ?? throw new UnauthorizedAccessException($"User {email} not found");

        return user;
    }

    public async Task<int> GetCompanyIdAsync(string email)
    {
        return (await GetCurrentUserAsync(email)).CompanyId;
    }
}

public sealed record CurrentUserContext(int Id, int CompanyId, UserRole Role);
