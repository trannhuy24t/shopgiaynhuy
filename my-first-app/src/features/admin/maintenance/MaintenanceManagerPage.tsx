import { useEffect, useState } from 'react';
import {
  getMaintenanceRequests,
  assignMaintenanceRequest,
  updateMaintenanceStatus,
} from '../../../api/maintenance';
import { getUsers } from '../../../api/user';
import { getApiErrorMessage, isForbiddenError } from '../../../api/client';
import { notifyTenant } from '../../../utils/notifyTenant';
import StatusBadge from '../../../components/Common/StatusBadge';
import { statusMaps } from '../../../constants/statusLabels';
import type { MaintenanceRequestDto, MaintenanceStatus } from '../../../types/maintenance';
import type { UserDto } from '../../../types/user';
import { Wrench, X, Info } from 'lucide-react';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

type ModalMode = null | { type: 'assign' | 'status'; request: MaintenanceRequestDto };

const MaintenanceManagerPage = () => {
  const [requests, setRequests] = useState<MaintenanceRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [staffUsers, setStaffUsers] = useState<UserDto[] | null>(null);
  const [staffListNote, setStaffListNote] = useState('');

  const [modal, setModal] = useState<ModalMode>(null);
  const [assigneeId, setAssigneeId] = useState('');
  const [statusValue, setStatusValue] = useState<MaintenanceStatus>('DangXuLy');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getMaintenanceRequests(filterStatus !== 'all' ? filterStatus : undefined);
      setRequests(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được danh sách yêu cầu bảo trì.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  useEffect(() => {
    // Chỉ Admin gọi được GET /User (Staff bị 403) — nếu lỗi thì để Staff nhập tay ID nhân viên.
    getUsers('Staff')
      .then((res) => setStaffUsers(res.data))
      .catch((err) => {
        setStaffUsers(null);
        if (isForbiddenError(err)) {
          setStaffListNote('Chỉ Admin xem được danh sách nhân viên — nếu bạn là Staff, hãy nhập ID nhân viên cần phân công.');
        }
      });
  }, []);

  const openAssignModal = (request: MaintenanceRequestDto) => {
    setModal({ type: 'assign', request });
    setAssigneeId(request.assignedToUserId ? String(request.assignedToUserId) : '');
    setModalError('');
  };

  const openStatusModal = (request: MaintenanceRequestDto) => {
    setModal({ type: 'status', request });
    setStatusValue(request.status === 'Moi' || request.status === 'DaPhanCong' ? 'DangXuLy' : request.status);
    setNote(request.note || '');
    setModalError('');
  };

  const closeModal = () => {
    if (saving) return;
    setModal(null);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setModalError('');

    const idNum = Number(assigneeId);
    if (!assigneeId || !Number.isInteger(idNum) || idNum <= 0) {
      setModalError('Vui lòng chọn hoặc nhập ID nhân viên hợp lệ.');
      return;
    }

    try {
      setSaving(true);
      await assignMaintenanceRequest(modal.request.id, { assignedToUserId: idNum });
      notifyTenant(modal.request.tenantId, {
        title: 'Yêu cầu bảo trì đã được phân công',
        content: `Yêu cầu "${modal.request.title}" (phòng ${modal.request.roomNumber || modal.request.roomId}) đang được xử lý.`,
        type: 'BaoTri',
      });
      setModal(null);
      await loadRequests();
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Không thể phân công yêu cầu này.'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setModalError('');

    try {
      setSaving(true);
      await updateMaintenanceStatus(modal.request.id, { status: statusValue, note: note || null });
      notifyTenant(modal.request.tenantId, {
        title: 'Cập nhật yêu cầu bảo trì',
        content: `Yêu cầu "${modal.request.title}": ${statusMaps.maintenanceStatus[statusValue].label}.${note ? ` Ghi chú: ${note}` : ''}`,
        type: 'BaoTri',
      });
      setModal(null);
      await loadRequests();
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl space-y-8">
      <div className="pb-4 border-b border-slate-900">
        <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
          Sự cố &amp; sửa chữa
        </span>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Quản lý bảo trì</h1>
      </div>

      {staffListNote && (
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold p-4 rounded-xl flex items-start gap-2">
          <Info size={16} className="shrink-0 mt-0.5" /> {staffListNote}
        </div>
      )}

      {/* Bộ lọc trạng thái */}
      <div className="flex flex-wrap gap-2 bg-slate-900/40 p-4 rounded-2xl border border-slate-850">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filterStatus === 'all' ? 'bg-orange-500 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Tất cả
        </button>
        {Object.entries(statusMaps.maintenanceStatus).map(([value, meta]) => (
          <button
            key={value}
            onClick={() => setFilterStatus(value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === value ? 'bg-orange-500 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {meta.label}
          </button>
        ))}
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
          <p className="text-slate-400 font-medium text-lg">Không có yêu cầu bảo trì nào khớp với bộ lọc.</p>
        </div>
      )}

      {!loading && !error && requests.length > 0 && (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider bg-slate-950/20">
                  <th className="p-5">Phòng</th>
                  <th className="p-5">Khách thuê</th>
                  <th className="p-5">Tiêu đề</th>
                  <th className="p-5">Ưu tiên</th>
                  <th className="p-5">Trạng thái</th>
                  <th className="p-5">Phụ trách</th>
                  <th className="p-5 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50">
                {requests.map((r) => (
                  <tr key={r.id} className="text-slate-300 hover:bg-slate-950/10 transition-colors">
                    <td className="p-5 font-bold text-white">{r.roomNumber || `#${r.roomId}`}</td>
                    <td className="p-5 font-semibold text-slate-400">{r.tenantName || `#${r.tenantId}`}</td>
                    <td className="p-5 font-medium text-slate-300 max-w-[220px] truncate">{r.title}</td>
                    <td className="p-5"><StatusBadge entity="maintenancePriority" value={r.priority} /></td>
                    <td className="p-5"><StatusBadge entity="maintenanceStatus" value={r.status} /></td>
                    <td className="p-5 font-medium text-slate-500">{r.assignedToUserName || '—'}</td>
                    <td className="p-5 text-center">
                      <div className="flex justify-center gap-2 flex-wrap">
                        {(r.status === 'Moi' || r.status === 'DaPhanCong') && (
                          <button
                            onClick={() => openAssignModal(r)}
                            className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                          >
                            Phân công
                          </button>
                        )}
                        {r.status !== 'HoanThanh' && r.status !== 'DaHuy' && (
                          <button
                            onClick={() => openStatusModal(r)}
                            className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                          >
                            Cập nhật
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PHÂN CÔNG */}
      {modal?.type === 'assign' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-scale-up">
            <button onClick={closeModal} className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl text-white uppercase tracking-wide mb-2">Phân công xử lý</h3>
            <p className="text-xs text-slate-500 mb-6">{modal.request.title} — Phòng {modal.request.roomNumber || modal.request.roomId}</p>

            {modalError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-4">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAssign} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Nhân viên phụ trách *</label>
                {staffUsers ? (
                  <select
                    required
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-3 py-3 text-sm text-white outline-none cursor-pointer"
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    required
                    min={1}
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    placeholder="Nhập ID nhân viên"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wide transition-colors cursor-pointer"
              >
                {saving ? 'Đang lưu...' : 'Xác nhận phân công'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CẬP NHẬT TRẠNG THÁI */}
      {modal?.type === 'status' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-scale-up">
            <button onClick={closeModal} className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl text-white uppercase tracking-wide mb-2">Cập nhật trạng thái</h3>
            <p className="text-xs text-slate-500 mb-6">{modal.request.title} — Phòng {modal.request.roomNumber || modal.request.roomId}</p>

            {modalError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-4">
                {modalError}
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Trạng thái mới *</label>
                <select
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value as MaintenanceStatus)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-3 py-3 text-sm text-white outline-none cursor-pointer"
                >
                  {(['DangXuLy', 'HoanThanh', 'DaHuy'] as MaintenanceStatus[]).map((value) => (
                    <option key={value} value={value}>{statusMaps.maintenanceStatus[value].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Ghi chú</label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú xử lý..."
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wide transition-colors cursor-pointer"
              >
                {saving ? 'Đang lưu...' : 'Cập nhật'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceManagerPage;
