using ShopAPI.Models;

namespace ShopAPI.Interfaces
{
    public interface IRoomRepository
    {
        List<Room> GetAll();

        Room? GetById(int id);

        void Add(Room room);

        void Update(Room room);

        void Delete(Room room);

        RoomMedia? GetMediaById(int mediaId);

        void AddMedia(RoomMedia media);

        void RemoveMedia(RoomMedia media);
    }
}
