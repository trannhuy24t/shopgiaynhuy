import { useEffect, useState } from 'react';
import { getActivityLogs } from '../../../api/report';
import { getApiErrorMessage } from '../../../api/client';
import TablePagination from '../../../components/Common/TablePagination';
import type { ActivityLogDto } from '../../../types/report';
import { FileClock } from 'lucide-react';

const formatDateTime = (iso: string) => {
  return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
};

const ActivityLogPage = () => {
  const [logs, setLogs] = useState<ActivityLogDto[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getActivityLogs(page, pageSize);
        setLogs(res.data.items);
        setTotalItems(res.data.totalItems);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Không tải được nhật ký hoạt động.'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, pageSize]);

  return (
    <div className="w-full space-y-6">

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

      {!loading && !error && logs.length === 0 && (
        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
          <FileClock className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-lg">Chưa có hoạt động nào được ghi lại.</p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          <div className="overflow-x-auto overflow-y-auto max-h-[560px] table-scroll-container">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 shadow-md">
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-900/95 backdrop-blur-md">
                  <th className="p-5">Thời gian</th>
                  <th className="p-5">Người thực hiện</th>
                  <th className="p-5">Hành động</th>
                  <th className="p-5">Đối tượng</th>
                  <th className="p-5">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50">
                {logs.map((log) => (
                  <tr key={log.id} className="text-slate-300 hover:bg-slate-950/10 transition-colors">
                    <td className="p-5 font-medium text-slate-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td className="p-5 font-semibold text-white">{log.userName || '—'}</td>
                    <td className="p-5 font-bold text-orange-400">{log.action}</td>
                    <td className="p-5 font-medium text-slate-400">{log.entityName}{log.entityId ? ` #${log.entityId}` : ''}</td>
                    <td className="p-5 font-medium text-slate-500 max-w-[240px] truncate">{log.detail || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={page}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50, 100]}
            itemLabel="hoạt động"
          />
        </div>
      )}
    </div>
  );
};

export default ActivityLogPage;
