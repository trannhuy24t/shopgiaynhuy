namespace ShopAPI.Interfaces
{
    public interface IActivityLogService
    {
        void Log(int? userId, string action, string entityName, int? entityId, string? detail = null);
    }
}
