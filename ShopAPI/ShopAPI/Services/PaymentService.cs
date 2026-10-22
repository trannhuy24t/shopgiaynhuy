using ShopAPI.Data;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;
using Microsoft.EntityFrameworkCore;

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
        private readonly AppDbContext _context;

        public PaymentService(
            IPaymentRepository paymentRepository,
            IInvoiceRepository invoiceRepository,
            IContractRepository contractRepository,
            IRoomRepository roomRepository,
            IVietQrService vietQrService,
            IActivityLogService activityLogService,
            AppDbContext context)
        {
            _paymentRepository = paymentRepository;
            _invoiceRepository = invoiceRepository;
            _contractRepository = contractRepository;
            _roomRepository = roomRepository;
            _vietQrService = vietQrService;
            _activityLogService = activityLogService;
            _context = context;
        }

        public QrPaymentResponseDto? GetQrForInvoice(int invoiceId, int userId)
        {
            var invoice = _invoiceRepository.GetById(invoiceId);

            if (invoice == null || invoice.Contract?.Tenant?.UserId != userId)
            {
                return null;
            }

            if (!_vietQrService.TryGeneratePayload(invoice.TotalAmount, $"HD{invoice.Id}", out var payload))
            {
                return new QrPaymentResponseDto
                {
                    InvoiceId = invoice.Id,
                    Amount = invoice.TotalAmount,
                    IsAvailable = false,
                    Message = "Tài khoản nhận chuyển khoản chưa được cấu hình đầy đủ. Vui lòng liên hệ ban quản lý để nhận thông tin chuyển khoản; giao dịch sẽ được xác nhận thủ công."
                };
            }

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

        public (bool Success, string Message) SubmitTransfer(SubmitTransferDto dto, int userId)
        {
            var invoice = _invoiceRepository.GetById(dto.InvoiceId);
            if (invoice == null || invoice.Contract?.Tenant?.UserId != userId)
                return (false, "Không tìm thấy hóa đơn.");
            if (invoice.Status != InvoiceStatus.ChuaThanhToan && invoice.Status != InvoiceStatus.QuaHan)
                return (false, "Hóa đơn này đã được thanh toán.");
            if (dto.Amount != invoice.TotalAmount)
                return (false, "Số tiền xác nhận phải khớp chính xác với tổng hóa đơn.");
            if (string.IsNullOrWhiteSpace(dto.TransactionRef))
                return (false, "Vui lòng nhập mã giao dịch trên biên lai ngân hàng.");
            if (_context.Payments.Any(p => p.InvoiceId == invoice.Id && p.Status == "ChoXacNhan"))
                return (false, "Hóa đơn đã có giao dịch đang chờ xác nhận.");

            var payment = new Payment
            {
                InvoiceId = invoice.Id,
                Amount = dto.Amount,
                Method = "ChuyenKhoan",
                Status = "ChoXacNhan",
                TransactionRef = dto.TransactionRef.Trim(),
                PaymentDate = DateTime.UtcNow
            };
            _paymentRepository.Add(payment);
            _activityLogService.Log(userId, "SubmitTransfer", "Invoice", invoice.Id, $"TransactionRef={payment.TransactionRef}");
            return (true, "Đã gửi giao dịch. Hóa đơn sẽ được cập nhật sau khi quản trị viên xác nhận.");
        }

        public bool ConfirmCash(ConfirmPaymentDto dto, int confirmedByUserId)
        {
            var invoice = _invoiceRepository.GetById(dto.InvoiceId);

            if (invoice == null || invoice.Status is not (InvoiceStatus.ChuaThanhToan or InvoiceStatus.QuaHan) || dto.Amount != invoice.TotalAmount || dto.Amount <= 0 || dto.Method is not ("TienMat" or "ChuyenKhoan" or "QR"))
            {
                return false;
            }

            using var transaction = _context.Database.BeginTransaction();
            try
            {
                var payment = new Payment
                {
                    InvoiceId = invoice.Id,
                    Amount = dto.Amount,
                    Method = dto.Method,
                    TransactionRef = dto.TransactionRef,
                    Status = "DaXacNhan",
                    PaymentDate = DateTime.UtcNow
                };

                _paymentRepository.Add(payment);

                invoice.Status = InvoiceStatus.DaThanhToan;
                _invoiceRepository.Update(invoice);

                if (invoice.Type == InvoiceType.Coc)
                {
                    var contract = _contractRepository.GetById(invoice.ContractId);

                    if (contract != null && contract.Status == ContractStatus.ChoCoc)
                    {
                        contract.Status = ContractStatus.DangHieuLuc;
                        _contractRepository.Update(contract);

                        var room = _roomRepository.GetById(contract.RoomId);

                        if (room != null)
                        {
                            room.Status = RoomStatus.DaThue;
                            _roomRepository.Update(room);
                        }
                    }
                }

                _activityLogService.Log(confirmedByUserId, "ConfirmPayment", "Invoice", invoice.Id, $"Amount={dto.Amount}, Method={dto.Method}");

                transaction.Commit();
                return true;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public bool ConfirmTransfer(int paymentId, int confirmedByUserId)
        {
            var payment = _context.Payments.Include(p => p.Invoice).FirstOrDefault(p => p.Id == paymentId);
            var invoice = payment?.Invoice;
            if (payment == null || invoice == null || payment.Status != "ChoXacNhan" || payment.Amount != invoice.TotalAmount || invoice.Status is not (InvoiceStatus.ChuaThanhToan or InvoiceStatus.QuaHan))
                return false;

            using var transaction = _context.Database.BeginTransaction();
            try
            {
                payment.Status = "DaXacNhan";
                invoice.Status = InvoiceStatus.DaThanhToan;
                _context.SaveChanges();
                ActivateDepositContract(invoice);
                _activityLogService.Log(confirmedByUserId, "ConfirmTransfer", "Payment", payment.Id, $"InvoiceId={invoice.Id}, Ref={payment.TransactionRef}");
                transaction.Commit();
                return true;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public bool RejectTransfer(int paymentId, int actorUserId)
        {
            var payment = _context.Payments.FirstOrDefault(p => p.Id == paymentId);
            if (payment == null || payment.Status != "ChoXacNhan") return false;
            payment.Status = "TuChoi";
            _context.SaveChanges();
            _activityLogService.Log(actorUserId, "RejectTransfer", "Payment", payment.Id, $"InvoiceId={payment.InvoiceId}, Ref={payment.TransactionRef}");
            return true;
        }

        private void ActivateDepositContract(Invoice invoice)
        {
            if (invoice.Type != InvoiceType.Coc) return;
            var contract = _contractRepository.GetById(invoice.ContractId);
            if (contract == null || contract.Status != ContractStatus.ChoCoc) return;
            contract.Status = ContractStatus.DangHieuLuc;
            _contractRepository.Update(contract);
            var room = _roomRepository.GetById(contract.RoomId);
            if (room != null)
            {
                room.Status = RoomStatus.DaThue;
                _roomRepository.Update(room);
            }
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
                TransactionRef = payment.TransactionRef,
                Status = payment.Status
            };
        }
    }
}
