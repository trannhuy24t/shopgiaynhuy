using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface IReportService
    {
        ReportDashboardDto GetDashboard();

        PagedResultDto<ActivityLogDto> GetLogs(int page, int pageSize);
    }
}
