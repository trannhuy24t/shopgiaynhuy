import { useCallback, useEffect, useState } from 'react';
import { getContracts, approveContract, rejectContract, terminateContract, setContractUnitPrice, extendContract } from '../../../api/contract';
import { getRoom } from '../../../api/room';
import { remindUpcomingContracts } from '../../../api/notification';
import { getSystemConfigs } from '../../../api/systemConfig';
import { getApiErrorMessage } from '../../../api/client';
import { notifyTenant } from '../../../utils/notifyTenant';
import { useAuth } from '../../../context/useAuth';
import StatusBadge from '../../../components/Common/StatusBadge';
import OccupantManager from '../../../components/Common/OccupantManager';
import RentalContractWordModal from '../../../components/Contract/RentalContractWordModal';
import TablePagination from '../../../components/Common/TablePagination';
import { statusMaps } from '../../../constants/statusLabels';
import type { ContractDto } from '../../../types/contract';
import {
  FileText,
  Info,
  X,
  BellRing,
  Users,
  AlertTriangle,
  Zap,
  ShieldCheck,
  MoreVertical,
  CheckCircle2,
  XCircle,
  CalendarPlus,
  PowerOff,
  Search,
} from 'lucide-react';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

type ModalMode = null | { type: 'approve' | 'reject' | 'occupants' | 'setPrice' | 'extend'; contract: ContractDto };

const ContractManagerPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [contracts, setContracts] = useState<ContractDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewingContract, setViewingContract] = useState<ContractDto | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.action-menu-container')) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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
  const [activeContractsError, setActiveContractsError] = useState('');
  const [activeContractsLoading, setActiveContractsLoading] = useState(false);

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
  const loadActiveContracts = useCallback(async () => {
    setActiveContractsLoading(true);
    setActiveContractsError('');
    try {
      const res = await getContracts('DangHieuLuc');
      setActiveContracts(res.data);
    } catch (err) {
      setActiveContracts([]);
      setActiveContractsError(getApiErrorMessage(err, 'Không thể kiểm tra đơn giá các hợp đồng đang hiệu lực.'));
    } finally {
      setActiveContractsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActiveContracts();
  }, [loadActiveContracts]);

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

    // Tiền phòng và tiền cọc tự động điền, tiền cọc bằng với tiền phòng
    const rentAmount = contract.monthlyRent > 0 ? contract.monthlyRent : ((contract as any).roomPrice > 0 ? (contract as any).roomPrice : 0);
    const depositAmount = contract.deposit > 0 ? contract.deposit : rentAmount;

    setMonthlyRent(rentAmount > 0 ? String(rentAmount) : '');
    setDeposit(depositAmount > 0 ? String(depositAmount) : '');

    // Nếu hợp đồng chưa có giá phòng, gọi API getRoom để tự động lấy giá phòng điền vào
    if (rentAmount <= 0 && contract.roomId) {
      getRoom(contract.roomId)
        .then((res) => {
          if (res.data?.price) {
            const priceStr = String(res.data.price);
            setMonthlyRent((prev) => prev || priceStr);
            setDeposit((prev) => prev || priceStr);
          }
        })
        .catch(() => {});
    }

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

  const openExtendModal = (contract: ContractDto) => {
    setModal({ type: 'extend', contract });
    const date = new Date(contract.endDate);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    setEndDate(date.toISOString().slice(0, 10));
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
      const serviceFeePerPerson = modal.contract.roomServiceFee || 0;
      const totalServiceFee = serviceFeePerPerson * occupantsNum;
      const totalFirstPayment = depositNum + rentNum + totalServiceFee;

      const tenantName = modal.contract.tenantName || 'Quý khách';
      const roomNumber = modal.contract.roomNumber || modal.contract.roomId;

      notifyTenant(modal.contract.tenantId, {
        title: 'Hợp đồng đã được duyệt',
        content: `Kính gửi khách thuê ${tenantName}, hợp đồng thuê phòng ${roomNumber} đã được Ban Quản Lý phê duyệt. Vui lòng thanh toán hóa đơn nhận phòng (${formatPrice(totalFirstPayment)} gồm cọc, tiền phòng tháng đầu & phí dịch vụ) để kích hoạt hợp đồng.`,
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
      const tenantName = modal.contract.tenantName || 'Quý khách';
      const roomNumber = modal.contract.roomNumber || modal.contract.roomId;
      notifyTenant(modal.contract.tenantId, {
        title: 'Hợp đồng bị từ chối',
        content: `Kính gửi khách thuê ${tenantName}, yêu cầu thuê phòng ${roomNumber} đã bị từ chối.${reason ? ` Lý do: ${reason}` : ''}`,
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

  const handleExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modal?.type !== 'extend') return;
    setModalError('');
    const newEndDate = new Date(`${endDate}T00:00:00`);
    const currentEndDate = new Date(modal.contract.endDate);
    currentEndDate.setHours(0, 0, 0, 0);
    if (!endDate || newEndDate.getTime() <= currentEndDate.getTime()) {
      setModalError('Ngày gia hạn phải sau ngày kết thúc hiện tại.');
      return;
    }
    try {
      setSaving(true);
      await extendContract(modal.contract.id, { endDate: newEndDate.toISOString() });
      setModal(null);
      await loadContracts();
      loadActiveContracts();
    } catch (err) {
      setModalError(getApiErrorMessage(err, 'Không thể gia hạn hợp đồng.'));
    } finally {
      setSaving(false);
    }
  };

  const handleTerminate = async (contract: ContractDto) => {
    const confirmed = window.confirm(`Kết thúc hợp đồng phòng ${contract.roomNumber || contract.roomId}? Hành động này không thể hoàn tác.`);
    if (!confirmed) return;

    try {
      await terminateContract(contract.id);
      const tenantName = contract.tenantName || 'Quý khách';
      const roomNumber = contract.roomNumber || contract.roomId;
      notifyTenant(contract.tenantId, {
        title: 'Hợp đồng đã kết thúc',
        content: `Kính gửi khách thuê ${tenantName}, hợp đồng thuê phòng ${roomNumber} đã được kết thúc hoàn tất.`,
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

  const filteredContracts = contracts.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const roomStr = String(c.roomNumber || c.roomId || '').toLowerCase();
    const tenantName = (c.tenantName || '').toLowerCase();
    const tenantPhone = (c.tenantPhone || '').toLowerCase();
    const buildingName = (c.buildingName || '').toLowerCase();
    const idStr = `#${c.id}`.toLowerCase();
    return (
      roomStr.includes(term) ||
      tenantName.includes(term) ||
      tenantPhone.includes(term) ||
      buildingName.includes(term) ||
      idStr.includes(term)
    );
  });

  const totalItems = filteredContracts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalItems > 0 ? (safeCurrentPage - 1) * pageSize : 0;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedContracts = filteredContracts.slice(startIndex, endIndex);

  return (
    <div className="w-full space-y-6">
      {/* Thanh công cụ: Ô tìm kiếm + Select trạng thái bên trái & Nút nhắc nhở hợp đồng bên phải cùng hàng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-850">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[280px] max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm theo tên khách, SĐT, số phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none hover:border-slate-700 focus:border-orange-500 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Ô Select trạng thái */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl px-3.5 py-2.5 outline-none cursor-pointer hover:border-slate-700 transition-colors"
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(statusMaps.contract).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>

        {/* Nút nhắc nhở hợp đồng nằm cùng hàng bên phải */}
        <button
          onClick={handleRemindUpcoming}
          disabled={reminding}
          className="bg-slate-950 border border-slate-800 hover:border-slate-700 active:scale-95 disabled:opacity-50 text-slate-300 hover:text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ml-auto sm:ml-0 shadow-sm"
          title="Nhắc hợp đồng đang hiệu lực sắp hết hạn trong 7 ngày tới"
        >
          <BellRing size={14} className="text-orange-400" />
          <span>{reminding ? 'Đang gửi...' : 'Nhắc hợp đồng sắp hết hạn'}</span>
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

      {activeContractsError && (
        <div role="alert" className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <span>{activeContractsError} Cảnh báo đơn giá có thể chưa đầy đủ.</span>
          <button type="button" onClick={() => void loadActiveContracts()} disabled={activeContractsLoading} className="font-bold text-orange-300 hover:text-orange-200 disabled:opacity-50">
            {activeContractsLoading ? 'Đang tải...' : 'Tải lại'}
          </button>
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

      {!loading && !error && filteredContracts.length === 0 && (
        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-850 rounded-3xl">
          <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-lg">
            {searchTerm ? `Không tìm thấy hợp đồng nào khớp với "${searchTerm}".` : 'Không có hợp đồng nào khớp với bộ lọc.'}
          </p>
        </div>
      )}

      {!loading && !error && filteredContracts.length > 0 && (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          <div className="overflow-x-auto overflow-y-auto max-h-[560px] table-scroll-container">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 shadow-md">
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-900/95 backdrop-blur-md">
                  <th className="p-5">Khách thuê</th>
                  <th className="p-5">Phòng</th>
                  <th className="p-5">Thời hạn</th>
                  <th className="p-5">Cọc</th>
                  <th className="p-5">Giá/tháng</th>
                  <th className="p-5">Số người</th>
                  <th className="p-5">Điện / Nước</th>
                  <th className="p-5">Trạng thái</th>
                  <th className="p-5 text-center w-24">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50">
                {paginatedContracts.map((c, index) => (
                  <tr key={c.id} className="text-slate-300 hover:bg-slate-950/10 transition-colors">
                    <td className="p-5 font-bold text-white">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{c.tenantName || `#${c.tenantId}`}</span>
                        {c.tenantSignatureUrl && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" title="Khách thuê đã ký số điện tử">
                            <ShieldCheck size={10} /> Đã ký số
                          </span>
                        )}
                      </div>
                    </td>
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
                      <div className="relative inline-block text-left action-menu-container">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionMenuId((prev) => (prev === c.id ? null : c.id));
                          }}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            openActionMenuId === c.id
                              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 scale-105'
                              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
                          }`}
                          title="Tùy chọn hành động"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openActionMenuId === c.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute right-0 w-48 bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl py-1.5 z-50 divide-y divide-slate-850 backdrop-blur-md animate-scale-up ${
                              index >= paginatedContracts.length - 2 && paginatedContracts.length >= 3
                                ? 'bottom-full mb-2 origin-bottom-right'
                                : 'top-full mt-2 origin-top-right'
                            }`}
                          >
                            <div className="p-1 space-y-0.5">
                              {/* Xem HĐ Word */}
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingContract(c);
                                  setOpenActionMenuId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer text-left"
                              >
                                <FileText size={14} className="shrink-0 text-blue-400" />
                                <span>Xem hợp đồng (Word)</span>
                              </button>
                            </div>

                            {/* Các thao tác khi Chờ duyệt */}
                            {isAdmin && c.status === 'ChoDuyet' && (
                              <div className="p-1 space-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    openApproveModal(c);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer text-left"
                                >
                                  <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                                  <span>Duyệt hợp đồng</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    openRejectModal(c);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer text-left"
                                >
                                  <XCircle size={14} className="shrink-0 text-rose-400" />
                                  <span>Từ chối hợp đồng</span>
                                </button>
                              </div>
                            )}

                            {/* Các thao tác khi Đang hiệu lực */}
                            {c.status === 'DangHieuLuc' && (
                              <div className="p-1 space-y-0.5">
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      openExtendModal(c);
                                      setOpenActionMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer text-left"
                                  >
                                    <CalendarPlus size={14} className="shrink-0 text-blue-400" />
                                    <span>Gia hạn hợp đồng</span>
                                  </button>
                                )}

                                {isAdmin && (c.electricUnitPrice <= 0 || c.waterUnitPrice <= 0) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      openSetPriceModal(c);
                                      setOpenActionMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer text-left"
                                  >
                                    <Zap size={14} className="shrink-0 text-amber-400" />
                                    <span>Gán giá điện / nước</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    openOccupantsModal(c);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/10 rounded-xl transition-colors cursor-pointer text-left"
                                >
                                  <Users size={14} className="shrink-0 text-purple-400" />
                                  <span>Danh sách người ở</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleTerminate(c);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer text-left"
                                >
                                  <PowerOff size={14} className="shrink-0 text-rose-400" />
                                  <span>Kết thúc hợp đồng</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={safeCurrentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="hợp đồng"
          />
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
            <p className="text-xs text-slate-500 mb-4">Phòng {modal.contract.roomNumber || modal.contract.roomId} — {modal.contract.tenantName || `Khách #${modal.contract.tenantId}`}</p>

            {modal.contract.tenantSignatureUrl ? (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300 font-semibold">Khách thuê đã ký số điện tử</span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingContract(modal.contract)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 underline font-semibold cursor-pointer"
                >
                  Xem hợp đồng & chữ ký
                </button>
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-2 text-xs text-slate-400">
                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Hợp đồng chưa có chữ ký số điện tử của khách thuê.</span>
              </div>
            )}

            {modalError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-4">
                {modalError}
              </div>
            )}

            <form onSubmit={handleApprove} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Tiền cọc (VNĐ) *
                  </label>
                  {monthlyRent && (
                    <button
                      type="button"
                      onClick={() => setDeposit(monthlyRent)}
                      className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold cursor-pointer underline"
                      title="Đặt lại tiền cọc bằng đúng tiền phòng"
                    >
                      Bằng tiền phòng
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  required
                  min={0}
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Tự động điền bằng tiền phòng ({monthlyRent ? formatPrice(Number(monthlyRent) || 0) : '0 ₫'}).
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Giá thuê / tháng (VNĐ) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={monthlyRent}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMonthlyRent(val);
                    setDeposit(val);
                  }}
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

              {/* Box tổng hợp chi phí nhận phòng đợt đầu */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                  Dự kiến hóa đơn nhận phòng (đợt đầu)
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>• Tiền đặt cọc:</span>
                  <span className="font-semibold text-white">{formatPrice(Number(deposit) || 0)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>• Tiền phòng (tháng đầu):</span>
                  <span className="font-semibold text-white">{formatPrice(Number(monthlyRent) || 0)}</span>
                </div>
                {(modal.contract.roomServiceFee || 0) > 0 && (
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>• Phí dịch vụ ({formatPrice(modal.contract.roomServiceFee || 0)} × {Number(numberOfOccupants) || 1} người):</span>
                    <span className="font-semibold text-white">
                      {formatPrice((modal.contract.roomServiceFee || 0) * (Number(numberOfOccupants) || 1))}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-800 pt-2 mt-2 flex justify-between items-center text-sm font-bold">
                  <span className="text-orange-400">TỔNG HÓA ĐƠN NHẬN PHÒNG:</span>
                  <span className="text-orange-400 text-base">
                    {formatPrice(
                      (Number(deposit) || 0) +
                      (Number(monthlyRent) || 0) +
                      ((modal.contract.roomServiceFee || 0) * (Number(numberOfOccupants) || 1))
                    )}
                  </span>
                </div>
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
      {modal?.type === 'extend' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl">
            <button onClick={closeModal} className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            <h3 className="font-bold text-xl text-white uppercase tracking-wide mb-2">Gia hạn hợp đồng</h3>
            <p className="text-xs text-slate-400 mb-5">Phòng {modal.contract.roomNumber || modal.contract.roomId} — hiện kết thúc {formatDate(modal.contract.endDate)}</p>
            {modalError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">{modalError}</p>}
            <form onSubmit={handleExtend} className="space-y-5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày kết thúc mới<input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none" /></label>
              <button type="submit" disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl">{saving ? 'Đang lưu...' : 'Xác nhận gia hạn'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal xem hợp đồng dạng bản Word thực sự */}
      {viewingContract && (
        <RentalContractWordModal
          contract={viewingContract}
          isAdminOrStaff={true}
          onClose={() => setViewingContract(null)}
        />
      )}
    </div>
  );
};

export default ContractManagerPage;
