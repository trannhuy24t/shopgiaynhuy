import { useEffect, useState } from 'react';
import { getContracts, approveContract, rejectContract, terminateContract, setContractUnitPrice } from '../../../api/contract';
import { remindUpcomingContracts } from '../../../api/notification';
import { getSystemConfigs } from '../../../api/systemConfig';
import { getApiErrorMessage } from '../../../api/client';
import { notifyTenant } from '../../../utils/notifyTenant';
import { useAuth } from '../../../context/useAuth';
import StatusBadge from '../../../components/Common/StatusBadge';
import OccupantManager from '../../../components/Common/OccupantManager';
import { statusMaps } from '../../../constants/statusLabels';
import type { ContractDto } from '../../../types/contract';
import { FileText, Info, X, BellRing, Users, AlertTriangle, Zap } from 'lucide-react';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

type ModalMode = null | { type: 'approve' | 'reject' | 'occupants' | 'setPrice'; contract: ContractDto };

const ContractManagerPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [contracts, setContracts] = useState<ContractDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [modal, setModal] = useState<ModalMode>(null);
  const [deposit, setDeposit] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [numberOfOccupants, setNumberOfOccupants] = useState('1');
  const [electricUnitPrice, setElectricUnitPrice] = useState('');
  const [waterUnitPrice, setWaterUnitPrice] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [defaultUnitPrices, setDefaultUnitPrices] = useState<{ electric: string; water: string }>({ electric: '', water: '' });
  const [setPriceElectric, setSetPriceElectric] = useState('');
  const [setPriceWater, setSetPriceWater] = useState('');
  const [activeContracts, setActiveContracts] = useState<ContractDto[]>([]);

  const [reminding, setReminding] = useState(false);
  const [remindResult, setRemindResult] = useState('');

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getContracts(filterStatus !== 'all' ? filterStatus : undefined);
      setContracts(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được danh sách hợp đồng.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  // Danh sách hợp đồng đang hiệu lực riêng, không phụ thuộc bộ lọc trạng thái ở trên — để banner
  // cảnh báo "thiếu giá điện/nước" luôn hiện đúng, kể cả khi Admin đang lọc theo trạng thái khác.
  const loadActiveContracts = () => {
    getContracts('DangHieuLuc')
      .then((res) => setActiveContracts(res.data))
      .catch(() => setActiveContracts([]));
  };

  useEffect(() => {
    loadActiveContracts();
  }, []);

  useEffect(() => {
    // Chỉ Admin gọi được GET /SystemConfig (Staff bị 403) — nếu lỗi thì bỏ qua, để Staff nhập tay.
    getSystemConfigs()
      .then((res) => {
        const map = Object.fromEntries(res.data.map((c) => [c.key, c.value]));
        setDefaultUnitPrices({
          electric: map.DefaultElectricUnitPrice ?? '',
          water: map.DefaultWaterUnitPrice ?? '',
        });
      })
      .catch(() => {});
  }, []);

  const openApproveModal = (contract: ContractDto) => {
    setModal({ type: 'approve', contract });
    setDeposit('');
    setMonthlyRent('');
    setNumberOfOccupants(String(contract.numberOfOccupants || 1));
    setElectricUnitPrice(defaultUnitPrices.electric);
    setWaterUnitPrice(defaultUnitPrices.water);
    setEndDate('');
    setModalError('');
  };

  const openRejectModal = (contract: ContractDto) => {
    setModal({ type: 'reject', contract });
    setReason('');
    setModalError('');
  };

  const openOccupantsModal = (contract: ContractDto) => {
    setModal({ type: 'occupants', contract });
  };

  const openSetPriceModal = (contract: ContractDto) => {
    setModal({ type: 'setPrice', contract });
    setSetPriceElectric(contract.electricUnitPrice > 0 ? String(contract.electricUnitPrice) : defaultUnitPrices.electric);
    setSetPriceWater(contract.waterUnitPrice > 0 ? String(contract.waterUnitPrice) : defaultUnitPrices.water);
    setModalError('');
  };

  const closeModal = () => {
    if (saving) return;
    setModal(null);
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setModalError('');

    const depositNum = Number(deposit);
    const rentNum = Number(monthlyRent);
    const occupantsNum = Number(numberOfOccupants);
    if (!deposit || !monthlyRent || depositNum < 0 || rentNum <= 0) {
      setModalError('Vui lòng điền Tiền cọc và Giá thuê hàng tháng hợp lệ.');
      return;
    }
    if (!occupantsNum || occupantsNum < 1) {
      setModalError('Số người ở phải từ 1 người trở lên.');
      return;
    }
    if (!electricUnitPrice || !waterUnitPrice) {
      setModalError('Vui lòng điền Đơn giá điện và Đơn giá nước.');
      return;
    }

    try {
      setSaving(true);
      await approveContract(modal.contract.id, {
        deposit: depositNum,
        monthlyRent: rentNum,
        numberOfOccupants: occupantsNum,
        electricUnitPrice: Number(electricUnitPrice),
        waterUnitPrice: Number(waterUnitPrice),
        endDate: endDate ? new Date(endDate).toISOString() : null,
      });
      notifyTenant(modal.contract.tenantId, {
        title: 'Hợp đồng đã được duyệt',
        content: `Hợp đồng phòng ${modal.contract.roomNumber || modal.contract.roomId} đã được duyệt. Vui lòng thanh toán tiền cọc (${formatPrice(depositNum)}) để kích hoạt hợp đồng.`,
        type: 'HopDong',
      });
      setModal(null);
      await loadContracts();
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Không thể duyệt hợp đồng này.'));
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setModalError('');

    try {
      setSaving(true);
      await rejectContract(modal.contract.id, { reason: reason || null });
      notifyTenant(modal.contract.tenantId, {
        title: 'Hợp đồng bị từ chối',
        content: `Yêu cầu thuê phòng ${modal.contract.roomNumber || modal.contract.roomId} đã bị từ chối.${reason ? ` Lý do: ${reason}` : ''}`,
        type: 'HopDong',
      });
      setModal(null);
      await loadContracts();
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Không thể từ chối hợp đồng này.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setModalError('');

    const electricNum = Number(setPriceElectric);
    const waterNum = Number(setPriceWater);
    if (!setPriceElectric || !setPriceWater || electricNum < 0 || waterNum < 0) {
      setModalError('Vui lòng điền Đơn giá điện và Đơn giá nước hợp lệ.');
      return;
    }

    try {
      setSaving(true);
      await setContractUnitPrice(modal.contract.id, { electricUnitPrice: electricNum, waterUnitPrice: waterNum });
      setModal(null);
      await loadContracts();
      loadActiveContracts();
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Không thể cập nhật đơn giá điện/nước.'));
    } finally {
      setSaving(false);
    }
  };

  const handleTerminate = async (contract: ContractDto) => {
    const confirmed = window.confirm(`Kết thúc hợp đồng phòng ${contract.roomNumber || contract.roomId}? Hành động này không thể hoàn tác.`);
    if (!confirmed) return;

    try {
      await terminateContract(contract.id);
      notifyTenant(contract.tenantId, {
        title: 'Hợp đồng đã kết thúc',
        content: `Hợp đồng phòng ${contract.roomNumber || contract.roomId} đã được kết thúc.`,
        type: 'HopDong',
      });
      await loadContracts();
      loadActiveContracts();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể kết thúc hợp đồng này.'));
    }
  };

  const missingPriceContracts = activeContracts.filter((c) => c.electricUnitPrice <= 0 || c.waterUnitPrice <= 0);

  const handleRemindUpcoming = async () => {
    setReminding(true);
    setRemindResult('');
    try {
      const res = await remindUpcomingContracts(7);
      setRemindResult(res.data.message);
    } catch (err) {
      setRemindResult(getApiErrorMessage(err, 'Không thể gửi nhắc hợp đồng sắp hết hạn.'));
    } finally {
      setReminding(false);
    }
  };

  return (
    <div className="max-w-7xl space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-900">
        <div>
          <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
            Vòng đời thuê phòng
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Quản lý hợp đồng</h1>
        </div>
        <button
          onClick={handleRemindUpcoming}
          disabled={reminding}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-50 text-slate-300 hover:text-white font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          title="Nhắc hợp đồng đang hiệu lực sắp hết hạn trong 7 ngày tới"
        >
          <BellRing size={14} /> {reminding ? 'Đang gửi...' : 'Nhắc hợp đồng sắp hết hạn'}
        </button>
      </div>

      {remindResult && (
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold p-4 rounded-xl">
          {remindResult}
        </div>
      )}

      {isAdmin && (
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold p-4 rounded-xl flex items-start gap-2">
          <Info size={16} className="shrink-0 mt-0.5" />
          Khi duyệt hợp đồng ("Chờ duyệt" → "Chờ cọc"), hệ thống tự tạo hóa đơn tiền cọc — không cần tạo hóa đơn tay.
        </div>
      )}

      {isAdmin && missingPriceContracts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold p-4 rounded-xl">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>
              Có {missingPriceContracts.length} hợp đồng đang hiệu lực chưa chốt đơn giá điện/nước (duyệt trước khi có tính năng này) — sẽ bị chặn khi tạo hóa đơn hàng tháng.
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingPriceContracts.map((c) => (
              <button
                key={c.id}
                onClick={() => openSetPriceModal(c)}
                className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer"
              >
                <Zap size={11} /> Gán giá — Phòng {c.roomNumber || c.roomId} ({c.tenantName || `Khách #${c.tenantId}`})
              </button>
            ))}
          </div>
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
        {Object.entries(statusMaps.contract).map(([value, meta]) => (
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

      {!loading && !error && contracts.length === 0 && (
        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
          <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-lg">Không có hợp đồng nào khớp với bộ lọc.</p>
        </div>
      )}

      {!loading && !error && contracts.length > 0 && (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider bg-slate-950/20">
                  <th className="p-5">Khách thuê</th>
                  <th className="p-5">Phòng</th>
                  <th className="p-5">Thời hạn</th>
                  <th className="p-5">Cọc</th>
                  <th className="p-5">Giá/tháng</th>
                  <th className="p-5">Số người</th>
                  <th className="p-5">Điện / Nước</th>
                  <th className="p-5">Trạng thái</th>
                  <th className="p-5 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50">
                {contracts.map((c) => (
                  <tr key={c.id} className="text-slate-300 hover:bg-slate-950/10 transition-colors">
                    <td className="p-5 font-bold text-white">{c.tenantName || `#${c.tenantId}`}</td>
                    <td className="p-5 font-semibold text-slate-400">{c.roomNumber || `#${c.roomId}`}</td>
                    <td className="p-5 font-medium text-slate-500">{formatDate(c.startDate)} — {formatDate(c.endDate)}</td>
                    <td className="p-5 font-medium text-slate-400">{c.deposit > 0 ? formatPrice(c.deposit) : '—'}</td>
                    <td className="p-5 font-extrabold text-orange-500">{c.monthlyRent > 0 ? formatPrice(c.monthlyRent) : '—'}</td>
                    <td className="p-5 font-medium text-slate-400">{c.numberOfOccupants || 1}</td>
                    <td className="p-5 font-medium text-slate-500 text-[10px]">
                      {c.electricUnitPrice > 0 || c.waterUnitPrice > 0
                        ? `${formatPrice(c.electricUnitPrice)}/kWh · ${formatPrice(c.waterUnitPrice)}/m³`
                        : '—'}
                    </td>
                    <td className="p-5"><StatusBadge entity="contract" value={c.status} /></td>
                    <td className="p-5 text-center">
                      <div className="flex justify-center gap-2 flex-wrap">
                        {isAdmin && c.status === 'ChoDuyet' && (
                          <>
                            <button
                              onClick={() => openApproveModal(c)}
                              className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => openRejectModal(c)}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        {c.status === 'DangHieuLuc' && (
                          <>
                            {isAdmin && (c.electricUnitPrice <= 0 || c.waterUnitPrice <= 0) && (
                              <button
                                onClick={() => openSetPriceModal(c)}
                                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Zap size={11} /> Gán giá
                              </button>
                            )}
                            <button
                              onClick={() => openOccupantsModal(c)}
                              className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Users size={11} /> Người ở
                            </button>
                            <button
                              onClick={() => handleTerminate(c)}
                              className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                            >
                              Kết thúc
                            </button>
                          </>
                        )}
                        {!(isAdmin && c.status === 'ChoDuyet') && c.status !== 'DangHieuLuc' && (
                          <span className="text-slate-600 text-[10px]">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DUYỆT */}
      {modal?.type === 'approve' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-scale-up">
            <button onClick={closeModal} className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl text-white uppercase tracking-wide mb-2">Duyệt hợp đồng</h3>
            <p className="text-xs text-slate-500 mb-6">Phòng {modal.contract.roomNumber || modal.contract.roomId} — {modal.contract.tenantName || `Khách #${modal.contract.tenantId}`}</p>

            {modalError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-4">
                {modalError}
              </div>
            )}

            <form onSubmit={handleApprove} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Tiền cọc (VNĐ) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Giá thuê / tháng (VNĐ) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Số người ở *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={numberOfOccupants}
                  onChange={(e) => setNumberOfOccupants(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1.5">Khách đăng ký {modal.contract.numberOfOccupants || 1} người — điều chỉnh nếu cần trước khi duyệt.</p>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Đơn giá điện (đ/kWh) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={electricUnitPrice}
                    onChange={(e) => setElectricUnitPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Đơn giá nước (đ/m³) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={waterUnitPrice}
                    onChange={(e) => setWaterUnitPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 -mt-3">Đơn giá điện/nước chốt vào hợp đồng — hóa đơn hàng tháng mặc định dùng đúng giá này, tính theo chỉ số dùng thực tế.</p>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Ngày kết thúc (tùy chọn, để trống nếu giữ nguyên đăng ký)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wide transition-colors cursor-pointer"
              >
                {saving ? 'Đang xử lý...' : 'Xác nhận duyệt hợp đồng'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TỪ CHỐI */}
      {modal?.type === 'reject' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-scale-up">
            <button onClick={closeModal} className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl text-white uppercase tracking-wide mb-2">Từ chối hợp đồng</h3>
            <p className="text-xs text-slate-500 mb-6">Phòng {modal.contract.roomNumber || modal.contract.roomId} — {modal.contract.tenantName || `Khách #${modal.contract.tenantId}`}</p>

            {modalError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-4">
                {modalError}
              </div>
            )}

            <form onSubmit={handleReject} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Lý do (tùy chọn)</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Lý do từ chối..."
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wide transition-colors cursor-pointer"
              >
                {saving ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NGƯỜI Ở CÙNG */}
      {modal?.type === 'occupants' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <button onClick={closeModal} className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl text-white uppercase tracking-wide mb-2">Người ở cùng</h3>
            <p className="text-xs text-slate-500 mb-6">
              Hợp đồng #{modal.contract.id} — Phòng {modal.contract.roomNumber || modal.contract.roomId} — {modal.contract.tenantName || `Khách #${modal.contract.tenantId}`}
            </p>
            <OccupantManager
              contractId={modal.contract.id}
              numberOfOccupants={modal.contract.numberOfOccupants || 1}
              contractStatus={modal.contract.status}
            />
          </div>
        </div>
      )}

      {/* MODAL GÁN GIÁ ĐIỆN/NƯỚC */}
      {modal?.type === 'setPrice' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-scale-up">
            <button onClick={closeModal} className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl text-white uppercase tracking-wide mb-2">Gán đơn giá điện/nước</h3>
            <p className="text-xs text-slate-500 mb-6">
              Hợp đồng #{modal.contract.id} — Phòng {modal.contract.roomNumber || modal.contract.roomId} — {modal.contract.tenantName || `Khách #${modal.contract.tenantId}`}
            </p>

            {modalError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-4">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSetPrice} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Đơn giá điện (đ/kWh) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={setPriceElectric}
                    onChange={(e) => setSetPriceElectric(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Đơn giá nước (đ/m³) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={setPriceWater}
                    onChange={(e) => setSetPriceWater(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                Khách thuê sẽ nhận được thông báo về đơn giá mới ngay khi lưu. Áp dụng cho các hóa đơn tạo từ giờ trở đi.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wide transition-colors cursor-pointer"
              >
                {saving ? 'Đang lưu...' : 'Lưu đơn giá'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractManagerPage;
