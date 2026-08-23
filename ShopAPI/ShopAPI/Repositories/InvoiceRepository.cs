using ShopAPI.Data;
using ShopAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using ShopAPI.Models;

namespace ShopAPI.Repositories
{
    public class InvoiceRepository : IInvoiceRepository
    {
        private readonly AppDbContext _context;

        public InvoiceRepository(AppDbContext context)
        {
            _context = context;
        }

        private IQueryable<Invoice> Query()
        {
            return _context.Invoices
                .Include(x => x.Items)
                .Include(x => x.Contract!).ThenInclude(c => c!.Room)
                .Include(x => x.Contract!).ThenInclude(c => c!.Tenant);
        }

        public List<Invoice> GetAll()
        {
            return Query().ToList();
        }

        public List<Invoice> GetByContractIds(List<int> contractIds)
        {
            return Query().Where(x => contractIds.Contains(x.ContractId)).ToList();
        }

        public Invoice? GetById(int id)
        {
            return Query().FirstOrDefault(x => x.Id == id);
        }

        public void Add(Invoice invoice)
        {
            _context.Invoices.Add(invoice);
            _context.SaveChanges();
        }

        public void Update(Invoice invoice)
        {
            _context.Invoices.Update(invoice);
            _context.SaveChanges();
        }
    }
}
