import { useEffect, useState } from 'react';
import { getMyTenantProfile, updateMyTenantProfile } from '../../api/tenant';
import { getApiErrorMessage, isNotFoundError } from '../../api/client';
import type { UpsertTenantProfilePayload } from '../../types/tenant';
import { User, IdCard, Phone, Mail, PhoneCall, CheckCircle2 } from 'lucide-react';

const emptyForm: UpsertTenantProfilePayload = {
  fullName: '',
  idCardNumber: '',
  phone: '',
  email: '',
  emergencyContact: '',
};

const TenantProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [hasProfile, setHasProfile] = useState(false);

  const [formData, setFormData] = useState<UpsertTenantProfilePayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setLoadError('');
        const res = await getMyTenantProfile();
        setHasProfile(true);
        setFormData({
          fullName: res.data.fullName,
          idCardNumber: res.data.idCardNumber || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          emergencyContact: res.data.emergencyContact || '',
        });
      } catch (err) {
        if (isNotFoundError(err)) {
          // Chưa có hồ sơ — không phải lỗi, cho điền form tạo mới
          setHasProfile(false);
          setFormData(emptyForm);
        } else {
          setLoadError(getApiErrorMessage(err, 'Không tải được hồ sơ khách thuê.'));
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);

    if (!formData.fullName.trim()) {
      setSaveError('Vui lòng điền Họ và tên.');
      return;
    }

    try {
      setSaving(true);
      const res = await updateMyTenantProfile({
        fullName: formData.fullName,
        idCardNumber: formData.idCardNumber || null,
        phone: formData.phone || null,
        email: formData.email || null,
        emergencyContact: formData.emergencyContact || null,
      });
      setHasProfile(true);
      setFormData({
        fullName: res.data.fullName,
        idCardNumber: res.data.idCardNumber || '',
        phone: res.data.phone || '',
        email: res.data.email || '',
        emergencyContact: res.data.emergencyContact || '',
      });
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Không thể lưu hồ sơ.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
          Tài khoản của tôi
        </span>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Hồ sơ khách thuê</h1>
      </div>

      {loadError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold p-6 rounded-2xl text-center mb-6">
          {loadError}
        </div>
      )}

      {!hasProfile && !loadError && (
        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold p-4 rounded-xl mb-6">
          Bạn chưa có hồ sơ khách thuê. Điền thông tin bên dưới để tạo hồ sơ — hồ sơ này sẽ được dùng khi bạn đăng ký thuê phòng.
        </div>
      )}

      <div className="bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl">
        {saveError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-5">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold p-3 rounded-xl mb-5 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Đã lưu hồ sơ thành công.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Họ và tên *</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl text-sm text-white outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Số CCCD/CMND</label>
            <div className="relative">
              <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                value={formData.idCardNumber ?? ''}
                onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
                placeholder="079xxxxxxxxx"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl text-sm text-white outline-none transition-colors"
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
                  value={formData.phone ?? ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="09xxxxxxxx"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl text-sm text-white outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Email liên hệ</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="email"
                  value={formData.email ?? ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ten@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl text-sm text-white outline-none transition-colors"
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
                value={formData.emergencyContact ?? ''}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="Tên và SĐT người thân..."
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl text-sm text-white outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-xl text-sm tracking-wide shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
          >
            {saving ? 'Đang lưu...' : hasProfile ? 'Cập nhật hồ sơ' : 'Tạo hồ sơ'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TenantProfilePage;
