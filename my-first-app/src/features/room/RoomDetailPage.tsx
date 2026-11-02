import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRoom } from '../../api/room';
import { getPublicRates } from '../../api/systemConfig';
import { getApiErrorMessage, resolveImageUrl } from '../../api/client';
import { useAuth } from '../../context/useAuth';
import StatusBadge from '../../components/Common/StatusBadge';
import ImageWithFallback from '../../components/Common/ImageWithFallback';
import ContactModal from '../../components/Common/ContactModal';
import type { RoomDto } from '../../types/room';
import type { PublicRatesDto } from '../../types/systemConfig';
import {
  ArrowLeft,
  Building2,
  Ruler,
  Phone,
  Zap,
  MessageCircle,
  PhoneCall,
  X,
  Armchair,
  Check,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const RoomDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [room, setRoom] = useState<RoomDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [publicRates, setPublicRates] = useState<PublicRatesDto | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [requestError, setRequestError] = useState('');

  // Zoom và Kéo rê trong Modal phóng to (Lightbox Zoom)
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset zoom khi đổi ảnh hoặc đóng modal
  useEffect(() => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, [selectedImage, isLightboxOpen]);

  useEffect(() => {
    const loadRoom = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getRoom(id ?? '');
        setRoom(res.data);
        setSelectedImage(res.data.imageUrl || res.data.media.find((m) => m.type === 'Image')?.url || null);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Không tải được thông tin phòng.'));
      } finally {
        setLoading(false);
      }
    };

    loadRoom();

    getPublicRates()
      .then((res) => setPublicRates(res.data))
      .catch(() => setPublicRates(null));
  }, [id]);

  const imageList: string[] = room
    ? (room.media?.filter((m) => m.type === 'Image').map((m) => m.url) ||
       (room.imageUrl ? [room.imageUrl] : []))
    : [];
  const currentImageIndex = imageList.indexOf(selectedImage || '') >= 0
    ? imageList.indexOf(selectedImage || '')
    : 0;

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      else if (e.key === 'ArrowLeft' && imageList.length > 1) {
        const prevIndex = (currentImageIndex - 1 + imageList.length) % imageList.length;
        setSelectedImage(imageList[prevIndex]);
      } else if (e.key === 'ArrowRight' && imageList.length > 1) {
        const nextIndex = (currentImageIndex + 1) % imageList.length;
        setSelectedImage(imageList[nextIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, currentImageIndex, imageList]);

  const handleRequestContract = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/thue/${id}` } } });
      return;
    }
    if (user?.role !== 'Tenant') {
      setRequestError(`Tài khoản ${user?.role ?? ''} chưa có quyền đăng ký thuê phòng. Vui lòng liên hệ quản trị viên.`);
      return;
    }
    setRequestError('');
    navigate(`/thue/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold p-6 rounded-2xl inline-block mb-6">
          {error}
        </p>
        <div>
          <Link to="/rooms" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Quay lại danh sách phòng
          </Link>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Không tìm thấy phòng!</h2>
        <Link to="/rooms" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
          Quay lại danh sách phòng
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link to="/rooms" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft size={16} /> Quay lại danh sách phòng
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Ảnh phòng */}
        <div className="space-y-3">
          <div
            onClick={() => setIsLightboxOpen(true)}
            className="relative aspect-video lg:aspect-square bg-slate-900 rounded-3xl overflow-hidden border border-slate-850 cursor-pointer group select-none shadow-xl hover:border-orange-500/50 transition-all"
            title="Bấm để mở phóng to ảnh"
          >
            <ImageWithFallback
              src={resolveImageUrl(selectedImage)}
              alt={room.roomNumber}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />

            {/* Badge đếm ảnh */}
            {imageList.length > 0 && (
              <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg pointer-events-none">
                <ImageIcon size={14} className="text-orange-400" />
                <span>{currentImageIndex + 1} / {imageList.length} ảnh</span>
              </div>
            )}

            {/* Nút bấm nổi phóng to xem ảnh */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              className="absolute bottom-4 right-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white backdrop-blur-md px-3.5 py-2 rounded-xl border border-orange-400/40 text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all cursor-pointer"
            >
              <ZoomIn size={16} />
              <span>Phóng to xem ảnh</span>
            </button>
          </div>

          {/* Nút bấm phụ trực tiếp bên dưới ảnh */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-orange-500/20 text-slate-300 hover:text-orange-400 border border-slate-850 hover:border-orange-500/40 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <ZoomIn size={16} className="text-orange-500" />
            <span>Xem ảnh phóng to toàn màn hình (Hỗ trợ cuộn chuột & kéo rê)</span>
          </button>

          {room.media.filter((m) => m.type === 'Image').length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1 pt-1">
              {room.media
                .filter((m) => m.type === 'Image')
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedImage(m.url)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border-2 shrink-0 transition-all cursor-pointer ${
                      selectedImage === m.url ? 'border-orange-500 shadow-md scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <ImageWithFallback src={resolveImageUrl(m.url)} alt={`${room.roomNumber} ${m.id}`} className="w-full h-full object-cover" />
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Thông tin phòng */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-500 font-extrabold text-xs uppercase tracking-widest">
              <Building2 size={14} /> {room.buildingName || `Tòa nhà #${room.buildingId}`}
            </div>
            {room.buildingAddress && <p className="text-sm text-slate-400">{room.buildingAddress}</p>}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight uppercase tracking-tight">
                Phòng {room.roomNumber}
              </h1>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {room.roomType || 'Phòng đơn'}
              </span>
              <StatusBadge entity="room" value={room.status} />
            </div>

            {room.area > 0 && (
              <div className="flex items-center gap-1.5 text-slate-400 text-sm font-medium">
                <Ruler size={14} /> Diện tích {room.area} m²
              </div>
            )}

            <div className="text-2xl md:text-3xl font-black text-orange-500 pt-2">
              {formatPrice(room.price)} <span className="text-sm text-slate-500 font-semibold">/ tháng</span>
            </div>

            {room.description && (
              <p className="text-slate-400 text-sm leading-relaxed pt-2">{room.description}</p>
            )}

            {/* Chi phí dự kiến */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 space-y-2">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block">Chi phí dự kiến</span>
              {room.serviceFee > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Phí dịch vụ / người / tháng</span>
                  <span className="font-bold text-white">{formatPrice(room.serviceFee)}</span>
                </div>
              )}
              {publicRates && (publicRates.electricUnitPrice > 0 || publicRates.waterUnitPrice > 0) && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 flex items-center gap-1"><Zap size={12} className="text-orange-500" /> Ước tính giá điện/nước</span>
                  <span className="font-bold text-white">{formatPrice(publicRates.electricUnitPrice)}/kWh · {formatPrice(publicRates.waterUnitPrice)}/m³</span>
                </div>
              )}
              <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-850">
                Giá điện/nước hiển thị theo mặt bằng chung hiện hành — sẽ được chốt chính thức trong hợp đồng, có thể khác nếu có thỏa thuận riêng.
              </p>
            </div>

            {/* Đồ đạc & Trang thiết bị trong phòng */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Armchair size={16} className="text-orange-400" />
                <span className="text-slate-200 font-bold uppercase text-[11px] tracking-wider">
                  Trang thiết bị & Đồ đạc trong phòng
                </span>
              </div>
              {room.amenities ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {room.amenities.split(',').map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300"
                    >
                      <Check size={14} className="text-emerald-400 shrink-0" />
                      <span className="truncate">{item.trim()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Phòng cơ bản, chưa cập nhật danh sách đồ đạc riêng.</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleRequestContract}
              disabled={room.status !== 'Trong'}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed active:scale-98 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {room.status === 'Trong' ? 'Đăng ký thuê phòng' : 'Phòng hiện không còn trống'}
            </button>
            <button
              onClick={() => setShowContactModal(true)}
              disabled={room.status !== 'Trong'}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-100 font-bold py-4 rounded-2xl border border-slate-800 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Phone size={18} /> Liên hệ chủ trọ
            </button>
          </div>
          {requestError && (
            <p role="alert" className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
              {requestError}
            </p>
          )}
        </div>
      </div>
      {showContactModal && <ContactModal phone={room.ownerPhone ?? null} onClose={() => setShowContactModal(false)} />}

      {/* Lightbox Modal xem ảnh toàn màn hình */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-black/95 backdrop-blur-md p-4 sm:p-6 select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Header */}
          <div
            className="w-full max-w-6xl flex items-center justify-between text-white py-2 z-10 flex-wrap gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-base sm:text-lg">
                Phòng {room.roomNumber} {room.buildingName ? `— ${room.buildingName}` : ''}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-slate-300">
                {currentImageIndex + 1} / {imageList.length}
              </span>
            </div>

            {/* Zoom Toolbar */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-white/10 rounded-2xl px-2 py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setZoomScale((prev) => {
                    const next = Math.max(1, Math.round((prev - 0.25) * 100) / 100);
                    if (next === 1) setPanPosition({ x: 0, y: 0 });
                    return next;
                  });
                }}
                disabled={zoomScale <= 1}
                className="p-1.5 rounded-xl hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent text-white transition-colors cursor-pointer"
                title="Thu nhỏ (-)"
              >
                <ZoomOut size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomScale(1);
                  setPanPosition({ x: 0, y: 0 });
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-orange-400 hover:bg-white/10 transition-colors"
                title="Bấm để đặt lại 100%"
              >
                {Math.round(zoomScale * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(4, Math.round((prev + 0.25) * 100) / 100))}
                disabled={zoomScale >= 4}
                className="p-1.5 rounded-xl hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent text-white transition-colors cursor-pointer"
                title="Phóng to (+)"
              >
                <ZoomIn size={18} />
              </button>
              {zoomScale > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setZoomScale(1);
                    setPanPosition({ x: 0, y: 0 });
                  }}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer border-l border-white/10 ml-1 pl-2"
                  title="Đặt lại kích thước ban đầu"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Đóng (Esc)"
            >
              <X size={24} />
            </button>
          </div>

          {/* Center Image with Prev / Next */}
          <div
            className="relative flex-1 w-full max-w-6xl flex items-center justify-center my-2 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY < 0 ? 0.25 : -0.25;
              setZoomScale((prev) => {
                const next = Math.min(4, Math.max(1, Math.round((prev + delta) * 100) / 100));
                if (next === 1) setPanPosition({ x: 0, y: 0 });
                return next;
              });
            }}
          >
            {imageList.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const prevIndex = (currentImageIndex - 1 + imageList.length) % imageList.length;
                  setSelectedImage(imageList[prevIndex]);
                }}
                className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/70 hover:bg-orange-500 text-white border border-white/10 transition-all cursor-pointer shadow-xl hover:scale-110"
                title="Ảnh trước (Mũi tên trái)"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            <div
              className="w-full h-full flex items-center justify-center select-none"
              onMouseDown={(e) => {
                if (zoomScale > 1) {
                  setIsDragging(true);
                  setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
                }
              }}
              onMouseMove={(e) => {
                if (isDragging && zoomScale > 1) {
                  setPanPosition({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y,
                  });
                }
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (zoomScale > 1) {
                  setZoomScale(1);
                  setPanPosition({ x: 0, y: 0 });
                } else {
                  setZoomScale(2.5);
                }
              }}
              style={{
                cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
              }}
            >
              <img
                src={resolveImageUrl(selectedImage)}
                alt={`Phòng ${room.roomNumber}`}
                draggable={false}
                style={{
                  transform: `scale(${zoomScale}) translate(${panPosition.x / zoomScale}px, ${panPosition.y / zoomScale}px)`,
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                }}
                className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl pointer-events-none select-none"
              />
            </div>

            {imageList.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextIndex = (currentImageIndex + 1) % imageList.length;
                  setSelectedImage(imageList[nextIndex]);
                }}
                className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/70 hover:bg-orange-500 text-white border border-white/10 transition-all cursor-pointer shadow-xl hover:scale-110"
                title="Ảnh sau (Mũi tên phải)"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>

          {/* Quick Guide */}
          <div className="text-[11px] text-slate-400 bg-slate-900/80 border border-white/10 px-3 py-1 rounded-full mb-1 flex items-center gap-2 pointer-events-none z-10">
            <span>Cuộn chuột hoặc bấm +/- để zoom ({Math.round(zoomScale * 100)}%)</span>
            <span>•</span>
            <span>{zoomScale > 1 ? 'Giữ chuột kéo để di chuyển ảnh' : 'Nhấp đúp chuột để zoom nhanh'}</span>
          </div>

          {/* Bottom Thumbnails */}
          {imageList.length > 1 && (
            <div
              className="w-full max-w-4xl flex items-center justify-center gap-2.5 overflow-x-auto py-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {imageList.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(url)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    selectedImage === url ? 'border-orange-500 scale-105 shadow-lg' : 'border-white/20 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={resolveImageUrl(url)} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomDetailPage;
