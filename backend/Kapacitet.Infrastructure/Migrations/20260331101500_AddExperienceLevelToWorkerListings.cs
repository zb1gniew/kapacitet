using Kapacitet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kapacitet.Infrastructure.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260331101500_AddExperienceLevelToWorkerListings")]
    public partial class AddExperienceLevelToWorkerListings : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExperienceLevel",
                table: "availability_declarations",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExperienceLevel",
                table: "capacity_requests",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExperienceLevel",
                table: "availability_declarations");

            migrationBuilder.DropColumn(
                name: "ExperienceLevel",
                table: "capacity_requests");
        }
    }
}
