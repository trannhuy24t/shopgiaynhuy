import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRoom } from '../../api/room';
import { getMyTenantProfile } from '../../api/tenant';
import { requestContract } from '../../api/contract';
import { getPublicRates } from '../../api/systemConfig';
import { getApiErrorMessage, isNotFoundError } from '../../api/client';
import type { RoomDto } from '../../types/room';
import type { PublicRatesDto } from '../../types/systemConfig';
import { ArrowLeft, CheckCircle2, User, IdCard, Phone, Mail, PhoneCall, Info, Zap } from 'lucide-react';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const oneYearLaterStr = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

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

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

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
            // Lỗi khác 404 (chưa có hồ sơ) thì báo, còn 404 thì cứ để form trống cho điền mới
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

    try {
      setSubmitting(true);
      await requestContract({
        roomId: Number(roomId),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        numberOfOccupants: Number(form.numberOfOccupants),
        tenantProfile: {
          fullName: form.fullName,
          idCardNumber: form.idCardNumber || null,
          phone: form.phone || null,
          email: form.email || null,
          emergencyContact: form.emergencyContact || null,
        },
      });
      setSuccess(true);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Không thể gửi yêu cầu đăng ký thuê.'));
    } finally {
      setSubmitting(false);
    }
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
        <div className="flex gap-3 justify-center">
          <Link to="/hop-dong-cua-toi" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Xem hợp đồng của tôi
          </Link>
          <Link to="/rooms" className="bg-slate-900 border border-slate-800 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Tiếp tục xem phòng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-8">Đăng ký thuê phòng</h1>

      {room && (
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-2 mb-6">
          <p className="text-sm text-slate-400">
            Phòng <span className="text-white font-bold">{room.roomNumber}</span> — {room.buildingName || `Tòa nhà #${room.buildingId}`}
          </p>
          <p className="text-2xl font-black text-orange-500">{formatPrice(room.price)} <span className="text-sm text-slate-500 font-semibold">/ tháng</span></p>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl">
        {submitError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-5">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="font-bold text-sm text-white uppercase tracking-wide mb-4">Thời gian thuê dự kiến</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Ngày bắt đầu *</label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Ngày kết thúc *</label>
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>
            </div>
            <div className="mt-5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Số người ở *</label>
              <input
                type="number"
                required
                min={1}
                value={form.numberOfOccupants}
                onChange={(e) => setForm({ ...form, numberOfOccupants: e.target.value })}
                className="w-full sm:w-40 bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1.5">Dùng để tính phí dịch vụ hàng tháng (theo đầu người).</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-850">
            <h3 className="font-bold text-sm text-white uppercase tracking-wide mb-4 pt-4">Hồ sơ khách thuê</h3>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Họ và tên *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Số CCCD/CMND</label>
                <div className="relative">
                  <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    value={form.idCardNumber}
                    onChange={(e) => setForm({ ...form, idCardNumber: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl text-sm text-white outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl text-sm text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Liên hệ khẩn cấp</label>
                <div className="relative">
                  <PhoneCall className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    value={form.emergencyContact}
                    onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl text-sm text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {room && (
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-2.5">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block mb-1">Chi phí ước tính</span>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Giá thuê / tháng</span>
                <span className="font-bold text-white">{formatPrice(room.price)}</span>
              </div>
              {room.serviceFee > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Đơn giá dịch vụ / người</span>
                  <span className="font-bold text-white">{formatPrice(room.serviceFee)}</span>
                </div>
              )}
              {publicRates && (publicRates.electricUnitPrice > 0 || publicRates.waterUnitPrice > 0) && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 flex items-center gap-1"><Zap size={12} className="text-orange-500" /> Ước tính giá điện/nước</span>
                  <span className="font-bold text-white">{formatPrice(publicRates.electricUnitPrice)}/kWh · {formatPrice(publicRates.waterUnitPrice)}/m³</span>
                </div>
              )}
              <div className="flex items-start gap-1.5 text-[10px] text-slate-500 pt-2.5 border-t border-slate-850">
                <Info size={12} className="shrink-0 mt-0.5" />
                Giá điện/nước sẽ được chốt chính thức khi chủ trọ duyệt hợp đồng, có thể khác giá hiển thị ở đây nếu có thoả thuận riêng.
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all text-sm tracking-wide cursor-pointer"
          >
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu đăng ký thuê'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContractRequestPage;
