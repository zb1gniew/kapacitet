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

        builder.Property(m => m.MatchScore).IsRequired();

        builder.Property(m => m.Status)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(m => m.CreatedAt).IsRequired();

        builder.HasOne(m => m.Request)
            .WithMany(r => r.MatchOffers)
            .HasForeignKey(m => m.RequestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.Availability)
            .WithMany(a => a.MatchOffers)
            .HasForeignKey(m => m.AvailabilityId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}