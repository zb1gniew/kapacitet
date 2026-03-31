using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kapacitet.Infrastructure.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260330120000_AddClientDraftKeyToListings")]
    public partial class AddClientDraftKeyToListings : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ClientDraftKey",
                table: "capacity_requests",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClientDraftKey",
                table: "availability_declarations",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_capacity_requests_CompanyId_ClientDraftKey",
                table: "capacity_requests",
                columns: new[] { "CompanyId", "ClientDraftKey" },
                unique: true,
                filter: "\"ClientDraftKey\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_availability_declarations_CompanyId_ClientDraftKey",
                table: "availability_declarations",
                columns: new[] { "CompanyId", "ClientDraftKey" },
                unique: true,
                filter: "\"ClientDraftKey\" IS NOT NULL");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_capacity_requests_CompanyId_ClientDraftKey",
                table: "capacity_requests");

            migrationBuilder.DropIndex(
                name: "IX_availability_declarations_CompanyId_ClientDraftKey",
                table: "availability_declarations");

            migrationBuilder.DropColumn(
                name: "ClientDraftKey",
                table: "capacity_requests");

            migrationBuilder.DropColumn(
                name: "ClientDraftKey",
                table: "availability_declarations");
        }
    }
}
