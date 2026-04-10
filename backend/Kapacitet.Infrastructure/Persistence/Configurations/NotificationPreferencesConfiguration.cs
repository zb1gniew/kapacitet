using Kapacitet.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kapacitet.Infrastructure.Persistence.Configurations;

public class NotificationPreferencesConfiguration : IEntityTypeConfiguration<NotificationPreferences>
{
    public void Configure(EntityTypeBuilder<NotificationPreferences> builder)
    {
        builder.ToTable("notification_preferences");

        builder.HasKey(n => n.Id);

        builder.HasIndex(n => n.CompanyId)
            .IsUnique();

        builder.Property(n => n.EmailNewMatches).IsRequired();
        builder.Property(n => n.EmailActionsRequired).IsRequired();
        builder.Property(n => n.EmailUpcomingCooperation).IsRequired();
        builder.Property(n => n.InAppNewMatches).IsRequired();
        builder.Property(n => n.InAppActionsRequired).IsRequired();
        builder.Property(n => n.InAppUpcomingCooperation).IsRequired();

        builder.HasOne(n => n.Company)
            .WithOne(c => c.NotificationPreferences)
            .HasForeignKey<NotificationPreferences>(n => n.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
