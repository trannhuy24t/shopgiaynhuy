import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyContracts } from '../../api/contract';
import { createMaintenanceRequest, createMaintenanceRequestWithImage } from '../../api/maintenance';
import { getApiErrorMessage } from '../../api/client';
import { statusMaps } from '../../constants/statusLabels';
import type { ContractDto } from '../../types/contract';
import type { MaintenancePriority } from '../../types/maintenance';
import { ArrowLeft, Wrench } from 'lucide-react';

const MaintenanceRequestPage = () => {
  const navigate = useNavigate();

  const [contracts, setContracts] = useState<ContractDto[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const [roomId, setRoomId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MaintenancePriority>('TrungBinh');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyContracts()
      .then((res) => {
        const active = res.data.filter((c) => c.status === 'DangHieuLuc');
        setContracts(active);
        if (active.length > 0) setRoomId(String(active[0].roomId));
      })
      .catch(() => setContracts([]))
      .finally(() => setLoadingRooms(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!roomId) {
      setError('Vui lòng chọn phòng cần yêu cầu bảo trì.');
      return;
    }
    if (!title.trim()) {
      setError('Vui lòng điền tiêu đề yêu cầu.');
      return;
    }

    try {
      setSubmitting(true);
      if (imageFile) {
        await createMaintenanceRequestWithImage({
          roomId: Number(roomId),
          title,
          description: description || null,
          priority,
          image: imageFile,
        });
      } else {
        await createMaintenanceRequest({
          roomId: Number(roomId),
          title,
          description: description || null,
          imageUrl: imageUrl || null,
          priority,
        });
      }
      navigate('/yeu-cau-cua-toi');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể gửi yêu cầu bảo trì.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link to="/yeu-cau-cua-toi" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft size={16} /> Quay lại yêu cầu của tôi
      </Link>

      <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-8">Gửi yêu cầu bảo trì</h1>

      <div className="bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-5">
            {error}
          </div>
        )}

        {!loadingRooms && contracts.length === 0 ? (
          <div className="text-center py-8">
            <Wrench className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Bạn chưa có hợp đồng nào đang hiệu lực nên chưa thể gửi yêu cầu bảo trì.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Phòng *</label>
              <select
                required
                disabled={loadingRooms}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-3 py-3 text-sm text-white outline-none cursor-pointer disabled:opacity-50"
              >
                {contracts.map((c) => (
                  <option key={c.roomId} value={c.roomId}>Phòng {c.roomNumber || c.roomId}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Tiêu đề *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Vòi nước bị rò rỉ"
                className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Mô tả chi tiết</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả sự cố, vị trí, mức độ ảnh hưởng..."
                className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Mức độ ưu tiên</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-3 py-3 text-sm text-white outline-none cursor-pointer"
              >
                {Object.entries(statusMaps.maintenancePriority).map(([value, meta]) => (
                  <option key={value} value={value}>{meta.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Ảnh minh họa (tùy chọn)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-orange-500 file:text-white file:text-xs file:font-bold file:cursor-pointer cursor-pointer mb-2"
              />
              {!imageFile && (
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="...hoặc dán link ảnh có sẵn"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-2xl text-sm tracking-wide transition-colors cursor-pointer"
            >
              {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default MaintenanceRequestPage;
