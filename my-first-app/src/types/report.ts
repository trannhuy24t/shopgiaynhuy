export interface MonthlyRevenueDto {
  month: number;
  year: number;
  total: number;
}

export interface ReportDashboardDto {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  totalTenants: number;
  totalRevenueThisMonth: number;
  revenueByMonth: MonthlyRevenueDto[];
  overdueInvoiceCount: number;
  overdueAmount: number;
  pendingContracts: number;
  pendingMaintenanceRequests: number;
}

export interface ActivityLogDto {
  id: number;
  userId?: number | null;
  userName?: string | null;
  action: string;
  entityName: string;
  entityId?: number | null;
  detail?: string | null;
  createdAt: string;
}
