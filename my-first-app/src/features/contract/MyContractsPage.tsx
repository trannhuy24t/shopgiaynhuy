import { useEffect, useState } from 'react';
import { getMyContracts, getContract } from '../../api/contract';
import { getRoom } from '../../api/room';
import { getApiErrorMessage } from '../../api/client';
import StatusBadge from '../../components/Common/StatusBadge';
import OccupantManager from '../../components/Common/OccupantManager';
import type { ContractDto } from '../../types/contract';
import type { RoomDto } from '../../types/room';
import { FileText, X } from 'lucide-react';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('vi-VN');
};

const MyContractsPage = () => {
  const [contracts, setContracts] = useState<ContractDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detail, setDetail] = useState<ContractDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailRoom, setDetailRoom] = useState<RoomDto | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getMyContracts();
        setContracts(res.data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Không tải được danh sách hợp đồng.'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleViewDetail = async (id: number) => {
    setDetail(null);
    setDetailRoom(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const res = await getContract(id);
      setDetail(res.data);
      getRoom(res.data.roomId)
        .then((roomRes) => setDetailRoom(roomRes.data))
        .catch(() => setDetailRoom(null));
    } catch (err) {
      setDetailError(getApiErrorMessage(err, 'Không tải được chi tiết hợp đồng.'));
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
          Tài khoản của tôi
        </span>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Hợp đồng của tôi</h1>
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

      {!loading && !error && contracts.length === 0 && (
        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
          <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-lg">Bạn chưa có hợp đồng nào.</p>
        </div>
      )}

      {!loading && !error && contracts.length > 0 && (
        <div className="space-y-4">
          {contracts.map((c) => (
            <div key={c.id} className="bg-slate-900 border border-slate-850 p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="font-bold text-white text-sm sm:text-base">Phòng {c.roomNumber || `#${c.roomId}`}</h4>
                  <StatusBadge entity="contract" value={c.status} />
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {formatDate(c.startDate)} — {formatDate(c.endDate)}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block font-semibold">Giá thuê / tháng</span>
                  <span className="text-base font-extrabold text-orange-500">{formatPrice(c.monthlyRent)}</span>
                </div>
                <button
                  onClick={() => handleViewDetail(c.id)}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal chi tiết */}
      {(detailLoading || detail || detailError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setDetail(null); setDetailRoom(null); setDetailError(''); }} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setDetail(null); setDetailRoom(null); setDetailError(''); }}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {detailLoading && (
              <div className="py-10 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {detailError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl">
                {detailError}
              </div>
            )}

            {detail && !detailLoading && (
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-white">Hợp đồng #{detail.id}</h3>
                  <StatusBadge entity="contract" value={detail.status} />
                </div>
                <div className="bg-slate-950 p-4 rounded-xl space-y-2 border border-slate-850 text-slate-300">
                  <p><span className="text-slate-500 font-bold uppercase block text-[10px] tracking-wider mb-0.5">Phòng</span> {detail.roomNumber || `#${detail.roomId}`}</p>
                  <p><span className="text-slate-500 font-bold uppercase block text-[10px] tracking-wider mb-0.5">Thời hạn</span> {formatDate(detail.startDate)} — {formatDate(detail.endDate)}</p>
                  <p><span className="text-slate-500 font-bold uppercase block text-[10px] tracking-wider mb-0.5">Số người ở</span> {detail.numberOfOccupants || 1} người</p>
                  <p><span className="text-slate-500 font-bold uppercase block text-[10px] tracking-wider mb-0.5">Ngày tạo</span> {formatDate(detail.createdAt)}</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <span className="text-slate-500 font-bold uppercase block text-[10px] tracking-wider mb-2.5">Các khoản tiền</span>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Tiền cọc</span>
                      <span className="font-bold text-white">{formatPrice(detail.deposit)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Giá thuê / tháng</span>
                      <span className="font-bold text-white">{formatPrice(detail.monthlyRent)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Đơn giá dịch vụ</span>
                      <span className="font-bold text-white">
                        {detailRoom ? `${formatPrice(detailRoom.serviceFee)} / người` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Đơn giá điện</span>
                      <span className="font-bold text-white">
                        {detail.electricUnitPrice > 0 ? `${formatPrice(detail.electricUnitPrice)} / kWh` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Đơn giá nước</span>
                      <span className="font-bold text-white">
                        {detail.waterUnitPrice > 0 ? `${formatPrice(detail.waterUnitPrice)} / m³` : '—'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3 pt-3 border-t border-slate-850">
                    Đây là đơn giá chốt trong hợp đồng. Tiền điện/nước hàng tháng = số dùng thực tế × đơn giá; phí dịch vụ hàng tháng = đơn giá × số người ở tại thời điểm lập hóa đơn ({detail.numberOfOccupants || 1} người hiện tại) — xem số tiền chính xác ở từng hóa đơn.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <OccupantManager
                    contractId={detail.id}
                    numberOfOccupants={detail.numberOfOccupants || 1}
                    contractStatus={detail.status}
                  />
                  {detail.status !== 'DangHieuLuc' && (
                    <p className="text-[10px] text-slate-600 mt-2">Chỉ quản lý được người ở cùng khi hợp đồng đang hiệu lực.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyContractsPage;
