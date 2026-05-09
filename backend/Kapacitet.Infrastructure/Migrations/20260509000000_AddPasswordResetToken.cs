using System;
using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kapacitet.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260509000000_AddPasswordResetToken")]
public partial class AddPasswordResetToken : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "PasswordResetTokenExpiresAt",
            table: "users",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "PasswordResetTokenHash",
            table: "users",
            type: "character varying(128)",
            maxLength: 128,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "PasswordResetTokenExpiresAt",
            table: "users");

        migrationBuilder.DropColumn(
            name: "PasswordResetTokenHash",
            table: "users");
    }
}
