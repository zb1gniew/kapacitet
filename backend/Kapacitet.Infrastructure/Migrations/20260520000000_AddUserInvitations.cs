using System;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Kapacitet.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260520000000_AddUserInvitations")]
public partial class AddUserInvitations : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "user_invitations",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                CompanyId = table.Column<int>(type: "integer", nullable: false),
                Email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                NormalizedEmail = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: true,
                    computedColumnSql: "lower(btrim(\"Email\"))", stored: true),
                Role = table.Column<string>(type: "text", nullable: false),
                InvitationTokenHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                InvitationTokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_user_invitations", x => x.Id);
                table.ForeignKey(
                    name: "FK_user_invitations_Companies_CompanyId",
                    column: x => x.CompanyId,
                    principalTable: "companies",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_user_invitations_CompanyId",
            table: "user_invitations",
            column: "CompanyId");

        migrationBuilder.CreateIndex(
            name: "IX_user_invitations_pending_normalized_email_company",
            table: "user_invitations",
            columns: new[] { "NormalizedEmail", "CompanyId" },
            unique: true,
            filter: "\"AcceptedAt\" IS NULL");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "user_invitations");
    }
}
