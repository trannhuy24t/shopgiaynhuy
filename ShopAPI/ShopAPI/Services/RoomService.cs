using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Services
{
    public class RoomService : IRoomService
    {
        private readonly IRoomRepository _roomRepository;
        private readonly IContractRepository _contractRepository;
        private readonly IActivityLogService _activityLogService;

        public RoomService(IRoomRepository roomRepository, IContractRepository contractRepository, IActivityLogService activityLogService)
        {
            _roomRepository = roomRepository;
            _contractRepository = contractRepository;
            _activityLogService = activityLogService;
        }

        public List<RoomDto> GetAll(int? buildingId, string? status)
        {
            var rooms = _roomRepository.GetAll().AsQueryable();

            if (buildingId.HasValue)
            {
                rooms = rooms.Where(r => r.BuildingId == buildingId.Value);
            }

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<RoomStatus>(status, out var roomStatus))
            {
                rooms = rooms.Where(r => r.Status == roomStatus);
            }

            return rooms.Select(MapToDto).ToList();
        }

        public List<RoomDto> GetAvailable(int? buildingId)
        {
            return GetAll(buildingId, nameof(RoomStatus.Trong));
        }

        public RoomDto? GetById(int id)
        {
            var room = _roomRepository.GetById(id);

            return room == null ? null : MapToDto(room);
        }

        public RoomDto Create(CreateRoomDto dto)
        {
            var room = new Room
            {
                BuildingId = dto.BuildingId,
                RoomNumber = dto.RoomNumber,
                Area = dto.Area,
                Price = dto.Price,
                ServiceFee = dto.ServiceFee,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl,
                Status = RoomStatus.Trong,
                CreatedAt = DateTime.UtcNow
            };

            _roomRepository.Add(room);

            return MapToDto(room);
        }

        public bool Update(UpdateRoomDto dto)
        {
            var room = _roomRepository.GetById(dto.Id);

            if (room == null)
            {
                return false;
            }

            room.RoomNumber = dto.RoomNumber;
            room.Area = dto.Area;
            room.Price = dto.Price;
            room.ServiceFee = dto.ServiceFee;
            room.Description = dto.Description;
            room.ImageUrl = dto.ImageUrl;

            _roomRepository.Update(room);

            return true;
        }

        public bool UpdateStatus(UpdateRoomStatusDto dto)
        {
            var room = _roomRepository.GetById(dto.Id);

            if (room == null)
            {
                return false;
            }

            if (!Enum.TryParse<RoomStatus>(dto.Status, out var newStatus))
            {
                return false;
            }

            room.Status = newStatus;
            _roomRepository.Update(room);

            _activityLogService.Log(null, "UpdateRoomStatus", "Room", room.Id, $"Status = {dto.Status}");

            return true;
        }

        public bool Delete(int id)
        {
            var room = _roomRepository.GetById(id);

            if (room == null)
            {
                return false;
            }

            _roomRepository.Delete(room);

            return true;
        }

        public List<RoomMediaDto>? AddMedia(int roomId, List<RoomMediaInputDto> items)
        {
            var room = _roomRepository.GetById(roomId);

            if (room == null)
            {
                return null;
            }

            var nextSortOrder = room.Media.Count == 0 ? 0 : room.Media.Max(m => m.SortOrder) + 1;

            foreach (var item in items)
            {
                _roomRepository.AddMedia(new RoomMedia
                {
                    RoomId = roomId,
                    Url = item.Url,
                    Type = item.Type,
                    SortOrder = nextSortOrder++,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Náº¿u phĂ²ng chÆ°a cĂ³ áº£nh Ä‘áº¡i diá»‡n, láº¥y áº£nh Ä‘áº§u tiĂªn vá»«a thĂªm lĂ m áº£nh Ä‘áº¡i diá»‡n
            if (string.IsNullOrEmpty(room.ImageUrl))
            {
                var firstImage = items.FirstOrDefault(i => i.Type == "Image");

                if (firstImage != null)
                {
                    room.ImageUrl = firstImage.Url;
                    _roomRepository.Update(room);
                }
            }

            room = _roomRepository.GetById(roomId);

            return room!.Media.OrderBy(m => m.SortOrder).Select(MapMediaToDto).ToList();
        }

        public string? RemoveMedia(int roomId, int mediaId)
        {
            var media = _roomRepository.GetMediaById(mediaId);

            if (media == null || media.RoomId != roomId)
            {
                return null;
            }

            var url = media.Url;
            _roomRepository.RemoveMedia(media);

            var room = _roomRepository.GetById(roomId);

            if (room != null && room.ImageUrl == url)
            {
                room.ImageUrl = room.Media.FirstOrDefault(m => m.Type == "Image")?.Url;
                _roomRepository.Update(room);
            }

            return url;
        }

        public bool SetPrimaryMedia(int roomId, int mediaId)
        {
            var media = _roomRepository.GetMediaById(mediaId);

            if (media == null || media.RoomId != roomId || media.Type != "Image")
            {
                return false;
            }

            var room = _roomRepository.GetById(roomId);

            if (room == null)
            {
                return false;
            }

            room.ImageUrl = media.Url;
            _roomRepository.Update(room);

            return true;
        }

        private static RoomMediaDto MapMediaToDto(RoomMedia media)
        {
            return new RoomMediaDto
            {
                Id = media.Id,
                Url = media.Url,
                Type = media.Type,
                SortOrder = media.SortOrder
            };
        }

        private RoomDto MapToDto(Room room)
        {
            var activeContract = _contractRepository.GetActiveByRoomId(room.Id);

            return new RoomDto
            {
                Id = room.Id,
                BuildingId = room.BuildingId,
                BuildingName = room.Building?.Name,
                OwnerPhone = room.Building?.Owner?.PhoneNumber,
                RoomNumber = room.RoomNumber,
                Area = room.Area,
                Price = room.Price,
                ServiceFee = room.ServiceFee,
                Status = room.Status.ToString(),
                Description = room.Description,
                ImageUrl = room.ImageUrl,
                CreatedAt = room.CreatedAt,
                Media = room.Media.OrderBy(m => m.SortOrder).Select(MapMediaToDto).ToList(),
                CurrentOccupants = activeContract == null ? null : activeContract.NumberOfOccupants
            };
        }
    }
}
