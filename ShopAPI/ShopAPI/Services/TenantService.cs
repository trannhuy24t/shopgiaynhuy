using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Services
{
    public class TenantService : ITenantService
    {
        private readonly ITenantRepository _tenantRepository;

        public TenantService(ITenantRepository tenantRepository)
        {
            _tenantRepository = tenantRepository;
        }

        public List<TenantDto> GetAll()
        {
            return _tenantRepository.GetAll().Select(MapToDto).ToList();
        }

        public TenantDto? GetById(int id)
        {
            var tenant = _tenantRepository.GetById(id);

            return tenant == null ? null : MapToDto(tenant);
        }

        public TenantDto? GetByUserId(int userId)
        {
            var tenant = _tenantRepository.GetByUserId(userId);

            return tenant == null ? null : MapToDto(tenant);
        }

        public TenantDto UpsertForUser(int userId, UpsertTenantProfileDto dto)
        {
            var tenant = _tenantRepository.GetByUserId(userId);

            if (tenant == null)
            {
                tenant = new Tenant
                {
                    UserId = userId,
                    FullName = dto.FullName,
                    IdCardNumber = dto.IdCardNumber,
                    Phone = dto.Phone,
                    Email = dto.Email,
                    EmergencyContact = dto.EmergencyContact,
                    CreatedAt = DateTime.UtcNow
                };

                _tenantRepository.Add(tenant);
            }
            else
            {
                tenant.FullName = dto.FullName;
                tenant.IdCardNumber = dto.IdCardNumber;
                tenant.Phone = dto.Phone;
                tenant.Email = dto.Email;
                tenant.EmergencyContact = dto.EmergencyContact;

                _tenantRepository.Update(tenant);
            }

            return MapToDto(tenant);
        }

        private static TenantDto MapToDto(Tenant tenant)
        {
            return new TenantDto
            {
                Id = tenant.Id,
                UserId = tenant.UserId,
                UserEmail = tenant.User?.Email,
                FullName = tenant.FullName,
                IdCardNumber = tenant.IdCardNumber,
                Phone = tenant.Phone,
                Email = tenant.Email,
                EmergencyContact = tenant.EmergencyContact,
                CreatedAt = tenant.CreatedAt
            };
        }
    }
}
