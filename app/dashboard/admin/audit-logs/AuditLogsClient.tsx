'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-500/20 text-green-300 border-green-500/30',
  edit: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  delete: 'bg-red-500/20 text-red-300 border-red-500/30',
  archive: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  role_change: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  beforeState: any;
  afterState: any;
  ipAddress: string | null;
  createdAt: string;
  actorEmail: string | null;
  actorName: string | null;
}

export default function AuditLogsClient({ page: initialPage }: { page: number }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/audit-logs?page=${page}`)
      .then((r) => r.json())
      .then((data) => { setLogs(data); setLoading(false); });
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-5 h-5 text-indigo-400" />
        <h1 className="text-xl font-bold text-slate-100">Audit Logs</h1>
        <span className="text-xs px-2.5 py-0.5 bg-purple-900/40 border border-purple-700/30 text-purple-400 rounded-full">Super Admin Only</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              >
                <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', ACTION_COLORS[log.action] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30')}>
                  {log.action}
                </span>
                <span className="text-sm text-slate-300 font-medium">{log.entityType}</span>
                <span className="text-xs text-slate-600 font-mono truncate max-w-[180px]">{log.entityId}</span>
                <div className="ml-auto text-right shrink-0">
                  <p className="text-xs text-slate-400">{log.actorName ?? log.actorEmail ?? 'Unknown'}</p>
                  <p className="text-xs text-slate-600">{formatDate(log.createdAt)}</p>
                </div>
              </button>

              {expanded === log.id && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Before</p>
                    <pre className="text-xs text-slate-400 bg-slate-950/50 rounded-lg p-3 overflow-auto max-h-40">
                      {JSON.stringify(log.beforeState, null, 2) ?? 'null'}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">After</p>
                    <pre className="text-xs text-slate-400 bg-slate-950/50 rounded-lg p-3 overflow-auto max-h-40">
                      {JSON.stringify(log.afterState, null, 2) ?? 'null'}
                    </pre>
                  </div>
                  {log.ipAddress && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-600">IP: <span className="font-mono text-slate-500">{log.ipAddress}</span></p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-12 text-slate-500">No audit entries yet</div>
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm text-slate-400 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <span className="text-sm text-slate-600">Page {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={logs.length < 50}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm text-slate-400 transition-all"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
