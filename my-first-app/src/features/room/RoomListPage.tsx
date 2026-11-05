import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAvailableRooms } from '../../api/room';
import { getPublicRates } from '../../api/systemConfig';
import { getApiErrorMessage, resolveImageUrl } from '../../api/client';
import StatusBadge from '../../components/Common/StatusBadge';
import ImageWithFallback from '../../components/Common/ImageWithFallback';
import type { RoomDto } from '../../types/room';
import type { PublicRatesDto } from '../../types/systemConfig';
import {
  ArrowUpDown,
  Building2,
  Ruler,
  Search,
  Zap,
  SlidersHorizontal,
  Armchair,
  Check,
  X,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export const ROOM_TYPE_FILTER_OPTIONS = [
  'Tất cả loại',
  'Phòng đơn',
  'Phòng gác xép',
  'Phòng Studio',
  'Phòng 1 ngủ 1 khách',
  'Phòng 2 ngủ 1 khách',
  'Phòng Duplex',
];

export const POPULAR_AMENITIES_FILTER = [
  'Điều hòa',
  'Bình nóng lạnh',
  'Tủ lạnh',
  'Máy giặt',
  'Giường nệm',
  'Tủ quần áo',
  'Kệ bếp / Bếp từ',
  'Bàn ghế làm việc',
  'Sofa',
  'Ban công / Cửa sổ thoáng',
  'Khóa vân tay',
  'Wifi riêng',
];

type SortOption = 'newest' | 'price-asc' | 'price-desc';

const RoomListPage = () => {
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | 'all'>('all');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minArea, setMinArea] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [publicRates, setPublicRates] = useState<PublicRatesDto | null>(null);

  // Khóa cuộn trang và lắng nghe phím Escape khi Drawer mở
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsDrawerOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isDrawerOpen]);

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

  const hasActiveFilters =
    selectedBuildingId !== 'all' ||
    selectedRoomType !== 'all' ||
    selectedAmenities.length > 0 ||
    searchTerm.trim() !== '' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    minArea !== '';

  const activeAdvancedCount =
    (selectedRoomType !== 'all' ? 1 : 0) +
    selectedAmenities.length +
    (minPrice || maxPrice ? 1 : 0) +
    (minArea ? 1 : 0);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleResetFilters = () => {
    setSelectedBuildingId('all');
    setSelectedRoomType('all');
    setSelectedAmenities([]);
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setMinArea('');
    setSortBy('newest');
  };

  const filteredRooms = useMemo(() => {
    let result = [...rooms];

    if (selectedBuildingId !== 'all') {
      result = result.filter((room) => room.buildingId === selectedBuildingId);
    }

    if (selectedRoomType !== 'all') {
      result = result.filter((room) => (room.roomType || 'Phòng đơn') === selectedRoomType);
    }

    if (selectedAmenities.length > 0) {
      result = result.filter((room) => {
        if (!room.amenities) return false;
        const lower = room.amenities.toLowerCase();
        return selectedAmenities.every((item) => lower.includes(item.toLowerCase()));
      });
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (room) =>
          room.roomNumber.toLowerCase().includes(term) ||
          (room.buildingName || '').toLowerCase().includes(term) ||
          (room.buildingAddress || '').toLowerCase().includes(term) ||
          (room.roomType || '').toLowerCase().includes(term) ||
          (room.amenities || '').toLowerCase().includes(term)
      );
    }

    if (minPrice !== '') result = result.filter((room) => room.price >= Number(minPrice));
    if (maxPrice !== '') result = result.filter((room) => room.price <= Number(maxPrice));
    if (minArea !== '') result = result.filter((room) => room.area >= Number(minArea));

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
  }, [rooms, selectedBuildingId, selectedRoomType, selectedAmenities, searchTerm, minPrice, maxPrice, minArea, sortBy]);

  return (
    <div className="container mx-auto px-4 pt-4 pb-12 max-w-7xl">
      {/* CỤM TÌM KIẾM & BỘ LỌC CỐ ĐỊNH KHI CUỘN */}
      <div className="sticky top-[72px] z-30 bg-slate-950/95 backdrop-blur-md pt-2 pb-3 mb-6 space-y-3 -mx-4 px-4 border-b border-slate-900/80 shadow-xl shadow-black/20">
        {/* KHUNG TÌM KIẾM CHÍNH VÀ BỘ LỌC NÂNG CAO */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
        {/* Hàng tìm kiếm + Sắp xếp + Nút mở bộ lọc nâng cao */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo số phòng, tòa nhà, địa chỉ, loại phòng, đồ dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 sm:py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-orange-500 text-slate-100 placeholder-slate-500 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Sắp xếp */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3.5 py-2.5 sm:py-3 rounded-2xl shrink-0">
              <ArrowUpDown size={16} className="text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-slate-300 focus:outline-none border-none pr-4 cursor-pointer"
              >
                <option value="newest" className="bg-slate-950 text-slate-200">Mới nhất</option>
                <option value="price-asc" className="bg-slate-950 text-slate-200">Giá: Thấp đến Cao</option>
                <option value="price-desc" className="bg-slate-950 text-slate-200">Giá: Cao đến Thấp</option>
              </select>
            </div>

            {/* Nút mở Drawer Bộ lọc nâng cao */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className={`flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap border ${
                activeAdvancedCount > 0
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <SlidersHorizontal size={16} />
              <span>Bộ lọc nâng cao</span>
              {activeAdvancedCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-orange-600 text-xs font-black flex items-center justify-center">
                  {activeAdvancedCount}
                </span>
              )}
            </button>
          </div>
        </div>

                {/* Nút chọn nhanh Tòa nhà trên thanh tìm kiếm */}
        {buildingOptions.length > 0 && (
          <div className="flex items-center gap-2 pt-2.5 border-t border-slate-850 overflow-x-auto">
            <Building2 size={15} className="text-slate-500 shrink-0" />
            <button
              type="button"
              onClick={() => setSelectedBuildingId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedBuildingId === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Tất cả tòa nhà
            </button>
            {buildingOptions.map((b) => (
              <button
                type="button"
                key={b.id}
                onClick={() => setSelectedBuildingId(b.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
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
      </div>

        {/* THANH TỔNG HỢP TIÊU CHÍ ĐANG LỌC & SỐ LƯỢNG KẾT QUẢ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-300">
            Tìm thấy <strong className="text-orange-400 font-black text-base">{filteredRooms.length}</strong> phòng phù hợp
          </span>

          {/* Các tags tiêu chí đang lọc */}
          {selectedBuildingId !== 'all' && (
            <span className="inline-flex items-center gap-1 text-xs bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
              Tòa: {buildingOptions.find((b) => b.id === selectedBuildingId)?.name}
              <button onClick={() => setSelectedBuildingId('all')} className="hover:text-red-400 ml-1 cursor-pointer">
                <X size={12} />
              </button>
            </span>
          )}

          {selectedRoomType !== 'all' && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300 px-2.5 py-1 rounded-lg">
              {selectedRoomType}
              <button onClick={() => setSelectedRoomType('all')} className="hover:text-red-400 ml-1 cursor-pointer">
                <X size={12} />
              </button>
            </span>
          )}

          {selectedAmenities.map((amenity) => (
            <span key={amenity} className="inline-flex items-center gap-1 text-xs bg-orange-500/10 border border-orange-500/30 text-orange-300 px-2.5 py-1 rounded-lg">
              ✓ {amenity}
              <button onClick={() => toggleAmenity(amenity)} className="hover:text-red-400 ml-1 cursor-pointer">
                <X size={12} />
              </button>
            </span>
          ))}

          {(minPrice || maxPrice) && (
            <span className="inline-flex items-center gap-1 text-xs bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
              Giá: {minPrice ? `${Number(minPrice) / 1000000}tr` : '0'} - {maxPrice ? `${Number(maxPrice) / 1000000}tr` : '∞'}
              <button
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('');
                }}
                className="hover:text-red-400 ml-1 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {minArea && (
            <span className="inline-flex items-center gap-1 text-xs bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
              ≥ {minArea} m²
              <button onClick={() => setMinArea('')} className="hover:text-red-400 ml-1 cursor-pointer">
                <X size={12} />
              </button>
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-orange-400 hover:text-orange-300 font-semibold self-start sm:self-auto cursor-pointer"
          >
            Xóa tất cả bộ lọc
          </button>
        )}
      </div>

        {/* Giá điện/nước tham khảo */}
      {publicRates && (publicRates.electricUnitPrice > 0 || publicRates.waterUnitPrice > 0) && (
        <div className="bg-slate-900/40 border border-slate-850 text-slate-400 text-xs font-semibold px-3.5 py-2.5 rounded-2xl flex items-center gap-2">
          <Zap size={14} className="text-orange-500 shrink-0 mt-0.5" />
          <span>
            Ước tính giá điện/nước:{' '}
            <span className="text-orange-400">{formatPrice(publicRates.electricUnitPrice)}/kWh</span>,{' '}
            <span className="text-orange-400">{formatPrice(publicRates.waterUnitPrice)}/m³</span>{' '}
            <span className="text-slate-500 font-medium">(theo giá chung hiện hành, có thể thay đổi khi ký hợp đồng)</span>
          </span>
        </div>
      )}
      </div>

      {/* DRAWER BỘ LỌC NÂNG CAO */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop tối mờ */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Panel Drawer trượt từ bên phải */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <div className="w-screen max-w-md sm:max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-slide-in">
              {/* Header Drawer */}
              <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <SlidersHorizontal size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                      Bộ lọc nâng cao
                    </h2>
                    <p className="text-xs text-slate-400">Chọn loại phòng & tiện nghi mong muốn</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Đóng (Esc)"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body Drawer (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. Lọc theo Tòa nhà */}
                {buildingOptions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Building2 size={15} className="text-orange-400" />
                      <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                        Tòa nhà
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedBuildingId('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedBuildingId === 'all'
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        Tất cả tòa nhà
                      </button>
                      {buildingOptions.map((b) => (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => setSelectedBuildingId(b.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedBuildingId === b.id
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Lọc theo Loại phòng */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles size={15} className="text-blue-400" />
                      <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                        Loại phòng
                      </span>
                    </div>
                    {selectedRoomType !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setSelectedRoomType('all')}
                        className="text-xs text-blue-400 hover:underline cursor-pointer"
                      >
                        Xem tất cả
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ROOM_TYPE_FILTER_OPTIONS.map((t) => {
                      const isSelected = (t === 'Tất cả loại' && selectedRoomType === 'all') || selectedRoomType === t;
                      return (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setSelectedRoomType(t === 'Tất cả loại' ? 'all' : t)}
                          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Lọc theo Đồ dùng & Tiện nghi phòng cần có */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Armchair size={16} className="text-orange-400" />
                      <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                        Đồ dùng & Tiện nghi phòng
                      </span>
                    </div>
                    {selectedAmenities.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedAmenities([])}
                        className="text-xs font-semibold text-orange-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw size={11} /> Bỏ chọn ({selectedAmenities.length})
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Chỉ hiển thị phòng có <span className="text-orange-400 font-semibold">đầy đủ tất cả</span> đồ dùng bạn chọn dưới đây:
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {POPULAR_AMENITIES_FILTER.map((amenity) => {
                      const isChecked = selectedAmenities.includes(amenity);
                      return (
                        <button
                          type="button"
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-left border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-orange-500/15 border-orange-500 text-orange-300 font-semibold shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isChecked
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'border-slate-700 bg-slate-950'
                            }`}
                          >
                            {isChecked && <Check size={11} strokeWidth={3} />}
                          </div>
                          <span className="truncate">{amenity}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Khoảng giá & Diện tích */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Khoảng giá thuê
                    </span>
                    {/* Nút chọn nhanh giá */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { label: '< 3tr', min: '', max: '3000000' },
                        { label: '3 - 5tr', min: '3000000', max: '5000000' },
                        { label: '5 - 8tr', min: '5000000', max: '8000000' },
                        { label: '> 8tr', min: '8000000', max: '' },
                      ].map((p) => {
                        const isActive = minPrice === p.min && maxPrice === p.max;
                        return (
                          <button
                            type="button"
                            key={p.label}
                            onClick={() => {
                              if (isActive) {
                                setMinPrice('');
                                setMaxPrice('');
                              } else {
                                setMinPrice(p.min);
                                setMaxPrice(p.max);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                              isActive
                                ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300'
                            }`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">
                        Giá từ (VNĐ/tháng)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100000"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition-colors"
                        placeholder="VD: 2500000"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">
                        Giá đến (VNĐ/tháng)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100000"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition-colors"
                        placeholder="VD: 5000000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1">
                      Diện tích tối thiểu (m²)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minArea}
                      onChange={(e) => setMinArea(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition-colors"
                      placeholder="VD: 25"
                    />
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                  className="px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <RotateCcw size={14} />
                  <span>Đặt lại</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 py-3 px-5 rounded-2xl text-xs sm:text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Xem {filteredRooms.length} phòng phù hợp</span>
                </button>
              </div>
            </div>
          </div>
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
                <ImageWithFallback
                  src={resolveImageUrl(room.imageUrl)}
                  alt={room.roomNumber}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                />
                <div className="absolute top-3 left-3">
                  <StatusBadge entity="room" value={room.status} />
                </div>
              </div>
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div className="text-left">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide font-bold block mb-1 flex items-center gap-1">
                    <Building2 size={11} /> {room.buildingName || `Tòa nhà #${room.buildingId}`}
                  </span>
                  {room.buildingAddress && <p className="text-xs text-slate-500 line-clamp-2 mb-1">{room.buildingAddress}</p>}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-slate-100 group-hover:text-orange-500 text-base leading-snug transition-colors">
                      Phòng {room.roomNumber}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/25">
                      {room.roomType || 'Phòng đơn'}
                    </span>
                  </div>
                  {room.area > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-slate-400 text-xs font-medium">
                      <Ruler size={12} /> {room.area} m²
                    </div>
                  )}
                  {room.amenities && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {room.amenities.split(',').slice(0, 4).map((item, idx) => {
                        const trimmed = item.trim();
                        const isMatched = selectedAmenities.some(
                          (a) => a.toLowerCase() === trimmed.toLowerCase()
                        );
                        return (
                          <span
                            key={idx}
                            className={`border text-[10px] font-medium px-2 py-0.5 rounded-lg transition-colors ${
                              isMatched
                                ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 font-semibold'
                                : 'bg-slate-950/80 border-slate-800 text-slate-400'
                            }`}
                          >
                            {isMatched ? `✓ ${trimmed}` : trimmed}
                          </span>
                        );
                      })}
                      {room.amenities.split(',').length > 4 && (
                        <span className="text-[10px] font-medium text-slate-500 py-0.5">
                          +{room.amenities.split(',').length - 4} món khác
                        </span>
                      )}
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
