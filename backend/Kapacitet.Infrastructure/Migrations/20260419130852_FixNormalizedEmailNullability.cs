using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kapacitet.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixNormalizedEmailNullability : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "NormalizedEmail",
                table: "users",
                type: "character varying(254)",
                maxLength: 254,
                nullable: true,
                computedColumnSql: "lower(btrim(\"Email\"))",
                stored: true,
                oldClrType: typeof(string),
                oldType: "character varying(254)",
                oldMaxLength: 254,
                oldComputedColumnSql: "lower(btrim(\"Email\"))",
                oldStored: true);

            migrationBuilder.AlterColumn<string>(
                name: "NormalizedContactEmail",
                table: "access_requests",
                type: "character varying(254)",
                maxLength: 254,
                nullable: true,
                computedColumnSql: "lower(btrim(\"ContactEmail\"))",
                stored: true,
                oldClrType: typeof(string),
                oldType: "character varying(254)",
                oldMaxLength: 254,
                oldComputedColumnSql: "lower(btrim(\"ContactEmail\"))",
                oldStored: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "NormalizedEmail",
                table: "users",
                type: "character varying(254)",
                maxLength: 254,
                nullable: false,
                computedColumnSql: "lower(btrim(\"Email\"))",
                stored: true,
                oldClrType: typeof(string),
                oldType: "character varying(254)",
                oldMaxLength: 254,
                oldNullable: true,
                oldComputedColumnSql: "lower(btrim(\"Email\"))",
                oldStored: true);

            migrationBuilder.AlterColumn<string>(
                name: "NormalizedContactEmail",
                table: "access_requests",
                type: "character varying(254)",
                maxLength: 254,
                nullable: false,
                computedColumnSql: "lower(btrim(\"ContactEmail\"))",
                stored: true,
                oldClrType: typeof(string),
                oldType: "character varying(254)",
                oldMaxLength: 254,
                oldNullable: true,
                oldComputedColumnSql: "lower(btrim(\"ContactEmail\"))",
                oldStored: true);
        }
    }
}
