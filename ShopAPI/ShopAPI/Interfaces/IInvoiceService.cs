using ShopAPI.DTOs;
using ShopAPI.Models;

namespace ShopAPI.Interfaces
{
    public interface IInvoiceService
    {
        List<InvoiceDto> GetAll(string? status, int? contractId);

        List<InvoiceDto> GetMy(int userId);

        InvoiceDto? GetById(int id);

        bool IsOwnedByUser(int invoiceId, int userId);

        (InvoiceDto? Invoice, string? Error) CreateMonthly(CreateInvoiceDto dto, int staffUserId);

        // Called by ContractService right after a contract is approved.
        Invoice CreateDepositInvoice(int contractId, DateTime startDate, decimal depositAmount);
    }
}
