using Kapacitet.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kapacitet.Infrastructure.Persistence.Configurations;

public class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.ToTable("companies");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(c => c.LogoUrl)
            .HasColumnType("text");

        builder.Property(c => c.Industry)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(c => c.DefaultLocation)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(c => c.Status)
            .HasConversion<string>();

        builder.Property(c => c.CreatedAt)
            .IsRequired();
    }
}