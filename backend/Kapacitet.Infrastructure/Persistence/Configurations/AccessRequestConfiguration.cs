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
            .HasMaxLength(150);

        builder.Property(a => a.Cvr)
            .HasMaxLength(8)
            .IsRequired(false);

        builder.Property(a => a.ContactPhone)
            .HasMaxLength(50)
            .IsRequired(false);

        builder.Property(a => a.Categories)
            .HasColumnType("text[]")
            .IsRequired()
            .HasDefaultValueSql("'{}'::text[]");

        builder.Property(a => a.Industry)
            .HasMaxLength(100)
            .IsRequired(false);

        builder.Property(a => a.Location)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.ContactEmail)
            .IsRequired()
            .HasMaxLength(254);

        builder.Property<string>(PersistenceModelConstants.NormalizedContactEmailProperty)
            .IsRequired(false)
            .HasMaxLength(254)
            .HasComputedColumnSql("lower(btrim(\"ContactEmail\"))", stored: true);

        builder.Property(a => a.Message)
            .HasMaxLength(2000);

        builder.Property(a => a.Status)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(a => a.ReviewedBy)
            .HasMaxLength(254);

        builder.Property(a => a.ReviewedAt);
        builder.Property(a => a.CreatedAt).IsRequired();

        builder.Property(a => a.RejectionReason).HasMaxLength(1000);
        builder.Property(a => a.InitialPasswordSetupTokenHash)
            .HasMaxLength(128)
            .IsRequired(false);
        builder.Property(a => a.InitialPasswordSetupTokenExpiresAt)
            .IsRequired(false);

        builder.HasOne<Company>()
            .WithMany()
            .HasForeignKey(a => a.ProvisionedCompanyId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(PersistenceModelConstants.NormalizedContactEmailProperty)
            .IsUnique()
            .HasDatabaseName(PersistenceModelConstants.AccessRequestsPendingNormalizedContactEmailIndex)
            .HasFilter("\"Status\" = 'Pending'");
    }
}
