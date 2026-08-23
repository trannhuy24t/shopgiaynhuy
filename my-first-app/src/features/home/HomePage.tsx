import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAvailableRooms } from '../../api/room';
import { getApiErrorMessage, resolveImageUrl } from '../../api/client';
import StatusBadge from '../../components/Common/StatusBadge';
import type { RoomDto } from '../../types/room';
import { ArrowRight, Building2, DoorOpen, FileCheck2, HeadphonesIcon, Ruler, ShieldCheck } from 'lucide-react';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const HomePage = () => {
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getAvailableRooms();
        setRooms(res.data.slice(0, 4));
      } catch (err) {
        setError(getApiErrorMessage(err, 'Không tải được danh sách phòng.'));
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[70vh] flex items-center justify-center bg-slate-950 overflow-hidden pt-12">
        <div className="absolute top-1/4 left-1/4 bg-orange-500/10 w-96 h-96 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 bg-amber-500/10 w-96 h-96 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 max-w-7xl">
          {/* Hero Text */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3.5 py-1.5 rounded-full text-orange-500 text-xs font-bold tracking-wider uppercase">
              <Building2 size={14} /> Hệ thống quản lý nhà trọ &amp; chung cư mini
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight uppercase tracking-tight">
              Thuê phòng <br />
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Dễ Dàng &amp; Minh Bạch
              </span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Xem phòng trống theo thời gian thực, đăng ký thuê trực tuyến, theo dõi hợp đồng và hóa đơn hàng tháng — tất cả trên cùng một nền tảng.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Link
                to="/rooms"
                className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                Xem phòng trống
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#lien-he"
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold px-8 py-4 rounded-2xl transition-all flex items-center justify-center cursor-pointer"
              >
                Liên hệ tư vấn
              </a>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative flex justify-center items-center">
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 opacity-20 blur-2xl animate-pulse" />
            <img
              src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
              alt="Tòa nhà chung cư mini"
              className="w-full max-w-[480px] object-cover rounded-3xl drop-shadow-[0_20px_50px_rgba(249,115,22,0.25)]"
            />
          </div>
        </div>
      </section>

      {/* --- LỢI ÍCH --- */}
      <section className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/40 border border-slate-850 p-8 rounded-2xl flex items-start gap-4">
            <div className="bg-orange-500/10 p-3 rounded-xl text-orange-500 shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-white mb-2">Minh bạch giá thuê</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Giá phòng, tiền cọc và các khoản phí dịch vụ hiển thị rõ ràng ngay từ đầu, không phát sinh ẩn.
              </p>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-slate-850 p-8 rounded-2xl flex items-start gap-4">
            <div className="bg-orange-500/10 p-3 rounded-xl text-orange-500 shrink-0">
              <FileCheck2 size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-white mb-2">Hợp đồng rõ ràng</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Đăng ký thuê, duyệt hợp đồng và theo dõi hiệu lực hợp đồng ngay trên hệ thống.
              </p>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-slate-850 p-8 rounded-2xl flex items-start gap-4">
            <div className="bg-orange-500/10 p-3 rounded-xl text-orange-500 shrink-0">
              <HeadphonesIcon size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-white mb-2">Hỗ trợ nhanh chóng</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Gửi yêu cầu bảo trì, nhận thông báo nhắc nợ và phản hồi từ quản lý ngay trong ứng dụng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- PHÒNG MỚI CẬP NHẬT --- */}
      <section className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-end mb-8">
          <div className="text-left">
            <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
              Vừa cập nhật
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">Phòng trống mới nhất</h2>
          </div>
          <Link
            to="/rooms"
            className="text-sm text-orange-500 hover:text-orange-400 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>

        {loading && (
          <div className="min-h-[20vh] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold p-6 rounded-2xl text-center">
            {error}
          </div>
        )}

        {!loading && !error && rooms.length === 0 && (
          <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
            <DoorOpen className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Hiện chưa có phòng trống nào, vui lòng quay lại sau.</p>
          </div>
        )}

        {!loading && !error && rooms.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {rooms.map((room) => (
              <Link
                key={room.id}
                to={`/rooms/${room.id}`}
                className="group bg-slate-900 border border-slate-850 hover:border-orange-500/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-950">
                  <img
                    src={resolveImageUrl(room.imageUrl) || 'https://via.placeholder.com/400x400?text=Ph%C3%B2ng+tr%E1%BB%8D'}
                    alt={room.roomNumber}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                  />
                  <div className="absolute top-3 left-3">
                    <StatusBadge entity="room" value={room.status} />
                  </div>
                </div>
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block mb-1">
                      {room.buildingName || `Tòa nhà #${room.buildingId}`}
                    </span>
                    <h3 className="font-bold text-white group-hover:text-orange-500 text-sm sm:text-base leading-snug transition-colors">
                      Phòng {room.roomNumber}
                    </h3>
                    {room.area > 0 && (
                      <div className="flex items-center mt-2.5 space-x-1 text-slate-500 text-xs font-medium">
                        <Ruler className="w-3.5 h-3.5" /> {room.area} m²
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-850">
                    <span className="text-base font-extrabold text-orange-500">{formatPrice(room.price)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
