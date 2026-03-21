using Kapacitet.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kapacitet.Infrastructure.Persistence.Configurations;

public class NetworkEscalationConfiguration : IEntityTypeConfiguration<NetworkEscalation>
{
    public void Configure(EntityTypeBuilder<NetworkEscalation> builder)
    {
        builder.ToTable("network_escalations");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.TriggeredAt).IsRequired();

        builder.Property(e => e.Status)
            .HasConversion<string>()
            .IsRequired();

        builder.HasOne(e => e.Request)
            .WithOne(r => r.NetworkEscalation)
            .HasForeignKey<NetworkEscalation>(e => e.RequestId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}