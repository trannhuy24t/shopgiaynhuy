import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyMaintenanceRequests } from '../../api/maintenance';
import { getApiErrorMessage, resolveImageUrl } from '../../api/client';
import StatusBadge from '../../components/Common/StatusBadge';
import type { MaintenanceRequestDto } from '../../types/maintenance';
import { Plus, Wrench } from 'lucide-react';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

const MyMaintenanceRequestsPage = () => {
  const [requests, setRequests] = useState<MaintenanceRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getMyMaintenanceRequests();
        setRequests(res.data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Không tải được danh sách yêu cầu bảo trì.'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
            Tài khoản của tôi
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Yêu cầu bảo trì</h1>
        </div>
        <Link
          to="/yeu-cau-bao-tri/moi"
          className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold px-5 py-3 rounded-2xl flex items-center gap-1.5 transition-all shadow-lg shadow-orange-500/10 cursor-pointer"
        >
          <Plus size={16} /> Gửi yêu cầu mới
        </Link>
      </div>

      {loading && (
        <div className="min-h-[30vh] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold p-6 rounded-2xl text-center">
          {error}
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
          <Wrench className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-lg">Bạn chưa gửi yêu cầu bảo trì nào.</p>
        </div>
      )}

      {!loading && !error && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="bg-slate-900 border border-slate-850 p-5 sm:p-6 rounded-2xl">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h4 className="font-bold text-white text-sm sm:text-base">{r.title}</h4>
                    <StatusBadge entity="maintenancePriority" value={r.priority} />
                    <StatusBadge entity="maintenanceStatus" value={r.status} />
                  </div>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    Phòng {r.roomNumber || `#${r.roomId}`} · Gửi lúc {formatDate(r.createdAt)}
                  </p>
                  {r.description && <p className="text-sm text-slate-400 mt-2">{r.description}</p>}
                  {r.assignedToUserName && (
                    <p className="text-xs text-slate-500 mt-2">Người phụ trách: <span className="text-slate-300 font-semibold">{r.assignedToUserName}</span></p>
                  )}
                  {r.note && (
                    <p className="text-xs text-slate-500 mt-1">Ghi chú: <span className="text-slate-300">{r.note}</span></p>
                  )}
                  {r.resolvedAt && (
                    <p className="text-xs text-green-400 mt-1">Hoàn thành lúc {formatDate(r.resolvedAt)}</p>
                  )}
                </div>
                {r.imageUrl && (
                  <img src={resolveImageUrl(r.imageUrl)} alt={r.title} className="w-20 h-20 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyMaintenanceRequestsPage;
