using ShopAPI.Data;
using ShopAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using ShopAPI.Models;

namespace ShopAPI.Repositories
{
    public class RoomRepository : IRoomRepository
    {
        private readonly AppDbContext _context;

        public RoomRepository(AppDbContext context)
        {
            _context = context;
        }

        public List<Room> GetAll()
        {
            return _context.Rooms
                .Include(x => x.Building)
                .Include(x => x.Media)
                .ToList();
        }

        public Room? GetById(int id)
        {
            return _context.Rooms
                .Include(x => x.Building)
                .Include(x => x.Media)
                .FirstOrDefault(x => x.Id == id);
        }

        public void Add(Room room)
        {
            _context.Rooms.Add(room);
            _context.SaveChanges();
        }

        public void Update(Room room)
        {
            _context.Rooms.Update(room);
            _context.SaveChanges();
        }

        public void Delete(Room room)
        {
            _context.Rooms.Remove(room);
            _context.SaveChanges();
        }

        public RoomMedia? GetMediaById(int mediaId)
        {
            return _context.RoomMedias.FirstOrDefault(x => x.Id == mediaId);
        }

        public void AddMedia(RoomMedia media)
        {
            _context.RoomMedias.Add(media);
            _context.SaveChanges();
        }

        public void RemoveMedia(RoomMedia media)
        {
            _context.RoomMedias.Remove(media);
            _context.SaveChanges();
        }
    }
}
