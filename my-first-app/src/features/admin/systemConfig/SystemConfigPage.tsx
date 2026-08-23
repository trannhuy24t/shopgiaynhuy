import { useEffect, useState } from 'react';
import { getSystemConfigs, upsertSystemConfig } from '../../../api/systemConfig';
import { getApiErrorMessage } from '../../../api/client';
import { CheckCircle2, Settings2 } from 'lucide-react';

interface ConfigField {
  key: string;
  label: string;
  description: string;
}

const FIELDS: ConfigField[] = [
  { key: 'BankBin', label: 'Mã BIN ngân hàng', description: 'Dùng để tạo mã VietQR (VD: 970422)' },
  { key: 'BankAccountNumber', label: 'Số tài khoản nhận thanh toán', description: '' },
  { key: 'BankAccountName', label: 'Tên chủ tài khoản', description: '' },
  { key: 'DefaultElectricUnitPrice', label: 'Đơn giá điện mặc định (đ/kWh)', description: 'Tự điền sẵn khi Staff/Admin tạo hóa đơn hàng tháng' },
  { key: 'DefaultWaterUnitPrice', label: 'Đơn giá nước mặc định (đ/m³)', description: 'Tự điền sẵn khi Staff/Admin tạo hóa đơn hàng tháng' },
];

const SystemConfigPage = () => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getSystemConfigs();
        const map = Object.fromEntries(res.data.map((c) => [c.key, c.value]));
        setValues(map);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Không tải được cấu hình hệ thống.'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);

    try {
      setSaving(true);
      await Promise.all(
        FIELDS.map((field) =>
          upsertSystemConfig({
            key: field.key,
            value: values[field.key] ?? '',
            description: field.description || null,
          })
        )
      );
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Không thể lưu cấu hình hệ thống.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-orange-500/10 p-2.5 rounded-xl text-orange-500 border border-orange-500/20">
          <Settings2 size={22} />
        </div>
        <div>
          <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
            Thiết lập chung
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Cấu hình hệ thống</h1>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold p-4 rounded-xl mb-6">
        Đơn giá phí dịch vụ (theo đầu người) giờ cấu hình riêng cho từng phòng ở trang Quản lý phòng,
        không còn ở đây.
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

      {!loading && !error && (
        <div className="bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl">
          {saveError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-5">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold p-3 rounded-xl mb-5 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Đã lưu cấu hình thành công.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {FIELDS.map((field) => (
              <div key={field.key}>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">{field.label}</label>
                <input
                  type="text"
                  value={values[field.key] ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
                {field.description && <p className="text-[10px] text-slate-500 mt-1.5">{field.description}</p>}
              </div>
            ))}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-xl text-sm tracking-wide transition-colors cursor-pointer"
            >
              {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SystemConfigPage;
