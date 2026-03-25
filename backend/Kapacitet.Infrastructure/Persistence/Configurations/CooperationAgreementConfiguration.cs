using Kapacitet.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kapacitet.Infrastructure.Persistence.Configurations;

public class CooperationAgreementConfiguration : IEntityTypeConfiguration<CooperationAgreement>
{
    public void Configure(EntityTypeBuilder<CooperationAgreement> builder)
    {
        builder.ToTable("cooperation_agreements");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.MatchOfferId).IsRequired();
        builder.Property(a => a.StartDate).IsRequired();
        builder.Property(a => a.EndDate).IsRequired();
        builder.Property(a => a.Quantity).IsRequired();

        builder.Property(a => a.Status)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(a => a.CreatedAt).IsRequired();
        builder.Property(a => a.ConfirmedAt).IsRequired();

        builder.HasOne(a => a.MatchOffer)
            .WithOne(m => m.CooperationAgreement)
            .HasForeignKey<CooperationAgreement>(a => a.MatchOfferId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Request)
            .WithMany()
            .HasForeignKey(a => a.RequestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Availability)
            .WithMany()
            .HasForeignKey(a => a.AvailabilityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.SupplierCompany)
            .WithMany()
            .HasForeignKey(a => a.SupplierCompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.RequesterCompany)
            .WithMany()
            .HasForeignKey(a => a.RequesterCompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => a.MatchOfferId).IsUnique();
    }
}
