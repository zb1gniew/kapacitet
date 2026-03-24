using Kapacitet.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kapacitet.Infrastructure.Persistence.Configurations;

public class AccessRequestConfiguration : IEntityTypeConfiguration<AccessRequest>
{
    public void Configure(EntityTypeBuilder<AccessRequest> builder)
    {
        builder.ToTable("access_requests");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Name)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(a => a.Industry)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(a => a.Location)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(a => a.ContactEmail)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(a => a.Message)
            .HasColumnType("text");

        builder.Property(a => a.Status)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(a => a.ReviewedBy)
            .HasMaxLength(32);

        builder.Property(a => a.ReviewedAt);
        builder.Property(a => a.CreatedAt).IsRequired();
    }
}