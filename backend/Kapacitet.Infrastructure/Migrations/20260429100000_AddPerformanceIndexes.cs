using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kapacitet.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // match_offers: speeds up ExpireStaleOffersAsync and open-offer queries
            migrationBuilder.CreateIndex(
                name: "IX_match_offers_Status_ExpiresAt",
                table: "match_offers",
                columns: new[] { "Status", "ExpiresAt" });

            // availability_declarations: speeds up candidate lookup during matching
            migrationBuilder.CreateIndex(
                name: "IX_availability_declarations_Status_StartDate_EndDate",
                table: "availability_declarations",
                columns: new[] { "Status", "StartDate", "EndDate" });

            // capacity_requests: speeds up active-request filtering during matching
            migrationBuilder.CreateIndex(
                name: "IX_capacity_requests_Status",
                table: "capacity_requests",
                column: "Status");

            // cooperation_agreements: speeds up allocation snapshot queries
            migrationBuilder.CreateIndex(
                name: "IX_cooperation_agreements_Status",
                table: "cooperation_agreements",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_match_offers_Status_ExpiresAt",
                table: "match_offers");

            migrationBuilder.DropIndex(
                name: "IX_availability_declarations_Status_StartDate_EndDate",
                table: "availability_declarations");

            migrationBuilder.DropIndex(
                name: "IX_capacity_requests_Status",
                table: "capacity_requests");

            migrationBuilder.DropIndex(
                name: "IX_cooperation_agreements_Status",
                table: "cooperation_agreements");
        }
    }
}
