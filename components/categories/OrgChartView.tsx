'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, ChevronDown, User } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';

interface HierarchyNode {
  id: string;
  name: string;
  title?: string | null;
  photoUrl?: string | null;
  parentId?: string | null;
  sortOrder: number;
}

interface OrgChartViewProps {
  businessId: string;
  userRole: 'user' | 'admin' | 'super_admin';
}

function buildTree(nodes: HierarchyNode[]): (HierarchyNode & { children: HierarchyNode[] })[] {
  const map = new Map<string, HierarchyNode & { children: any[] }>();
  nodes.forEach((n) => map.set(n.id, { ...n, children: [] }));
  const roots: any[] = [];
  nodes.forEach((n) => {
    if (n.parentId && map.has(n.parentId)) {
      map.get(n.parentId)!.children.push(map.get(n.id));
    } else {
      roots.push(map.get(n.id));
    }
  });
  return roots;
}

function NodeCard({
  node,
  canAdmin,
  onEdit,
  onDelete,
  depth = 0,
}: {
  node: any;
  canAdmin: boolean;
  onEdit: (n: HierarchyNode) => void;
  onDelete: (id: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children?.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <div className="relative group flex flex-col items-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center w-40 hover:border-indigo-500/40 transition-all duration-200">
          {/* Avatar */}
          <div className="w-12 h-12 mx-auto mb-2 rounded-full overflow-hidden bg-indigo-900/60 flex items-center justify-center text-indigo-300 font-bold text-sm">
            {node.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={node.photoUrl} alt={node.name} className="w-full h-full object-cover" />
            ) : (
              getInitials(node.name)
            )}
          </div>
          <p className="text-sm font-semibold text-slate-200 truncate">{node.name}</p>
          {node.title && <p className="text-xs text-slate-500 truncate">{node.title}</p>}

          {/* Admin controls */}
          {canAdmin && (
            <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(node)} className="p-1 bg-slate-800 border border-white/10 rounded-lg hover:bg-indigo-900/50 transition-colors">
                <Pencil className="w-3 h-3 text-slate-400" />
              </button>
              <button onClick={() => onDelete(node.id)} className="p-1 bg-slate-800 border border-white/10 rounded-lg hover:bg-red-900/50 transition-colors">
                <Trash2 className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          )}
        </div>

        {/* Expand toggle */}
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronDown className={cn('w-3.5 h-3.5 text-slate-500 transition-transform', expanded && 'rotate-180')} />
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="relative mt-2">
          {/* Vertical line */}
          <div className="absolute top-0 left-1/2 w-px h-4 bg-white/10" />
          <div className="pt-4 flex gap-8 items-start">
            {node.children.map((child: any, i: number) => (
              <div key={child.id} className="relative flex flex-col items-center">
                {/* Horizontal connector */}
                <div className="absolute -top-4 left-1/2 w-px h-4 bg-white/10" />
                {/* Horizontal line spanning siblings */}
                {node.children.length > 1 && (
                  <div
                    className="absolute -top-4 bg-white/10"
                    style={{
                      top: '-1rem',
                      left: i === 0 ? '50%' : '-4rem',
                      right: i === node.children.length - 1 ? '50%' : '-4rem',
                      height: '1px',
                    }}
                  />
                )}
                <NodeCard node={child} canAdmin={canAdmin} onEdit={onEdit} onDelete={onDelete} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrgChartView({ businessId, userRole }: OrgChartViewProps) {
  const [nodes, setNodes] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editNode, setEditNode] = useState<HierarchyNode | null>(null);
  const [form, setForm] = useState({ name: '', title: '', parentId: '', photoUrl: '' });
  const canAdmin = userRole === 'admin' || userRole === 'super_admin';

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hierarchy/${businessId}`);
      setNodes(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNodes(); }, [businessId]);

  const handleSave = async () => {
    if (editNode) {
      await fetch(`/api/hierarchy/${businessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editNode.id, ...form }),
      });
    } else {
      await fetch(`/api/hierarchy/${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, parentId: form.parentId || null }),
      });
    }
    setShowForm(false);
    setEditNode(null);
    setForm({ name: '', title: '', parentId: '', photoUrl: '' });
    await fetchNodes();
  };

  const handleEdit = (node: HierarchyNode) => {
    setForm({ name: node.name, title: node.title ?? '', parentId: node.parentId ?? '', photoUrl: node.photoUrl ?? '' });
    setEditNode(node);
    setShowForm(true);
  };

  const handleDelete = async (nodeId: string) => {
    if (!confirm('Delete this node and all its children?')) return;
    await fetch(`/api/hierarchy/${businessId}?nodeId=${nodeId}`, { method: 'DELETE' });
    await fetchNodes();
  };

  const tree = buildTree(nodes);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {canAdmin && (
        <div className="flex justify-end">
          <button onClick={() => { setEditNode(null); setForm({ name: '', title: '', parentId: '', photoUrl: '' }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">{editNode ? 'Edit Member' : 'Add Member'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Name *</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Title / Role</label>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Reports to</label>
              <select value={form.parentId} onChange={(e) => setForm((p) => ({ ...p, parentId: e.target.value }))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors">
                <option value="" className="bg-slate-900 text-slate-200">— Top level —</option>
                {nodes.filter((n) => n.id !== editNode?.id).map((n) => (
                  <option key={n.id} value={n.id} className="bg-slate-900 text-slate-200">{n.name} {n.title ? `(${n.title})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Photo URL (optional)</label>
              <input value={form.photoUrl} onChange={(e) => setForm((p) => ({ ...p, photoUrl: e.target.value }))} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors" placeholder="https://..." />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">Save</button>
            <button onClick={() => { setShowForm(false); setEditNode(null); }} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm transition-all">Cancel</button>
          </div>
        </div>
      )}

      {/* Org chart */}
      <div className="overflow-x-auto pb-6">
        {tree.length === 0 ? (
          <div className="text-center py-16">
            <User className="w-12 h-12 mx-auto mb-3 text-slate-700" />
            <p className="text-slate-500 text-sm">No hierarchy defined yet</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 min-w-max mx-auto pt-4">
            {tree.map((root) => (
              <NodeCard key={root.id} node={root} canAdmin={canAdmin} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
