using ShopAPI.Models;

namespace ShopAPI.Interfaces
{
    public interface INotificationRepository
    {
        List<Notification> GetByUserId(int userId);

        Notification? GetById(int id);

        void Add(Notification notification);

        void Update(Notification notification);
    }
}
