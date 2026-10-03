using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface IReportService
    {
        Task<ReportDashboardDto> GetDashboardAsync();
        Task<PagedResultDto<ActivityLogDto>> GetLogsAsync(int page, int pageSize);
    }
}
