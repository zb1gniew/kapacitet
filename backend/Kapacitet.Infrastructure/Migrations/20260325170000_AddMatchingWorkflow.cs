using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kapacitet.Infrastructure.Migrations
{
    public partial class AddMatchingWorkflow : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedAt",
                table: "capacity_requests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedAt",
                table: "availability_declarations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ConfirmedAt",
                table: "cooperation_agreements",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AddColumn<int>(
                name: "MatchOfferId",
                table: "cooperation_agreements",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE cooperation_agreements AS ca
                SET "MatchOfferId" = mo."Id"
                FROM match_offers AS mo
                WHERE mo."CooperationAgreementId" = ca."Id";
                """);

            migrationBuilder.AlterColumn<int>(
                name: "MatchOfferId",
                table: "cooperation_agreements",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "CoversFullPeriod",
                table: "match_offers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "CertificateScore",
                table: "match_offers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DateScore",
                table: "match_offers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Explanation",
                table: "match_offers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                table: "match_offers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AddColumn<bool>(
                name: "IsPartial",
                table: "match_offers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "LocationScore",
                table: "match_offers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MatchedCertificateCount",
                table: "match_offers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MatchedSkillCount",
                table: "match_offers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OfferedQuantity",
                table: "match_offers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "QuantityScore",
                table: "match_offers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RequiredCertificateCount",
                table: "match_offers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RequiredSkillCount",
                table: "match_offers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "RequesterReviewedAt",
                table: "match_offers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SkillScore",
                table: "match_offers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "SupplierReviewedAt",
                table: "match_offers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE match_offers
                SET "Status" = CASE
                    WHEN "Status" = 'Pending' THEN 'PendingRequesterReview'
                    WHEN "Status" = 'Accepted' THEN 'PendingSupplierConfirmation'
                    WHEN "Status" = 'Rejected' THEN 'RequesterDeclined'
                    ELSE "Status"
                END;
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_match_offers_cooperation_agreements_CooperationAgreementId",
                table: "match_offers");

            migrationBuilder.DropIndex(
                name: "IX_match_offers_CooperationAgreementId",
                table: "match_offers");

            migrationBuilder.DropColumn(
                name: "CooperationAgreementId",
                table: "match_offers");

            migrationBuilder.CreateIndex(
                name: "IX_cooperation_agreements_MatchOfferId",
                table: "cooperation_agreements",
                column: "MatchOfferId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_match_offers_RequestId_AvailabilityId",
                table: "match_offers",
                columns: new[] { "RequestId", "AvailabilityId" });

            migrationBuilder.AddForeignKey(
                name: "FK_cooperation_agreements_match_offers_MatchOfferId",
                table: "cooperation_agreements",
                column: "MatchOfferId",
                principalTable: "match_offers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_cooperation_agreements_match_offers_MatchOfferId",
                table: "cooperation_agreements");

            migrationBuilder.DropIndex(
                name: "IX_cooperation_agreements_MatchOfferId",
                table: "cooperation_agreements");

            migrationBuilder.DropIndex(
                name: "IX_match_offers_RequestId_AvailabilityId",
                table: "match_offers");

            migrationBuilder.AddColumn<int>(
                name: "CooperationAgreementId",
                table: "match_offers",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_match_offers_CooperationAgreementId",
                table: "match_offers",
                column: "CooperationAgreementId");

            migrationBuilder.AddForeignKey(
                name: "FK_match_offers_cooperation_agreements_CooperationAgreementId",
                table: "match_offers",
                column: "CooperationAgreementId",
                principalTable: "cooperation_agreements",
                principalColumn: "Id");

            migrationBuilder.DropColumn(
                name: "PublishedAt",
                table: "capacity_requests");

            migrationBuilder.DropColumn(
                name: "PublishedAt",
                table: "availability_declarations");

            migrationBuilder.DropColumn(
                name: "ConfirmedAt",
                table: "cooperation_agreements");

            migrationBuilder.DropColumn(
                name: "MatchOfferId",
                table: "cooperation_agreements");

            migrationBuilder.DropColumn(
                name: "CoversFullPeriod",
                table: "match_offers");

            migrationBuilder.DropColumn(
                name: "CertificateScore",
                table: "match_offers");

            migrationBuilder.DropColumn(
                name: "DateScore",
                table: "match_offers");

            migrationBuilder.DropColumn(
                name: "Explanation",
                table: "match_offers");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "match_offers");

            migrationBuilder.DropColumn(
                name: "IsPartial",
                table: "match_offers");

            migrationBuilder.DropColumn(
                name: "LocationScore",
                table: "match_offers");

            migrationBuilder.DropColumn(
                name: "MatchedCertificateCount",
                table: "match_offers");

            migrationBuilder.DropColumn(
                name: "MatchedSkillCount",
                table: "match_offers");

            migrationBuilder.DropColumn(
                name: "OfferedQuantity",
                table: "match_offers");

            migrationBuilder.DropColumn(
                name: "QuantityScore",
                table: "match_offers");

            migrationBuilder.DropColumn(
                name: "RequiredCertificateCount",
                table: "match_offers");

            migrationBuilder.DropColumn(
                name: "RequiredSkillCount",
                table: "match_offers");

            migrationBuilder.DropColumn(
                name: "RequesterReviewedAt",
                table: "match_offers");

            migrationBuilder.DropColumn(
                name: "SkillScore",
                table: "match_offers");

            migrationBuilder.DropColumn(
                name: "SupplierReviewedAt",
                table: "match_offers");
        }
    }
}
