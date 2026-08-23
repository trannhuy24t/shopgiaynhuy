import { useEffect, useState } from 'react';
import { getBuildings, createBuilding, updateBuilding, deleteBuilding } from '../../../api/building';
import { getApiErrorMessage } from '../../../api/client';
import { useAuth } from '../../../context/useAuth';
import type { BuildingDto } from '../../../types/building';
import { Plus, Edit2, Trash2, X, Building2 } from 'lucide-react';

interface BuildingFormData {
  name: string;
  address: string;
  ownerId: string;
  description: string;
}

const BuildingManagerPage = () => {
  const { user } = useAuth();
  const [buildings, setBuildings] = useState<BuildingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<BuildingFormData>({
    name: '',
    address: '',
    ownerId: user ? String(user.id) : '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadBuildings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getBuildings();
      setBuildings(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được danh sách tòa nhà.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuildings();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormError('');
    setFormData({
      name: '',
      address: '',
      ownerId: user ? String(user.id) : '',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (building: BuildingDto) => {
    setEditingId(building.id);
    setFormError('');
    setFormData({
      name: building.name,
      address: building.address,
      ownerId: String(building.ownerId),
      description: building.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (building: BuildingDto) => {
    const confirmDelete = window.confirm(`Xóa tòa nhà "${building.name}"? Hành động này không thể hoàn tác.`);
    if (!confirmDelete) return;

    try {
      await deleteBuilding(building.id);
      await loadBuildings();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể xóa tòa nhà này.'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.address.trim() || !formData.ownerId.trim()) {
      setFormError('Vui lòng điền đầy đủ Tên, Địa chỉ và Chủ sở hữu (Owner ID).');
      return;
    }

    const ownerIdNum = Number(formData.ownerId);
    if (!Number.isInteger(ownerIdNum) || ownerIdNum <= 0) {
      setFormError('Owner ID phải là số nguyên hợp lệ.');
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await updateBuilding({
          id: editingId,
          name: formData.name,
          address: formData.address,
          ownerId: ownerIdNum,
          description: formData.description || null,
        });
      } else {
        await createBuilding({
          name: formData.name,
          address: formData.address,
          ownerId: ownerIdNum,
          description: formData.description || null,
        });
      }
      setIsModalOpen(false);
      await loadBuildings();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Không thể lưu tòa nhà này.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl space-y-8">
      {/* Tiêu đề & Nút thêm */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-900">
        <div>
          <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
            Cơ sở vật chất
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Quản lý tòa nhà</h1>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold px-5 py-3 rounded-2xl flex items-center gap-1.5 transition-all shadow-lg shadow-orange-500/10 cursor-pointer"
        >
          <Plus size={16} /> Thêm tòa nhà mới
        </button>
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

      {!loading && !error && buildings.length === 0 && (
        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
          <Building2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-lg">Chưa có tòa nhà nào. Hãy thêm tòa nhà đầu tiên.</p>
        </div>
      )}

      {!loading && !error && buildings.length > 0 && (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider bg-slate-950/20">
                  <th className="p-5">Tên tòa nhà</th>
                  <th className="p-5">Địa chỉ</th>
                  <th className="p-5">Chủ sở hữu</th>
                  <th className="p-5">Số phòng</th>
                  <th className="p-5">Mô tả</th>
                  <th className="p-5 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50">
                {buildings.map((building) => (
                  <tr key={building.id} className="text-slate-300 hover:bg-slate-950/10 transition-colors">
                    <td className="p-5 font-bold text-white">{building.name}</td>
                    <td className="p-5 font-medium text-slate-400 max-w-[220px] truncate">{building.address}</td>
                    <td className="p-5 font-semibold text-slate-400">{building.ownerName || `#${building.ownerId}`}</td>
                    <td className="p-5 font-semibold text-orange-500">{building.roomCount}</td>
                    <td className="p-5 font-medium text-slate-500 max-w-[200px] truncate">{building.description || '—'}</td>
                    <td className="p-5 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(building)}
                          className="p-2 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl transition-all border border-transparent hover:border-slate-800 cursor-pointer"
                          title="Chỉnh sửa tòa nhà"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(building)}
                          className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/10 cursor-pointer"
                          title="Xóa tòa nhà"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setIsModalOpen(false)} />

          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="font-bold text-xl text-white uppercase tracking-wide mb-6">
              {editingId ? 'Chỉnh sửa tòa nhà' : 'Thêm tòa nhà mới'}
            </h3>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Tên tòa nhà *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Chung cư mini ABC"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Địa chỉ *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Số nhà, đường, quận/huyện..."
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Owner ID (ID người dùng chủ sở hữu) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.ownerId}
                  onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                  placeholder="ID tài khoản Admin sở hữu tòa nhà"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1.5">Mặc định là ID của bạn ({user?.id}). Trang quản lý người dùng để chọn chủ sở hữu khác sẽ có ở nhóm sau.</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Mô tả</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ghi chú thêm về tòa nhà..."
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wide transition-colors mt-4 cursor-pointer"
              >
                {saving ? 'Đang lưu...' : editingId ? 'Cập nhật tòa nhà' : 'Lưu tòa nhà mới'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingManagerPage;
