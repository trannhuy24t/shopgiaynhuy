using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddContractUnitPricesAndInvoiceReadings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ElectricNewReading",
                table: "Invoices",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ElectricOldReading",
                table: "Invoices",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "ElectricUnitPrice",
                table: "Invoices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "WaterNewReading",
                table: "Invoices",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WaterOldReading",
                table: "Invoices",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "WaterUnitPrice",
                table: "Invoices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ElectricUnitPrice",
                table: "Contracts",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "WaterUnitPrice",
                table: "Contracts",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ElectricNewReading",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ElectricOldReading",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ElectricUnitPrice",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "WaterNewReading",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "WaterOldReading",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "WaterUnitPrice",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ElectricUnitPrice",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "WaterUnitPrice",
                table: "Contracts");
        }
    }
}
