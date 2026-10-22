import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getContracts } from '../../../api/contract';
import { createInvoice, getInvoices } from '../../../api/invoice';
import { getRoom } from '../../../api/room';
import { getApiErrorMessage } from '../../../api/client';
import { notifyTenantByContract } from '../../../utils/notifyTenant';
import type { ContractDto } from '../../../types/contract';
import { ArrowLeft } from 'lucide-react';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const today = new Date();
const defaultDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 10);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

interface FormState {
  contractId: string;
  month: string;
  year: string;
  electricOldReading: string;
  electricNewReading: string;
  waterOldReading: string;
  waterNewReading: string;
  serviceFee: string;
  dueDate: string;
}

const InvoiceCreatePage = () => {
  const navigate = useNavigate();

  const [contracts, setContracts] = useState<ContractDto[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [contractsError, setContractsError] = useState('');
  const [contractsReloadKey, setContractsReloadKey] = useState(0);

  const [form, setForm] = useState<FormState>({
    contractId: '',
    month: String(today.getMonth() + 1),
    year: String(today.getFullYear()),
    electricOldReading: '',
    electricNewReading: '',
    waterOldReading: '',
    waterNewReading: '',
    serviceFee: '',
    dueDate: defaultDueDate(),
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [roomServiceFee, setRoomServiceFee] = useState<number | null>(null);
  const [contractInvoices, setContractInvoices] = useState<import('../../../types/invoice').InvoiceDto[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyReloadKey, setHistoryReloadKey] = useState(0);

  useEffect(() => {
    setLoadingContracts(true);
    setContractsError('');
    getContracts('DangHieuLuc')
      .then((res) => setContracts(res.data))
      .catch((err) => {
        setContracts([]);
        setContractsError(getApiErrorMessage(err, 'Không thể tải danh sách hợp đồng. Vui lòng thử lại.'));
      })
      .finally(() => setLoadingContracts(false));
  }, [contractsReloadKey]);

  const selectedContract = contracts.find((c) => c.id === Number(form.contractId));
  const occupants = selectedContract?.numberOfOccupants || 1;

  useEffect(() => {
    if (!selectedContract) {
      setContractInvoices([]);
      setHistoryError('');
      setLoadingHistory(false);
      return;
    }
    let cancelled = false;
    setLoadingHistory(true);
    setHistoryError('');
    getInvoices({ contractId: selectedContract.id })
      .then((res) => { if (!cancelled) setContractInvoices(res.data); })
      .catch((err) => {
        if (!cancelled) {
          setContractInvoices([]);
          setHistoryError(getApiErrorMessage(err, 'Không thể tải lịch sử hóa đơn. Vui lòng thử lại.'));
        }
      })
      .finally(() => { if (!cancelled) setLoadingHistory(false); });
    return () => { cancelled = true; };
  }, [selectedContract?.id, historyReloadKey]);

  useEffect(() => {
    if (!selectedContract || loadingHistory || historyError) return;
    const month = Number(form.month);
    const year = Number(form.year);
    const monthlyInvoices = contractInvoices.filter((invoice) => invoice.type === 'HangThang');
    const previous = monthlyInvoices
      .filter((invoice) => invoice.year < year || (invoice.year === year && invoice.month < month))
      .sort((a, b) => b.year - a.year || b.month - a.month)[0];
    setForm((current) => ({
      ...current,
      electricOldReading: previous ? String(previous.electricNewReading) : '',
      electricNewReading: previous ? String(previous.electricNewReading) : '',
      waterOldReading: previous ? String(previous.waterNewReading) : '',
      waterNewReading: previous ? String(previous.waterNewReading) : '',
    }));
  }, [selectedContract?.id, contractInvoices, form.month, form.year, loadingHistory, historyError]);

  const duplicateInvoice = contractInvoices.some((invoice) => invoice.type === 'HangThang' && invoice.month === Number(form.month) && invoice.year === Number(form.year));

  // Lấy đơn giá dịch vụ mặc định của phòng để hiện tham khảo — nếu để trống ô "Đơn giá / người",
  // backend tự dùng đúng giá trị này (Room.ServiceFee) khi tạo hóa đơn.
  useEffect(() => {
    if (!selectedContract) {
      setRoomServiceFee(null);
      return;
    }
    let cancelled = false;
    getRoom(selectedContract.roomId)
      .then((res) => {
        if (!cancelled) setRoomServiceFee(res.data.serviceFee);
      })
      .catch(() => {
        if (!cancelled) setRoomServiceFee(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedContract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.contractId) {
      setError('Vui lòng chọn hợp đồng cần lập hóa đơn.');
      return;
    }
    if (loadingHistory || historyError) {
      setError(historyError || 'Đang tải lịch sử hóa đơn, vui lòng chờ rồi thử lại.');
      return;
    }
    if (!selectedContract || selectedContract.electricUnitPrice <= 0 || selectedContract.waterUnitPrice <= 0) {
      setError('Hợp đồng này chưa có đơn giá điện/nước chốt sẵn — không thể tự tính tiền điện/nước. Liên hệ Admin để cập nhật.');
      return;
    }
    if (duplicateInvoice) {
      setError('Hợp đồng này đã có hóa đơn cho tháng/năm đã chọn.');
      return;
    }
    if (form.electricOldReading === '' || form.electricNewReading === '' || form.waterOldReading === '' || form.waterNewReading === '') {
      setError('Vui lòng nhập đủ chỉ số điện và nước. Lần lập hóa đơn đầu tiên cần nhập chỉ số cũ ban đầu.');
      return;
    }
    if (Number(form.electricNewReading) < Number(form.electricOldReading)) {
      setError('Chỉ số điện mới không được nhỏ hơn chỉ số cũ.');
      return;
    }
    if (Number(form.waterNewReading) < Number(form.waterOldReading)) {
      setError('Chỉ số nước mới không được nhỏ hơn chỉ số cũ.');
      return;
    }

    try {
      setSaving(true);
      const contractIdNum = Number(form.contractId);
      const res = await createInvoice({
        contractId: contractIdNum,
        month: Number(form.month),
        year: Number(form.year),
        electricOldReading: Number(form.electricOldReading),
        electricNewReading: Number(form.electricNewReading),
        waterOldReading: Number(form.waterOldReading),
        waterNewReading: Number(form.waterNewReading),
        serviceFee: form.serviceFee.trim() === '' ? undefined : Number(form.serviceFee),
        dueDate: new Date(`${form.dueDate}T00:00:00`).toISOString(),
      });
      notifyTenantByContract(contractIdNum, {
        title: 'Hóa đơn mới',
        content: `Hóa đơn kỳ ${form.month}/${form.year} (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(res.data.totalAmount)}) đã được tạo, hạn thanh toán ${new Date(`${form.dueDate}T00:00:00`).toLocaleDateString('vi-VN')}.`,
        type: 'ThongBaoChung',
      });
      navigate('/admin/invoices');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tạo hóa đơn.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate('/admin/invoices')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Quay lại danh sách hóa đơn
      </button>

      <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-8">Tạo hóa đơn hàng tháng</h1>

      <div className="bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Hợp đồng (phòng đang hiệu lực) *</label>
            <select
              required
              disabled={loadingContracts || Boolean(contractsError)}
              value={form.contractId}
              onChange={(e) => setForm({ ...form, contractId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-3 py-3 text-sm text-white outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="">{loadingContracts ? 'Đang tải...' : '-- Chọn hợp đồng --'}</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  Phòng {c.roomNumber || c.roomId} — {c.tenantName || `Khách #${c.tenantId}`}
                </option>
              ))}
            </select>
            {contractsError ? (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-red-400">
                <span>{contractsError}</span>
                <button
                  type="button"
                  onClick={() => setContractsReloadKey((key) => key + 1)}
                  className="font-bold text-orange-400 hover:text-orange-300"
                >
                  Thử tải lại
                </button>
              </div>
            ) : !loadingContracts && contracts.length === 0 && (
              <p className="text-[10px] text-slate-500 mt-1.5">Chưa có hợp đồng nào đang hiệu lực.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Tháng *</label>
              <input
                type="number"
                required
                min={1}
                max={12}
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
                className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Năm *</label>
              <input
                type="number"
                required
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
              />
            </div>
          </div>

          {duplicateInvoice && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">Hợp đồng này đã có hóa đơn tháng {form.month}/{form.year}. Chọn kỳ khác để tránh thu trùng.</p>}
          {selectedContract && (
            <div className="text-[10px]">
              {loadingHistory ? (
                <p className="text-slate-500">Đang tra chỉ số kỳ trước...</p>
              ) : historyError ? (
                <div className="flex flex-wrap items-center gap-3 text-red-400">
                  <span>{historyError}</span>
                  <button
                    type="button"
                    onClick={() => setHistoryReloadKey((key) => key + 1)}
                    className="font-bold text-orange-400 hover:text-orange-300"
                  >
                    Thử tải lại
                  </button>
                </div>
              ) : (
                <p className="text-slate-500">Chỉ số cũ được lấy từ hóa đơn gần nhất. Nếu đây là hóa đơn đầu tiên, hãy nhập chỉ số ban đầu theo đồng hồ.</p>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-850">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-white uppercase tracking-wide">Chỉ số điện</h3>
              <span className="text-[10px] font-bold">
                {selectedContract ? (
                  selectedContract.electricUnitPrice > 0 ? (
                    <span className="text-slate-400">
                      Giá điện: <span className="text-orange-400">{formatPrice(selectedContract.electricUnitPrice)}/kWh</span> <span className="text-slate-600 normal-case font-medium">(theo hợp đồng)</span>
                    </span>
                  ) : (
                    <span className="text-red-400">Hợp đồng chưa chốt giá điện</span>
                  )
                ) : null}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Chỉ số cũ</label>
                <input type="number" required min={0} value={form.electricOldReading} onChange={(e) => setForm({ ...form, electricOldReading: e.target.value })} className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Chỉ số mới</label>
                <input type="number" required min={0} value={form.electricNewReading} onChange={(e) => setForm({ ...form, electricNewReading: e.target.value })} className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-white uppercase tracking-wide">Chỉ số nước</h3>
              <span className="text-[10px] font-bold">
                {selectedContract ? (
                  selectedContract.waterUnitPrice > 0 ? (
                    <span className="text-slate-400">
                      Giá nước: <span className="text-orange-400">{formatPrice(selectedContract.waterUnitPrice)}/m³</span> <span className="text-slate-600 normal-case font-medium">(theo hợp đồng)</span>
                    </span>
                  ) : (
                    <span className="text-red-400">Hợp đồng chưa chốt giá nước</span>
                  )
                ) : null}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Chỉ số cũ</label>
                <input type="number" required min={0} value={form.waterOldReading} onChange={(e) => setForm({ ...form, waterOldReading: e.target.value })} className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Chỉ số mới</label>
                <input type="number" required min={0} value={form.waterNewReading} onChange={(e) => setForm({ ...form, waterNewReading: e.target.value })} className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-850">
            <h3 className="font-bold text-sm text-white uppercase tracking-wide mb-4">Phí dịch vụ (theo số người ở)</h3>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Đơn giá / người (đ) — để trống để lấy đơn giá đã cấu hình cho phòng</label>
              <input
                type="number"
                min={0}
                value={form.serviceFee}
                onChange={(e) => setForm({ ...form, serviceFee: e.target.value })}
                placeholder={roomServiceFee != null ? String(roomServiceFee) : ''}
                className="w-full sm:w-60 bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
              />
            </div>
            {form.contractId && (
              <p className="text-[10px] text-slate-500 mt-2">
                Hợp đồng này có {occupants} người ở.
                {roomServiceFee != null && (
                  <> Đơn giá của phòng: {formatPrice(roomServiceFee)}/người — nếu để trống, phí dịch vụ sẽ tự tính = {formatPrice(roomServiceFee)} × {occupants} = {formatPrice(roomServiceFee * occupants)}.</>
                )}
              </p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Hạn thanh toán *</label>
            <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full sm:w-60 bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none" />
          </div>

          <p className="text-[10px] text-slate-500">Tiền phòng (giá thuê hàng tháng theo hợp đồng) được hệ thống tự cộng vào hóa đơn, không cần nhập ở đây.</p>

          <button
            type="submit"
            disabled={saving || loadingContracts || Boolean(contractsError) || loadingHistory || Boolean(historyError) || !selectedContract}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-2xl text-sm tracking-wide transition-colors cursor-pointer"
          >
            {saving ? 'Đang tạo...' : 'Tạo hóa đơn'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InvoiceCreatePage;
