using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kapacitet.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260421000001_AddMatchOutsideCategory")]
public partial class AddMatchOutsideCategory : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "MatchOutsideCategory",
            table: "company_settings",
            type: "boolean",
            nullable: false,
            defaultValue: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "MatchOutsideCategory",
            table: "company_settings");
    }
}
