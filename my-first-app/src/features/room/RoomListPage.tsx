import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAvailableRooms } from '../../api/room';
import { getPublicRates } from '../../api/systemConfig';
import { getApiErrorMessage, resolveImageUrl } from '../../api/client';
import StatusBadge from '../../components/Common/StatusBadge';
import type { RoomDto } from '../../types/room';
import type { PublicRatesDto } from '../../types/systemConfig';
import { ArrowUpDown, Building2, Ruler, Search, Zap } from 'lucide-react';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

type SortOption = 'newest' | 'price-asc' | 'price-desc';

const RoomListPage = () => {
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [publicRates, setPublicRates] = useState<PublicRatesDto | null>(null);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getAvailableRooms();
        setRooms(res.data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Không tải được danh sách phòng trống.'));
      } finally {
        setLoading(false);
      }
    };

    loadRooms();

    getPublicRates()
      .then((res) => setPublicRates(res.data))
      .catch(() => setPublicRates(null));
  }, []);

  // Danh sách tòa nhà để lọc, suy ra từ chính dữ liệu phòng trả về
  // (không gọi GET /Building vì endpoint đó chỉ dành cho Admin/Staff)
  const buildingOptions = useMemo(() => {
    const map = new Map<number, string>();
    rooms.forEach((room) => {
      if (!map.has(room.buildingId)) {
        map.set(room.buildingId, room.buildingName || `Tòa nhà #${room.buildingId}`);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rooms]);

  const hasActiveFilters = selectedBuildingId !== 'all' || searchTerm.trim() !== '';

  const handleResetFilters = () => {
    setSelectedBuildingId('all');
    setSearchTerm('');
    setSortBy('newest');
  };

  const filteredRooms = useMemo(() => {
    let result = [...rooms];

    if (selectedBuildingId !== 'all') {
      result = result.filter((room) => room.buildingId === selectedBuildingId);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (room) =>
          room.roomNumber.toLowerCase().includes(term) ||
          (room.buildingName || '').toLowerCase().includes(term)
      );
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [rooms, selectedBuildingId, searchTerm, sortBy]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Banner nhỏ */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-8 md:p-12 mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-lg text-left">
          <span className="bg-white/10 text-white text-xs font-extrabold uppercase px-3 py-1 rounded-full border border-white/20 tracking-wider">
            Danh sách phòng trống
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white mt-4 tracking-tight leading-none uppercase">
            Tìm phòng trọ ưng ý
          </h1>
          <p className="text-orange-100 text-sm md:text-base mt-3 font-medium">
            Xem toàn bộ phòng đang trống, lọc theo tòa nhà để tìm nhanh vị trí phù hợp với bạn.
          </p>
        </div>
      </div>

      {/* Bộ lọc theo tòa nhà */}
      {buildingOptions.length > 0 && (
        <div className="flex items-center gap-2 mb-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-850 overflow-x-auto">
          <Building2 size={16} className="text-slate-500 shrink-0" />
          <button
            onClick={() => setSelectedBuildingId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedBuildingId === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Tất cả tòa nhà
          </button>
          {buildingOptions.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBuildingId(b.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedBuildingId === b.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Tìm kiếm & sắp xếp */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 bg-slate-900/40 p-4 rounded-2xl border border-slate-850">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm theo số phòng, tòa nhà..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-orange-500 text-slate-200 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl w-full md:w-auto">
          <ArrowUpDown size={16} className="text-slate-500 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent text-sm font-semibold text-slate-300 focus:outline-none border-none pr-6 cursor-pointer w-full"
          >
            <option value="newest" className="bg-slate-950">Mới nhất</option>
            <option value="price-asc" className="bg-slate-950">Giá: Thấp đến Cao</option>
            <option value="price-desc" className="bg-slate-950">Giá: Cao đến Thấp</option>
          </select>
        </div>
      </div>

      {/* Giá điện/nước tham khảo */}
      {publicRates && (publicRates.electricUnitPrice > 0 || publicRates.waterUnitPrice > 0) && (
        <div className="bg-slate-900/40 border border-slate-850 text-slate-400 text-xs font-semibold p-4 rounded-2xl mb-6 flex items-start gap-2">
          <Zap size={14} className="text-orange-500 shrink-0 mt-0.5" />
          <span>
            Ước tính giá điện/nước:{' '}
            <span className="text-orange-400">{formatPrice(publicRates.electricUnitPrice)}/kWh</span>,{' '}
            <span className="text-orange-400">{formatPrice(publicRates.waterUnitPrice)}/m³</span>{' '}
            <span className="text-slate-500 font-medium">(theo giá chung hiện hành, có thể thay đổi khi ký hợp đồng)</span>
          </span>
        </div>
      )}

      {/* Trạng thái tải */}
      {loading && (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Trạng thái lỗi */}
      {!loading && error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold p-6 rounded-2xl text-center">
          {error}
        </div>
      )}

      {/* Trạng thái rỗng */}
      {!loading && !error && filteredRooms.length === 0 && (
        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
          <Search className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-lg">
            {rooms.length === 0
              ? 'Hiện chưa có phòng trống nào.'
              : 'Không tìm thấy phòng nào khớp với bộ lọc.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-4 inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Xóa các bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Lưới phòng */}
      {!loading && !error && filteredRooms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <Link
              key={room.id}
              to={`/rooms/${room.id}`}
              className="group bg-slate-900 border border-slate-850 hover:border-orange-500/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5"
            >
              <div className="relative aspect-video overflow-hidden bg-slate-950">
                <img
                  src={resolveImageUrl(room.imageUrl) || 'https://via.placeholder.com/400x260?text=Ph%C3%B2ng+tr%E1%BB%8D'}
                  alt={room.roomNumber}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                />
                <div className="absolute top-3 left-3">
                  <StatusBadge entity="room" value={room.status} />
                </div>
              </div>
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div className="text-left">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block mb-1 flex items-center gap-1">
                    <Building2 size={11} /> {room.buildingName || `Tòa nhà #${room.buildingId}`}
                  </span>
                  <h3 className="font-bold text-white group-hover:text-orange-500 text-base leading-snug transition-colors">
                    Phòng {room.roomNumber}
                  </h3>
                  {room.area > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-slate-400 text-xs font-medium">
                      <Ruler size={12} /> {room.area} m²
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-850">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Giá thuê / tháng</span>
                    <span className="text-base font-extrabold text-orange-500">{formatPrice(room.price)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomListPage;
