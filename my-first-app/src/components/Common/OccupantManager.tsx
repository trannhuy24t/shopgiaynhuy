import { useEffect, useState } from 'react';
import { getContractOccupants, addContractOccupant, updateOccupant, deleteOccupant } from '../../api/occupant';
import { getApiErrorMessage, isForbiddenError } from '../../api/client';
import type { OccupantDto, ContractStatus } from '../../types/contract';
import { UserPlus, Trash2, Pencil } from 'lucide-react';
import Toast from './Toast';

interface OccupantManagerProps {
  contractId: number;
  numberOfOccupants: number;
  contractStatus: ContractStatus;
  // Chỉ hiện danh sách, ẩn hết nút Thêm/Sửa/Xóa — dùng cho popup xem nhanh phía Admin (Quản lý phòng).
  readOnly?: boolean;
}

interface OccupantFormState {
  fullName: string;
  relationship: string;
  idCardNumber: string;
  phone: string;
}

const emptyForm: OccupantFormState = { fullName: '', relationship: '', idCardNumber: '', phone: '' };

type FormMode = null | { type: 'add' } | { type: 'edit'; occupant: OccupantDto };

const OccupantManager = ({ contractId, numberOfOccupants, contractStatus, readOnly = false }: OccupantManagerProps) => {
  const [occupants, setOccupants] = useState<OccupantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [forbidden, setForbidden] = useState(false);

  const [mode, setMode] = useState<FormMode>(null);
  const [form, setForm] = useState<OccupantFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const cap = Math.max(0, numberOfOccupants - 1);
  const atCap = occupants.length >= cap;
  const isActive = contractStatus === 'DangHieuLuc';
  const canAdd = !readOnly && isActive && !atCap;
  const canEditDelete = !readOnly && isActive;

  const load = async () => {
    setLoading(true);
    setLoadError('');
    setForbidden(false);
    try {
      const res = await getContractOccupants(contractId);
      setOccupants(res.data);
    } catch (err) {
      if (isForbiddenError(err)) {
        setForbidden(true);
      } else {
        setLoadError(getApiErrorMessage(err, 'Không tải được danh sách người ở cùng.'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  const openAdd = () => {
    setMode({ type: 'add' });
    setForm(emptyForm);
    setFormError('');
  };

  const openEdit = (o: OccupantDto) => {
    setMode({ type: 'edit', occupant: o });
    setForm({ fullName: o.fullName, relationship: o.relationship, idCardNumber: o.idCardNumber || '', phone: o.phone || '' });
    setFormError('');
  };

  const closeForm = () => {
    setMode(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.relationship.trim()) {
      setFormError('Vui lòng điền Họ tên và Quan hệ với người thuê chính.');
      return;
    }

    const payload = {
      fullName: form.fullName,
      relationship: form.relationship,
      idCardNumber: form.idCardNumber || null,
      phone: form.phone || null,
    };

    setSaving(true);
    setFormError('');
    try {
      if (mode?.type === 'edit') {
        await updateOccupant(mode.occupant.id, payload);
      } else {
        await addContractOccupant(contractId, payload);
      }
      await load();
      closeForm();
    } catch (err) {
      setToast(getApiErrorMessage(err, 'Không thể lưu người ở cùng.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (o: OccupantDto) => {
    const confirmed = window.confirm(`Xóa "${o.fullName}" khỏi danh sách người ở cùng?`);
    if (!confirmed) return;

    setRemovingId(o.id);
    try {
      await deleteOccupant(o.id);
      await load();
    } catch (err) {
      setToast(getApiErrorMessage(err, 'Không thể xóa người ở cùng.'));
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return <p className="text-slate-500 text-xs">Đang tải người ở cùng...</p>;
  }

  if (forbidden) {
    return <p className="text-slate-500 text-xs">Bạn không có quyền xem người ở cùng của hợp đồng này.</p>;
  }

  if (loadError) {
    return <p className="text-red-400 text-xs">{loadError}</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Người ở cùng</span>
        {canAdd && mode === null && (
          <button
            onClick={openAdd}
            className="text-orange-500 hover:text-orange-400 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
          >
            <UserPlus size={12} /> Thêm người
          </button>
        )}
      </div>

      {isActive && cap > 0 && (
        <p className="text-[10px] text-slate-500 mb-3">
          {atCap
            ? `Đã khai báo đủ ${occupants.length}/${cap} người ở cùng.`
            : `Hợp đồng ghi ${numberOfOccupants} người ở (1 là bạn/người thuê chính). Cần khai báo thêm ${cap - occupants.length} người${
                readOnly ? '.' : ' — bấm "Thêm người" để ghi rõ.'
              }`}
        </p>
      )}

      {occupants.length === 0 && (!isActive || cap === 0) && (
        <p className="text-slate-500 text-xs mb-2">Chưa khai báo người ở cùng nào.</p>
      )}

      {occupants.length > 0 && (
        <ul className="space-y-2 mb-1">
          {occupants.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-850 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-white font-semibold text-xs truncate">{o.fullName}</p>
                <p className="text-slate-500 text-[10px] truncate">
                  {[o.relationship, o.phone, o.idCardNumber].filter(Boolean).join(' · ')}
                </p>
              </div>
              {canEditDelete && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(o)}
                    className="text-slate-500 hover:text-orange-400 p-1.5 cursor-pointer"
                    title="Sửa"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(o)}
                    disabled={removingId === o.id}
                    className="text-slate-500 hover:text-red-400 disabled:opacity-50 p-1.5 cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {mode !== null && (
        <form onSubmit={handleSubmit} className="space-y-2.5 mt-3 pt-3 border-t border-slate-850">
          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-semibold p-2.5 rounded-lg">
              {formError}
            </div>
          )}
          <input
            type="text"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="Họ và tên *"
            className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
          />
          <input
            type="text"
            required
            value={form.relationship}
            onChange={(e) => setForm({ ...form, relationship: e.target.value })}
            placeholder="Quan hệ với người thuê chính * (VD: vợ/chồng, con, bạn cùng phòng)"
            className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
          />
          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="text"
              value={form.idCardNumber}
              onChange={(e) => setForm({ ...form, idCardNumber: e.target.value })}
              placeholder="Số CCCD/CMND"
              className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Số điện thoại"
              className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
            >
              {saving ? 'Đang lưu...' : mode.type === 'edit' ? 'Cập nhật' : 'Lưu'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
};

export default OccupantManager;
