import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRoom } from '../../api/room';
import { getPublicRates } from '../../api/systemConfig';
import { getApiErrorMessage, resolveImageUrl } from '../../api/client';
import { useAuth } from '../../context/useAuth';
import StatusBadge from '../../components/Common/StatusBadge';
import type { RoomDto } from '../../types/room';
import type { PublicRatesDto } from '../../types/systemConfig';
import { ArrowLeft, Building2, Ruler, Phone, Zap, MessageCircle, PhoneCall, X } from 'lucide-react';

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
  const [publicRates, setPublicRates] = useState<PublicRatesDto | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

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

  const handleRequestContract = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/thue/${id}` } } });
      return;
    }
    if (user?.role !== 'Tenant') {
      alert(
        'Tài khoản của bạn chưa có quyền đăng ký thuê phòng (role hiện tại: ' +
          user?.role +
          '). Vui lòng liên hệ quản trị viên để được cấp quyền Tenant.'
      );
      return;
    }
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
        <div className="space-y-4">
          <div className="aspect-video lg:aspect-square bg-slate-900 rounded-3xl overflow-hidden border border-slate-850">
            <img
              src={resolveImageUrl(selectedImage) || 'https://via.placeholder.com/600x600?text=Ph%C3%B2ng+tr%E1%BB%8D'}
              alt={room.roomNumber}
              className="w-full h-full object-cover"
            />
          </div>

          {room.media.filter((m) => m.type === 'Image').length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {room.media
                .filter((m) => m.type === 'Image')
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedImage(m.url)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border shrink-0 transition-all cursor-pointer ${
                      selectedImage === m.url ? 'border-orange-500 shadow-md' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={resolveImageUrl(m.url)} alt={`${room.roomNumber} ${m.id}`} className="w-full h-full object-cover" />
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight uppercase tracking-tight">
                Phòng {room.roomNumber}
              </h1>
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
          </div>

          <div className="pt-4 border-t border-slate-900">
            <button
              onClick={() => setShowContactModal(true)}
              disabled={room.status !== 'Trong'}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed active:scale-98 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Phone size={18} />
              {room.status === 'Trong' ? 'Liên hệ với chủ trọ' : 'Phòng hiện không còn trống'}
            </button>
          </div>
        </div>
      </div>
      {showContactModal && <ContactModal phone={room.ownerPhone ?? null} onClose={() => setShowContactModal(false)} />}
    </div>
  );
};

const ContactModal = ({ phone, onClose }: { phone: string | null; onClose: () => void }) => (
  <div
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <div
      className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Liên hệ chủ trọ</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
          <X size={20} />
        </button>
      </div>

      {phone ? (
        <>
          <p className="text-sm text-slate-400">
            Số điện thoại: <span className="text-white font-semibold">{phone}</span>
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href={`sms:${phone}`}
              className="flex flex-col items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-orange-500/50 text-white font-semibold py-5 rounded-2xl transition-all"
            >
              <MessageCircle size={26} className="text-orange-400" />
              <span className="text-sm">Nhắn tin</span>
            </a>
            <a
              href={`tel:${phone}`}
              className="flex flex-col items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-5 rounded-2xl transition-all shadow-lg shadow-orange-500/30"
            >
              <PhoneCall size={26} />
              <span className="text-sm">Gọi điện</span>
            </a>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-400 text-center py-4">
          Chủ trọ chưa cập nhật số điện thoại liên hệ.
        </p>
      )}
    </div>
  </div>
);

export default RoomDetailPage;
