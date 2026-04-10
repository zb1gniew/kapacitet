using Kapacitet.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kapacitet.Infrastructure.Persistence.Configurations;

public class CompanySettingsConfiguration : IEntityTypeConfiguration<CompanySettings>
{
    public void Configure(EntityTypeBuilder<CompanySettings> builder)
    {
        builder.ToTable("company_settings");

        builder.HasKey(s => s.Id);

        builder.HasIndex(s => s.CompanyId)
            .IsUnique();

        builder.Property(s => s.ReceiveCapacityRequests).IsRequired();
        builder.Property(s => s.ParticipateInNetworkWide).IsRequired();
        builder.Property(s => s.AllowPartialMatches).IsRequired();

        builder.HasOne(s => s.Company)
            .WithOne(c => c.CompanySettings)
            .HasForeignKey<CompanySettings>(s => s.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
