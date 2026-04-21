using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kapacitet.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260421000000_AddCompanyCategories")]
public partial class AddCompanyCategories : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string[]>(
            name: "Categories",
            table: "companies",
            type: "text[]",
            nullable: false,
            defaultValueSql: "'{}'::text[]");

        migrationBuilder.AlterColumn<string>(
            name: "Industry",
            table: "companies",
            type: "character varying(100)",
            maxLength: 100,
            nullable: true,
            oldClrType: typeof(string),
            oldType: "character varying(100)",
            oldMaxLength: 100);

        migrationBuilder.AddColumn<string[]>(
            name: "Categories",
            table: "access_requests",
            type: "text[]",
            nullable: false,
            defaultValueSql: "'{}'::text[]");

        migrationBuilder.AlterColumn<string>(
            name: "Industry",
            table: "access_requests",
            type: "character varying(100)",
            maxLength: 100,
            nullable: true,
            oldClrType: typeof(string),
            oldType: "character varying(100)",
            oldMaxLength: 100);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Categories",
            table: "companies");

        migrationBuilder.AlterColumn<string>(
            name: "Industry",
            table: "companies",
            type: "character varying(100)",
            maxLength: 100,
            nullable: false,
            defaultValue: "",
            oldClrType: typeof(string),
            oldType: "character varying(100)",
            oldMaxLength: 100,
            oldNullable: true);

        migrationBuilder.DropColumn(
            name: "Categories",
            table: "access_requests");

        migrationBuilder.AlterColumn<string>(
            name: "Industry",
            table: "access_requests",
            type: "character varying(100)",
            maxLength: 100,
            nullable: false,
            defaultValue: "",
            oldClrType: typeof(string),
            oldType: "character varying(100)",
            oldMaxLength: 100,
            oldNullable: true);
    }
}
