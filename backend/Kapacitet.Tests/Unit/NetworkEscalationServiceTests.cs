using FluentAssertions;
using Kapacitet.Application.Features.NetworkEscalations.DTOs;
using Kapacitet.Application.Features.NetworkEscalations.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Tests.Helpers;

namespace Kapacitet.Tests.Unit;

public class NetworkEscalationServiceTests
{
    private static void SeedCompany(AppDbContext db, int id)
    {
        db.Companies.Add(new Company
        {
            Id = id,
            Name = $"Co{id}",
            Industry = "IT",
            DefaultLocation = "Warsaw",
            Status = CompanyStatus.Active,
            CreatedAt = DateTime.UtcNow
        });
    }

    private static void SeedEscalation(
        AppDbContext db,
        int requestId,
        int requesterCompanyId,
        NetworkEscalationStatus status = NetworkEscalationStatus.Open)
    {
        db.CapacityRequests.Add(new CapacityRequest
        {
            Id = requestId,
            CompanyId = requesterCompanyId,
            ResourceType = ResourceType.Worker,
            Quantity = 1,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            LocationCity = "Warsaw",
            Status = ListingStatus.Active,
            CreatedAt = DateTime.UtcNow
        });
        db.NetworkEscalations.Add(new NetworkEscalation
        {
            Id = requestId,
            RequestId = requestId,
            TriggeredAt = DateTime.UtcNow,
            Status = status
        });
    }

    [Fact]
    public async Task SubmitResponse_WhenOwnRequest_ThrowsUnauthorized()
    {
        var db = TestDbFactory.Create();
        SeedCompany(db, 1);
        SeedEscalation(db, requestId: 1, requesterCompanyId: 1);
        await db.SaveChangesAsync();

        var act = async () => await new NetworkEscalationService(db)
            .SubmitResponseAsync(1, 1, new SubmitNetworkResponseDto { ResponseType = NetworkResponseType.CanHelp });

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task SubmitResponse_WhenEscalationClosed_ThrowsInvalidOperation()
    {
        var db = TestDbFactory.Create();
        SeedCompany(db, 1);
        SeedCompany(db, 2);
        SeedEscalation(db, requestId: 1, requesterCompanyId: 1, status: NetworkEscalationStatus.Resolved);
        await db.SaveChangesAsync();

        var act = async () => await new NetworkEscalationService(db)
            .SubmitResponseAsync(1, 2, new SubmitNetworkResponseDto { ResponseType = NetworkResponseType.CanHelp });

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task SubmitResponse_WhenValid_AddsResponseToDb()
    {
        var db = TestDbFactory.Create();
        SeedCompany(db, 1);
        SeedCompany(db, 2);
        SeedEscalation(db, requestId: 1, requesterCompanyId: 1);
        await db.SaveChangesAsync();

        await new NetworkEscalationService(db)
            .SubmitResponseAsync(1, 2, new SubmitNetworkResponseDto { ResponseType = NetworkResponseType.CanHelp });

        db.NetworkResponses.Count().Should().Be(1);
        db.NetworkResponses.Single().ResponseType.Should().Be(NetworkResponseType.CanHelp);
    }

    [Fact]
    public async Task SubmitResponse_WhenDuplicate_ThrowsInvalidOperation()
    {
        var db = TestDbFactory.Create();
        SeedCompany(db, 1);
        SeedCompany(db, 2);
        SeedEscalation(db, requestId: 1, requesterCompanyId: 1);
        await db.SaveChangesAsync();
        var svc = new NetworkEscalationService(db);
        await svc.SubmitResponseAsync(1, 2, new SubmitNetworkResponseDto { ResponseType = NetworkResponseType.CanHelp });

        var act = async () => await svc.SubmitResponseAsync(1, 2, new SubmitNetworkResponseDto { ResponseType = NetworkResponseType.CanHelp });

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task GetForCompany_ExcludesOwnRequests()
    {
        var db = TestDbFactory.Create();
        SeedCompany(db, 1);
        SeedEscalation(db, requestId: 1, requesterCompanyId: 1);
        await db.SaveChangesAsync();

        var result = await new NetworkEscalationService(db).GetForCompanyAsync(1);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetForCompany_WhenCompanyNotFound_ThrowsUnauthorized()
    {
        var db = TestDbFactory.Create();
        var act = async () => await new NetworkEscalationService(db).GetForCompanyAsync(999);
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task GetForCompany_WhenEscalationOpen_ReturnsForEligibleCompany()
    {
        var db = TestDbFactory.Create();
        SeedCompany(db, 1); // requester
        SeedCompany(db, 2); // recipient
        SeedEscalation(db, requestId: 1, requesterCompanyId: 1);
        await db.SaveChangesAsync();

        var result = await new NetworkEscalationService(db).GetForCompanyAsync(2);

        result.Should().HaveCount(1);
    }
}