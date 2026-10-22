namespace ShopAPI.Interfaces
{
    public interface IVietQrService
    {
        bool TryGeneratePayload(decimal amount, string addInfo, out string payload);
    }
}
