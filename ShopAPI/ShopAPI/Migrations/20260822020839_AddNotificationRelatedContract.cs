using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationRelatedContract : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RelatedContractId",
                table: "Notifications",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_RelatedContractId",
                table: "Notifications",
                column: "RelatedContractId");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Contracts_RelatedContractId",
                table: "Notifications",
                column: "RelatedContractId",
                principalTable: "Contracts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Contracts_RelatedContractId",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_RelatedContractId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "RelatedContractId",
                table: "Notifications");
        }
    }
}
