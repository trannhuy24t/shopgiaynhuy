import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRoom } from '../../api/room';
import { getMyTenantProfile } from '../../api/tenant';
import { requestContract } from '../../api/contract';
import { getPublicRates } from '../../api/systemConfig';
import { getApiErrorMessage, isNotFoundError } from '../../api/client';
import type { RoomDto } from '../../types/room';
import type { PublicRatesDto } from '../../types/systemConfig';
import type { ContractDto } from '../../types/contract';
import RentalContractWordModal from '../../components/Contract/RentalContractWordModal';
import DigitalSignaturePad from '../../components/Contract/DigitalSignaturePad';
import {
  ArrowLeft,
  CheckCircle2,
  User,
  IdCard,
  Phone,
  Mail,
  PhoneCall,
  Info,
  Zap,
  FileText,
  Users,
  UserPlus,
  Trash2,
  Plus,
  Minus,
  PenTool,
  ShieldCheck,
} from 'lucide-react';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const toDateInput = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};
const todayStr = () => toDateInput(new Date());
const oneYearLaterStr = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return toDateInput(d);
};

export interface OccupantItem {
  id: string;
  fullName: string;
  relationship: string;
  idCardNumber: string;
  phone: string;
}

const RELATIONSHIP_OPTIONS = [
  'Bạn cùng phòng',
  'Vợ/Chồng',
  'Anh/Chị/Em',
  'Con',
  'Bố/Mẹ',
  'Đồng nghiệp',
  'Người thân',
  'Khác',
];

interface FormState {
  startDate: string;
  endDate: string;
  numberOfOccupants: string;
  fullName: string;
  idCardNumber: string;
  phone: string;
  email: string;
  emergencyContact: string;
}

const ContractRequestPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState<RoomDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [publicRates, setPublicRates] = useState<PublicRatesDto | null>(null);

  const [form, setForm] = useState<FormState>({
    startDate: todayStr(),
    endDate: oneYearLaterStr(),
    numberOfOccupants: '1',
    fullName: '',
    idCardNumber: '',
    phone: '',
    email: '',
    emergencyContact: '',
  });

  const [occupants, setOccupants] = useState<OccupantItem[]>([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [createdContract, setCreatedContract] = useState<ContractDto | null>(null);

  // Tự động điều chỉnh số lượng form người ở cùng khi thay đổi số người ở
  const handleNumberOfOccupantsChange = (val: string) => {
    setForm((prev) => ({ ...prev, numberOfOccupants: val }));

    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1) {
      // 1 người chính đứng hợp đồng + (num - 1) người ở cùng
      const targetRoommates = Math.max(0, num - 1);
      setOccupants((prev) => {
        if (prev.length === targetRoommates) return prev;
        if (prev.length < targetRoommates) {
          // Thêm các thẻ thông tin người ở cùng mới tự động
          const additions: OccupantItem[] = [];
          for (let i = prev.length; i < targetRoommates; i++) {
            additions.push({
              id: `occ_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
              fullName: '',
              relationship: 'Bạn cùng phòng',
              idCardNumber: '',
              phone: '',
            });
          }
          return [...prev, ...additions];
        } else {
          // Giảm bớt số người ở cùng
          return prev.slice(0, targetRoommates);
        }
      });
    }
  };

  const handleAddOccupant = () => {
    setOccupants((prev) => {
      const newOcc: OccupantItem = {
        id: `occ_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        fullName: '',
        relationship: 'Bạn cùng phòng',
        idCardNumber: '',
        phone: '',
      };
      const next = [...prev, newOcc];
      // Tự động tăng số người ở
      setForm((f) => ({ ...f, numberOfOccupants: String(next.length + 1) }));
      return next;
    });
  };

  const handleRemoveOccupant = (id: string) => {
    setOccupants((prev) => {
      const next = prev.filter((o) => o.id !== id);
      // Tự động giảm số người ở
      setForm((f) => ({ ...f, numberOfOccupants: String(Math.max(1, next.length + 1)) }));
      return next;
    });
  };

  const handleUpdateOccupant = (id: string, field: keyof OccupantItem, value: string) => {
    setOccupants((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadError('');

        const roomRes = await getRoom(roomId ?? '');
        setRoom(roomRes.data);

        getPublicRates()
          .then((res) => setPublicRates(res.data))
          .catch(() => setPublicRates(null));

        try {
          const profileRes = await getMyTenantProfile();
          setForm((prev) => ({
            ...prev,
            fullName: profileRes.data.fullName,
            idCardNumber: profileRes.data.idCardNumber || '',
            phone: profileRes.data.phone || '',
            email: profileRes.data.email || '',
            emergencyContact: profileRes.data.emergencyContact || '',
          }));
        } catch (profileErr) {
          if (!isNotFoundError(profileErr)) {
            console.error(profileErr);
          }
        }
      } catch (err) {
        setLoadError(getApiErrorMessage(err, 'Không tải được thông tin phòng.'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [roomId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!form.fullName.trim()) {
      setSubmitError('Vui lòng điền Họ và tên trong hồ sơ khách thuê.');
      return;
    }
    if (!form.startDate || !form.endDate) {
      setSubmitError('Vui lòng chọn ngày bắt đầu và ngày kết thúc dự kiến.');
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setSubmitError('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }
    if (!form.numberOfOccupants || Number(form.numberOfOccupants) < 1) {
      setSubmitError('Số người ở phải từ 1 người trở lên.');
      return;
    }

    if (!signatureDataUrl) {
      setSubmitError('Vui lòng ký tên bằng chữ ký số ở Mục 5 trước khi gửi yêu cầu đăng ký thuê.');
      return;
    }

    for (let i = 0; i < occupants.length; i++) {
      const occ = occupants[i];
      if (!occ.fullName.trim() && (occ.phone.trim() || occ.idCardNumber.trim())) {
        setSubmitError(`Vui lòng nhập Họ và tên cho Người ở cùng #${i + 1}.`);
        return;
      }
    }

    const validOccupants = occupants.filter((o) => o.fullName.trim() !== '');
    const totalOccupants = Math.max(Number(form.numberOfOccupants) || 1, validOccupants.length + 1);

    try {
      setSubmitting(true);
      const res = await requestContract({
        roomId: Number(roomId),
        startDate: `${form.startDate}T00:00:00.000Z`,
        endDate: `${form.endDate}T00:00:00.000Z`,
        numberOfOccupants: totalOccupants,
        tenantProfile: {
          fullName: form.fullName.trim(),
          idCardNumber: form.idCardNumber.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          emergencyContact: form.emergencyContact.trim() || null,
        },
        occupants: validOccupants.map((o) => ({
          fullName: o.fullName.trim(),
          relationship: o.relationship.trim() || 'Người ở cùng',
          idCardNumber: o.idCardNumber.trim() || null,
          phone: o.phone.trim() || null,
        })),
        tenantSignature: signatureDataUrl,
      });
      setCreatedContract(res.data);
      setSuccess(true);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Không thể gửi yêu cầu đăng ký thuê.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Tạo đối tượng hợp đồng dự thảo theo đúng thông tin người dùng đang điền trên Form
  const previewContract: ContractDto = createdContract || {
    id: 0,
    roomId: Number(roomId),
    roomNumber: room?.roomNumber,
    roomArea: room?.area || 25,
    roomServiceFee: room?.serviceFee || 150000,
    buildingName: room?.buildingName || 'Khu Căn hộ / Nhà trọ TroHub',
    buildingAddress: room?.buildingAddress || 'Hệ thống nhà trọ TroHub, Việt Nam',
    landlordName: 'Ban Quản lý Tòa nhà TroHub',
    landlordPhone: '0988.xxx.xxx',
    tenantId: 0,
    tenantName: form.fullName.trim() || 'Khách thuê (Dự thảo)',
    tenantPhone: form.phone.trim() || '...........................................',
    tenantIdCard: form.idCardNumber.trim() || '...........................................',
    tenantEmail: form.email.trim() || '...........................................',
    startDate: form.startDate ? `${form.startDate}T00:00:00.000Z` : new Date().toISOString(),
    endDate: form.endDate ? `${form.endDate}T00:00:00.000Z` : new Date().toISOString(),
    deposit: room?.price || 0,
    monthlyRent: room?.price || 0,
    numberOfOccupants: Math.max(Number(form.numberOfOccupants) || 1, occupants.filter((o) => o.fullName.trim()).length + 1),
    electricUnitPrice: publicRates?.electricUnitPrice || 3500,
    waterUnitPrice: publicRates?.waterUnitPrice || 35000,
    status: 'ChoDuyet',
    createdAt: new Date().toISOString(),
    occupants: occupants
      .filter((o) => o.fullName.trim() !== '')
      .map((o, idx) => ({
        id: -(idx + 1),
        contractId: 0,
        fullName: o.fullName.trim(),
        relationship: o.relationship.trim() || 'Người ở cùng',
        idCardNumber: o.idCardNumber.trim() || null,
        phone: o.phone.trim() || null,
        createdAt: new Date().toISOString(),
      })),
    tenantSignatureUrl: signatureDataUrl || null,
    signedAt: signatureDataUrl ? new Date().toISOString() : null,
    signatureHash: signatureDataUrl ? 'TROHUB-DIGITAL-SIGNATURE-VERIFIED' : null,
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold p-6 rounded-2xl inline-block mb-6">
          {loadError}
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-xl text-center space-y-6">
        <div className="bg-slate-900 border border-slate-850 p-8 rounded-3xl shadow-2xl relative">
          <div className="absolute -top-6 -right-6 bg-green-500/10 w-20 h-20 rounded-full blur-xl pointer-events-none" />
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Đã gửi yêu cầu đăng ký thuê!</h2>
          <p className="text-slate-400 text-sm mt-3">
            Yêu cầu của bạn đang chờ chủ trọ duyệt. Sau khi duyệt, hệ thống sẽ tự tạo hóa đơn tiền cọc — theo dõi ở trang "Hợp đồng của tôi".
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <FileText size={16} /> Xem bản hợp đồng vừa tạo
          </button>
          <Link to="/hop-dong-cua-toi" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Hợp đồng của tôi
          </Link>
          <Link to="/rooms" className="bg-slate-900 border border-slate-800 text-slate-100 font-bold px-6 py-3 rounded-xl transition-colors">
            Tiếp tục xem phòng
          </Link>
        </div>

        {showPreviewModal && (
          <RentalContractWordModal
            contract={previewContract}
            room={room}
            onClose={() => setShowPreviewModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-70px)] px-4 sm:px-8 lg:px-12 xl:px-16 py-6 flex flex-col space-y-5">
      {/* Thanh điều hướng quay lại & Tiêu đề */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> Quay lại danh sách phòng
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            Đăng ký thuê phòng
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Điền thông tin bên dưới để gửi yêu cầu thuê phòng và tự động tạo bản hợp đồng dự thảo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPreviewModal(true)}
          className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold px-5 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          title="Xem trước mẫu hợp đồng dạng bản Word với thông tin đang nhập"
        >
          <FileText size={16} /> Xem trước hợp đồng (Bản Word)
        </button>
      </div>

      {/* Banner thông tin phòng & Ghi chú tự động cập nhật (Phủ kín trang) */}
      {room && (
        <div className="w-full bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                {room.buildingName || `Tòa nhà #${room.buildingId}`}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Phòng <span className="text-orange-500">{room.roomNumber}</span>
                {room.area ? (
                  <span className="text-sm font-normal text-slate-400 ml-2">({room.area} m²)</span>
                ) : null}
              </h2>
              <p className="text-xs text-slate-400">
                {room.buildingAddress || 'Hệ thống căn hộ / phòng trọ TroHub'}
              </p>
            </div>

            <div className="sm:border-l sm:border-slate-800 sm:pl-6">
              <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">
                Giá thuê phòng
              </span>
              <p className="text-2xl sm:text-3xl font-black text-orange-500">
                {formatPrice(room.price)}{' '}
                <span className="text-xs text-slate-500 font-semibold">/ tháng</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-2xl">
              <FileText size={18} className="text-blue-400 shrink-0" />
              <span>Văn bản hợp đồng sẽ tự động cập nhật ngay lập tức theo các thông tin bạn điền</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 cursor-pointer active:scale-95 shrink-0"
            >
              <FileText size={16} /> Mở bản Word xem trước
            </button>
          </div>
        </div>
      )}

      {/* Card Form lớn phủ kín toàn bộ trang */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col flex-1">
        {submitError && (
          <div className="m-6 sm:m-8 mb-0 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-4 rounded-2xl">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          {/* Vùng cuộn nội dung form có thanh cuộn riêng biệt */}
          <div className="max-h-[64vh] xl:max-h-[68vh] overflow-y-auto px-6 sm:px-10 lg:px-12 py-7 space-y-8 form-scroll-container">
            {/* 1. Thời gian thuê dự kiến & Số lượng người ở */}
            <div>
              <h3 className="font-bold text-sm text-white uppercase tracking-wide mb-4">
                1. Thời gian thuê & Số lượng người ở
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Ngày bắt đầu thuê *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Ngày kết thúc thuê *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Số người ở *
                    </label>
                    <span className="text-[10px] text-orange-400 font-semibold">
                      {Number(form.numberOfOccupants) > 1
                        ? `1 chính + ${Number(form.numberOfOccupants) - 1} cùng`
                        : '1 người (ở một mình)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = Math.max(1, (Number(form.numberOfOccupants) || 1) - 1);
                        handleNumberOfOccupantsChange(String(cur));
                      }}
                      disabled={Number(form.numberOfOccupants) <= 1}
                      className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500 text-white disabled:opacity-30 disabled:hover:border-slate-800 transition-all cursor-pointer select-none"
                      title="Giảm 1 người"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      required
                      min={1}
                      max={20}
                      value={form.numberOfOccupants}
                      onChange={(e) => handleNumberOfOccupantsChange(e.target.value)}
                      className="w-20 text-center font-bold text-base bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl py-2.5 text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const cur = (Number(form.numberOfOccupants) || 1) + 1;
                        handleNumberOfOccupantsChange(String(cur));
                      }}
                      className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500 text-white hover:text-orange-400 transition-all cursor-pointer select-none"
                      title="Tăng thêm 1 người (tự động hiện form người ở cùng)"
                    >
                      <Plus size={16} />
                    </button>
                    <span className="text-xs text-slate-400">người</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    Tăng số người sẽ tự động mở ô nhập thông tin người ở cùng bên dưới.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Hồ sơ khách thuê chính */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="font-bold text-sm text-white uppercase tracking-wide mb-4">
                2. Hồ sơ khách thuê chính (Đứng tên hợp đồng - Bên B)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Họ và tên *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl text-sm text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Số CCCD / CMND
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      value={form.idCardNumber}
                      onChange={(e) => setForm({ ...form, idCardNumber: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl text-sm text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl text-sm text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl text-sm text-white outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Liên hệ khẩn cấp (Người thân / Bạn bè)
                  </label>
                  <div className="relative">
                    <PhoneCall className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Họ tên và số điện thoại người thân khi cần liên hệ khẩn cấp"
                      value={form.emergencyContact}
                      onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl text-sm text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Danh sách người ở cùng */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wide flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-500" />
                    3. Thông tin người ở cùng ({occupants.length} người)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Khai báo thông tin người ở cùng để đưa vào Điều 4 Hợp đồng và làm thủ tục đăng ký tạm trú với công an.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddOccupant}
                  className="inline-flex items-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  <UserPlus size={14} /> + Thêm người ở cùng
                </button>
              </div>

              {occupants.length === 0 ? (
                <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-2">
                  <p className="text-xs text-slate-400">
                    Hiện tại chưa có người ở cùng (bạn đang chọn ở 1 người).
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Nếu bạn ở cùng bạn bè hoặc gia đình, hãy tăng ô <strong>Số người ở</strong> phía trên hoặc bấm nút bên dưới.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddOccupant}
                    className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-bold cursor-pointer underline pt-1"
                  >
                    <UserPlus size={14} /> + Bấm để thêm người ở cùng ngay
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {occupants.map((occ, idx) => (
                    <div
                      key={occ.id}
                      className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 sm:p-5 relative transition-all shadow-sm"
                    >
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-850">
                        <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 inline-flex items-center justify-center text-[11px] font-bold">
                            {idx + 1}
                          </span>
                          Người ở cùng #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOccupant(occ.id)}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Xóa người này (tự động giảm số người ở)"
                        >
                          <Trash2 size={13} /> Xóa người này
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Họ và tên *
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
                            <input
                              type="text"
                              required
                              placeholder="Ví dụ: Nguyễn Văn B"
                              value={occ.fullName}
                              onChange={(e) => handleUpdateOccupant(occ.id, 'fullName', e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl text-xs sm:text-sm text-white outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Mối quan hệ *
                          </label>
                          <select
                            value={occ.relationship}
                            onChange={(e) => handleUpdateOccupant(occ.id, 'relationship', e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl text-xs sm:text-sm text-white outline-none cursor-pointer"
                          >
                            {RELATIONSHIP_OPTIONS.map((opt) => (
                              <option key={opt} value={opt} className="bg-slate-900 text-white">
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Số CCCD / CMND
                          </label>
                          <div className="relative">
                            <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
                            <input
                              type="text"
                              placeholder="12 số CCCD (tùy chọn)"
                              value={occ.idCardNumber}
                              onChange={(e) => handleUpdateOccupant(occ.id, 'idCardNumber', e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl text-xs sm:text-sm text-white outline-none font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Số điện thoại
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
                            <input
                              type="tel"
                              placeholder="Số điện thoại liên hệ"
                              value={occ.phone}
                              onChange={(e) => handleUpdateOccupant(occ.id, 'phone', e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl text-xs sm:text-sm text-white outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddOccupant}
                    className="w-full py-3 bg-slate-950 border border-dashed border-slate-800 hover:border-orange-500/50 hover:bg-slate-900/40 text-slate-300 hover:text-orange-400 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UserPlus size={14} /> + Thêm một người ở cùng khác
                  </button>
                </div>
              )}
            </div>

            {/* 4. Chi phí ước tính */}
            {room && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-2.5">
                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block mb-1">
                  4. Chi phí ước tính & Biểu phí
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-2">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-850">
                    <span className="text-slate-400 text-xs block mb-1">Giá thuê phòng / tháng</span>
                    <span className="font-black text-lg text-white">{formatPrice(room.price)}</span>
                  </div>
                  {room.serviceFee > 0 && (
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-850">
                      <span className="text-slate-400 text-xs block mb-1">Dịch vụ / người</span>
                      <span className="font-black text-lg text-white">{formatPrice(room.serviceFee)}</span>
                    </div>
                  )}
                  {publicRates && (publicRates.electricUnitPrice > 0 || publicRates.waterUnitPrice > 0) && (
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-850">
                      <span className="text-slate-400 text-xs block mb-1 flex items-center gap-1">
                        <Zap size={13} className="text-orange-500" /> Điện / Nước tạm tính
                      </span>
                      <span className="font-bold text-sm text-white">
                        {formatPrice(publicRates.electricUnitPrice)}/kWh · {formatPrice(publicRates.waterUnitPrice)}/m³
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-1.5 text-[10px] text-slate-500 pt-2 border-t border-slate-850">
                  <Info size={12} className="shrink-0 mt-0.5" />
                  Giá điện/nước sẽ được chốt chính thức khi chủ trọ duyệt hợp đồng. Tiền cọc được tạo hóa đơn tự động sau khi duyệt.
                </div>
              </div>
            )}

            {/* 5. Chữ ký số khách thuê (Bên B) */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wide flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-orange-500" />
                    5. Ký tên bằng chữ ký số (Đại diện Bên B) *
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ký tên trực tiếp bằng nét vẽ tay, chọn mẫu chữ ký theo tên hoặc tải ảnh chữ ký có sẵn.
                  </p>
                </div>
                {signatureDataUrl ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    <CheckCircle2 size={13} /> Đã có chữ ký số
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold">
                    <PenTool size={12} /> Cần ký tên trước khi gửi
                  </span>
                )}
              </div>

              <DigitalSignaturePad
                value={signatureDataUrl}
                onChange={setSignatureDataUrl}
                fullName={form.fullName}
              />
            </div>
          </div>

          {/* Thanh hành động dính ở đáy card Form */}
          <div className="bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-6 sm:px-10 lg:px-12 py-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
              Đang đăng ký thuê phòng <strong className="text-white">{room?.roomNumber}</strong> ·{' '}
              <strong className="text-orange-400">{form.numberOfOccupants || 1} người ở</strong>{' '}
              {occupants.length > 0 && <span className="text-slate-500">({occupants.length} người ở cùng)</span>}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm cursor-pointer transition-all active:scale-95"
              >
                <FileText size={16} /> Xem trước bản Word
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold px-8 py-3.5 rounded-2xl text-xs sm:text-sm shadow-lg shadow-orange-500/20 cursor-pointer transition-all active:scale-95"
              >
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu đăng ký thuê'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal hiển thị bản hợp đồng Word */}
      {showPreviewModal && (
        <RentalContractWordModal
          contract={previewContract}
          room={room}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
};

export default ContractRequestPage;
