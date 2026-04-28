using System;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kapacitet.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260428160000_AddInitialPasswordSetupTokens")]
public partial class AddInitialPasswordSetupTokens : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "InitialPasswordSetupTokenExpiresAt",
            table: "access_requests",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "InitialPasswordSetupTokenHash",
            table: "access_requests",
            type: "character varying(128)",
            maxLength: 128,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "InitialPasswordSetupTokenExpiresAt",
            table: "access_requests");

        migrationBuilder.DropColumn(
            name: "InitialPasswordSetupTokenHash",
            table: "access_requests");
    }
}
