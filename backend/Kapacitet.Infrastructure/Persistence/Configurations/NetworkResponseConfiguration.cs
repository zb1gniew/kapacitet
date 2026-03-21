using Kapacitet.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kapacitet.Infrastructure.Persistence.Configurations;

public class NetworkResponseConfiguration : IEntityTypeConfiguration<NetworkResponse>
{
    public void Configure(EntityTypeBuilder<NetworkResponse> builder)
    {
        builder.ToTable("network_responses");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.ResponseType)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(r => r.CreatedAt).IsRequired();

        builder.HasOne(r => r.Escalation)
            .WithMany(e => e.Responses)
            .HasForeignKey(r => r.EscalationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Company)
            .WithMany(c => c.NetworkResponses)
            .HasForeignKey(r => r.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}