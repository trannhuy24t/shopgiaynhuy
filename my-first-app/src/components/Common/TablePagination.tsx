import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 20, 25, 50],
  itemLabel = 'mục',
}) => {
  const effectiveOptions = React.useMemo(() => {
    if (pageSizeOptions.includes(pageSize)) {
      return pageSizeOptions;
    }
    return [...pageSizeOptions, pageSize].sort((a, b) => a - b);
  }, [pageSizeOptions, pageSize]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalItems > 0 ? (safeCurrentPage - 1) * pageSize : 0;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="p-3.5 bg-slate-950/80 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 px-6">
      <div className="flex items-center gap-3 flex-wrap">
        <span>
          <strong className="text-white">{startIndex + 1}</strong> - <strong className="text-white">{endIndex}</strong> / Tổng <strong className="text-white">{totalItems}</strong> {itemLabel}
        </span>

        <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
          <span className="text-[11px] text-slate-500">Mỗi trang:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white outline-none cursor-pointer hover:border-slate-700 transition-colors"
          >
            {effectiveOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / trang
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage <= 1}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:hover:border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed"
          title="Về trang đầu"
        >
          <ChevronsLeft size={15} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage <= 1}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:hover:border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed"
          title="Trang trước"
        >
          <ChevronLeft size={15} />
        </button>

        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev && p - prev > 1;
              return (
                <span key={p} className="flex items-center gap-1">
                  {showEllipsis && <span className="text-slate-600 px-0.5">...</span>}
                  <button
                    type="button"
                    onClick={() => onPageChange(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                      p === safeCurrentPage
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              );
            })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage >= totalPages}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:hover:border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed"
          title="Trang sau"
        >
          <ChevronRight size={15} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage >= totalPages}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:hover:border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed"
          title="Tới trang cuối"
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;

