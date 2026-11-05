import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyContracts } from '../../api/contract';
import { createMaintenanceRequest, createMaintenanceRequestWithImage } from '../../api/maintenance';
import { getApiErrorMessage } from '../../api/client';
import { statusMaps } from '../../constants/statusLabels';
import type { ContractDto } from '../../types/contract';
import type { MaintenancePriority, MaintenanceRequestDto } from '../../types/maintenance';
import { ArrowLeft, Wrench, CheckCircle2, MessageSquare, ExternalLink, Check, Plus } from 'lucide-react';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif)$/i;

const MaintenanceRequestPage = () => {
  const navigate = useNavigate();

  const [contracts, setContracts] = useState<ContractDto[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [contractsError, setContractsError] = useState('');
  const [contractsReloadKey, setContractsReloadKey] = useState(0);

  const [roomId, setRoomId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MaintenancePriority>('TrungBinh');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState<MaintenanceRequestDto | null>(null);
  const [zaloCopied, setZaloCopied] = useState(false);

  useEffect(() => {
    setLoadingRooms(true);
    setContractsError('');
    getMyContracts()
      .then((res) => {
        const active = res.data.filter((c) => c.status === 'DangHieuLuc');
        setContracts(active);
        if (active.length > 0) setRoomId(String(active[0].roomId));
      })
      .catch((err) => {
        setContracts([]);
        setContractsError(getApiErrorMessage(err, 'Không thể tải danh sách hợp đồng. Vui lòng thử lại.'));
      })
      .finally(() => setLoadingRooms(false));
  }, [contractsReloadKey]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setError('');

    if (!file) {
      setImageFile(null);
      return;
    }

    if (!ALLOWED_IMAGE_EXTENSION.test(file.name) || (file.type && !ALLOWED_IMAGE_TYPES.has(file.type))) {
      setImageFile(null);
      e.target.value = '';
      setError('Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageFile(null);
      e.target.value = '';
      setError('Ảnh không được vượt quá 5MB.');
      return;
    }

    setImageFile(file);
    setImageUrl('');
  };

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
      let resData: MaintenanceRequestDto;
      if (imageFile) {
        const res = await createMaintenanceRequestWithImage({
          roomId: Number(roomId),
          title,
          description: description || null,
          priority,
          image: imageFile,
        });
        resData = res.data;
      } else {
        const res = await createMaintenanceRequest({
          roomId: Number(roomId),
          title,
          description: description || null,
          imageUrl: imageUrl || null,
          priority,
        });
        resData = res.data;
      }
      setSuccessResult(resData);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể gửi yêu cầu bảo trì.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getZaloLandlordMessage = (req: MaintenanceRequestDto) => {
    const priorityLabel = statusMaps.maintenancePriority[req.priority]?.label || req.priority;
    return `🔧 [YÊU CẦU BẢO TRÌ PHÒNG ${req.roomNumber || req.roomId}]
• Tòa nhà: ${req.buildingName || 'TroHub'}
• Người thuê: ${req.tenantName || 'Khách thuê'}
• Sự cố: ${req.title}
• Mức độ ưu tiên: ${priorityLabel}
${req.description ? `• Chi tiết: ${req.description}` : ''}
👉 Nhờ chủ trọ / quản lý kiểm tra và hỗ trợ xử lý sớm giúp em với ạ! Em cảm ơn.`;
  };

  const handleOpenLandlordZalo = async (req: MaintenanceRequestDto) => {
    const cleanPhone = (req.landlordPhone || '').replace(/\D/g, '');
    const message = getZaloLandlordMessage(req);
    try {
      await navigator.clipboard.writeText(message);
      setZaloCopied(true);
    } catch {
      // ignore
    }
    if (cleanPhone) {
      window.open(`https://zalo.me/${cleanPhone}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleResetForm = () => {
    setSuccessResult(null);
    setZaloCopied(false);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setImageFile(null);
    setError('');
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

        {loadingRooms ? (
          <p className="py-8 text-center text-sm text-slate-400">Đang tải hợp đồng...</p>
        ) : contractsError ? (
          <div className="py-8 text-center">
            <p className="mb-4 text-sm text-red-400">{contractsError}</p>
            <button
              type="button"
              onClick={() => setContractsReloadKey((key) => key + 1)}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Thử tải lại
            </button>
          </div>
        ) : successResult ? (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Gửi yêu cầu bảo trì thành công!</h2>
              <p className="text-xs text-slate-400">
                Yêu cầu của bạn đã được ghi nhận trên hệ thống và gửi thông báo tới Ban Quản lý.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">Phòng:</span>
                <span className="font-bold text-white">
                  Phòng {successResult.roomNumber || successResult.roomId} {successResult.buildingName ? `— ${successResult.buildingName}` : ''}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">Tiêu đề:</span>
                <span className="font-bold text-slate-200">{successResult.title}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">Mức độ ưu tiên:</span>
                <span className="font-bold text-orange-400">
                  {statusMaps.maintenancePriority[successResult.priority]?.label || successResult.priority}
                </span>
              </div>
              {successResult.description && (
                <div className="pt-1">
                  <span className="text-slate-400 block mb-1">Mô tả chi tiết:</span>
                  <p className="text-slate-300 bg-slate-900 p-2.5 rounded-xl text-[11px] leading-relaxed">
                    {successResult.description}
                  </p>
                </div>
              )}
            </div>

            {/* KHỐI THÔNG BÁO SANG ZALO CHỦ TRỌ */}
            <div className="bg-gradient-to-r from-blue-950/40 via-blue-900/20 to-slate-900 border border-blue-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#0068FF] text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/20 shrink-0">
                  Zalo
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    Thông báo trực tiếp sang Zalo Chủ trọ
                  </h3>
                  <p className="text-[11px] text-blue-200/80">
                    Chủ trọ: <strong className="text-white">{successResult.landlordName || 'Chủ trọ / Ban Quản lý'}</strong>
                    {successResult.landlordPhone ? ` — SĐT: ${successResult.landlordPhone}` : ''}
                  </p>
                </div>
              </div>

              {successResult.landlordPhone ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleOpenLandlordZalo(successResult)}
                    className="w-full bg-[#0068FF] hover:bg-[#0052cc] text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                  >
                    <MessageSquare size={16} />
                    <span>Mở Zalo nhắn tin cho Chủ trọ ngay</span>
                    <ExternalLink size={14} />
                  </button>

                  {zaloCopied && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] p-2.5 rounded-xl flex items-center gap-2">
                      <Check size={14} className="shrink-0 text-emerald-400" />
                      <span>Đã tự động sao chép nội dung sự cố! Bạn chỉ cần nhấn <strong>Ctrl + V</strong> (Dán) và Gửi trên Zalo.</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Chủ trọ chưa cập nhật số điện thoại Zalo. Hệ thống đã tự động gửi chuông thông báo trên phần mềm.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/yeu-cau-cua-toi')}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-xs text-center transition-colors cursor-pointer"
              >
                Xem danh sách yêu cầu của tôi
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} /> Gửi thêm yêu cầu
              </button>
            </div>
          </div>
        ) : contracts.length === 0 ? (
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
                ref={imageInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-orange-500 file:text-white file:text-xs file:font-bold file:cursor-pointer cursor-pointer mb-2"
              />
              <p className="mb-2 text-[11px] text-slate-500">JPG, PNG, WEBP hoặc GIF · tối đa 5MB</p>
              {imageFile && (
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                  <span className="truncate">{imageFile.name} · {(imageFile.size / (1024 * 1024)).toFixed(1)}MB</span>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      if (imageInputRef.current) imageInputRef.current.value = '';
                    }}
                    className="ml-3 shrink-0 font-semibold text-orange-400 hover:text-orange-300"
                  >
                    Bỏ ảnh
                  </button>
                </div>
              )}
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
