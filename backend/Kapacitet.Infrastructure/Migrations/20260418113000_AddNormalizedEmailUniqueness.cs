using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kapacitet.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260418113000_AddNormalizedEmailUniqueness")]
public partial class AddNormalizedEmailUniqueness : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: PersistenceModelConstants.NormalizedContactEmailProperty,
            table: "access_requests",
            type: "character varying(254)",
            maxLength: 254,
            nullable: false,
            computedColumnSql: "lower(btrim(\"ContactEmail\"))",
            stored: true);

        migrationBuilder.AddColumn<string>(
            name: PersistenceModelConstants.NormalizedEmailProperty,
            table: "users",
            type: "character varying(254)",
            maxLength: 254,
            nullable: false,
            computedColumnSql: "lower(btrim(\"Email\"))",
            stored: true);

        migrationBuilder.CreateIndex(
            name: PersistenceModelConstants.AccessRequestsPendingNormalizedContactEmailIndex,
            table: "access_requests",
            column: PersistenceModelConstants.NormalizedContactEmailProperty,
            unique: true,
            filter: "\"Status\" = 'Pending'");

        migrationBuilder.CreateIndex(
            name: PersistenceModelConstants.UsersNormalizedEmailIndex,
            table: "users",
            column: PersistenceModelConstants.NormalizedEmailProperty,
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: PersistenceModelConstants.AccessRequestsPendingNormalizedContactEmailIndex,
            table: "access_requests");

        migrationBuilder.DropIndex(
            name: PersistenceModelConstants.UsersNormalizedEmailIndex,
            table: "users");

        migrationBuilder.DropColumn(
            name: PersistenceModelConstants.NormalizedContactEmailProperty,
            table: "access_requests");

        migrationBuilder.DropColumn(
            name: PersistenceModelConstants.NormalizedEmailProperty,
            table: "users");
    }
}
