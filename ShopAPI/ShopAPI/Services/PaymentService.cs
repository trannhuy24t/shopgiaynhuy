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
        private readonly INotificationService _notificationService;
        private readonly AppDbContext _context;

        public PaymentService(
            IPaymentRepository paymentRepository,
            IInvoiceRepository invoiceRepository,
            IContractRepository contractRepository,
            IRoomRepository roomRepository,
            IVietQrService vietQrService,
            IActivityLogService activityLogService,
            INotificationService notificationService,
            AppDbContext context)
        {
            _paymentRepository = paymentRepository;
            _invoiceRepository = invoiceRepository;
            _contractRepository = contractRepository;
            _roomRepository = roomRepository;
            _vietQrService = vietQrService;
            _activityLogService = activityLogService;
            _notificationService = notificationService;
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

        public (bool Success, string Message, int? InvoiceId) ProcessSePayWebhook(SePayWebhookDto dto)
        {
            if (dto.TransferType != null && !dto.TransferType.Equals("in", StringComparison.OrdinalIgnoreCase))
            {
                return (false, "Giao dịch không phải là tiền vào (transferType != in).", null);
            }

            var text = $"{dto.Content} {dto.Code} {dto.Description}";
            var match = System.Text.RegularExpressions.Regex.Match(text, @"(?i)(?:HD|HOADON|TROHUB)\s*(\d+)");
            if (!match.Success)
            {
                match = System.Text.RegularExpressions.Regex.Match(text, @"\b(\d+)\b");
            }

            if (!match.Success || !int.TryParse(match.Groups[1].Value, out var invoiceId))
            {
                return (false, $"Không thể trích xuất mã hóa đơn từ nội dung chuyển khoản: '{dto.Content}'", null);
            }

            var invoice = _invoiceRepository.GetById(invoiceId);
            if (invoice == null)
            {
                return (false, $"Không tìm thấy hóa đơn #{invoiceId}.", invoiceId);
            }

            if (invoice.Status == InvoiceStatus.DaThanhToan)
            {
                return (true, $"Hóa đơn #{invoiceId} đã được thanh toán trước đó.", invoiceId);
            }

            if (dto.TransferAmount < invoice.TotalAmount)
            {
                return (false, $"Số tiền chuyển ({dto.TransferAmount:N0} đ) nhỏ hơn tổng tiền hóa đơn #{invoiceId} ({invoice.TotalAmount:N0} đ).", invoiceId);
            }

            using var transaction = _context.Database.BeginTransaction();
            try
            {
                var existingPending = _context.Payments.FirstOrDefault(p => p.InvoiceId == invoice.Id && p.Status == "ChoXacNhan");
                if (existingPending != null)
                {
                    existingPending.Status = "DaXacNhan";
                    existingPending.TransactionRef = !string.IsNullOrWhiteSpace(dto.ReferenceCode) ? dto.ReferenceCode : $"SEPAY_{dto.Id}";
                    existingPending.PaymentDate = DateTime.UtcNow;
                }
                else
                {
                    var payment = new Payment
                    {
                        InvoiceId = invoice.Id,
                        Amount = dto.TransferAmount,
                        Method = "QR",
                        Status = "DaXacNhan",
                        TransactionRef = !string.IsNullOrWhiteSpace(dto.ReferenceCode) ? dto.ReferenceCode : $"SEPAY_{dto.Id}",
                        PaymentDate = DateTime.UtcNow
                    };
                    _context.Payments.Add(payment);
                }

                invoice.Status = InvoiceStatus.DaThanhToan;
                _invoiceRepository.Update(invoice);
                ActivateDepositContract(invoice);

                _activityLogService.Log(1, "SePayWebhook", "Payment", invoice.Id, $"Auto-confirmed invoice #{invoice.Id} via SePay. Gateway={dto.Gateway}, Ref={dto.ReferenceCode}, Amount={dto.TransferAmount}");

                if (invoice.Contract?.Tenant?.UserId != null)
                {
                    _notificationService.Create(new CreateNotificationDto
                    {
                        UserId = invoice.Contract.Tenant.UserId,
                        Title = "Thanh toán thành công!",
                        Content = $"Hóa đơn #{invoice.Id} kỳ {invoice.Month}/{invoice.Year} ({invoice.TotalAmount:N0} đ) đã được tự động xác nhận qua ngân hàng.",
                        Type = "HoaDon",
                        RelatedInvoiceId = invoice.Id
                    }, 1);
                }

                _notificationService.NotifyRole(
                    "Admin",
                    "Nhận thanh toán tự động",
                    $"Hệ thống đã nhận {dto.TransferAmount:N0} đ từ {dto.Gateway} cho hóa đơn #{invoice.Id}.",
                    "HoaDon",
                    invoice.Id
                );

                transaction.Commit();
                return (true, $"Tự động xác nhận hóa đơn #{invoiceId} thành công.", invoiceId);
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public (bool Success, string Message) SimulateTransfer(int invoiceId)
        {
            var invoice = _invoiceRepository.GetById(invoiceId);
            if (invoice == null)
            {
                return (false, $"Không tìm thấy hóa đơn #{invoiceId}.");
            }

            if (invoice.Status == InvoiceStatus.DaThanhToan)
            {
                return (true, $"Hóa đơn #{invoiceId} đã được thanh toán trước đó.");
            }

            var mockSePayDto = new SePayWebhookDto
            {
                Id = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                Gateway = "MBBank (Simulated)",
                TransactionDate = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
                AccountNumber = "0123456789",
                Content = $"HD{invoice.Id} TROHUB SIMULATED TRANSFER",
                TransferType = "in",
                TransferAmount = invoice.TotalAmount,
                ReferenceCode = $"SIM_{Guid.NewGuid().ToString("N")[..8].ToUpper()}"
            };

            var (success, message, _) = ProcessSePayWebhook(mockSePayDto);
            return (success, message);
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
