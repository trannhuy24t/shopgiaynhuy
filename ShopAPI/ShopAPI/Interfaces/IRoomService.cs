using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface IRoomService
    {
        List<RoomDto> GetAll(int? buildingId, string? status);

        List<RoomDto> GetAvailable(int? buildingId);

        RoomDto? GetById(int id);

        RoomDto Create(CreateRoomDto dto);

        bool Update(UpdateRoomDto dto);

        bool UpdateStatus(UpdateRoomStatusDto dto);

        bool Delete(int id);

        List<RoomMediaDto>? AddMedia(int roomId, List<RoomMediaInputDto> items);

        // Trả về Url của media vừa xóa (để Controller xóa file vật lý) hoặc null nếu không tìm thấy
        string? RemoveMedia(int roomId, int mediaId);

        bool SetPrimaryMedia(int roomId, int mediaId);
    }
}
