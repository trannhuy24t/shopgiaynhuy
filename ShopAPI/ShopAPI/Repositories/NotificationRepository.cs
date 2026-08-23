using ShopAPI.Data;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Repositories
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly AppDbContext _context;

        public NotificationRepository(AppDbContext context)
        {
            _context = context;
        }

        public List<Notification> GetByUserId(int userId)
        {
            return _context.Notifications
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.Id)
                .ToList();
        }

        public Notification? GetById(int id)
        {
            return _context.Notifications.Find(id);
        }

        public void Add(Notification notification)
        {
            _context.Notifications.Add(notification);
            _context.SaveChanges();
        }

        public void Update(Notification notification)
        {
            _context.Notifications.Update(notification);
            _context.SaveChanges();
        }
    }
}
