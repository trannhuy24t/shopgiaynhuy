using Moq;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;
using ShopAPI.Services;
using Xunit;

namespace ShopAPI.Tests
{
    public class InvoiceServiceTests
    {
        private static InvoiceService CreateService(
            Mock<IInvoiceRepository>? invoiceRepo = null,
            Mock<IContractRepository>? contractRepo = null,
            Mock<ITenantService>? tenantService = null,
            Mock<IActivityLogService>? activityLogService = null)
        {
            return new InvoiceService(
                invoiceRepo?.Object ?? new Mock<IInvoiceRepository>().Object,
                contractRepo?.Object ?? new Mock<IContractRepository>().Object,
                tenantService?.Object ?? new Mock<ITenantService>().Object,
                activityLogService?.Object ?? new Mock<IActivityLogService>().Object);
        }

        // --- CreateMonthly ---

        [Fact]
        public void CreateMonthly_ContractNotFound_ReturnsError()
        {
            var contractRepo = new Mock<IContractRepository>();
            contractRepo.Setup(r => r.GetById(99)).Returns((Contract?)null);

            var service = CreateService(contractRepo: contractRepo);

            var (invoice, error) = service.CreateMonthly(new CreateInvoiceDto { ContractId = 99 }, 1);

            Assert.Null(invoice);
            Assert.NotNull(error);
        }

        [Fact]
        public void CreateMonthly_ContractNotActive_ReturnsError()
        {
            var contractRepo = new Mock<IContractRepository>();
            contractRepo.Setup(r => r.GetById(1))
                .Returns(new Contract { Id = 1, Status = ContractStatus.ChoDuyet });

            var service = CreateService(contractRepo: contractRepo);

            var (invoice, error) = service.CreateMonthly(new CreateInvoiceDto { ContractId = 1 }, 1);

            Assert.Null(invoice);
            Assert.NotNull(error);
        }

        [Fact]
        public void CreateMonthly_ElectricNewLessThanOld_ReturnsError()
        {
            var contractRepo = new Mock<IContractRepository>();
            contractRepo.Setup(r => r.GetById(1))
                .Returns(new Contract { Id = 1, Status = ContractStatus.DangHieuLuc });

            var service = CreateService(contractRepo: contractRepo);

            var (invoice, error) = service.CreateMonthly(new CreateInvoiceDto
            {
                ContractId = 1,
                ElectricOldReading = 100,
                ElectricNewReading = 80
            }, 1);

            Assert.Null(invoice);
            Assert.NotNull(error);
        }

        [Fact]
        public void CreateMonthly_WaterNewLessThanOld_ReturnsError()
        {
            var contractRepo = new Mock<IContractRepository>();
            contractRepo.Setup(r => r.GetById(1))
                .Returns(new Contract { Id = 1, Status = ContractStatus.DangHieuLuc });

            var service = CreateService(contractRepo: contractRepo);

            var (invoice, error) = service.CreateMonthly(new CreateInvoiceDto
            {
                ContractId = 1,
                ElectricOldReading = 100,
                ElectricNewReading = 110,
                WaterOldReading = 50,
                WaterNewReading = 40
            }, 1);

            Assert.Null(invoice);
            Assert.NotNull(error);
        }

        [Fact]
        public void CreateMonthly_ValidData_SavesInvoiceWithCorrectStatus()
        {
            var contractRepo = new Mock<IContractRepository>();
            var invoiceRepo = new Mock<IInvoiceRepository>();
            Invoice? savedInvoice = null;

            contractRepo.Setup(r => r.GetById(1)).Returns(new Contract
            {
                Id = 1,
                Status = ContractStatus.DangHieuLuc,
                MonthlyRent = 3_000_000,
                ElectricUnitPrice = 3_500,
                WaterUnitPrice = 18_000,
                NumberOfOccupants = 2
            });

            invoiceRepo.Setup(r => r.Add(It.IsAny<Invoice>()))
                .Callback<Invoice>(i => savedInvoice = i);
            invoiceRepo.Setup(r => r.GetById(It.IsAny<int>())).Returns((Invoice?)null);

            var service = CreateService(invoiceRepo, contractRepo);

            service.CreateMonthly(new CreateInvoiceDto
            {
                ContractId = 1,
                Month = 10,
                Year = 2026,
                ElectricOldReading = 100,
                ElectricNewReading = 150,
                WaterOldReading = 20,
                WaterNewReading = 25,
                DueDate = DateTime.Today.AddDays(7)
            }, 1);

            Assert.NotNull(savedInvoice);
            Assert.Equal(InvoiceStatus.ChuaThanhToan, savedInvoice!.Status);
            Assert.Equal(InvoiceType.HangThang, savedInvoice.Type);
            Assert.Equal(50, savedInvoice.ElectricUsage);
            Assert.Equal(5, savedInvoice.WaterUsage);
        }

