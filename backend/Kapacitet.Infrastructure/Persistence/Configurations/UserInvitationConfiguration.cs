using Kapacitet.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kapacitet.Infrastructure.Persistence.Configurations;

public class UserInvitationConfiguration : IEntityTypeConfiguration<UserInvitation>
{
    public void Configure(EntityTypeBuilder<UserInvitation> builder)
    {
        builder.ToTable("user_invitations");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Email)
            .IsRequired()
            .HasMaxLength(254);

        builder.Property<string>(PersistenceModelConstants.NormalizedInvitationEmailProperty)
            .IsRequired(false)
            .HasMaxLength(254)
            .HasComputedColumnSql("lower(btrim(\"Email\"))", stored: true);

        builder.Property(i => i.Role)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(i => i.InvitationTokenHash)
            .HasMaxLength(128)
            .IsRequired(false);

        builder.Property(i => i.InvitationTokenExpiresAt)
            .IsRequired(false);

        builder.Property(i => i.CreatedAt).IsRequired();

        builder.Property(i => i.AcceptedAt).IsRequired(false);

        builder.HasOne(i => i.Company)
            .WithMany()
            .HasForeignKey(i => i.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(
                PersistenceModelConstants.NormalizedInvitationEmailProperty,
                nameof(UserInvitation.CompanyId))
            .IsUnique()
            .HasDatabaseName(PersistenceModelConstants.UserInvitationsPendingEmailCompanyIndex)
            .HasFilter("\"AcceptedAt\" IS NULL");
    }
}
