import api from "../client";
import type { ReportDashboardDto, ActivityLogDto } from "../../types/report";
import type { PagedResult } from "../../types/common";

// Admin — số liệu tổng quan
export const getReportDashboard = () => {
    return api.get<ReportDashboardDto>("/Report/dashboard");
};

// Admin — nhật ký hoạt động, có phân trang thật (PagedResultDto)
export const getActivityLogs = (page = 1, pageSize = 20) => {
    return api.get<PagedResult<ActivityLogDto>>("/Report/logs", { params: { page, pageSize } });
};
