using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kapacitet.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNetworkRequestsNotificationPrefs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EmailNetworkRequests",
                table: "notification_preferences",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "InAppNetworkRequests",
                table: "notification_preferences",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailNetworkRequests",
                table: "notification_preferences");

            migrationBuilder.DropColumn(
                name: "InAppNetworkRequests",
                table: "notification_preferences");
        }
    }
}
