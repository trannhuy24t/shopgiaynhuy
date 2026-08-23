import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getReportDashboard } from '../../../api/report';
import { getApiErrorMessage } from '../../../api/client';
import type { ReportDashboardDto } from '../../../types/report';
import { BarChart3, Building2, DoorOpen, Users, AlertTriangle, Wrench, FileClock } from 'lucide-react';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const ReportDashboardPage = () => {
  const [data, setData] = useState<ReportDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getReportDashboard();
        setData(res.data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Không tải được số liệu báo cáo.'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold p-6 rounded-2xl inline-block">
          {error || 'Không có dữ liệu.'}
        </div>
      </div>
    );
  }

  const chartData = data.revenueByMonth.map((m) => ({
    name: `Tháng ${m.month}`,
    DoanhThu: m.total,
  }));

  const stats = [
    { title: 'Tổng phòng', value: `${data.totalRooms}`, icon: Building2, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    { title: 'Tỷ lệ lấp đầy', value: `${data.occupancyRate}%`, icon: DoorOpen, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { title: 'Doanh thu tháng này', value: formatPrice(data.totalRevenueThisMonth), icon: BarChart3, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { title: 'Tổng khách thuê', value: `${data.totalTenants}`, icon: Users, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  ];

  const secondaryStats = [
    { title: 'Phòng trống', value: data.vacantRooms },
    { title: 'Phòng đang sửa', value: data.maintenanceRooms },
    { title: 'Hợp đồng chờ duyệt', value: data.pendingContracts },
    { title: 'Yêu cầu bảo trì chờ xử lý', value: data.pendingMaintenanceRequests },
  ];

  return (
    <div className="max-w-7xl space-y-8">
      <div className="pb-4 border-b border-slate-900">
        <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
          Tổng quan vận hành
        </span>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Dashboard báo cáo</h1>
      </div>

      {(data.overdueInvoiceCount > 0) && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold p-4 rounded-xl flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          {data.overdueInvoiceCount} hóa đơn quá hạn — tổng {formatPrice(data.overdueAmount)}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-md">
              <div className="space-y-2 text-left">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{stat.title}</span>
                <span className="text-xl sm:text-2xl font-black text-white block">{stat.value}</span>
              </div>
              <div className={`p-3.5 rounded-xl border ${stat.color} shrink-0`}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-4 shadow-md">
          <h3 className="font-bold text-lg text-white uppercase tracking-wide">Doanh thu 6 tháng gần nhất</h3>
          <div className="h-80 w-full text-xs font-medium">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f1f5f9' }}
                  formatter={(value) => [formatPrice(Number(value)), 'Doanh thu']}
                />
                <Line type="monotone" dataKey="DoanhThu" stroke="#f97316" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-5 shadow-md">
          <h3 className="font-bold text-lg text-white uppercase tracking-wide pb-2 border-b border-slate-850">Chỉ số khác</h3>
          {secondaryStats.map((s, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-xs text-slate-400 font-semibold">{s.title}</span>
              <span className="text-sm font-black text-white">{s.value}</span>
            </div>
          ))}
          <div className="pt-4 border-t border-slate-850 flex gap-2">
            <Wrench size={14} className="text-slate-600 mt-0.5 shrink-0" />
            <FileClock size={14} className="text-slate-600 mt-0.5 shrink-0" />
            <span className="text-[10px] text-slate-500">Xem chi tiết ở trang Quản lý bảo trì / hợp đồng.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDashboardPage;
