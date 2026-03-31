using Kapacitet.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kapacitet.Infrastructure.Persistence.Configurations;

public class CertificateConfiguration : IEntityTypeConfiguration<Certificate>
{
    public void Configure(EntityTypeBuilder<Certificate> builder)
    {
        builder.ToTable("certificates");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Code)
            .HasMaxLength(64);

        builder.Property(c => c.Category)
            .HasMaxLength(32);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(64);

        builder.HasIndex(c => c.Code)
            .IsUnique()
            .HasFilter("\"Code\" IS NOT NULL");
    }
}
