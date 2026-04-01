using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kapacitet.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOnboardingCompletedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "OnboardingCompletedAt",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.DropIndex(
                name: "IX_match_offers_RequestId",
                table: "match_offers");

            migrationBuilder.DropIndex(
                name: "IX_capacity_requests_CompanyId",
                table: "capacity_requests");

            migrationBuilder.DropIndex(
                name: "IX_availability_declarations_CompanyId",
                table: "availability_declarations");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OnboardingCompletedAt",
                table: "users");

            migrationBuilder.CreateIndex(
                name: "IX_match_offers_RequestId",
                table: "match_offers",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_capacity_requests_CompanyId",
                table: "capacity_requests",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_availability_declarations_CompanyId",
                table: "availability_declarations",
                column: "CompanyId");
        }
    }
}
