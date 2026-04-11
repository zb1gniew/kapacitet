using Kapacitet.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kapacitet.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.CompanyId).IsRequired();

        builder.Property(n => n.Type)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(n => n.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(n => n.Body)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(n => n.IsRead)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(n => n.CreatedAt).IsRequired();

        builder.Property(n => n.Metadata)
            .HasColumnType("jsonb");

        builder.HasOne(n => n.Company)
            .WithMany(c => c.Notifications)
            .HasForeignKey(n => n.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(n => new { n.CompanyId, n.IsRead });
    }
}