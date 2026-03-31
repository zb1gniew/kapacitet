using Kapacitet.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kapacitet.Infrastructure.Persistence.Configurations;

public class SkillConfiguration : IEntityTypeConfiguration<Skill>
{
    public void Configure(EntityTypeBuilder<Skill> builder)
    {
        builder.ToTable("skills");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Code)
            .HasMaxLength(64);

        builder.Property(s => s.Category)
            .HasMaxLength(32);

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(64);

        builder.HasIndex(s => s.Code)
            .IsUnique()
            .HasFilter("\"Code\" IS NOT NULL");
    }
}
