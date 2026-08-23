using ShopAPI.Data;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Services
{
    public class SystemConfigService : ISystemConfigService
    {
        private readonly AppDbContext _context;

        public SystemConfigService(AppDbContext context)
        {
            _context = context;
        }

        public List<SystemConfigDto> GetAll()
        {
            return _context.SystemConfigs
                .OrderBy(x => x.Key)
                .Select(MapToDto)
                .ToList();
        }

        public SystemConfigDto Upsert(UpsertSystemConfigDto dto)
        {
            var config = _context.SystemConfigs.FirstOrDefault(x => x.Key == dto.Key);

            if (config == null)
            {
                config = new SystemConfig
                {
                    Key = dto.Key,
                    Value = dto.Value,
                    Description = dto.Description
                };

                _context.SystemConfigs.Add(config);
            }
            else
            {
                config.Value = dto.Value;

                if (dto.Description != null)
                {
                    config.Description = dto.Description;
                }
            }

            _context.SaveChanges();

            return MapToDto(config);
        }

        public PublicRatesDto GetPublicRates()
        {
            var electricRaw = _context.SystemConfigs.FirstOrDefault(x => x.Key == "DefaultElectricUnitPrice")?.Value;
            var waterRaw = _context.SystemConfigs.FirstOrDefault(x => x.Key == "DefaultWaterUnitPrice")?.Value;

            decimal.TryParse(electricRaw, out var electric);
            decimal.TryParse(waterRaw, out var water);

            return new PublicRatesDto
            {
                ElectricUnitPrice = electric,
                WaterUnitPrice = water
            };
        }

        private static SystemConfigDto MapToDto(SystemConfig config)
        {
            return new SystemConfigDto
            {
                Id = config.Id,
                Key = config.Key,
                Value = config.Value,
                Description = config.Description
            };
        }
    }
}
