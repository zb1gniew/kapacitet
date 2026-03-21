using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Kapacitet.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "certificates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_certificates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "companies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    Industry = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    DefaultLocation = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_companies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "skills",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_skills", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "availability_declarations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompanyId = table.Column<int>(type: "integer", nullable: false),
                    ResourceType = table.Column<string>(type: "text", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LocationCity = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    LocationRadiusKm = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_availability_declarations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_availability_declarations_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "capacity_requests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompanyId = table.Column<int>(type: "integer", nullable: false),
                    ResourceType = table.Column<string>(type: "text", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LocationCity = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    LocationRadiusKm = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Urgency = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_capacity_requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_capacity_requests_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompanyId = table.Column<int>(type: "integer", nullable: false),
                    Email = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_users_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "availability_certificates",
                columns: table => new
                {
                    AvailabilityDeclarationId = table.Column<int>(type: "integer", nullable: false),
                    CertificatesId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_availability_certificates", x => new { x.AvailabilityDeclarationId, x.CertificatesId });
                    table.ForeignKey(
                        name: "FK_availability_certificates_availability_declarations_Availab~",
                        column: x => x.AvailabilityDeclarationId,
                        principalTable: "availability_declarations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_availability_certificates_certificates_CertificatesId",
                        column: x => x.CertificatesId,
                        principalTable: "certificates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "availability_skills",
                columns: table => new
                {
                    AvailabilityDeclarationId = table.Column<int>(type: "integer", nullable: false),
                    SkillsId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_availability_skills", x => new { x.AvailabilityDeclarationId, x.SkillsId });
                    table.ForeignKey(
                        name: "FK_availability_skills_availability_declarations_AvailabilityD~",
                        column: x => x.AvailabilityDeclarationId,
                        principalTable: "availability_declarations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_availability_skills_skills_SkillsId",
                        column: x => x.SkillsId,
                        principalTable: "skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "cooperation_agreements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RequestId = table.Column<int>(type: "integer", nullable: false),
                    AvailabilityId = table.Column<int>(type: "integer", nullable: false),
                    SupplierCompanyId = table.Column<int>(type: "integer", nullable: false),
                    RequesterCompanyId = table.Column<int>(type: "integer", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cooperation_agreements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_cooperation_agreements_availability_declarations_Availabili~",
                        column: x => x.AvailabilityId,
                        principalTable: "availability_declarations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cooperation_agreements_capacity_requests_RequestId",
                        column: x => x.RequestId,
                        principalTable: "capacity_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cooperation_agreements_companies_RequesterCompanyId",
                        column: x => x.RequesterCompanyId,
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cooperation_agreements_companies_SupplierCompanyId",
                        column: x => x.SupplierCompanyId,
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "network_escalations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RequestId = table.Column<int>(type: "integer", nullable: false),
                    TriggeredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_escalations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_network_escalations_capacity_requests_RequestId",
                        column: x => x.RequestId,
                        principalTable: "capacity_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "request_certificates",
                columns: table => new
                {
                    CapacityRequestId = table.Column<int>(type: "integer", nullable: false),
                    CertificatesId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_request_certificates", x => new { x.CapacityRequestId, x.CertificatesId });
                    table.ForeignKey(
                        name: "FK_request_certificates_capacity_requests_CapacityRequestId",
                        column: x => x.CapacityRequestId,
                        principalTable: "capacity_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_request_certificates_certificates_CertificatesId",
                        column: x => x.CertificatesId,
                        principalTable: "certificates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "request_skills",
                columns: table => new
                {
                    CapacityRequestId = table.Column<int>(type: "integer", nullable: false),
                    SkillsId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_request_skills", x => new { x.CapacityRequestId, x.SkillsId });
                    table.ForeignKey(
                        name: "FK_request_skills_capacity_requests_CapacityRequestId",
                        column: x => x.CapacityRequestId,
                        principalTable: "capacity_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_request_skills_skills_SkillsId",
                        column: x => x.SkillsId,
                        principalTable: "skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "match_offers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RequestId = table.Column<int>(type: "integer", nullable: false),
                    AvailabilityId = table.Column<int>(type: "integer", nullable: false),
                    MatchScore = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CooperationAgreementId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_match_offers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_match_offers_availability_declarations_AvailabilityId",
                        column: x => x.AvailabilityId,
                        principalTable: "availability_declarations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_match_offers_capacity_requests_RequestId",
                        column: x => x.RequestId,
                        principalTable: "capacity_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_match_offers_cooperation_agreements_CooperationAgreementId",
                        column: x => x.CooperationAgreementId,
                        principalTable: "cooperation_agreements",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "network_responses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EscalationId = table.Column<int>(type: "integer", nullable: false),
                    CompanyId = table.Column<int>(type: "integer", nullable: false),
                    ResponseType = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_network_responses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_network_responses_companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_network_responses_network_escalations_EscalationId",
                        column: x => x.EscalationId,
                        principalTable: "network_escalations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_availability_certificates_CertificatesId",
                table: "availability_certificates",
                column: "CertificatesId");

            migrationBuilder.CreateIndex(
                name: "IX_availability_declarations_CompanyId",
                table: "availability_declarations",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_availability_skills_SkillsId",
                table: "availability_skills",
                column: "SkillsId");

            migrationBuilder.CreateIndex(
                name: "IX_capacity_requests_CompanyId",
                table: "capacity_requests",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_cooperation_agreements_AvailabilityId",
                table: "cooperation_agreements",
                column: "AvailabilityId");

            migrationBuilder.CreateIndex(
                name: "IX_cooperation_agreements_RequesterCompanyId",
                table: "cooperation_agreements",
                column: "RequesterCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_cooperation_agreements_RequestId",
                table: "cooperation_agreements",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_cooperation_agreements_SupplierCompanyId",
                table: "cooperation_agreements",
                column: "SupplierCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_match_offers_AvailabilityId",
                table: "match_offers",
                column: "AvailabilityId");

            migrationBuilder.CreateIndex(
                name: "IX_match_offers_CooperationAgreementId",
                table: "match_offers",
                column: "CooperationAgreementId");

            migrationBuilder.CreateIndex(
                name: "IX_match_offers_RequestId",
                table: "match_offers",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_network_escalations_RequestId",
                table: "network_escalations",
                column: "RequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_network_responses_CompanyId",
                table: "network_responses",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_network_responses_EscalationId",
                table: "network_responses",
                column: "EscalationId");

            migrationBuilder.CreateIndex(
                name: "IX_request_certificates_CertificatesId",
                table: "request_certificates",
                column: "CertificatesId");

            migrationBuilder.CreateIndex(
                name: "IX_request_skills_SkillsId",
                table: "request_skills",
                column: "SkillsId");

            migrationBuilder.CreateIndex(
                name: "IX_users_CompanyId",
                table: "users",
                column: "CompanyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "availability_certificates");

            migrationBuilder.DropTable(
                name: "availability_skills");

            migrationBuilder.DropTable(
                name: "match_offers");

            migrationBuilder.DropTable(
                name: "network_responses");

            migrationBuilder.DropTable(
                name: "request_certificates");

            migrationBuilder.DropTable(
                name: "request_skills");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "cooperation_agreements");

            migrationBuilder.DropTable(
                name: "network_escalations");

            migrationBuilder.DropTable(
                name: "certificates");

            migrationBuilder.DropTable(
                name: "skills");

            migrationBuilder.DropTable(
                name: "availability_declarations");

            migrationBuilder.DropTable(
                name: "capacity_requests");

            migrationBuilder.DropTable(
                name: "companies");
        }
    }
}
