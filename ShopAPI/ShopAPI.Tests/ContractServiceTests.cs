using Microsoft.EntityFrameworkCore;
using Moq;
using ShopAPI.Data;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;
using ShopAPI.Services;
using Xunit;

namespace ShopAPI.Tests
{
    public class ContractServiceTests
    {
        private static AppDbContext CreateInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        private static ContractService CreateService(
            Mock<IContractRepository>? contractRepo = null,
            Mock<IRoomRepository>? roomRepo = null,
            Mock<ITenantService>? tenantService = null,
            Mock<IInvoiceService>? invoiceService = null,
            Mock<INotificationService>? notificationService = null,
            Mock<IActivityLogService>? activityLogService = null,
            AppDbContext? context = null)
        {
            return new ContractService(
                contractRepo?.Object ?? new Mock<IContractRepository>().Object,
                roomRepo?.Object ?? new Mock<IRoomRepository>().Object,
                tenantService?.Object ?? new Mock<ITenantService>().Object,
                invoiceService?.Object ?? new Mock<IInvoiceService>().Object,
                notificationService?.Object ?? new Mock<INotificationService>().Object,
                activityLogService?.Object ?? new Mock<IActivityLogService>().Object,
                context ?? CreateInMemoryContext());
        }

        [Fact]
        public void Request_RoomNotFound_ReturnsNull()
        {
            var roomRepo = new Mock<IRoomRepository>();
            roomRepo.Setup(r => r.GetById(It.IsAny<int>())).Returns((Room?)null);

            var service = CreateService(roomRepo: roomRepo);

            var result = service.Request(1, new RequestContractDto
            {
                RoomId = 99,
                StartDate = DateTime.Today.AddDays(1),
                EndDate = DateTime.Today.AddMonths(6),
                TenantProfile = new UpsertTenantProfileDto { FullName = "Test" }
            });

            Assert.Null(result);
        }

        [Fact]
        public void Request_RoomNotAvailable_ReturnsNull()
        {
            var roomRepo = new Mock<IRoomRepository>();
            roomRepo.Setup(r => r.GetById(1)).Returns(new Room { Id = 1, Status = RoomStatus.DaThue });

            var service = CreateService(roomRepo: roomRepo);

            var result = service.Request(1, new RequestContractDto
            {
                RoomId = 1,
                StartDate = DateTime.Today.AddDays(1),
                EndDate = DateTime.Today.AddMonths(6),
                TenantProfile = new UpsertTenantProfileDto { FullName = "Test" }
            });

            Assert.Null(result);
        }

        [Fact]
        public void Request_ValidRoom_CreatesContractWithChoDuyetStatus()
        {
            var contractRepo = new Mock<IContractRepository>();
            var roomRepo = new Mock<IRoomRepository>();
            var tenantService = new Mock<ITenantService>();
            var notificationService = new Mock<INotificationService>();

            roomRepo.Setup(r => r.GetById(1)).Returns(new Room
            {
                Id = 1, RoomNumber = "101", Status = RoomStatus.Trong, Price = 2_000_000
            });

            tenantService.Setup(t => t.UpsertForUser(1, It.IsAny<UpsertTenantProfileDto>()))
                .Returns(new TenantDto { Id = 10, FullName = "Nguyen Van A" });

            Contract? savedContract = null;
            contractRepo.Setup(r => r.Add(It.IsAny<Contract>()))
                .Callback<Contract>(c => savedContract = c);
            contractRepo.Setup(r => r.GetById(It.IsAny<int>())).Returns((Contract?)null);

            var service = CreateService(contractRepo, roomRepo, tenantService,
                notificationService: notificationService);

            service.Request(1, new RequestContractDto
            {
                RoomId = 1,
                StartDate = DateTime.Today.AddDays(1),
                EndDate = DateTime.Today.AddMonths(6),
                TenantProfile = new UpsertTenantProfileDto { FullName = "Nguyen Van A" }
            });

            Assert.NotNull(savedContract);
            Assert.Equal(ContractStatus.ChoDuyet, savedContract!.Status);
            Assert.Equal(2_000_000, savedContract.MonthlyRent);
        }

