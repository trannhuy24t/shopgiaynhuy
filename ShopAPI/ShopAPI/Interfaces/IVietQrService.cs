namespace ShopAPI.Interfaces
{
    public interface IVietQrService
    {
        string GeneratePayload(decimal amount, string addInfo);
    }
}
