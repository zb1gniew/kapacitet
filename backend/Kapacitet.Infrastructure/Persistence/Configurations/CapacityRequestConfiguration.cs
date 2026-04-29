using Kapacitet.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kapacitet.Infrastructure.Persistence.Configurations;

public class CapacityRequestConfiguration : IEntityTypeConfiguration<CapacityRequest>
{
    public void Configure(EntityTypeBuilder<CapacityRequest> builder)
    {
        builder.ToTable("capacity_requests");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.ClientDraftKey)
            .HasMaxLength(64);

        builder.Property(r => r.ResourceType)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(r => r.StartDate).IsRequired();
        builder.Property(r => r.EndDate).IsRequired();

        builder.Property(r => r.LocationCity)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(r => r.LocationRadiusKm).IsRequired();
        builder.Property(r => r.Quantity).IsRequired();
        builder.Property(r => r.ExperienceLevel)
            .HasMaxLength(16);

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(r => r.Urgency)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(r => r.CreatedAt).IsRequired();
        builder.Property(r => r.PublishedAt);

        builder.HasOne(r => r.Company)
            .WithMany(c => c.CapacityRequests)
            .HasForeignKey(r => r.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => new { r.CompanyId, r.ClientDraftKey })
            .IsUnique()
            .HasFilter("\"ClientDraftKey\" IS NOT NULL");

        builder.HasIndex(r => r.Status);

        // Many-to-many Skills
        builder.HasMany(r => r.Skills)
            .WithMany()
            .UsingEntity(j => j.ToTable("request_skills"));

        // Many-to-many Certificates
        builder.HasMany(r => r.Certificates)
            .WithMany()
            .UsingEntity(j => j.ToTable("request_certificates"));
    }
}
