import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getMyInvoices } from '../../api/invoice';
import { getPaymentQr } from '../../api/payment';
import { getApiErrorMessage } from '../../api/client';
import StatusBadge from '../../components/Common/StatusBadge';
import type { InvoiceDto } from '../../types/invoice';
import { Receipt, QrCode, X, Clock, AlertTriangle } from 'lucide-react';

const DUE_SOON_DAYS = 3;

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

// Số ngày còn lại tới hạn thanh toán, tính theo ngày (không theo giờ) — âm nghĩa là đã quá hạn.
const getDaysUntilDue = (dueDateIso: string) => {
  const due = new Date(dueDateIso);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const MyInvoicesPage = () => {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [qrInvoice, setQrInvoice] = useState<InvoiceDto | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getMyInvoices();
        setInvoices(res.data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Không tải được danh sách hóa đơn.'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleShowQr = async (invoice: InvoiceDto) => {
    setQrInvoice(invoice);
    setQrDataUrl('');
    setQrError('');
    setQrLoading(true);
    try {
      const res = await getPaymentQr(invoice.id);
      const dataUrl = await QRCode.toDataURL(res.data.payload, { width: 280, margin: 1 });
      setQrDataUrl(dataUrl);
    } catch (err) {
      setQrError(getApiErrorMessage(err, 'Không tạo được mã QR thanh toán.'));
    } finally {
      setQrLoading(false);
    }
  };

  const closeQrModal = () => {
    setQrInvoice(null);
    setQrDataUrl('');
    setQrError('');
  };

  const dueSoonCount = invoices.filter(
    (inv) => inv.status === 'ChuaThanhToan' && getDaysUntilDue(inv.dueDate) >= 0 && getDaysUntilDue(inv.dueDate) <= DUE_SOON_DAYS
  ).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
          Tài khoản của tôi
        </span>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Hóa đơn của tôi</h1>
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

      {!loading && !error && dueSoonCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold p-4 rounded-xl mb-6 flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          Bạn có {dueSoonCount} hóa đơn sắp đến hạn thanh toán trong {DUE_SOON_DAYS} ngày tới.
        </div>
      )}

      {!loading && !error && invoices.length === 0 && (
        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
          <Receipt className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-lg">Bạn chưa có hóa đơn nào.</p>
        </div>
      )}

      {!loading && !error && invoices.length > 0 && (
        <div className="space-y-4">
          {invoices.map((inv) => {
            const daysUntilDue = getDaysUntilDue(inv.dueDate);
            const isDueSoon = inv.status === 'ChuaThanhToan' && daysUntilDue >= 0 && daysUntilDue <= DUE_SOON_DAYS;
            // Hóa đơn cũ (tạo trước khi lưu chỉ số) không có dữ liệu này — chỉ hiện khi có thật,
            // tránh hiện nhầm "0 → 0" cho hóa đơn đã tạo từ trước.
            const hasElectricReadings = inv.electricNewReading > 0 || inv.electricOldReading > 0;
            const hasWaterReadings = inv.waterNewReading > 0 || inv.waterOldReading > 0;
            const otherItems = inv.items.filter((item) => {
              if (item.itemName === 'Tiền điện' && hasElectricReadings) return false;
              if (item.itemName === 'Tiền nước' && hasWaterReadings) return false;
              return true;
            });

            return (
            <div
              key={inv.id}
              className={`bg-slate-900 p-5 sm:p-6 rounded-2xl border ${
                isDueSoon ? 'border-amber-500/40 ring-1 ring-amber-500/10' : 'border-slate-850'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h4 className="font-bold text-white text-sm sm:text-base">
                      Phòng {inv.roomNumber} — Kỳ {inv.month}/{inv.year}
                    </h4>
                    <StatusBadge entity="invoiceType" value={inv.type} />
                    <StatusBadge entity="invoiceStatus" value={inv.status} />
                    {isDueSoon && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/20">
                        <Clock size={10} /> {daysUntilDue === 0 ? 'Đến hạn hôm nay' : `Sắp đến hạn — còn ${daysUntilDue} ngày`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Hạn thanh toán: {formatDate(inv.dueDate)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block font-semibold">Tổng tiền</span>
                    <span className="text-lg font-extrabold text-orange-500">{formatPrice(inv.totalAmount)}</span>
                  </div>
                  {(inv.status === 'ChuaThanhToan' || inv.status === 'QuaHan') && (
                    <button
                      onClick={() => handleShowQr(inv)}
                      className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <QrCode size={14} /> Thanh toán QR
                    </button>
                  )}
                </div>
              </div>

              {(hasElectricReadings || hasWaterReadings) && (
                <div className="mt-4 pt-4 border-t border-slate-850 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hasElectricReadings && (
                    <div className="text-xs bg-slate-950/50 rounded-xl p-3 border border-slate-850">
                      <span className="text-slate-500 block mb-1">Tiền điện</span>
                      <span className="text-slate-400">
                        Chỉ số {inv.electricOldReading} → {inv.electricNewReading} ({inv.electricUsage} kWh) × {formatPrice(inv.electricUnitPrice)}
                      </span>
                      <div className="text-slate-200 font-bold mt-1">{formatPrice(inv.electricUsage * inv.electricUnitPrice)}</div>
                    </div>
                  )}
                  {hasWaterReadings && (
                    <div className="text-xs bg-slate-950/50 rounded-xl p-3 border border-slate-850">
                      <span className="text-slate-500 block mb-1">Tiền nước</span>
                      <span className="text-slate-400">
                        Chỉ số {inv.waterOldReading} → {inv.waterNewReading} ({inv.waterUsage} m³) × {formatPrice(inv.waterUnitPrice)}
                      </span>
                      <div className="text-slate-200 font-bold mt-1">{formatPrice(inv.waterUsage * inv.waterUnitPrice)}</div>
                    </div>
                  )}
                </div>
              )}

              {otherItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-850 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {otherItems.map((item, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="text-slate-500 block">{item.itemName}</span>
                      <span className="text-slate-300 font-semibold">{formatPrice(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Modal QR */}
      {qrInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeQrModal} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 sm:p-8 shadow-2xl animate-scale-up text-center">
            <button onClick={closeQrModal} className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>

            <h3 className="font-bold text-lg text-white uppercase tracking-wide mb-1">Quét mã để thanh toán</h3>
            <p className="text-xs text-slate-500 mb-6">
              Hóa đơn kỳ {qrInvoice.month}/{qrInvoice.year} — {formatPrice(qrInvoice.totalAmount)}
            </p>

            {qrLoading && (
              <div className="py-10 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {qrError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl">
                {qrError}
              </div>
            )}

            {qrDataUrl && !qrLoading && (
              <>
                <div className="bg-white p-4 rounded-2xl inline-block mb-4">
                  <img src={qrDataUrl} alt="Mã QR thanh toán" className="w-full max-w-[240px]" />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Mở app ngân hàng, quét mã VietQR ở trên. Sau khi chuyển khoản, nhân viên sẽ xác nhận thanh toán trong hệ thống — trạng thái hóa đơn sẽ tự cập nhật.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInvoicesPage;
