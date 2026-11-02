namespace ShopAPI.DTOs
{
    // DTO hứng payload Webhook từ dịch vụ SePay (sepay.vn) khi có biến động số dư ngân hàng
    public class SePayWebhookDto
    {
        public long Id { get; set; }                      // ID giao dịch trên SePay
        public string? Gateway { get; set; }              // Ngân hàng thụ hưởng (MBBank, VCB...)
        public string? TransactionDate { get; set; }      // Thời gian giao dịch
        public string? AccountNumber { get; set; }        // Số tài khoản nhận tiền
        public string? Code { get; set; }                 // Mã code thanh toán SePay (nếu có)
        public string? Content { get; set; }              // Nội dung chuyển khoản thực tế (VD: "TROHUB HD10")
        public string? TransferType { get; set; }         // "in" (tiền vào) | "out" (tiền ra)
        public decimal TransferAmount { get; set; }       // Số tiền chuyển vào
        public decimal Accumulated { get; set; }          // Số dư tài khoản sau giao dịch
        public string? SubAccount { get; set; }
        public string? ReferenceCode { get; set; }        // Mã tham chiếu ngân hàng (FT...)
        public string? Description { get; set; }
    }
}

