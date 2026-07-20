'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, CheckCircle, Clock, AlertCircle, XCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import type { CategorySchema, FieldConfig } from '@/lib/category-schemas/types';

interface StructuredCategoryViewProps {
  businessId: string;
  categoryKey: string;
  schema: CategorySchema;
  userRole: 'user' | 'admin' | 'super_admin';
}

const STATUS_STYLES: Record<string, string> = {
  // Lead stages
  new: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  contacted: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  qualified: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  won: 'bg-green-500/20 text-green-300 border-green-500/30',
  lost: 'bg-red-500/20 text-red-300 border-red-500/30',
  // Feature status
  planned: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  live: 'bg-green-500/20 text-green-300 border-green-500/30',
  deprecated: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  // Task status
  pending: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  completed: 'bg-green-500/20 text-green-300 border-green-500/30',
  blocked: 'bg-red-500/20 text-red-300 border-red-500/30',
  // Update types
  announcement: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  milestone: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  issue: 'bg-red-500/20 text-red-300 border-red-500/30',
  release: 'bg-green-500/20 text-green-300 border-green-500/30',
  other: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  high: 'bg-red-500/20 text-red-300 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  low: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

function StatusBadge({ value }: { value: string }) {
  const style = STATUS_STYLES[value] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium capitalize', style)}>
      {value.replace(/_/g, ' ')}
    </span>
  );
}

