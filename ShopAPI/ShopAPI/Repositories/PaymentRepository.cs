using ShopAPI.Data;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Repositories
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly AppDbContext _context;

        public PaymentRepository(AppDbContext context)
        {
            _context = context;
        }

        public List<Payment> GetByInvoiceId(int invoiceId)
        {
            return _context.Payments
                .Where(x => x.InvoiceId == invoiceId)
                .OrderByDescending(x => x.Id)
                .ToList();
        }

        public void Add(Payment payment)
        {
            _context.Payments.Add(payment);
            _context.SaveChanges();
        }
    }
}
