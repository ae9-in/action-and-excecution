'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, FileText, Database, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface SearchResult {
  files: Array<{ id: string; title: string; businessId: string; categoryId: number; resourceType: string }>;
  records: Array<{ id: string; businessId: string; categoryId: number; data: any }>;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ files: [], records: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults({ files: [], records: [] }); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      setResults(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const total = results.files.length + results.records.length;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-slate-500 transition-all"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search...</span>
        <kbd className="ml-2 text-xs px-1.5 py-0.5 bg-white/10 rounded font-mono">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          {loading ? <Loader2 className="w-4 h-4 text-slate-500 animate-spin shrink-0" /> : <Search className="w-4 h-4 text-slate-500 shrink-0" />}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files, records, leads..."
            className="flex-1 bg-transparent text-slate-200 text-sm placeholder-slate-600 focus:outline-none"
          />
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
          {query.length < 2 && (
            <p className="text-center text-slate-600 text-sm py-8">Type at least 2 characters to search</p>
          )}

          {query.length >= 2 && total === 0 && !loading && (
            <p className="text-center text-slate-600 text-sm py-8">No results for &ldquo;{query}&rdquo;</p>
          )}

          {results.files.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Files</p>
              {results.files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => {
                    setOpen(false);
                    // Navigate to business category — we need business slug here ideally
                    router.push(`/dashboard`);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">{file.title}</p>
                    <p className="text-xs text-slate-600">{file.resourceType.toUpperCase()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.records.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Records</p>
              {results.records.map((record) => {
                const preview = Object.values(record.data ?? {})[0];
                return (
                  <button
                    key={record.id}
                    onClick={() => { setOpen(false); router.push(`/dashboard`); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                  >
                    <Database className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate">{String(preview ?? 'Record')}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-slate-600">{total} result{total !== 1 ? 's' : ''}</p>
          <kbd className="text-xs text-slate-600 font-mono">ESC to close</kbd>
        </div>
      </div>
    </div>
  );
}