        [Fact]
        public void CreateMonthly_ValidData_CalculatesTotalAmountCorrectly()
        {
            var contractRepo = new Mock<IContractRepository>();
            var invoiceRepo = new Mock<IInvoiceRepository>();
            Invoice? savedInvoice = null;

            contractRepo.Setup(r => r.GetById(1)).Returns(new Contract
            {
                Id = 1,
                Status = ContractStatus.DangHieuLuc,
                MonthlyRent = 3_000_000,
                ElectricUnitPrice = 3_500,
                WaterUnitPrice = 18_000,
                NumberOfOccupants = 1,
                Room = new Room { ServiceFee = 0 }
            });

            invoiceRepo.Setup(r => r.Add(It.IsAny<Invoice>()))
                .Callback<Invoice>(i => savedInvoice = i);
            invoiceRepo.Setup(r => r.GetById(It.IsAny<int>())).Returns((Invoice?)null);

            var service = CreateService(invoiceRepo, contractRepo);

            service.CreateMonthly(new CreateInvoiceDto
            {
                ContractId = 1,
                Month = 10,
                Year = 2026,
                ElectricOldReading = 0,
                ElectricNewReading = 10,   // 10 kWh x 3,500 = 35,000
                WaterOldReading = 0,
                WaterNewReading = 2,        // 2 m3  x 18,000 = 36,000
                DueDate = DateTime.Today.AddDays(7)
            }, 1);

            // MonthlyRent 3,000,000 + Electric 35,000 + Water 36,000 = 3,071,000
            Assert.Equal(3_071_000, savedInvoice!.TotalAmount);
        }

        // --- CreateDepositInvoice ---

        [Fact]
        public void CreateDepositInvoice_CreatesInvoiceWithCocType()
        {
            var invoiceRepo = new Mock<IInvoiceRepository>();
            Invoice? savedInvoice = null;
            invoiceRepo.Setup(r => r.Add(It.IsAny<Invoice>()))
                .Callback<Invoice>(i => savedInvoice = i);

            var service = CreateService(invoiceRepo: invoiceRepo);

            service.CreateDepositInvoice(1, new DateTime(2026, 10, 1), 5_000_000);

            Assert.NotNull(savedInvoice);
            Assert.Equal(InvoiceType.Coc, savedInvoice!.Type);
            Assert.Equal(InvoiceStatus.ChuaThanhToan, savedInvoice.Status);
            Assert.Equal(5_000_000, savedInvoice.TotalAmount);
        }

        [Fact]
        public void CreateDepositInvoice_SetsMonthAndYearFromStartDate()
        {
            var invoiceRepo = new Mock<IInvoiceRepository>();
            Invoice? savedInvoice = null;
            invoiceRepo.Setup(r => r.Add(It.IsAny<Invoice>()))
                .Callback<Invoice>(i => savedInvoice = i);

            var service = CreateService(invoiceRepo: invoiceRepo);

            service.CreateDepositInvoice(1, new DateTime(2026, 3, 15), 2_000_000);

            Assert.Equal(3, savedInvoice!.Month);
            Assert.Equal(2026, savedInvoice.Year);
        }

        [Fact]
        public void CreateDepositInvoice_AddsDepositLineItem()
        {
            var invoiceRepo = new Mock<IInvoiceRepository>();
            Invoice? savedInvoice = null;
            invoiceRepo.Setup(r => r.Add(It.IsAny<Invoice>()))
                .Callback<Invoice>(i => savedInvoice = i);

            var service = CreateService(invoiceRepo: invoiceRepo);

            service.CreateDepositInvoice(1, DateTime.Today, 4_000_000);

            Assert.Single(savedInvoice!.Items);
            Assert.Equal(4_000_000, savedInvoice.Items[0].Amount);
        }
    }
}
