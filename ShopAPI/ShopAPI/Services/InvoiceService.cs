using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IContractRepository _contractRepository;
        private readonly ITenantService _tenantService;
        private readonly IActivityLogService _activityLogService;

        public InvoiceService(
            IInvoiceRepository invoiceRepository,
            IContractRepository contractRepository,
            ITenantService tenantService,
            IActivityLogService activityLogService)
        {
            _invoiceRepository = invoiceRepository;
            _contractRepository = contractRepository;
            _tenantService = tenantService;
            _activityLogService = activityLogService;
        }

        public List<InvoiceDto> GetAll(string? status, int? contractId)
        {
            var invoices = _invoiceRepository.GetAll().AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<InvoiceStatus>(status, out var invoiceStatus))
            {
                invoices = invoices.Where(i => i.Status == invoiceStatus);
            }

            if (contractId.HasValue)
            {
                invoices = invoices.Where(i => i.ContractId == contractId.Value);
            }

            return invoices.Select(MapToDto).ToList();
        }

        public List<InvoiceDto> GetMy(int userId)
        {
            var tenant = _tenantService.GetByUserId(userId);

            if (tenant == null)
            {
                return new List<InvoiceDto>();
            }

            var contractIds = _contractRepository.GetByTenantId(tenant.Id).Select(c => c.Id).ToList();

            return _invoiceRepository.GetByContractIds(contractIds).Select(MapToDto).ToList();
        }

        public InvoiceDto? GetById(int id)
        {
            var invoice = _invoiceRepository.GetById(id);

            return invoice == null ? null : MapToDto(invoice);
        }

        public bool IsOwnedByUser(int invoiceId, int userId)
        {
            var invoice = _invoiceRepository.GetById(invoiceId);

            return invoice?.Contract?.Tenant?.UserId == userId;
        }

        public (InvoiceDto? Invoice, string? Error) CreateMonthly(CreateInvoiceDto dto, int staffUserId)
        {
            var contract = _contractRepository.GetById(dto.ContractId);

            if (contract == null || contract.Status != ContractStatus.DangHieuLuc)
            {
                return (null, "Há»£p Ä‘á»“ng khĂ´ng tá»“n táº¡i hoáº·c chÆ°a cĂ³ hiá»‡u lá»±c.");
            }

            if (dto.ElectricNewReading < dto.ElectricOldReading)
            {
                return (null, "Sá»‘ Ä‘iá»‡n má»›i pháº£i lá»›n hÆ¡n hoáº·c báº±ng sá»‘ Ä‘iá»‡n cÅ©.");
            }

            if (dto.WaterNewReading < dto.WaterOldReading)
            {
                return (null, "Sá»‘ nÆ°á»›c má»›i pháº£i lá»›n hÆ¡n hoáº·c báº±ng sá»‘ nÆ°á»›c cÅ©.");
            }

            var electricUsage = dto.ElectricNewReading - dto.ElectricOldReading;
            var waterUsage = dto.WaterNewReading - dto.WaterOldReading;
            var electricRate = dto.ElectricUnitPrice ?? contract.ElectricUnitPrice;
            var waterRate = dto.WaterUnitPrice ?? contract.WaterUnitPrice;

            var invoice = new Invoice
            {
                ContractId = contract.Id,
                Month = dto.Month,
                Year = dto.Year,
                ElectricOldReading = dto.ElectricOldReading,
                ElectricNewReading = dto.ElectricNewReading,
                ElectricUsage = electricUsage,
                ElectricUnitPrice = electricRate,
                WaterOldReading = dto.WaterOldReading,
                WaterNewReading = dto.WaterNewReading,
                WaterUsage = waterUsage,
                WaterUnitPrice = waterRate,
                Type = InvoiceType.HangThang,
                Status = InvoiceStatus.ChuaThanhToan,
                DueDate = dto.DueDate,
                CreatedAt = DateTime.UtcNow
            };

            invoice.Items.Add(new InvoiceItem { ItemName = "Tiá»n phĂ²ng", Amount = contract.MonthlyRent });
            invoice.Items.Add(new InvoiceItem { ItemName = "Tiá»n Ä‘iá»‡n", Amount = electricUsage * electricRate });
            invoice.Items.Add(new InvoiceItem { ItemName = "Tiá»n nÆ°á»›c", Amount = waterUsage * waterRate });

            // Tiá»n dá»‹ch vá»¥ = Ä‘Æ¡n giĂ¡ dá»‹ch vá»¥ (theo phĂ²ng, hoáº·c Staff tá»± nháº­p) x sá»‘ ngÆ°á»i Ä‘ang á»Ÿ
            var occupantCount = Math.Max(1, contract.NumberOfOccupants);
            var serviceFeeRate = dto.ServiceFee ?? contract.Room?.ServiceFee ?? 0;
            var serviceFeeTotal = serviceFeeRate * occupantCount;

            if (serviceFeeTotal > 0)
            {
                invoice.Items.Add(new InvoiceItem { ItemName = $"PhĂ­ dá»‹ch vá»¥ ({serviceFeeRate:N0}Ä‘ x {occupantCount} ngÆ°á»i)", Amount = serviceFeeTotal });
            }

            invoice.TotalAmount = invoice.Items.Sum(i => i.Amount);

            _invoiceRepository.Add(invoice);

            _activityLogService.Log(staffUserId, "CreateInvoice", "Invoice", invoice.Id, $"Há»£p Ä‘á»“ng #{contract.Id}, thĂ¡ng {dto.Month}/{dto.Year}");

            return (GetById(invoice.Id), null);
        }

        public Invoice CreateDepositInvoice(int contractId, DateTime startDate, decimal depositAmount)
        {
            var invoice = new Invoice
            {
                ContractId = contractId,
                Month = startDate.Month,
                Year = startDate.Year,
                ElectricUsage = 0,
                WaterUsage = 0,
                TotalAmount = depositAmount,
                Type = InvoiceType.Coc,
                Status = InvoiceStatus.ChuaThanhToan,
                DueDate = DateTime.UtcNow.AddDays(3),
                CreatedAt = DateTime.UtcNow
            };

            invoice.Items.Add(new InvoiceItem { ItemName = "Tiá»n cá»c", Amount = depositAmount });

            _invoiceRepository.Add(invoice);

            return invoice;
        }

        private static InvoiceDto MapToDto(Invoice invoice)
        {
            return new InvoiceDto
            {
                Id = invoice.Id,
                ContractId = invoice.ContractId,
                RoomNumber = invoice.Contract?.Room?.RoomNumber,
                TenantName = invoice.Contract?.Tenant?.FullName,
                Month = invoice.Month,
                Year = invoice.Year,
                ElectricOldReading = invoice.ElectricOldReading,
                ElectricNewReading = invoice.ElectricNewReading,
                ElectricUsage = invoice.ElectricUsage,
                ElectricUnitPrice = invoice.ElectricUnitPrice,
                WaterOldReading = invoice.WaterOldReading,
                WaterNewReading = invoice.WaterNewReading,
                WaterUsage = invoice.WaterUsage,
                WaterUnitPrice = invoice.WaterUnitPrice,
                TotalAmount = invoice.TotalAmount,
                Type = invoice.Type.ToString(),
                Status = invoice.Status.ToString(),
                DueDate = invoice.DueDate,
                CreatedAt = invoice.CreatedAt,
                Items = invoice.Items.Select(i => new InvoiceItemDto { ItemName = i.ItemName, Amount = i.Amount }).ToList()
            };
        }
    }
}
