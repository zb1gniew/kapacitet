using FluentAssertions;
using Kapacitet.Application.Features.Admin.Services;
using Kapacitet.Domain.Entities;
using Kapacitet.Domain.Enums;
using Kapacitet.Infrastructure.Persistence;
using Kapacitet.Tests.Helpers;

namespace Kapacitet.Tests.Unit;

public class AdminDataServiceTests
{
    [Fact]
    public async Task GetCompaniesAsync_ReturnsProvisionedAndFollowUpRecords()
    {
        var db = TestDbFactory.Create();
        var now = DateTime.UtcNow;

        var provisionedCompany = new Company
        {
            Id = 11,
            Name = "Provisioned Co",
            Cvr = "12345678",
            Categories = ["construction"],
            DefaultLocation = "Aarhus",
            ContactPhone = "+4512345678",
            Status = CompanyStatus.Active,
            CreatedAt = now.AddDays(-2)
        };
        var existingCompany = new Company
        {
            Id = 12,
            Name = "Existing Co",
            Cvr = "87654321",
            Categories = ["electrical"],
            DefaultLocation = "Odense",
            Status = CompanyStatus.Active,
            CreatedAt = now.AddDays(-5)
        };

        db.Companies.AddRange(provisionedCompany, existingCompany);
        db.Users.Add(new User
        {
            Id = 1,
            CompanyId = provisionedCompany.Id,
            Email = "first@provisioned.test",
            Role = UserRole.Admin,
            CreatedAt = now.AddDays(-2)
        });

        db.AccessRequests.AddRange(
            new AccessRequest
            {
                Id = 100,
                Name = "Provisioned Request",
                Cvr = "12345678",
                Categories = ["construction"],
                Location = "Aarhus",
                ContactPhone = "+4512345678",
                ContactEmail = "request@provisioned.test",
                Status = AccessRequestStatus.Approved,
                CreatedAt = now.AddDays(-4),
                ReviewedAt = now.AddHours(-1),
                ReviewedBy = "admin@kapacitet.net",
                ProvisionedCompanyId = provisionedCompany.Id
            },
            new AccessRequest
            {
                Id = 101,
                Name = "Needs Follow Up",
                Cvr = "11112222",
                Categories = ["painting"],
                Location = "Copenhagen",
                ContactPhone = "+4599999999",
                ContactEmail = "followup@test.com",
                Status = AccessRequestStatus.Approved,
                CreatedAt = now.AddDays(-3),
                ReviewedAt = now.AddHours(-2),
                ReviewedBy = "operator@kapacitet.net"
            });
        await db.SaveChangesAsync();

        var service = new AdminDataService(db);

        var result = await service.GetCompaniesAsync();

        result.Should().HaveCount(3);
        result[0].CompanyName.Should().Be("Provisioned Co");
        result[0].Status.Should().Be("Provisioned");
        result[0].RequestId.Should().Be(100);
        result[0].ContactEmail.Should().Be("first@provisioned.test");

        result[1].CompanyName.Should().Be("Needs Follow Up");
        result[1].Status.Should().Be("Needs follow-up");
        result[1].ProvisionedCompanyId.Should().BeNull();
        result[1].ContactEmail.Should().Be("followup@test.com");

        result[2].CompanyName.Should().Be("Existing Co");
        result[2].Status.Should().Be("Provisioned");
        result[2].ContactEmail.Should().Be("Not available");
        result[2].RequestId.Should().BeNull();
    }

    [Fact]
    public async Task GetAuditEventsAsync_ReturnsSubmissionReviewAndProvisioningEvents()
    {
        var db = TestDbFactory.Create();
        var now = DateTime.UtcNow;

        db.Companies.Add(new Company
        {
            Id = 25,
            Name = "Provisioned Co",
            Categories = ["construction"],
            DefaultLocation = "Aarhus",
            Status = CompanyStatus.Active,
            CreatedAt = now.AddHours(-3)
        });
        db.Users.Add(new User
        {
            Id = 25,
            CompanyId = 25,
            Email = "admin@provisioned.test",
            Role = UserRole.Admin,
            CreatedAt = now.AddHours(-3)
        });
        db.AccessRequests.AddRange(
            new AccessRequest
            {
                Id = 200,
                Name = "Approved Request",
                Cvr = "12345678",
                Categories = ["construction"],
                Location = "Aarhus",
                ContactPhone = "+4512345678",
                ContactEmail = "approved@test.com",
                Status = AccessRequestStatus.Approved,
                CreatedAt = now.AddDays(-2),
                ReviewedAt = now.AddHours(-1),
                ReviewedBy = "reviewer@test.com",
                ProvisionedCompanyId = 25
            },
            new AccessRequest
            {
                Id = 201,
                Name = "Rejected Request",
                Cvr = "87654321",
                Categories = ["painting"],
                Location = "Odense",
                ContactPhone = "+4588888888",
                ContactEmail = "rejected@test.com",
                Status = AccessRequestStatus.Rejected,
                CreatedAt = now.AddDays(-1),
                ReviewedAt = now.AddHours(-2),
                ReviewedBy = "reviewer@test.com",
                RejectionReason = "Missing verification"
            });
        await db.SaveChangesAsync();

        var service = new AdminDataService(db);

        var events = await service.GetAuditEventsAsync();

        events.Should().ContainSingle(e => e.Id == "submission-200" && e.Type == "Submission");
        events.Should().ContainSingle(e => e.Id == "approval-200" && e.Type == "Approval" && e.Actor == "reviewer@test.com");
        events.Should().ContainSingle(e =>
            e.Id == "rejection-201" &&
            e.Type == "Rejection" &&
            e.Detail.Contains("Missing verification"));
        events.Should().ContainSingle(e =>
            e.Id == "provisioning-company-25" &&
            e.Type == "Provisioning" &&
            e.RequestId == 200 &&
            e.ContactEmail == "admin@provisioned.test");
    }
}
