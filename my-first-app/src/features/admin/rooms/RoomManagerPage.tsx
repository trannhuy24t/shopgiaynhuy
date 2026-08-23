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
import OccupantManager from '../../../components/Common/OccupantManager';
import { statusMaps } from '../../../constants/statusLabels';
import type { RoomDto, RoomStatus, RoomMediaDto } from '../../../types/room';
import type { BuildingDto } from '../../../types/building';
import type { ContractDto } from '../../../types/contract';
import { Plus, Edit2, Trash2, X, DoorOpen, Star, ImagePlus, Users } from 'lucide-react';

interface RoomFormData {
  buildingId: string;
  roomNumber: string;
  area: string;
  price: string;
  serviceFee: string;
  description: string;
}

const emptyFormData: RoomFormData = {
  buildingId: '',
  roomNumber: '',
  area: '',
  price: '',
  serviceFee: '',
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [occupantsModalRoom, setOccupantsModalRoom] = useState<RoomDto | null>(null);

  // Bộ lọc
  const [filterBuildingId, setFilterBuildingId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal thêm/sửa (Admin)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RoomFormData>(emptyFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
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
    getBuildings()
      .then((res) => setBuildings(res.data))
      .catch(() => setBuildings([]));

    // Chỉ Admin/Staff gọi được — dùng để tra tên người thuê + người ở cùng theo phòng.
    getContracts('DangHieuLuc')
      .then((res) => setActiveContracts(res.data))
      .catch(() => setActiveContracts([]));
  }, []);

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
    setEditingRoomImageUrl(room.imageUrl || null);
    setGalleryMedia(room.media || []);
    setGalleryError('');
    setFormData({
      buildingId: String(room.buildingId),
      roomNumber: room.roomNumber,
      area: room.area ? String(room.area) : '',
      price: String(room.price),
      serviceFee: room.serviceFee ? String(room.serviceFee) : '',
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

    try {
      setSaving(true);

      if (editingId) {
        await updateRoomWithImage({
          id: editingId,
          roomNumber: formData.roomNumber,
          area: areaNum,
          price: priceNum,
          serviceFee: serviceFeeNum,
          description: formData.description || null,
          image: imageFile,
        });
      } else if (imageFile) {
        await createRoomWithImage({
          buildingId: Number(formData.buildingId),
          roomNumber: formData.roomNumber,
          area: areaNum,
          price: priceNum,
          serviceFee: serviceFeeNum,
          description: formData.description || null,
          image: imageFile,
        });
      } else {
        await createRoom({
          buildingId: Number(formData.buildingId),
          roomNumber: formData.roomNumber,
          area: areaNum,
          price: priceNum,
          serviceFee: serviceFeeNum,
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
    <div className="max-w-7xl space-y-8">
      {/* Tiêu đề & Nút thêm */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-900">
        <div>
          <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
            Kho phòng nhà trọ
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Quản lý phòng</h1>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold px-5 py-3 rounded-2xl flex items-center gap-1.5 transition-all shadow-lg shadow-orange-500/10 cursor-pointer"
          >
            <Plus size={16} /> Thêm phòng mới
          </button>
        )}
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-850">
        <select
          value={filterBuildingId}
          onChange={(e) => setFilterBuildingId(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none cursor-pointer"
        >
          <option value="all">Tất cả tòa nhà</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none cursor-pointer"
        >
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(statusMaps.room).map(([value, meta]) => (
            <option key={value} value={value}>{meta.label}</option>
          ))}
        </select>
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

      {!loading && !error && rooms.length === 0 && (
        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
          <DoorOpen className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-lg">Không có phòng nào khớp với bộ lọc.</p>
        </div>
      )}

      {!loading && !error && rooms.length > 0 && (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider bg-slate-950/20">
                  <th className="p-5">Ảnh</th>
                  <th className="p-5">Phòng</th>
                  <th className="p-5">Tòa nhà</th>
                  <th className="p-5">Diện tích</th>
                  <th className="p-5">Giá thuê</th>
                  <th className="p-5">Số người ở</th>
                  <th className="p-5">Trạng thái</th>
                  {isAdmin && <th className="p-5 text-center">Hành động</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50">
                {rooms.map((room) => (
                  <tr key={room.id} className="text-slate-300 hover:bg-slate-950/10 transition-colors">
                    <td className="p-5 shrink-0">
                      <img
                        src={resolveImageUrl(room.imageUrl) || 'https://via.placeholder.com/64?text=P'}
                        alt={room.roomNumber}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-800"
                      />
                    </td>
                    <td className="p-5 font-bold text-white">{room.roomNumber}</td>
                    <td className="p-5 font-semibold text-slate-400">{room.buildingName || `#${room.buildingId}`}</td>
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
                            className="p-2 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl transition-all border border-transparent hover:border-slate-800 cursor-pointer"
                            title="Chỉnh sửa phòng"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(room)}
                            className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/10 cursor-pointer"
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
        </div>
      )}

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

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Mô tả</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nội thất, tiện ích đi kèm..."
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
                            <img
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
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Ảnh đại diện (tùy chọn)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-orange-500 file:text-white file:text-xs file:font-bold file:cursor-pointer cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5">Thêm nhiều ảnh vào thư viện sau khi đã tạo phòng, trong màn hình Sửa phòng.</p>
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
