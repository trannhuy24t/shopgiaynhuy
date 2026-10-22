import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyMaintenanceRequests, cancelMyMaintenanceRequest, replyToMaintenanceRequest } from '../../api/maintenance';
import { getApiErrorMessage, resolveImageUrl } from '../../api/client';
import StatusBadge from '../../components/Common/StatusBadge';
import ImageWithFallback from '../../components/Common/ImageWithFallback';
import type { MaintenanceRequestDto } from '../../types/maintenance';
import { Plus, Wrench, XCircle } from 'lucide-react';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

const MyMaintenanceRequestsPage = () => {
  const [requests, setRequests] = useState<MaintenanceRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [sendingReplyId, setSendingReplyId] = useState<number | null>(null);

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

  const handleCancel = async (id: number) => {
    if (!window.confirm('Hủy yêu cầu bảo trì này?')) return;
    setCancelingId(id);
    try {
      await cancelMyMaintenanceRequest(id);
      const res = await getMyMaintenanceRequests();
      setRequests(res.data);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể hủy yêu cầu bảo trì.'));
    } finally {
      setCancelingId(null);
    }
  };

  const handleReply = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    const message = replyDrafts[id]?.trim();
    if (!message) return;
    setSendingReplyId(id);
    try {
      await replyToMaintenanceRequest(id, message);
      setReplyDrafts((current) => ({ ...current, [id]: '' }));
      const res = await getMyMaintenanceRequests();
      setRequests(res.data);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không gửi được phản hồi.'));
    } finally {
      setSendingReplyId(null);
    }
  };

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
                    <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">Trao đổi: <span className="text-slate-300">{r.note}</span></p>
                  )}
                  {r.resolvedAt && (
                    <p className="text-xs text-green-400 mt-1">Hoàn thành lúc {formatDate(r.resolvedAt)}</p>
                  )}
                  {(r.status === 'Moi' || r.status === 'DaPhanCong') && (
                    <button onClick={() => handleCancel(r.id)} disabled={cancelingId === r.id} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 disabled:opacity-50">
                      <XCircle size={13} /> {cancelingId === r.id ? 'Đang hủy...' : 'Hủy yêu cầu'}
                    </button>
                  )}
                  {r.status !== 'HoanThanh' && r.status !== 'DaHuy' && (
                    <form onSubmit={(e) => handleReply(e, r.id)} className="mt-3 flex flex-col sm:flex-row gap-2">
                      <input value={replyDrafts[r.id] ?? ''} onChange={(e) => setReplyDrafts((current) => ({ ...current, [r.id]: e.target.value }))} maxLength={2000} placeholder="Gửi thêm thông tin cho quản lý..." className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500" />
                      <button type="submit" disabled={sendingReplyId === r.id || !(replyDrafts[r.id] ?? '').trim()} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-50">{sendingReplyId === r.id ? 'Đang gửi...' : 'Gửi phản hồi'}</button>
                    </form>
                  )}
                </div>
                {r.imageUrl && (
                  <ImageWithFallback src={resolveImageUrl(r.imageUrl)} alt={r.title} className="w-20 h-20 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0" />
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
