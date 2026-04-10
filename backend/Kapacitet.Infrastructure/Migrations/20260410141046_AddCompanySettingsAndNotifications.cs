using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Kapacitet.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanySettingsAndNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContactPhone",
                table: "companies",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "company_settings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompanyId = table.Column<int>(type: "integer", nullable: false),
                    ReceiveCapacityRequests = table.Column<bool>(type: "boolean", nullable: false),
                    ParticipateInNetworkWide = table.Column<bool>(type: "boolean", nullable: false),
                    AllowPartialMatches = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_settings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_company_settings_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notification_preferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompanyId = table.Column<int>(type: "integer", nullable: false),
                    EmailNewMatches = table.Column<bool>(type: "boolean", nullable: false),
                    EmailActionsRequired = table.Column<bool>(type: "boolean", nullable: false),
                    EmailUpcomingCooperation = table.Column<bool>(type: "boolean", nullable: false),
                    InAppNewMatches = table.Column<bool>(type: "boolean", nullable: false),
                    InAppActionsRequired = table.Column<bool>(type: "boolean", nullable: false),
                    InAppUpcomingCooperation = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notification_preferences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_notification_preferences_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_company_settings_CompanyId",
                table: "company_settings",
                column: "CompanyId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_notification_preferences_CompanyId",
                table: "notification_preferences",
                column: "CompanyId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "company_settings");

            migrationBuilder.DropTable(
                name: "notification_preferences");

            migrationBuilder.DropColumn(
                name: "ContactPhone",
                table: "companies");
        }
    }
}
