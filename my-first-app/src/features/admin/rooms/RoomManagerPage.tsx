import { useEffect, useState } from 'react';
import {
  getRooms,
  createRoom,
  createRoomWithImage,
  updateRoomWithImage,
  updateRoomStatus,
  deleteRoom,
  addRoomMedia,
  removeRoomMedia,
  setPrimaryRoomMedia,
} from '../../../api/room';
import { getBuildings } from '../../../api/building';
import { getContracts } from '../../../api/contract';
import { getApiErrorMessage, resolveImageUrl } from '../../../api/client';
import { useAuth } from '../../../context/useAuth';
import StatusBadge from '../../../components/Common/StatusBadge';
import ImageWithFallback from '../../../components/Common/ImageWithFallback';
import OccupantManager from '../../../components/Common/OccupantManager';
import TablePagination from '../../../components/Common/TablePagination';
import { statusMaps } from '../../../constants/statusLabels';
import type { RoomDto, RoomStatus, RoomMediaDto } from '../../../types/room';
import type { BuildingDto } from '../../../types/building';
import type { ContractDto } from '../../../types/contract';
import { Plus, Edit2, Trash2, X, DoorOpen, Star, ImagePlus, Users, Check, Armchair, Search } from 'lucide-react';

export const ROOM_TYPE_OPTIONS = [
  'Phòng đơn',
  'Phòng gác xép',
  'Phòng Studio',
  'Phòng 1 ngủ 1 khách',
  'Phòng 2 ngủ 1 khách',
  'Phòng Duplex',
  'Khác (tự nhập)',
];

