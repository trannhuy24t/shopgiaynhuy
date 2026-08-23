import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInvoices } from '../../../api/invoice';
import { confirmPayment } from '../../../api/payment';
import { remindOverdue, remindUpcomingInvoices } from '../../../api/notification';
import { getApiErrorMessage } from '../../../api/client';
import { notifyTenantByContract } from '../../../utils/notifyTenant';
import StatusBadge from '../../../components/Common/StatusBadge';
import { statusMaps } from '../../../constants/statusLabels';
import type { InvoiceDto } from '../../../types/invoice';
import type { PaymentMethod } from '../../../types/payment';
import { Plus, Receipt, BellRing, X } from 'lucide-react';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

const InvoiceManagerPage = () => {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [confirmTarget, setConfirmTarget] = useState<InvoiceDto | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('TienMat');
  const [amount, setAmount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const [reminding, setReminding] = useState(false);
  const [remindResult, setRemindResult] = useState('');
  const [remindingUpcoming, setRemindingUpcoming] = useState(false);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getInvoices({ status: filterStatus !== 'all' ? filterStatus : undefined });
      setInvoices(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được danh sách hóa đơn.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const openConfirmModal = (invoice: InvoiceDto) => {
    setConfirmTarget(invoice);
    setMethod('TienMat');
    setAmount(String(invoice.totalAmount));
    setTransactionRef('');
    setModalError('');
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmTarget) return;
    setModalError('');

    const amountNum = Number(amount);
    if (!amount || amountNum <= 0) {
      setModalError('Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    try {
      setSaving(true);
      await confirmPayment({
        invoiceId: confirmTarget.id,
        amount: amountNum,
        method,
        transactionRef: transactionRef || null,
      });
      notifyTenantByContract(confirmTarget.contractId, {
        title: 'Đã xác nhận thanh toán',
        content: `Hóa đơn kỳ ${confirmTarget.month}/${confirmTarget.year} (${formatPrice(confirmTarget.totalAmount)}) đã được xác nhận thanh toán.`,
        type: 'ThongBaoChung',
      });
      setConfirmTarget(null);
      await loadInvoices();
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Không thể xác nhận thanh toán.'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemindOverdue = async () => {
    setReminding(true);
    setRemindResult('');
    try {
      const res = await remindOverdue();
      setRemindResult(res.data.message);
    } catch (err) {
      setRemindResult(getApiErrorMessage(err, 'Không thể gửi nhắc nợ.'));
    } finally {
      setReminding(false);
    }
  };

  const handleRemindUpcoming = async () => {
    setRemindingUpcoming(true);
    setRemindResult('');
    try {
      const res = await remindUpcomingInvoices(3);
      setRemindResult(res.data.message);
    } catch (err) {
      setRemindResult(getApiErrorMessage(err, 'Không thể gửi nhắc hóa đơn sắp đến hạn.'));
    } finally {
      setRemindingUpcoming(false);
    }
  };

  return (
    <div className="max-w-7xl space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-900">
        <div>
          <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
            Thu chi hàng tháng
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Quản lý hóa đơn</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRemindOverdue}
            disabled={reminding}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-50 text-slate-300 hover:text-white font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <BellRing size={14} /> {reminding ? 'Đang gửi...' : 'Nhắc nợ quá hạn'}
          </button>
          <button
            onClick={handleRemindUpcoming}
            disabled={remindingUpcoming}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-50 text-slate-300 hover:text-white font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Nhắc hóa đơn chưa thanh toán sắp tới hạn trong 3 ngày tới"
          >
            <BellRing size={14} /> {remindingUpcoming ? 'Đang gửi...' : 'Nhắc hóa đơn sắp đến hạn'}
          </button>
          <Link
            to="/admin/invoices/tao-moi"
            className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold px-5 py-3 rounded-2xl flex items-center gap-1.5 transition-all shadow-lg shadow-orange-500/10 cursor-pointer"
          >
            <Plus size={16} /> Tạo hóa đơn mới
          </Link>
        </div>
      </div>

      {remindResult && (
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold p-4 rounded-xl">
          {remindResult}
        </div>
      )}

      {/* Bộ lọc trạng thái */}
      <div className="flex flex-wrap gap-2 bg-slate-900/40 p-4 rounded-2xl border border-slate-850">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filterStatus === 'all' ? 'bg-orange-500 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Tất cả
        </button>
        {Object.entries(statusMaps.invoiceStatus).map(([value, meta]) => (
          <button
            key={value}
            onClick={() => setFilterStatus(value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === value ? 'bg-orange-500 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {meta.label}
          </button>
        ))}
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

      {!loading && !error && invoices.length === 0 && (
        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
          <Receipt className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-lg">Không có hóa đơn nào khớp với bộ lọc.</p>
        </div>
      )}

      {!loading && !error && invoices.length > 0 && (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider bg-slate-950/20">
                  <th className="p-5">Phòng</th>
                  <th className="p-5">Khách thuê</th>
                  <th className="p-5">Kỳ</th>
                  <th className="p-5">Loại</th>
                  <th className="p-5">Chỉ số điện / nước</th>
                  <th className="p-5">Tổng tiền</th>
                  <th className="p-5">Hạn TT</th>
                  <th className="p-5">Trạng thái</th>
                  <th className="p-5 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="text-slate-300 hover:bg-slate-950/10 transition-colors">
                    <td className="p-5 font-bold text-white">{inv.roomNumber || '—'}</td>
                    <td className="p-5 font-semibold text-slate-400">{inv.tenantName || '—'}</td>
                    <td className="p-5 font-medium text-slate-500">{inv.month}/{inv.year}</td>
                    <td className="p-5"><StatusBadge entity="invoiceType" value={inv.type} /></td>
                    <td className="p-5 font-medium text-slate-500 text-[10px]">
                      {inv.type === 'HangThang' ? (
                        <>
                          {inv.electricNewReading > 0 || inv.electricOldReading > 0 ? `Đ: ${inv.electricOldReading}→${inv.electricNewReading} (${inv.electricUsage}kWh)` : 'Đ: —'}
                          <br />
                          {inv.waterNewReading > 0 || inv.waterOldReading > 0 ? `N: ${inv.waterOldReading}→${inv.waterNewReading} (${inv.waterUsage}m³)` : 'N: —'}
                        </>
                      ) : '—'}
                    </td>
                    <td className="p-5 font-extrabold text-orange-500">{formatPrice(inv.totalAmount)}</td>
                    <td className="p-5 font-medium text-slate-500">{formatDate(inv.dueDate)}</td>
                    <td className="p-5"><StatusBadge entity="invoiceStatus" value={inv.status} /></td>
                    <td className="p-5 text-center">
                      {(inv.status === 'ChuaThanhToan' || inv.status === 'QuaHan') ? (
                        <button
                          onClick={() => openConfirmModal(inv)}
                          className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                        >
                          Xác nhận thanh toán
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal xác nhận thanh toán */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setConfirmTarget(null)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-scale-up">
            <button onClick={() => setConfirmTarget(null)} className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl text-white uppercase tracking-wide mb-2">Xác nhận thanh toán</h3>
            <p className="text-xs text-slate-500 mb-6">
              Phòng {confirmTarget.roomNumber} — Kỳ {confirmTarget.month}/{confirmTarget.year}
            </p>

            {modalError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-4">
                {modalError}
              </div>
            )}

            <form onSubmit={handleConfirmPayment} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Phương thức *</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-3 py-3 text-sm text-white outline-none cursor-pointer"
                >
                  {Object.entries(statusMaps.paymentMethod).map(([value, meta]) => (
                    <option key={value} value={value}>{meta.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Số tiền (VNĐ) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Mã giao dịch (tùy chọn)</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="Mã tham chiếu chuyển khoản/QR..."
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wide transition-colors cursor-pointer"
              >
                {saving ? 'Đang xử lý...' : 'Xác nhận đã nhận thanh toán'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagerPage;
