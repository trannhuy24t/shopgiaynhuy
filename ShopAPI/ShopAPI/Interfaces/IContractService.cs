using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface IContractService
    {
        List<ContractDto> GetAll(string? status);

        List<ContractDto> GetMy(int userId);

        ContractDto? GetById(int id);

        bool IsOwnedByUser(int contractId, int userId);

        ContractDto? Request(int userId, RequestContractDto dto);

        bool Approve(int contractId, ApproveContractDto dto, int approverUserId);

        bool Reject(int contractId, RejectContractDto dto, int approverUserId);

        bool Terminate(int contractId, int actorUserId);

        // Gán/sửa đơn giá điện/nước cho hợp đồng đang DangHieuLuc mà chưa có (hoặc cần điều
        // chỉnh) mà không phải quay lại bước approve — tự thông báo cho Tenant khi thành công.
        (bool Success, string? Error) SetUnitPrice(int contractId, SetContractUnitPriceDto dto, int actorUserId);

        // Người ở cùng (Occupant) — NumberOfOccupants tính cả người thuê chính, nên bảng
        // Occupant chỉ chứa những người NGOÀI người thuê chính (tối đa NumberOfOccupants - 1 dòng).
        List<OccupantDto>? GetOccupants(int contractId);

        (List<OccupantDto>? Occupants, string? Error) AddOccupant(int contractId, CreateOccupantDto dto, int actorUserId);

        bool IsOccupantOwnedByUser(int occupantId, int userId);

        (OccupantDto? Occupant, string? Error) UpdateOccupant(int occupantId, UpdateOccupantDto dto, int actorUserId);

        bool RemoveOccupant(int occupantId, int actorUserId);
    }
}