export const POPULAR_AMENITIES = [
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

interface RoomFormData {
  buildingId: string;
  roomNumber: string;
  roomType: string;
  customRoomType: string;
  area: string;
  price: string;
  serviceFee: string;
  selectedAmenities: string[];
  amenityQuantities?: Record<string, number>;
  otherAmenities: string;
  description: string;
}

const emptyFormData: RoomFormData = {
  buildingId: '',
  roomNumber: '',
  roomType: 'Phòng đơn',
  customRoomType: '',
  area: '',
  price: '',
  serviceFee: '',
  selectedAmenities: ['Điều hòa', 'Bình nóng lạnh', 'Giường nệm', 'Tủ quần áo'],
  amenityQuantities: {
    'Điều hòa': 1,
    'Bình nóng lạnh': 1,
    'Giường nệm': 1,
    'Tủ quần áo': 1,
  },
  otherAmenities: '',
  description: '',
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const RoomManagerPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [buildings, setBuildings] = useState<BuildingDto[]>([]);
  const [activeContracts, setActiveContracts] = useState<ContractDto[]>([]);
  const [buildingsError, setBuildingsError] = useState('');
  const [activeContractsError, setActiveContractsError] = useState('');
  const [lookupsReloadKey, setLookupsReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [occupantsModalRoom, setOccupantsModalRoom] = useState<RoomDto | null>(null);

  // Bộ lọc
  const [filterBuildingId, setFilterBuildingId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRoomType, setFilterRoomType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterBuildingId, filterStatus, filterRoomType, searchTerm]);

  // Modal thêm/sửa (Admin)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RoomFormData>(emptyFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [editingRoomImageUrl, setEditingRoomImageUrl] = useState<string | null>(null);

  // Thư viện ảnh (chỉ áp dụng khi sửa phòng đã tồn tại — thao tác tức thời, không qua nút Lưu)
  const [galleryMedia, setGalleryMedia] = useState<RoomMediaDto[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryError, setGalleryError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getRooms({
        buildingId: filterBuildingId !== 'all' ? Number(filterBuildingId) : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
      });
      setRooms(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được danh sách phòng.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setBuildingsError('');
    setActiveContractsError('');
    getBuildings()
      .then((res) => setBuildings(res.data))
      .catch((err) => {
        setBuildings([]);
        setBuildingsError(getApiErrorMessage(err, 'Không tải được danh sách tòa nhà.'));
      });

    // Chỉ Admin/Staff gọi được — dùng để tra tên người thuê + người ở cùng theo phòng.
    getContracts('DangHieuLuc')
      .then((res) => setActiveContracts(res.data))
      .catch((err) => {
        setActiveContracts([]);
        setActiveContractsError(getApiErrorMessage(err, 'Không tải được danh sách hợp đồng đang hiệu lực.'));
      });
  }, [lookupsReloadKey]);

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBuildingId, filterStatus]);

  const handleStatusChange = async (room: RoomDto, status: RoomStatus) => {
    try {
      await updateRoomStatus({ id: room.id, status });
      setRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, status } : r)));
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể đổi trạng thái phòng này.'));
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormError('');
    setImageFile(null);
    setSelectedFiles([]);
    setEditingRoomImageUrl(null);
    setGalleryMedia([]);
    setGalleryError('');
    setFormData({
      ...emptyFormData,
      buildingId: buildings[0] ? String(buildings[0].id) : '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (room: RoomDto) => {
    setEditingId(room.id);
    setFormError('');
    setImageFile(null);
    setSelectedFiles([]);
    setEditingRoomImageUrl(room.imageUrl || null);
    setGalleryMedia(room.media || []);
    setGalleryError('');

    // Parse RoomType
    const presetTypes = ROOM_TYPE_OPTIONS.filter((t) => t !== 'Khác (tự nhập)');
    const isPreset = presetTypes.includes(room.roomType || '');
    const roomType = isPreset ? (room.roomType || 'Phòng đơn') : (room.roomType ? 'Khác (tự nhập)' : 'Phòng đơn');
    const customRoomType = isPreset ? '' : (room.roomType || '');

    // Parse Amenities & Quantities
    const rawAmenities = room.amenities ? room.amenities.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const selectedAmenities: string[] = [];
    const amenityQuantities: Record<string, number> = {};
    const otherAmenitiesList: string[] = [];

    for (const raw of rawAmenities) {
      let matchedPreset: string | undefined;
      let qty = 1;

      for (const preset of POPULAR_AMENITIES) {
        if (raw.toLowerCase().startsWith(preset.toLowerCase())) {
          matchedPreset = preset;
          break;
        }
      }

      const matchQty = raw.match(/[\(\[]\s*(\d+)/i) || raw.match(/[:\-–xX]\s*(\d+)/i);
      if (matchQty) {
        qty = parseInt(matchQty[1], 10) || 1;
      }

      if (matchedPreset) {
        if (!selectedAmenities.includes(matchedPreset)) {
          selectedAmenities.push(matchedPreset);
          amenityQuantities[matchedPreset] = qty;
        }
      } else {
        otherAmenitiesList.push(raw);
      }
    }

    setFormData({
      buildingId: String(room.buildingId),
      roomNumber: room.roomNumber,
      roomType,
      customRoomType,
      area: room.area ? String(room.area) : '',
      price: String(room.price),
      serviceFee: room.serviceFee ? String(room.serviceFee) : '',
      selectedAmenities,
      amenityQuantities,
      otherAmenities: otherAmenitiesList.join(', '),
      description: room.description || '',
    });
    setIsModalOpen(true);
  };

  const handleAddGalleryFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !editingId) return;
    setGalleryError('');
    setGalleryUploading(true);
    try {
      const res = await addRoomMedia(editingId, Array.from(files));
      setGalleryMedia(res.data);
      const updatedPrimary = res.data.find((m) => m.type === 'Image');
      if (!editingRoomImageUrl && updatedPrimary) {
        setEditingRoomImageUrl(updatedPrimary.url);
      }
      await loadRooms();
    } catch (err) {
      setGalleryError(getApiErrorMessage(err, 'Không thể tải ảnh lên.'));
    } finally {
      setGalleryUploading(false);
    }
  };

  const handleRemoveGalleryItem = async (media: RoomMediaDto) => {
    if (!editingId) return;
    const confirmDelete = window.confirm('Xóa ảnh này khỏi thư viện?');
    if (!confirmDelete) return;

    try {
      await removeRoomMedia(editingId, media.id);
      setGalleryMedia((prev) => prev.filter((m) => m.id !== media.id));
      if (editingRoomImageUrl === media.url) {
        const remaining = galleryMedia.find((m) => m.id !== media.id && m.type === 'Image');
        setEditingRoomImageUrl(remaining?.url || null);
      }
      await loadRooms();
    } catch (err) {
      setGalleryError(getApiErrorMessage(err, 'Không thể xóa ảnh này.'));
    }
  };

  const handleSetPrimaryMedia = async (media: RoomMediaDto) => {
    if (!editingId) return;
    try {
      await setPrimaryRoomMedia(editingId, media.id);
      setEditingRoomImageUrl(media.url);
      await loadRooms();
    } catch (err) {
      setGalleryError(getApiErrorMessage(err, 'Không thể đặt ảnh đại diện.'));
    }
  };

  const handleDelete = async (room: RoomDto) => {
    const confirmDelete = window.confirm(`Xóa phòng "${room.roomNumber}"? Hành động này không thể hoàn tác.`);
    if (!confirmDelete) return;

    try {
      await deleteRoom(room.id);
      await loadRooms();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể xóa phòng này (có thể phòng đang có hợp đồng).'));
    }
  };

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSetPrimaryIndex = (index: number) => {
    if (index === 0) return;
    setSelectedFiles((prev) => {
      const chosen = prev[index];
      const remaining = prev.filter((_, idx) => idx !== index);
      return [chosen, ...remaining];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.buildingId || !formData.roomNumber.trim() || !formData.price.trim()) {
      setFormError('Vui lòng chọn Tòa nhà và điền Số phòng, Giá thuê.');
      return;
    }

    const priceNum = Number(formData.price);
    const areaNum = formData.area ? Number(formData.area) : undefined;
    const serviceFeeNum = formData.serviceFee ? Number(formData.serviceFee) : undefined;

    const finalRoomType =
      formData.roomType === 'Khác (tự nhập)'
        ? (formData.customRoomType.trim() || 'Phòng khác')
        : formData.roomType;

    const otherList = formData.otherAmenities
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const selectedWithQty = formData.selectedAmenities.map((amenity) => {
      const qty = formData.amenityQuantities?.[amenity] || 1;
      return qty > 1 ? `${amenity} (${qty} cái)` : amenity;
    });
    const allAmenities = Array.from(new Set([...selectedWithQty, ...otherList])).join(', ');

    try {
      setSaving(true);

      if (editingId) {
        await updateRoomWithImage({
          id: editingId,
          roomNumber: formData.roomNumber,
          roomType: finalRoomType,
          area: areaNum,
          price: priceNum,
          serviceFee: serviceFeeNum,
          amenities: allAmenities || null,
          description: formData.description || null,
          image: imageFile,
          files: selectedFiles.length > 0 ? selectedFiles : undefined,
        });
      } else if (selectedFiles.length > 0 || imageFile) {
        await createRoomWithImage({
          buildingId: Number(formData.buildingId),
          roomNumber: formData.roomNumber,
          roomType: finalRoomType,
          area: areaNum,
          price: priceNum,
          serviceFee: serviceFeeNum,
          amenities: allAmenities || null,
          description: formData.description || null,
          image: selectedFiles[0] || imageFile,
          files: selectedFiles.length > 0 ? selectedFiles : (imageFile ? [imageFile] : undefined),
        });
      } else {
        await createRoom({
          buildingId: Number(formData.buildingId),
          roomNumber: formData.roomNumber,
          roomType: finalRoomType,
          area: areaNum,
          price: priceNum,
          serviceFee: serviceFeeNum,
          amenities: allAmenities || null,
          description: formData.description || null,
          imageUrl: null,
        });
      }

      setIsModalOpen(false);
      await loadRooms();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Không thể lưu phòng này.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Thanh công cụ: Ô tìm kiếm + Bộ lọc bên trái & Nút thêm phòng mới bên phải cùng hàng */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-850">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 min-w-[180px] sm:min-w-[240px] max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm theo số phòng, tòa nhà..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none hover:border-slate-700 focus:border-orange-500 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Lọc tòa nhà */}
          <select
            value={filterBuildingId}
            onChange={(e) => setFilterBuildingId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none cursor-pointer hover:border-slate-700 transition-colors"
          >
            <option value="all">Tất cả tòa nhà</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Lọc trạng thái */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none cursor-pointer hover:border-slate-700 transition-colors"
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(statusMaps.room).map(([value, meta]) => (
              <option key={value} value={value}>{meta.label}</option>
            ))}
          </select>

          {/* Lọc loại phòng */}
          <select
            value={filterRoomType}
            onChange={(e) => setFilterRoomType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none cursor-pointer hover:border-slate-700 transition-colors"
          >
            <option value="all">Tất cả loại phòng</option>
            {ROOM_TYPE_OPTIONS.filter((t) => t !== 'Khác (tự nhập)').map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Các nút hành động quản lý phòng */}
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0 ml-auto xl:ml-0">
            <button
              onClick={handleOpenAddModal}
              disabled={!buildings.length || Boolean(buildingsError)}
              title={buildingsError ? 'Tải danh sách tòa nhà thành công rồi thử lại.' : !buildings.length ? 'Cần tạo tòa nhà trước khi thêm phòng.' : undefined}
              className="bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 sm:px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <Plus size={16} /> Thêm phòng mới
            </button>
          </div>
        )}
      </div>

      {(buildingsError || (!buildings.length && isAdmin)) && (
        <div className={`rounded-xl border p-3 text-xs ${buildingsError ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-slate-800 bg-slate-900/50 text-slate-400'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{buildingsError || 'Chưa có tòa nhà. Hãy tạo tòa nhà trước khi thêm phòng.'}</span>
            {buildingsError && (
              <button
                type="button"
                onClick={() => setLookupsReloadKey((key) => key + 1)}
                className="font-bold text-orange-400 hover:text-orange-300"
              >
                Thử tải lại
              </button>
            )}
          </div>
        </div>
      )}

      {activeContractsError && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{activeContractsError} Thông tin người ở chưa thể hiển thị.</span>
            <button
              type="button"
              onClick={() => setLookupsReloadKey((key) => key + 1)}
              className="font-bold text-orange-400 hover:text-orange-300"
            >
              Thử tải lại
            </button>
          </div>
        </div>
      )}

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

      {!loading && !error && rooms.length === 0 && (
        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
          <DoorOpen className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-lg">Không có phòng nào khớp với bộ lọc.</p>
        </div>
      )}

      {(() => {
        const displayedRooms = rooms.filter((r) => {
          if (filterRoomType !== 'all') {
            const currentType = r.roomType || 'Phòng đơn';
            if (currentType !== filterRoomType) return false;
          }
          if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            const roomNum = (r.roomNumber || '').toLowerCase();
            const bName = (r.buildingName || '').toLowerCase();
            const rType = (r.roomType || '').toLowerCase();
            const desc = (r.description || '').toLowerCase();
            const amenities = (r.amenities || '').toLowerCase();
            const priceStr = String(r.price || '');
            return (
              roomNum.includes(term) ||
              bName.includes(term) ||
              rType.includes(term) ||
              desc.includes(term) ||
              amenities.includes(term) ||
              priceStr.includes(term)
            );
          }
          return true;
        });

        if (loading || error || rooms.length === 0) return null;

        if (displayedRooms.length === 0) {
          return (
            <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
              <DoorOpen className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">
                {searchTerm
                  ? `Không tìm thấy phòng nào khớp với từ khóa "${searchTerm}".`
                  : filterRoomType !== 'all'
                  ? `Không tìm thấy phòng thuộc loại "${filterRoomType}".`
                  : 'Không tìm thấy phòng nào khớp với bộ lọc.'}
              </p>
            </div>
          );
        }

        const totalItems = displayedRooms.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
        const startIndex = totalItems > 0 ? (safeCurrentPage - 1) * pageSize : 0;
        const endIndex = Math.min(startIndex + pageSize, totalItems);
        const paginatedRooms = displayedRooms.slice(startIndex, endIndex);

        return (
          <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="overflow-x-auto overflow-y-auto max-h-[560px] table-scroll-container">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 shadow-md">
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wide bg-slate-900/95 backdrop-blur-md">
                    <th className="p-5">Ảnh</th>
                    <th className="p-5">Phòng & Loại</th>
                    <th className="p-5">Tòa nhà</th>
                    <th className="p-5">Diện tích</th>
                    <th className="p-5">Giá thuê</th>
                    <th className="p-5">Số người ở</th>
                    <th className="p-5">Trạng thái</th>
                    {isAdmin && <th className="p-5 text-center">Hành động</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50">
                  {paginatedRooms.map((room) => (
                    <tr key={room.id} className="text-slate-300 hover:bg-slate-950/10 transition-colors">
                      <td className="p-5 shrink-0">
                        <ImageWithFallback
                          src={resolveImageUrl(room.imageUrl)}
                          alt={room.roomNumber}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-800"
                        />
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm">{room.roomNumber}</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                            {room.roomType || 'Phòng đơn'}
                          </span>
                        </div>
                        {room.amenities && (
                          <div className="text-[10px] text-slate-400 mt-1 line-clamp-1 max-w-[200px]" title={room.amenities}>
                            🛋️ {room.amenities}
                          </div>
                        )}
                      </td>
                      <td className="p-5 font-semibold text-slate-300">{room.buildingName || `#${room.buildingId}`}</td>
                      <td className="p-5 font-medium text-slate-500">{room.area ? `${room.area} m²` : '—'}</td>
                      <td className="p-5 font-extrabold text-orange-500">{formatPrice(room.price)}</td>
                      <td className="p-5 font-medium text-slate-400">
                        {room.currentOccupants != null ? (
                          <button
                            onClick={() => setOccupantsModalRoom(room)}
                            className="inline-flex items-center gap-1.5 hover:text-orange-400 transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
                          >
                            <Users size={12} /> {room.currentOccupants} người
                          </button>
                        ) : '—'}
                      </td>
                      <td className="p-5">
                        <select
                          value={room.status}
                          onChange={(e) => handleStatusChange(room, e.target.value as RoomStatus)}
                          className="bg-slate-950 border border-slate-800 text-[10px] font-bold rounded-lg px-2 py-1 outline-none cursor-pointer text-slate-300"
                        >
                          {Object.entries(statusMaps.room).map(([value, meta]) => (
                            <option key={value} value={value}>{meta.label}</option>
                          ))}
                        </select>
                        <div className="mt-1.5">
                          <StatusBadge entity="room" value={room.status} />
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="p-5 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(room)}
                              className="p-2 hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 rounded-xl transition-all border border-transparent hover:border-blue-500/30 cursor-pointer"
                              title="Chỉnh sửa phòng"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(room)}
                              className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/20 cursor-pointer"
                              title="Xóa phòng"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={safeCurrentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="phòng"
            />
          </div>
        );
      })()}

      {/* MODAL DANH SÁCH NGƯỜI Ở */}
      {occupantsModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOccupantsModalRoom(null)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-scale-up">
            <button
              onClick={() => setOccupantsModalRoom(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="font-bold text-lg text-white uppercase tracking-wide mb-1">
              Người ở phòng {occupantsModalRoom.roomNumber}
            </h3>
            {(() => {
              const contract = activeContracts.find((c) => c.roomId === occupantsModalRoom.id);
              if (activeContractsError) {
                return <p className="text-amber-300 text-xs mt-4">{activeContractsError}</p>;
              }
              if (!contract) {
                return <p className="text-slate-500 text-xs mt-4">Không tìm thấy hợp đồng đang hiệu lực cho phòng này.</p>;
              }
              return (
                <>
                  <p className="text-xs text-slate-500 mb-5">Hợp đồng #{contract.id}</p>
                  <div className="bg-slate-950 border border-orange-500/20 rounded-xl px-3 py-2.5 mb-4">
                    <p className="text-white font-semibold text-sm truncate">{contract.tenantName || `Khách #${contract.tenantId}`}</p>
                    <p className="text-orange-400 text-[10px] font-bold">Người thuê chính</p>
                  </div>
                  <OccupantManager
                    contractId={contract.id}
                    numberOfOccupants={contract.numberOfOccupants || 1}
                    contractStatus={contract.status}
                    readOnly
                  />
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* FORM MODAL (Admin) */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setIsModalOpen(false)} />

          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="font-bold text-xl text-white uppercase tracking-wide mb-6">
              {editingId ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
            </h3>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Tòa nhà *</label>
                  <select
                    required
                    disabled={!!editingId}
                    value={formData.buildingId}
                    onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-3 py-3 text-xs text-white outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">-- Chọn tòa nhà --</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Số phòng *</label>
                  <input
                    type="text"
                    required
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="VD: P101"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Loại phòng *</label>
                  <select
                    required
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-3 py-3 text-xs text-white outline-none cursor-pointer"
                  >
                    {ROOM_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {formData.roomType === 'Khác (tự nhập)' ? (
                  <div>
                    <label className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block mb-2">Tên loại phòng tự nhập *</label>
                    <input
                      type="text"
                      required
                      value={formData.customRoomType}
                      onChange={(e) => setFormData({ ...formData, customRoomType: e.target.value })}
                      placeholder="VD: Căn hộ 3 ngủ, Penthouse mini..."
                      className="w-full bg-slate-950 border border-orange-500/50 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Diện tích (m²)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      placeholder="20"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
                    />
                  </div>
                )}

                {formData.roomType === 'Khác (tự nhập)' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Diện tích (m²)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      placeholder="20"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Giá thuê / tháng (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="3000000"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Phí dịch vụ / người / tháng (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.serviceFee}
                    onChange={(e) => setFormData({ ...formData, serviceFee: e.target.value })}
                    placeholder="100000"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5">Khi tạo hóa đơn: tự nhân với số người đang ở của hợp đồng.</p>
                </div>
              </div>

              {/* Ô NHẬP ĐỒ ĐẠC / TIỆN NGHI TRONG PHÒNG */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Armchair size={16} className="text-orange-400" />
                    <label className="text-xs font-bold text-white uppercase tracking-wider">
                      Đồ đạc & Trang thiết bị trong phòng
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                    Đã chọn: <strong className="text-orange-400 font-bold">{formData.selectedAmenities.length}</strong> món
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Chọn nhanh các đồ đạc có sẵn trang bị cho khách thuê:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {POPULAR_AMENITIES.map((amenity) => {
                    const isSelected = formData.selectedAmenities.includes(amenity);
                    const qty = formData.amenityQuantities?.[amenity] || 1;
                    return (
                      <div
                        key={amenity}
                        onClick={() => {
                          setFormData((prev) => {
                            const nextSelected = isSelected
                              ? prev.selectedAmenities.filter((a) => a !== amenity)
                              : [...prev.selectedAmenities, amenity];
                            const nextQuantities = { ...prev.amenityQuantities };
                            if (!isSelected && !nextQuantities[amenity]) {
                              nextQuantities[amenity] = 1;
                            }
                            return {
                              ...prev,
                              selectedAmenities: nextSelected,
                              amenityQuantities: nextQuantities,
                            };
                          });
                        }}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500/15 border-orange-500/50 text-orange-300 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                              isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-700 bg-slate-900'
                            }`}
                          >
                            {isSelected && <Check size={11} strokeWidth={3} />}
                          </span>
                          <span className="truncate">{amenity}</span>
                        </div>

                        {isSelected && (
                          <div
                            className="flex items-center gap-1 shrink-0 ml-2 bg-slate-900/80 border border-slate-800 rounded-lg p-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (qty > 1) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    amenityQuantities: { ...prev.amenityQuantities, [amenity]: qty - 1 },
                                  }));
                                }
                              }}
                              className="w-5 h-5 rounded hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                              title="Giảm số lượng"
                            >
                              -
                            </button>
                            <span className="w-5 text-center text-[11px] font-bold text-orange-400 font-mono">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  amenityQuantities: { ...prev.amenityQuantities, [amenity]: qty + 1 },
                                }));
                              }}
                              className="w-5 h-5 rounded hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                              title="Tăng số lượng"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2.5 border-t border-slate-850">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Đồ đạc khác (nếu có — phân cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={formData.otherAmenities}
                    onChange={(e) => setFormData({ ...formData, otherAmenities: e.target.value })}
                    placeholder="VD: Quạt trần, Lò vi sóng, Rèm cửa chống nắng, Bàn ăn..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Các trang thiết bị này sẽ hiển thị ở trang Chi tiết phòng và tự động đưa vào Hợp đồng bàn giao tài sản.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Mô tả bổ sung</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ghi chú thêm về giờ giấc, an ninh, view phòng..."
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
                />
              </div>

              {editingId ? (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Thư viện ảnh
                  </label>

                  {galleryError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-3">
                      {galleryError}
                    </div>
                  )}

                  {galleryMedia.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                      {galleryMedia.map((media) => {
                        const isPrimary = editingRoomImageUrl === media.url;
                        return (
                          <div key={media.id} className="relative group">
                            <ImageWithFallback
                              src={resolveImageUrl(media.url)}
                              alt="Ảnh phòng"
                              className={`w-full aspect-square rounded-xl object-cover bg-slate-950 border ${
                                isPrimary ? 'border-orange-500' : 'border-slate-800'
                              }`}
                            />
                            {isPrimary && (
                              <span className="absolute top-1 left-1 bg-orange-500 text-white p-1 rounded-full">
                                <Star size={10} fill="white" />
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryItem(media)}
                              className="absolute top-1 right-1 bg-slate-950/90 hover:bg-red-500 text-white p-1 rounded-full transition-colors cursor-pointer"
                              title="Xóa ảnh này"
                            >
                              <X size={10} />
                            </button>
                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryMedia(media)}
                                className="absolute bottom-1 inset-x-1 bg-slate-950/90 hover:bg-orange-500 text-white text-[9px] font-bold py-1 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                              >
                                Đặt đại diện
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <label className="w-full bg-slate-950 border border-dashed border-slate-800 hover:border-orange-500 rounded-xl px-4 py-3 text-xs text-slate-400 outline-none flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    <ImagePlus size={14} />
                    {galleryUploading ? 'Đang tải lên...' : 'Thêm ảnh mới (chọn được nhiều ảnh cùng lúc)'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={galleryUploading}
                      onChange={(e) => {
                        handleAddGalleryFiles(e.target.files);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500 mt-1.5">Thao tác ảnh có hiệu lực ngay, không cần bấm "Cập nhật phòng" bên dưới.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Ảnh & Video phòng (chọn được nhiều file cùng lúc)
                    </label>
                    {selectedFiles.length > 0 && (
                      <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                        Đã chọn {selectedFiles.length} file
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Previews */}
                  {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-3 bg-slate-950/70 border border-slate-850 rounded-2xl max-h-56 overflow-y-auto">
                      {selectedFiles.map((file, idx) => {
                        const previewUrl = URL.createObjectURL(file);
                        const isPrimary = idx === 0;
                        const isVideo = file.type.startsWith('video/');

                        return (
                          <div
                            key={`${file.name}-${idx}`}
                            className={`relative group rounded-xl overflow-hidden aspect-video bg-slate-900 border ${
                              isPrimary ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-slate-800'
                            }`}
                          >
                            {isVideo ? (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 bg-slate-900 font-bold p-1 text-center">
                                🎬 {file.name}
                              </div>
                            ) : (
                              <img
                                src={previewUrl}
                                alt={file.name}
                                className="w-full h-full object-cover"
                                onLoad={() => URL.revokeObjectURL(previewUrl)}
                              />
                            )}

                            {/* Badge ảnh đại diện */}
                            {isPrimary && (
                              <span className="absolute top-1 left-1 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-md">
                                <Star size={9} fill="white" /> Đại diện
                              </span>
                            )}

                            {/* Overlay actions */}
                            <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                              {!isPrimary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryIndex(idx)}
                                  className="text-[9px] font-bold text-white bg-orange-500 hover:bg-orange-600 px-2 py-1 rounded-md transition-colors cursor-pointer"
                                  title="Đặt làm ảnh đại diện"
                                >
                                  Làm ảnh chính
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveSelectedFile(idx)}
                                className="text-[9px] font-bold text-red-300 hover:text-white bg-red-500/80 hover:bg-red-600 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-0.5"
                                title="Xóa file này"
                              >
                                <Trash2 size={10} /> Xóa
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Nút chọn tệp cho phép chọn nhiều file */}
                  <label className="w-full bg-slate-950 border border-dashed border-slate-800 hover:border-orange-500 rounded-xl px-4 py-3.5 text-xs text-slate-300 outline-none flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                      <ImagePlus size={16} />
                    </div>
                    <div className="text-center sm:text-left">
                      <span className="font-bold text-orange-400 group-hover:text-orange-300 block">
                        {selectedFiles.length > 0 ? '+ Thêm ảnh/video khác...' : 'Bấm vào đây để chọn nhiều ảnh/video cùng lúc'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Hỗ trợ JPG, PNG, WebP, MP4... Có thể chọn nhiều tệp trong một lần.
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleSelectFiles}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500">
                    Ảnh đầu tiên sẽ được đặt làm ảnh đại diện. Toàn bộ ảnh sẽ được tải trực tiếp lên MinIO khi bấm "Lưu phòng mới".
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wide transition-colors mt-4 cursor-pointer"
              >
                {saving ? 'Đang lưu...' : editingId ? 'Cập nhật phòng' : 'Lưu phòng mới'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagerPage;