function RecordForm({
  schema,
  initial,
  onSave,
  onCancel,
}: {
  schema: CategorySchema;
  initial?: Record<string, any>;
  onSave: (data: Record<string, any>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Record<string, any>>(initial ?? {});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const widthClass = (width?: string) => {
    if (width === 'half') return 'col-span-6';
    if (width === 'third') return 'col-span-4';
    return 'col-span-12';
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
      <div className="grid grid-cols-12 gap-4">
        {schema.fields.map((field) => (
          <div key={field.key} className={widthClass(field.width)}>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {field.type === 'select' ? (
              <select
                value={form[field.key] ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                required={field.required}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
              >
                <option value="" className="bg-slate-900 text-slate-200">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt} className="bg-slate-900 text-slate-200">{opt.replace(/_/g, ' ')}</option>
                ))}
              </select>
            ) : field.type === 'textarea' || field.type === 'richtext' ? (
              <textarea
                value={form[field.key] ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                required={field.required}
                placeholder={field.placeholder}
                rows={4}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
              />
            ) : (
              <input
                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                value={form[field.key] ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                required={field.required}
                placeholder={field.placeholder}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {initial ? 'Save Changes' : 'Add Record'}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-400 transition-all"
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export function StructuredCategoryView({ businessId, categoryKey, schema, userRole }: StructuredCategoryViewProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const canAdmin = userRole === 'admin' || userRole === 'super_admin';

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/structured/${categoryKey}?businessId=${businessId}`);
      const data = await res.json();
      // For generic structured_records, extract .data; for specialized tables, use directly
      setRecords(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [businessId, categoryKey]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const getFieldValue = (record: any, field: FieldConfig) => {
    // For structured_records, data is nested inside .data
    const src = record.data ?? record;
    return src[field.key];
  };

  const handleSave = async (data: Record<string, any>) => {
    if (editRecord) {
      const recordId = editRecord.id;
      await fetch(`/api/structured/${categoryKey}?recordId=${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
    } else {
      await fetch(`/api/structured/${categoryKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, data }),
      });
    }
    setShowForm(false);
    setEditRecord(null);
    await fetchRecords();
  };

  const handleDelete = async (record: any) => {
    if (!confirm('Delete this record? This action cannot be undone.')) return;
    await fetch(`/api/structured/${categoryKey}?recordId=${record.id}`, { method: 'DELETE' });
    await fetchRecords();
  };

  const primaryField = schema.primaryField;
  const statusField = schema.statusField;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // ─── ACCORDION (FAQ) ────────────────────────────────────────────────────────
  if (schema.displayMode === 'accordion') {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        </div>
        {showForm && <RecordForm schema={schema} onSave={handleSave} onCancel={() => setShowForm(false)} />}
        {editRecord && <RecordForm schema={schema} initial={editRecord.data ?? editRecord} onSave={handleSave} onCancel={() => setEditRecord(null)} />}
        <div className="space-y-2">
          {records.map((r) => {
            const src = r.data ?? r;
            const isOpen = expandedId === r.id;
            return (
              <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedId(isOpen ? null : r.id)}
                >
                  <span className="text-sm font-medium text-slate-200">{src.question}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 border-t border-white/5">
                    <p className="text-sm text-slate-400 mt-3 leading-relaxed whitespace-pre-wrap">{src.answer}</p>
                    {canAdmin && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setEditRecord(r)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                        <button onClick={() => handleDelete(r)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {records.length === 0 && <p className="text-center text-slate-500 py-12">No FAQs yet</p>}
      </div>
    );
  }

  // ─── FEED (Updates / changelog) ─────────────────────────────────────────────
  if (schema.displayMode === 'feed') {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
            <Plus className="w-4 h-4" /> Post Update
          </button>
        </div>
        {showForm && <RecordForm schema={schema} onSave={handleSave} onCancel={() => setShowForm(false)} />}
        <div className="relative pl-6">
          <div className="absolute left-2 top-0 bottom-0 w-px bg-white/10" />
          <div className="space-y-4">
            {records.map((r) => {
              const src = r.data ?? r;
              return (
                <div key={r.id} className="relative">
                  <div className="absolute -left-4 top-4 w-2 h-2 rounded-full bg-indigo-500" />
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {src.type && <StatusBadge value={src.type} />}
                          <span className="text-xs text-slate-500">{formatDate(r.createdAt)}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-200 mb-1">{src.title}</h4>
                        <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{src.body}</p>
                      </div>
                      {canAdmin && (
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => setEditRecord(r)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                          <button onClick={() => handleDelete(r)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-slate-500" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {records.length === 0 && <p className="text-center text-slate-500 py-12">No updates yet</p>}
      </div>
    );
  }

  // ─── TIMELINE (Prices / Targets — versioned records) ─────────────────────────
  if (schema.displayMode === 'timeline') {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
            <Plus className="w-4 h-4" /> Add Record
          </button>
        </div>
        {showForm && <RecordForm schema={schema} onSave={handleSave} onCancel={() => setShowForm(false)} />}
        <div className="space-y-3">
          {records.map((r) => {
            const src = r.data ?? r;
            const primaryVal = src[primaryField ?? ''] ?? 'Record';
            const pct = src.targetValue ? Math.min(100, Math.round((parseFloat(src.achievedValue ?? 0) / parseFloat(src.targetValue)) * 100)) : null;
            return (
              <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-sm font-semibold text-slate-200">{primaryVal}</h4>
                      {src.effectiveFrom && <span className="text-xs text-slate-500">from {formatDate(src.effectiveFrom)}</span>}
                      {src.periodStart && <span className="text-xs text-slate-500">{formatDate(src.periodStart)} – {formatDate(src.periodEnd)}</span>}
                    </div>
                    {src.value && (
                      <p className="text-2xl font-bold text-indigo-400">
                        {formatCurrency(parseFloat(src.value), src.currency ?? 'INR')}
                      </p>
                    )}
                    {src.targetValue && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Target: {src.targetValue} · Achieved: {src.achievedValue ?? 0}</span>
                          {pct !== null && <span className={pct >= 100 ? 'text-green-400' : 'text-indigo-400'}>{pct}%</span>}
                        </div>
                        {pct !== null && (
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', pct >= 100 ? 'bg-green-500' : 'bg-indigo-500')}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {src.note && <p className="text-xs text-slate-500 mt-2">{src.note}</p>}
                  </div>
                  {canAdmin && (
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditRecord(r)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                      <button onClick={() => handleDelete(r)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-slate-500" /></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {records.length === 0 && <p className="text-center text-slate-500 py-12">No records yet</p>}
      </div>
    );
  }

  // ─── TASK LIST (Plan of Action) ───────────────────────────────────────────────
  if (schema.displayMode === 'task-list') {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
        {showForm && <RecordForm schema={schema} onSave={handleSave} onCancel={() => setShowForm(false)} />}
        {editRecord && <RecordForm schema={schema} initial={editRecord.data ?? editRecord} onSave={handleSave} onCancel={() => setEditRecord(null)} />}
        <div className="space-y-2">
          {records.map((r) => {
            const src = r.data ?? r;
            const statusIcon = src.status === 'completed' ? <CheckCircle className="w-4 h-4 text-green-400" /> : src.status === 'blocked' ? <XCircle className="w-4 h-4 text-red-400" /> : src.status === 'in_progress' ? <Clock className="w-4 h-4 text-blue-400" /> : <AlertCircle className="w-4 h-4 text-slate-500" />;
            return (
              <div key={r.id} className={cn('flex items-center gap-4 bg-white/5 border rounded-xl px-4 py-3 transition-all', src.status === 'completed' ? 'border-green-500/20 opacity-70' : 'border-white/10 hover:border-white/20')}>
                {statusIcon}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', src.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200')}>{src.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {src.owner && <span className="text-xs text-slate-500">👤 {src.owner}</span>}
                    {src.dueDate && <span className="text-xs text-slate-500">📅 {formatDate(src.dueDate)}</span>}
                  </div>
                </div>
                <StatusBadge value={src.status ?? 'pending'} />
                {canAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => setEditRecord(r)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                    <button onClick={() => handleDelete(r)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-slate-500" /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {records.length === 0 && <p className="text-center text-slate-500 py-12">No tasks yet</p>}
      </div>
    );
  }

  // ─── CARDS (Mail Draft) ───────────────────────────────────────────────────────
  if (schema.displayMode === 'cards') {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
            <Plus className="w-4 h-4" /> New Draft
          </button>
        </div>
        {showForm && <RecordForm schema={schema} onSave={handleSave} onCancel={() => setShowForm(false)} />}
        {editRecord && <RecordForm schema={schema} initial={editRecord.data ?? editRecord} onSave={handleSave} onCancel={() => setEditRecord(null)} />}
        <div className="grid gap-4 sm:grid-cols-2">
          {records.map((r) => {
            const src = r.data ?? r;
            return (
              <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 hover:border-white/20 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{src.subject}</h4>
                    {src.tone && <span className="text-xs text-slate-500">{src.tone}</span>}
                  </div>
                  <div className="flex gap-1">
                    {canAdmin && <button onClick={() => setEditRecord(r)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>}
                    {canAdmin && <button onClick={() => handleDelete(r)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-slate-500" /></button>}
                  </div>
                </div>
                <div className="bg-slate-950/50 rounded-xl p-3 relative">
                  <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                    {src.body}
                  </p>
                  <div className="absolute top-2 right-2">
                    <CopyButton text={src.body ?? ''} />
                  </div>
                </div>
                {src.body && (src.body.match(/\{\{[^}]+\}\}/g) ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(src.body.match(/\{\{[^}]+\}\}/g) ?? [])).map((v) => (
                      <span key={v as string} className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-mono">{v as string}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {records.length === 0 && <p className="text-center text-slate-500 py-12">No drafts yet</p>}
      </div>
    );
  }

  // ─── TABLE (Leads, Features — default) ────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>
      {showForm && <RecordForm schema={schema} onSave={handleSave} onCancel={() => setShowForm(false)} />}
      {editRecord && <RecordForm schema={schema} initial={editRecord.data ?? editRecord} onSave={handleSave} onCancel={() => setEditRecord(null)} />}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/3">
              {schema.fields.slice(0, 5).map((f) => (
                <th key={f.key} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {f.label}
                </th>
              ))}
              {canAdmin && <th className="px-4 py-3 w-20" />}
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const src = r.data ?? r;
              return (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  {schema.fields.slice(0, 5).map((f) => {
                    const val = src[f.key];
                    if (f.key === statusField && val) {
                      return <td key={f.key} className="px-4 py-3"><StatusBadge value={val} /></td>;
                    }
                    if (f.type === 'date') {
                      return <td key={f.key} className="px-4 py-3 text-slate-400">{formatDate(val)}</td>;
                    }
                    return (
                      <td key={f.key} className="px-4 py-3 text-slate-300 max-w-xs truncate" title={val}>
                        {val ?? '—'}
                      </td>
                    );
                  })}
                  {canAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setEditRecord(r)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                        <button onClick={() => handleDelete(r)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-slate-500" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {records.length === 0 && <p className="text-center text-slate-500 py-12">No records yet</p>}
      </div>
    </div>
  );
}
