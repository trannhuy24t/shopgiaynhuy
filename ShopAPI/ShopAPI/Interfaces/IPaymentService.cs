using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface IPaymentService
    {
        QrPaymentResponseDto? GetQrForInvoice(int invoiceId, int userId);

        List<PaymentDto> GetByInvoiceId(int invoiceId);

        bool ConfirmCash(ConfirmPaymentDto dto, int confirmedByUserId);

        (bool Success, string Message) SubmitTransfer(SubmitTransferDto dto, int userId);

        bool ConfirmTransfer(int paymentId, int confirmedByUserId);

        bool RejectTransfer(int paymentId, int actorUserId);
    }
}
