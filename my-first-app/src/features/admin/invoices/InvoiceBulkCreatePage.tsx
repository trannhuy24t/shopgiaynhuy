import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Square } from 'lucide-react';
import { getContracts } from '../../../api/contract';
import { createInvoice, getInvoices } from '../../../api/invoice';
import { getApiErrorMessage } from '../../../api/client';
import { notifyTenantByContract } from '../../../utils/notifyTenant';
import type { ContractDto } from '../../../types/contract';
import type { CreateInvoicePayload, InvoiceDto } from '../../../types/invoice';

interface MeterReadings {
  electricOldReading: string;
  electricNewReading: string;
  waterOldReading: string;
  waterNewReading: string;
}

interface BatchResult {
  contractId: number;
  roomNumber: string;
  tenantName: string;
  invoiceId?: number;
  error?: string;
}

const emptyReadings: MeterReadings = {
  electricOldReading: '',
  electricNewReading: '',
  waterOldReading: '',
  waterNewReading: '',
};

const localDateInputValue = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

const defaultDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 10);
  return localDateInputValue(date);
};

const periodNumber = (year: number, month: number) => year * 100 + month;

const InvoiceBulkCreatePage = () => {
  const now = new Date();
  const [contracts, setContracts] = useState<ContractDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [readings, setReadings] = useState<Record<number, MeterReadings>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [results, setResults] = useState<BatchResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');

    Promise.all([getContracts('DangHieuLuc'), getInvoices()])
      .then(([contractsResponse, invoicesResponse]) => {
        if (cancelled) return;
        setContracts(contractsResponse.data);
        setInvoices(invoicesResponse.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(err, 'Không thể tải hợp đồng hoặc lịch sử hóa đơn.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    const targetPeriod = periodNumber(Number(year), Number(month));
    const defaults: Record<number, MeterReadings> = {};

    for (const contract of contracts) {
      const previous = invoices
        .filter((invoice) =>
          invoice.contractId === contract.id &&
          invoice.type === 'HangThang' &&
          periodNumber(invoice.year, invoice.month) < targetPeriod,
        )
        .sort((a, b) => periodNumber(b.year, b.month) - periodNumber(a.year, a.month))[0];

      defaults[contract.id] = previous
        ? {
            electricOldReading: String(previous.electricNewReading),
            electricNewReading: String(previous.electricNewReading),
            waterOldReading: String(previous.waterNewReading),
            waterNewReading: String(previous.waterNewReading),
          }
        : emptyReadings;
    }

    setReadings(defaults);
    setSelectedIds([]);
    setFormError('');
  }, [contracts, invoices, month, year]);

  useEffect(() => {
    setSelectedIds([]);
    setResults([]);
    setFormError('');
  }, [month, year]);

  const targetMonth = Number(month);
  const targetYear = Number(year);

  const invoiceByContract = useMemo(() => {
    const map = new Map<number, InvoiceDto[]>();
    for (const invoice of invoices) {
      const current = map.get(invoice.contractId) ?? [];
      current.push(invoice);
      map.set(invoice.contractId, current);
    }
    return map;
  }, [invoices]);

  const getReadings = (contractId: number) => readings[contractId] ?? emptyReadings;

  const getEligibilityIssue = (contract: ContractDto): string => {
    const hasInvoice = (invoiceByContract.get(contract.id) ?? []).some(
      (invoice) => invoice.type === 'HangThang' && invoice.month === targetMonth && invoice.year === targetYear,
    );
    if (hasInvoice) return 'Đã có hóa đơn kỳ này';
    if (contract.electricUnitPrice <= 0 || contract.waterUnitPrice <= 0) return 'Chưa chốt giá điện/nước';
    return '';
  };

  const getRowIssue = (contract: ContractDto): string => {
    const eligibilityIssue = getEligibilityIssue(contract);
    if (eligibilityIssue) return eligibilityIssue;
    const row = getReadings(contract.id);
    const values = [row.electricOldReading, row.electricNewReading, row.waterOldReading, row.waterNewReading];
    if (values.some((value) => value.trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0)) {
      return 'Cần nhập đủ chỉ số';
    }
    if (Number(row.electricNewReading) < Number(row.electricOldReading)) return 'Chỉ số điện mới nhỏ hơn chỉ số cũ';
    if (Number(row.waterNewReading) < Number(row.waterOldReading)) return 'Chỉ số nước mới nhỏ hơn chỉ số cũ';
    return '';
  };

  const eligibleContracts = contracts.filter((contract) => {
    return !getEligibilityIssue(contract);
  });

  const updateReading = (contractId: number, key: keyof MeterReadings, value: string) => {
    setReadings((current) => ({
      ...current,
      [contractId]: { ...getReadings(contractId), ...current[contractId], [key]: value },
    }));
    setResults([]);
    setFormError('');
  };

  const toggleContract = (contractId: number) => {
    setSelectedIds((current) => current.includes(contractId)
      ? current.filter((id) => id !== contractId)
      : [...current, contractId]);
    setResults([]);
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setResults([]);

    if (selectedIds.length === 0) {
      setFormError('Chọn ít nhất một hợp đồng để lập hóa đơn.');
      return;
    }
    if (targetMonth < 1 || targetMonth > 12 || targetYear < 2020 || targetYear > 2100) {
      setFormError('Tháng phải từ 1 đến 12 và năm từ 2020 đến 2100.');
      return;
    }
    if (!dueDate) {
      setFormError('Chọn hạn thanh toán cho các hóa đơn.');
      return;
    }

    const selected = contracts.filter((contract) => selectedIds.includes(contract.id));
    const invalid = selected.filter((contract) => getRowIssue(contract));
    if (invalid.length > 0) {
      setFormError(`Kiểm tra lại: ${invalid.map((contract) => `phòng ${contract.roomNumber || contract.roomId}`).join(', ')}.`);
      return;
    }

    setCreating(true);
    const createdInvoices: InvoiceDto[] = [];
    const nextResults: BatchResult[] = [];
    const dueDateIso = new Date(`${dueDate}T00:00:00`).toISOString();

    for (const contract of selected) {
      const row = getReadings(contract.id);
      const payload: CreateInvoicePayload = {
        contractId: contract.id,
        month: targetMonth,
        year: targetYear,
        electricOldReading: Number(row.electricOldReading),
        electricNewReading: Number(row.electricNewReading),
        waterOldReading: Number(row.waterOldReading),
        waterNewReading: Number(row.waterNewReading),
        dueDate: dueDateIso,
      };

      try {
        const response = await createInvoice(payload);
        createdInvoices.push(response.data);
        const result: BatchResult = {
          contractId: contract.id,
          roomNumber: contract.roomNumber || String(contract.roomId),
          tenantName: contract.tenantName || `Khách #${contract.tenantId}`,
          invoiceId: response.data.id,
        };
        nextResults.push(result);
        setResults([...nextResults]);
        void notifyTenantByContract(contract.id, {
          title: 'Hóa đơn mới',
          content: `Hóa đơn kỳ ${targetMonth}/${targetYear} đã được tạo, hạn thanh toán ${new Date(dueDateIso).toLocaleDateString('vi-VN')}.`,
          type: 'ThongBaoChung',
        });
      } catch (err) {
        nextResults.push({
          contractId: contract.id,
          roomNumber: contract.roomNumber || String(contract.roomId),
          tenantName: contract.tenantName || `Khách #${contract.tenantId}`,
          error: getApiErrorMessage(err, 'Không thể tạo hóa đơn.'),
        });
        setResults([...nextResults]);
      }
    }

    if (createdInvoices.length > 0) {
      setInvoices((current) => [...current, ...createdInvoices]);
    }
    setSelectedIds([]);
    setCreating(false);
  };

  const selectedCount = selectedIds.length;
  const successCount = results.filter((result) => result.invoiceId != null).length;
  const failureCount = results.filter((result) => result.error).length;

  return (
    <div className="max-w-7xl space-y-6">
      <Link to="/admin/invoices" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Quay lại danh sách hóa đơn
      </Link>

      <div>
        <span className="text-orange-500 text-xs font-black uppercase tracking-wider">Thu chi hàng tháng</span>
        <h1 className="mt-1 text-3xl font-black text-white tracking-tight uppercase">Tạo hóa đơn hàng loạt</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Chọn kỳ, hạn thanh toán và nhập chỉ số cho từng phòng. Hợp đồng đã có hóa đơn kỳ này hoặc chưa chốt giá điện/nước sẽ bị bỏ qua.
        </p>
      </div>

      {loadError && (
        <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-3 font-bold text-orange-400 hover:text-orange-300"
          >
            Tải lại dữ liệu
          </button>
        </div>
      )}

      {formError && <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{formError}</div>}

      {results.length > 0 && (
        <section aria-live="polite" className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-bold text-white">Kết quả: {successCount} thành công · {failureCount} lỗi</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {results.map((result) => (
              <li key={result.contractId} className={result.error ? 'text-red-300' : 'text-emerald-300'}>
                Phòng {result.roomNumber} · {result.tenantName}: {result.error || `Đã tạo hóa đơn #${result.invoiceId}`}
              </li>
            ))}
          </ul>
        </section>
      )}

      <form onSubmit={handleCreateBatch} className="space-y-5 rounded-3xl border border-slate-850 bg-slate-900 p-5 sm:p-7">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Tháng</label>
            <input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(e.target.value)} disabled={creating} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-orange-500 disabled:opacity-50" />
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Năm</label>
            <input type="number" min={2020} max={2100} value={year} onChange={(e) => setYear(e.target.value)} disabled={creating} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-orange-500 disabled:opacity-50" />
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Hạn thanh toán chung</label>
            <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={creating} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-orange-500 disabled:opacity-50" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5">
          <div className="text-sm text-slate-300">
            {loading ? 'Đang tải hợp đồng và lịch sử hóa đơn...' : `${selectedCount} hợp đồng được chọn · ${eligibleContracts.length} hợp đồng có thể chọn`}
          </div>
          <button
            type="button"
            disabled={loading || creating || eligibleContracts.length === 0}
            onClick={() => setSelectedIds(eligibleContracts.map((contract) => contract.id))}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:border-orange-500 hover:text-white disabled:opacity-50"
          >
            <CheckSquare size={14} /> Chọn tất cả có thể chọn
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Đang tải dữ liệu...</div>
        ) : !loadError && contracts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 py-12 text-center text-sm text-slate-400">Chưa có hợp đồng nào đang hiệu lực.</div>
        ) : !loadError && (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="min-w-[1050px] w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-3">Chọn</th>
                  <th className="p-3">Phòng / người thuê</th>
                  <th className="p-3">Điện · cũ / mới</th>
                  <th className="p-3">Nước · cũ / mới</th>
                  <th className="p-3">Đơn giá điện / nước</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {contracts.map((contract) => {
                  const row = getReadings(contract.id);
                  const issue = getRowIssue(contract);
                  const eligibilityIssue = getEligibilityIssue(contract);
                  const canSelect = !eligibilityIssue;
                  const checked = selectedIds.includes(contract.id);
                  const inputsDisabled = creating || Boolean(eligibilityIssue);

                  return (
                    <tr key={contract.id} className={`${checked ? 'bg-orange-500/5' : ''} ${!canSelect ? 'opacity-65' : ''}`}>
                      <td className="p-3 align-top">
                        <button
                          type="button"
                          disabled={!canSelect || creating}
                          onClick={() => toggleContract(contract.id)}
                          aria-label={`${checked ? 'Bỏ chọn' : 'Chọn'} phòng ${contract.roomNumber || contract.roomId}`}
                          className="rounded p-1 text-orange-400 disabled:cursor-not-allowed disabled:text-slate-700"
                        >
                          {checked ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      </td>
                      <td className="p-3 align-top">
                        <p className="font-bold text-white">Phòng {contract.roomNumber || contract.roomId}</p>
                        <p className="mt-1 text-slate-400">{contract.tenantName || `Khách #${contract.tenantId}`}</p>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex gap-2">
                          <input aria-label={`Điện cũ phòng ${contract.roomNumber || contract.roomId}`} type="number" min={0} value={row.electricOldReading} disabled={inputsDisabled} onChange={(e) => updateReading(contract.id, 'electricOldReading', e.target.value)} placeholder="Cũ" className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-white disabled:opacity-50" />
                          <input aria-label={`Điện mới phòng ${contract.roomNumber || contract.roomId}`} type="number" min={0} value={row.electricNewReading} disabled={inputsDisabled} onChange={(e) => updateReading(contract.id, 'electricNewReading', e.target.value)} placeholder="Mới" className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-white disabled:opacity-50" />
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex gap-2">
                          <input aria-label={`Nước cũ phòng ${contract.roomNumber || contract.roomId}`} type="number" min={0} value={row.waterOldReading} disabled={inputsDisabled} onChange={(e) => updateReading(contract.id, 'waterOldReading', e.target.value)} placeholder="Cũ" className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-white disabled:opacity-50" />
                          <input aria-label={`Nước mới phòng ${contract.roomNumber || contract.roomId}`} type="number" min={0} value={row.waterNewReading} disabled={inputsDisabled} onChange={(e) => updateReading(contract.id, 'waterNewReading', e.target.value)} placeholder="Mới" className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-white disabled:opacity-50" />
                        </div>
                      </td>
                      <td className="p-3 align-top text-slate-300">
                        {contract.electricUnitPrice.toLocaleString('vi-VN')} đ/kWh<br />
                        {contract.waterUnitPrice.toLocaleString('vi-VN')} đ/m³
                      </td>
                      <td className="p-3 align-top">
                        {issue ? <span className="text-amber-300">{issue}</span> : <span className="text-emerald-400">Đủ điều kiện</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || creating || Boolean(loadError) || selectedCount === 0}
          className="w-full rounded-2xl bg-orange-500 py-3.5 text-sm font-bold tracking-wide text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? `Đang tạo ${results.length}/${selectedCount} hóa đơn...` : `Tạo ${selectedCount} hóa đơn`}
        </button>
      </form>
    </div>
  );
};

export default InvoiceBulkCreatePage;
