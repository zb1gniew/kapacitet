using FluentAssertions;
using Kapacitet.Application.Features.Common.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Tests.Helpers;

namespace Kapacitet.Tests.Unit;

public class CurrentUserServiceTests
{
    private static User SeedUser(AppDbContext db)
    {
        var company = new Company
        {
            Id = 1,
            Name = "Kapacitet",
            Categories = ["construction"],
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        var user = new User
        {
            Id = 7,
            CompanyId = company.Id,
            Email = "admin@test.com",
            Role = UserRole.Manager,
            CreatedAt = DateTime.UtcNow
        };

        db.Companies.Add(company);
        db.Users.Add(user);
        db.SaveChanges();
        return user;
    }

    [Fact]
    public async Task GetCurrentUserAsync_WhenUserExists_ReturnsCurrentUserContext()
    {
        var db = TestDbFactory.Create();
        var user = SeedUser(db);
        var service = new CurrentUserService(db);

        var result = await service.GetCurrentUserAsync(user.Email);

        result.Id.Should().Be(user.Id);
        result.CompanyId.Should().Be(user.CompanyId);
        result.Role.Should().Be(UserRole.Manager);
    }

    [Fact]
    public async Task GetCompanyIdAsync_WhenUserDoesNotExist_ThrowsUnauthorized()
    {
        var db = TestDbFactory.Create();
        var service = new CurrentUserService(db);

        var act = async () => await service.GetCompanyIdAsync("missing@test.com");

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
