using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kapacitet.Infrastructure.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260330133000_AddCatalogMetadata")]
    public partial class AddCatalogMetadata : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "skills",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "skills",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "certificates",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "certificates",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE skills
                SET "Code" = CASE "Name"
                    WHEN 'Welding' THEN 'welding'
                    WHEN 'Electrical work' THEN 'electrical-installation'
                    WHEN 'Assembly' THEN 'mechanical-assembly'
                    ELSE "Code"
                END,
                "Category" = CASE "Name"
                    WHEN 'Welding' THEN 'fabrication'
                    WHEN 'Electrical work' THEN 'electrical'
                    WHEN 'Assembly' THEN 'mechanical'
                    ELSE "Category"
                END;
                """);

            migrationBuilder.Sql("""
                UPDATE certificates
                SET "Code" = CASE "Name"
                    WHEN 'Hot work certification' THEN 'hot-work'
                    WHEN 'Working at heights' THEN 'working-at-heights'
                    WHEN 'Electrical certification' THEN 'electrical-certification'
                    ELSE "Code"
                END,
                "Category" = CASE "Name"
                    WHEN 'Hot work certification' THEN 'safety'
                    WHEN 'Working at heights' THEN 'access'
                    WHEN 'Electrical certification' THEN 'trade'
                    ELSE "Category"
                END;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_skills_Code",
                table: "skills",
                column: "Code",
                unique: true,
                filter: "\"Code\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_certificates_Code",
                table: "certificates",
                column: "Code",
                unique: true,
                filter: "\"Code\" IS NOT NULL");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_skills_Code",
                table: "skills");

            migrationBuilder.DropIndex(
                name: "IX_certificates_Code",
                table: "certificates");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "skills");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "skills");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "certificates");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "certificates");
        }
    }
}
