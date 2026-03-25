using Kapacitet.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kapacitet.Infrastructure.Persistence.Configurations;

public class MatchOfferConfiguration : IEntityTypeConfiguration<MatchOffer>
{
    public void Configure(EntityTypeBuilder<MatchOffer> builder)
    {
        builder.ToTable("match_offers");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.OfferedQuantity).IsRequired();
        builder.Property(m => m.MatchScore).IsRequired();
        builder.Property(m => m.SkillScore).IsRequired();
        builder.Property(m => m.CertificateScore).IsRequired();
        builder.Property(m => m.DateScore).IsRequired();
        builder.Property(m => m.LocationScore).IsRequired();
        builder.Property(m => m.QuantityScore).IsRequired();
        builder.Property(m => m.MatchedSkillCount).IsRequired();
        builder.Property(m => m.RequiredSkillCount).IsRequired();
        builder.Property(m => m.MatchedCertificateCount).IsRequired();
        builder.Property(m => m.RequiredCertificateCount).IsRequired();
        builder.Property(m => m.CoversFullPeriod).IsRequired();
        builder.Property(m => m.IsPartial).IsRequired();
        builder.Property(m => m.Explanation)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(m => m.Status)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(m => m.CreatedAt).IsRequired();
        builder.Property(m => m.ExpiresAt).IsRequired();
        builder.Property(m => m.RequesterReviewedAt);
        builder.Property(m => m.SupplierReviewedAt);

        builder.HasOne(m => m.Request)
            .WithMany(r => r.MatchOffers)
            .HasForeignKey(m => m.RequestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.Availability)
            .WithMany(a => a.MatchOffers)
            .HasForeignKey(m => m.AvailabilityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(m => new { m.RequestId, m.AvailabilityId });
    }
}
