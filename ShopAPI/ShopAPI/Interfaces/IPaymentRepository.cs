using ShopAPI.Models;

namespace ShopAPI.Interfaces
{
    public interface IPaymentRepository
    {
        List<Payment> GetByInvoiceId(int invoiceId);

        void Add(Payment payment);
    }
}
