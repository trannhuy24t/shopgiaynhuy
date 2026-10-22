import { useCallback, useEffect, useState } from 'react';
import {
  getMaintenanceRequests,
  getMaintenanceRequest,
  assignMaintenanceRequest,
  updateMaintenanceStatus,
} from '../../../api/maintenance';
import { getStaffOptions } from '../../../api/user';
import { getApiErrorMessage, resolveImageUrl } from '../../../api/client';
import { notifyTenant } from '../../../utils/notifyTenant';
import StatusBadge from '../../../components/Common/StatusBadge';
import ImageWithFallback from '../../../components/Common/ImageWithFallback';
import { statusMaps } from '../../../constants/statusLabels';
import type { MaintenanceRequestDto, MaintenanceStatus } from '../../../types/maintenance';
import type { StaffOptionDto } from '../../../types/user';
import { Wrench, X, Info, Eye } from 'lucide-react';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

type ModalMode = null | { type: 'assign' | 'status'; request: MaintenanceRequestDto };


const MaintenanceManagerPage = () => {
  const [requests, setRequests] = useState<MaintenanceRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [staffUsers, setStaffUsers] = useState<StaffOptionDto[] | null>(null);
  const [staffListNote, setStaffListNote] = useState('');
  const [staffListLoading, setStaffListLoading] = useState(true);

  const [detailTarget, setDetailTarget] = useState<MaintenanceRequestDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const loadStaffOptions = useCallback(async () => {
    setStaffListLoading(true);
    setStaffListNote('');
    try {
      const res = await getStaffOptions();
      setStaffUsers(res.data);
    } catch (err) {
      setStaffUsers(null);
      setStaffListNote(getApiErrorMessage(err, 'Không tải được danh sách nhân viên.'));
    } finally {
      setStaffListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStaffOptions();
  }, [loadStaffOptions]);

  const openDetailModal = async (request: MaintenanceRequestDto) => {
    setDetailTarget(request);
    setDetailLoading(true);
    try {
      const res = await getMaintenanceRequest(request.id);
      setDetailTarget(res.data);
    } catch {
      // giữ dữ liệu từ list
    } finally {
      setDetailLoading(false);
    }
  };

  const openAssignModal = (request: MaintenanceRequestDto) => {
    setModal({ type: 'assign', request });
    setAssigneeId(request.assignedToUserId ? String(request.assignedToUserId) : '');
    setModalError('');
  };

  const openStatusModal = (request: MaintenanceRequestDto) => {
    setModal({ type: 'status', request });
    setStatusValue(request.status === 'Moi' || request.status === 'DaPhanCong' ? 'DangXuLy' : request.status);
    setNote('');
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
      setModalError('Vui lòng chọn một nhân viên hợp lệ.');
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
        <div role="alert" className="bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs font-semibold p-4 rounded-xl flex items-start gap-2">
          <Info size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{staffListNote}</p>
            <button type="button" onClick={() => void loadStaffOptions()} disabled={staffListLoading} className="mt-2 font-bold text-orange-300 hover:text-orange-200 disabled:opacity-50">
              {staffListLoading ? 'Đang tải...' : 'Thử tải lại danh sách nhân viên'}
            </button>
          </div>
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
                        <button
                          onClick={() => openDetailModal(r)}
                          className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Eye size={11} /> Chi tiết
                        </button>
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

      {/* MODAL CHI TIẾT */}
      {detailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailTarget(null)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button onClick={() => setDetailTarget(null)} className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl text-white uppercase tracking-wide mb-1">Chi tiết yêu cầu</h3>
            <p className="text-xs text-slate-500 mb-6">#{detailTarget.id} — Phòng {detailTarget.roomNumber || detailTarget.roomId}</p>

            {detailLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                {detailTarget.imageUrl && (
                  <ImageWithFallback
                    src={resolveImageUrl(detailTarget.imageUrl)}
                    alt="Ảnh yêu cầu bảo trì"
                    className="w-full rounded-2xl object-cover max-h-52 border border-slate-800"
                    fallbackClassName="w-full min-h-40 rounded-2xl border border-slate-800"
                  />
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Khách thuê</p>
                    <p className="text-white font-semibold">{detailTarget.tenantName || `#${detailTarget.tenantId}`}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Phụ trách</p>
                    <p className="text-white font-semibold">{detailTarget.assignedToUserName || '—'}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Ngày tạo</p>
                    <p className="text-white font-semibold">{formatDate(detailTarget.createdAt)}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Hoàn thành</p>
                    <p className="text-white font-semibold">{detailTarget.resolvedAt ? formatDate(detailTarget.resolvedAt) : '—'}</p>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Tiêu đề</p>
                  <p className="text-white font-semibold">{detailTarget.title}</p>
                </div>
                {detailTarget.description && (
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Mô tả</p>
                    <p className="text-slate-300 leading-relaxed">{detailTarget.description}</p>
                  </div>
                )}
                {detailTarget.note && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                    <p className="text-[10px] text-orange-400 uppercase tracking-wider mb-1">Trao đổi với khách thuê</p>
                    <p className="text-orange-200 leading-relaxed whitespace-pre-wrap">{detailTarget.note}</p>
                  </div>
                )}
              </div>
            )}
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
                {staffUsers && staffUsers.length > 0 ? (
                  <select
                    required
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-3 py-3 text-sm text-white outline-none cursor-pointer"
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.fullName} (#{u.id})</option>
                    ))}
                  </select>
                ) : staffUsers ? (
                  <p role="status" className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                    Chưa có tài khoản nhân viên để phân công.
                  </p>
                ) : (
                  <p role="status" className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                    {staffListLoading ? 'Đang tải danh sách nhân viên...' : staffListNote || 'Không tải được danh sách nhân viên. Hãy thử tải lại.'}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={saving || staffListLoading || !staffUsers?.length}
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Phản hồi khách thuê (để trống nếu không có)</label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập phản hồi mới..."
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
