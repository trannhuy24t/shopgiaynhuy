using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository _paymentRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IContractRepository _contractRepository;
        private readonly IRoomRepository _roomRepository;
        private readonly IVietQrService _vietQrService;
        private readonly IActivityLogService _activityLogService;

        public PaymentService(
            IPaymentRepository paymentRepository,
            IInvoiceRepository invoiceRepository,
            IContractRepository contractRepository,
            IRoomRepository roomRepository,
            IVietQrService vietQrService,
            IActivityLogService activityLogService)
        {
            _paymentRepository = paymentRepository;
            _invoiceRepository = invoiceRepository;
            _contractRepository = contractRepository;
            _roomRepository = roomRepository;
            _vietQrService = vietQrService;
            _activityLogService = activityLogService;
        }

        public QrPaymentResponseDto? GetQrForInvoice(int invoiceId, int userId)
        {
            var invoice = _invoiceRepository.GetById(invoiceId);

            if (invoice == null || invoice.Contract?.Tenant?.UserId != userId)
            {
                return null;
            }

            var payload = _vietQrService.GeneratePayload(invoice.TotalAmount, $"HD{invoice.Id}");

            return new QrPaymentResponseDto
            {
                InvoiceId = invoice.Id,
                Amount = invoice.TotalAmount,
                Payload = payload
            };
        }

        public List<PaymentDto> GetByInvoiceId(int invoiceId)
        {
            return _paymentRepository.GetByInvoiceId(invoiceId)
                .Select(MapToDto)
                .ToList();
        }

        public bool ConfirmCash(ConfirmPaymentDto dto, int confirmedByUserId)
        {
            var invoice = _invoiceRepository.GetById(dto.InvoiceId);

            if (invoice == null || invoice.Status != "ChuaThanhToan")
            {
                return false;
            }

            var payment = new Payment
            {
                InvoiceId = invoice.Id,
                Amount = dto.Amount,
                Method = dto.Method,
                TransactionRef = dto.TransactionRef,
                PaymentDate = DateTime.Now
            };

            _paymentRepository.Add(payment);

            invoice.Status = "DaThanhToan";
            _invoiceRepository.Update(invoice);

            if (invoice.Type == "Coc")
            {
                var contract = _contractRepository.GetById(invoice.ContractId);

                if (contract != null && contract.Status == "ChoCoc")
                {
                    contract.Status = "DangHieuLuc";
                    _contractRepository.Update(contract);

                    var room = _roomRepository.GetById(contract.RoomId);

                    if (room != null)
                    {
                        room.Status = "DaThue";
                        _roomRepository.Update(room);
                    }
                }
            }

            _activityLogService.Log(confirmedByUserId, "ConfirmPayment", "Invoice", invoice.Id, $"Amount={dto.Amount}, Method={dto.Method}");

            return true;
        }

        private static PaymentDto MapToDto(Payment payment)
        {
            return new PaymentDto
            {
                Id = payment.Id,
                InvoiceId = payment.InvoiceId,
                Amount = payment.Amount,
                PaymentDate = payment.PaymentDate,
                Method = payment.Method,
                TransactionRef = payment.TransactionRef
            };
        }
    }
}
