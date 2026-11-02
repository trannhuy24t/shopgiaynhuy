import { useEffect, useState } from 'react';
import { getMyContracts, getContract, cancelContractRequest } from '../../api/contract';
import { getRoom } from '../../api/room';
import { getApiErrorMessage } from '../../api/client';
import StatusBadge from '../../components/Common/StatusBadge';
import RentalContractWordModal from '../../components/Contract/RentalContractWordModal';
import type { ContractDto } from '../../types/contract';
import type { RoomDto } from '../../types/room';
import { FileText, ShieldCheck } from 'lucide-react';

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
  const [cancelingId, setCancelingId] = useState<number | null>(null);

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

  const handleCancelRequest = async (id: number) => {
    if (!window.confirm('Hủy yêu cầu thuê phòng đang chờ duyệt?')) return;
    setCancelingId(id);
    try {
      await cancelContractRequest(id);
      const res = await getMyContracts();
      setContracts(res.data);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể hủy yêu cầu thuê phòng.'));
    } finally {
      setCancelingId(null);
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
            <div key={c.id} id={`contract-${c.id}`} className="bg-slate-900 border border-slate-850 p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h4 className="font-bold text-white text-sm sm:text-base">Phòng {c.roomNumber || `#${c.roomId}`}</h4>
                  <StatusBadge entity="contract" value={c.status} />
                  {c.tenantSignatureUrl ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <ShieldCheck size={11} /> Đã ký số
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-800/40 px-2 py-0.5 rounded-md">
                      Chưa ký số
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {formatDate(c.startDate)} — {formatDate(c.endDate)}
                </p>
              </div>
              <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
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
                {c.status === 'ChoDuyet' && <button onClick={() => handleCancelRequest(c.id)} disabled={cancelingId === c.id} className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 disabled:opacity-50 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer">{cancelingId === c.id ? 'Đang hủy...' : 'Hủy yêu cầu'}</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading Modal */}
      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error Modal */}
      {detailError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md text-center shadow-2xl">
            <p className="text-red-400 font-medium mb-4 text-sm">{detailError}</p>
            <button
              onClick={() => setDetailError('')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Modal xem hợp đồng dưới dạng bản Word thực sự */}
      {detail && (
        <RentalContractWordModal
          contract={detail}
          room={detailRoom}
          onClose={() => {
            setDetail(null);
            setDetailRoom(null);
          }}
        />
      )}
    </div>
  );
};

export default MyContractsPage;
