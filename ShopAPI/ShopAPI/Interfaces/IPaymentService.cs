using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface IPaymentService
    {
        QrPaymentResponseDto? GetQrForInvoice(int invoiceId, int userId);

        List<PaymentDto> GetByInvoiceId(int invoiceId);

        bool ConfirmCash(ConfirmPaymentDto dto, int confirmedByUserId);
    }
}
