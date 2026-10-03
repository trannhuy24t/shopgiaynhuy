using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Services
{
    public class BuildingService : IBuildingService
    {
        private readonly IBuildingRepository _buildingRepository;

        public BuildingService(IBuildingRepository buildingRepository)
        {
            _buildingRepository = buildingRepository;
        }

        public List<BuildingDto> GetAll()
        {
            return _buildingRepository.GetAll()
                .Select(MapToDto)
                .ToList();
        }

        public BuildingDto? GetById(int id)
        {
            var building = _buildingRepository.GetById(id);

            return building == null ? null : MapToDto(building);
        }

        public BuildingDto Create(CreateBuildingDto dto)
        {
            var building = new Building
            {
                Name = dto.Name,
                Address = dto.Address,
                OwnerId = dto.OwnerId,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow
            };

            _buildingRepository.Add(building);

            return MapToDto(building);
        }

        public bool Update(UpdateBuildingDto dto)
        {
            var building = _buildingRepository.GetById(dto.Id);

            if (building == null)
            {
                return false;
            }

            building.Name = dto.Name;
            building.Address = dto.Address;
            building.OwnerId = dto.OwnerId;
            building.Description = dto.Description;

            _buildingRepository.Update(building);

            return true;
        }

        public bool Delete(int id)
        {
            var building = _buildingRepository.GetById(id);

            if (building == null)
            {
                return false;
            }

            _buildingRepository.Delete(building);

            return true;
        }

        private static BuildingDto MapToDto(Building building)
        {
            return new BuildingDto
            {
                Id = building.Id,
                Name = building.Name,
                Address = building.Address,
                OwnerId = building.OwnerId,
                OwnerName = building.Owner?.FullName,
                Description = building.Description,
                RoomCount = building.Rooms.Count,
                CreatedAt = building.CreatedAt
            };
        }
    }
}
