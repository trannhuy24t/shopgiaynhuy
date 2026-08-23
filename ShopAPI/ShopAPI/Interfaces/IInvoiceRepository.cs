using ShopAPI.Models;

namespace ShopAPI.Interfaces
{
    public interface IInvoiceRepository
    {
        List<Invoice> GetAll();

        List<Invoice> GetByContractIds(List<int> contractIds);

        Invoice? GetById(int id);

        void Add(Invoice invoice);

        void Update(Invoice invoice);
    }
}
