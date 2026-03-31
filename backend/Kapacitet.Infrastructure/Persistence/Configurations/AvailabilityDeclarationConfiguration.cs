using Kapacitet.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kapacitet.Infrastructure.Persistence.Configurations;

public class AvailabilityDeclarationConfiguration : IEntityTypeConfiguration<AvailabilityDeclaration>
{
    public void Configure(EntityTypeBuilder<AvailabilityDeclaration> builder)
    {
        builder.ToTable("availability_declarations");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.ClientDraftKey)
            .HasMaxLength(64);

        builder.Property(a => a.ResourceType)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(a => a.StartDate).IsRequired();
        builder.Property(a => a.EndDate).IsRequired();

        builder.Property(a => a.LocationCity)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(a => a.LocationRadiusKm).IsRequired();
        builder.Property(a => a.Quantity).IsRequired();
        builder.Property(a => a.ExperienceLevel)
            .HasMaxLength(16);

        builder.Property(a => a.Status)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(a => a.CreatedAt).IsRequired();
        builder.Property(a => a.PublishedAt);

        builder.HasOne(a => a.Company)
            .WithMany(c => c.AvailabilityDeclarations)
            .HasForeignKey(a => a.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => new { a.CompanyId, a.ClientDraftKey })
            .IsUnique()
            .HasFilter("\"ClientDraftKey\" IS NOT NULL");

        // Many-to-many Skills
        builder.HasMany(a => a.Skills)
            .WithMany()
            .UsingEntity(j => j.ToTable("availability_skills"));

        // Many-to-many Certificates
        builder.HasMany(a => a.Certificates)
            .WithMany()
            .UsingEntity(j => j.ToTable("availability_certificates"));
    }
}