        [Fact]
        public void Request_ValidRoom_NotifiesAdmin()
        {
            var roomRepo = new Mock<IRoomRepository>();
            var tenantService = new Mock<ITenantService>();
            var notificationService = new Mock<INotificationService>();
            var contractRepo = new Mock<IContractRepository>();

            roomRepo.Setup(r => r.GetById(1)).Returns(new Room
            {
                Id = 1, RoomNumber = "101", Status = RoomStatus.Trong, Price = 1_000_000
            });
            tenantService.Setup(t => t.UpsertForUser(It.IsAny<int>(), It.IsAny<UpsertTenantProfileDto>()))
                .Returns(new TenantDto { Id = 5, FullName = "Test" });
            contractRepo.Setup(r => r.GetById(It.IsAny<int>())).Returns((Contract?)null);

            var service = CreateService(contractRepo, roomRepo, tenantService,
                notificationService: notificationService);

            service.Request(1, new RequestContractDto
            {
                RoomId = 1,
                StartDate = DateTime.Today.AddDays(1),
                EndDate = DateTime.Today.AddMonths(6),
                TenantProfile = new UpsertTenantProfileDto { FullName = "Test" }
            });

            notificationService.Verify(n => n.NotifyRole("Admin", It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public void Reject_ContractNotFound_ReturnsFalse()
        {
            var contractRepo = new Mock<IContractRepository>();
            contractRepo.Setup(r => r.GetById(99)).Returns((Contract?)null);

            var service = CreateService(contractRepo: contractRepo);

            var result = service.Reject(99, new RejectContractDto { Reason = "test" }, 1);

            Assert.False(result);
        }

        [Fact]
        public void Reject_ContractNotChoDuyet_ReturnsFalse()
        {
            var contractRepo = new Mock<IContractRepository>();
            contractRepo.Setup(r => r.GetById(1))
                .Returns(new Contract { Id = 1, Status = ContractStatus.DangHieuLuc });

            var service = CreateService(contractRepo: contractRepo);

            var result = service.Reject(1, new RejectContractDto(), 1);

            Assert.False(result);
        }

        [Fact]
        public void Reject_ValidContract_UpdatesStatusToTuChoi()
        {
            var contractRepo = new Mock<IContractRepository>();
            Contract? updatedContract = null;

            contractRepo.Setup(r => r.GetById(1))
                .Returns(new Contract { Id = 1, Status = ContractStatus.ChoDuyet });
            contractRepo.Setup(r => r.Update(It.IsAny<Contract>()))
                .Callback<Contract>(c => updatedContract = c);

            var service = CreateService(contractRepo: contractRepo);

            var result = service.Reject(1, new RejectContractDto { Reason = "Hop dong khong phu hop" }, 1);

            Assert.True(result);
            Assert.Equal(ContractStatus.TuChoi, updatedContract!.Status);
        }

        [Fact]
        public void Terminate_ValidContract_UpdatesContractAndRoom()
        {
            var contractRepo = new Mock<IContractRepository>();
            var roomRepo = new Mock<IRoomRepository>();
            Room? updatedRoom = null;

            contractRepo.Setup(r => r.GetById(1))
                .Returns(new Contract { Id = 1, RoomId = 5, Status = ContractStatus.DangHieuLuc });
            roomRepo.Setup(r => r.GetById(5))
                .Returns(new Room { Id = 5, Status = RoomStatus.DaThue });
            roomRepo.Setup(r => r.Update(It.IsAny<Room>()))
                .Callback<Room>(r => updatedRoom = r);

            var service = CreateService(contractRepo: contractRepo, roomRepo: roomRepo);

            var result = service.Terminate(1, 1);

            Assert.True(result);
            Assert.Equal(RoomStatus.Trong, updatedRoom!.Status);
        }
    }
}
