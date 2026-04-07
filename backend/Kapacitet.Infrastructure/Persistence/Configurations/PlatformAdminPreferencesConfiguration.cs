using Kapacitet.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kapacitet.Infrastructure.Persistence.Configurations;

public class PlatformAdminPreferencesConfiguration
    : IEntityTypeConfiguration<PlatformAdminPreferences>
{
    public void Configure(EntityTypeBuilder<PlatformAdminPreferences> builder)
    {
        builder.ToTable("platform_admin_preferences");

        builder.HasKey(p => p.Id);

        builder.HasIndex(p => p.UserId)
            .IsUnique();

        builder.Property(p => p.DefaultAccessRequestsTab)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(p => p.DefaultAuditFilter)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(p => p.PrioritizeFollowUpCompanies)
            .IsRequired();

        builder.Property(p => p.HighlightProvisioningAlerts)
            .IsRequired();
    }
}
