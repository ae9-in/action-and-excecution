'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Loader2, UserCheck, UserX, Shield } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  user: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  admin: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  super_admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', password: '', role: 'user' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ email: '', fullName: '', password: '', role: 'user' });
    await fetchUsers();
    setSaving(false);
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isActive: !isActive }),
    });
    await fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold text-slate-100">User Management</h1>
          <span className="text-xs px-2.5 py-0.5 bg-purple-900/40 border border-purple-700/30 text-purple-400 rounded-full">Super Admin Only</span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          id="create-user-btn"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" /> Create Account
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Create New Account</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'fullName', label: 'Full Name', type: 'text', required: true },
              { key: 'email', label: 'Email', type: 'email', required: true },
              { key: 'password', label: 'Password', type: 'password', required: true },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs text-slate-400 mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  required={f.required}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
              >
                <option value="user" className="bg-slate-900 text-slate-200">User</option>
                <option value="admin" className="bg-slate-900 text-slate-200">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Account
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm transition-all">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/3">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{u.fullName}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded border font-medium capitalize', ROLE_COLORS[u.role] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30')}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded border', u.isActive ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30')}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u.role !== 'super_admin' && (
                      <button
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        className={cn('flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all', u.isActive ? 'bg-red-900/20 border-red-500/20 text-red-400 hover:bg-red-900/40' : 'bg-green-900/20 border-green-500/20 text-green-400 hover:bg-green-900/40')}
                      >
                        {u.isActive ? <><UserX className="w-3 h-3" /> Deactivate</> : <><UserCheck className="w-3 h-3" /> Activate</>}
                      </button>
                    )}
                    {u.role === 'super_admin' && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Shield className="w-3 h-3" /> Protected
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
