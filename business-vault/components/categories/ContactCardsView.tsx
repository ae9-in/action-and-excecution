'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, Phone, Mail, Building2 } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';

interface SpocContact {
  id: string;
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  businessUnit?: string | null;
}

interface ContactCardsViewProps {
  businessId: string;
  userRole: 'user' | 'admin' | 'super_admin';
}

const AVATAR_COLORS = [
  'from-indigo-600 to-indigo-800',
  'from-violet-600 to-violet-800',
  'from-blue-600 to-blue-800',
  'from-teal-600 to-teal-800',
  'from-amber-600 to-amber-800',
  'from-rose-600 to-rose-800',
];

export function ContactCardsView({ businessId, userRole }: ContactCardsViewProps) {
  const [contacts, setContacts] = useState<SpocContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState<SpocContact | null>(null);
  const [form, setForm] = useState({ name: '', role: '', phone: '', email: '', businessUnit: '' });
  const canAdmin = userRole === 'admin' || userRole === 'super_admin';

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/spoc/${businessId}`);
      setContacts(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContacts(); }, [businessId]);

  const handleSave = async () => {
    if (editContact) {
      await fetch(`/api/spoc/${businessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editContact.id, ...form }),
      });
    } else {
      await fetch(`/api/spoc/${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false);
    setEditContact(null);
    setForm({ name: '', role: '', phone: '', email: '', businessUnit: '' });
    await fetchContacts();
  };

  const handleEdit = (c: SpocContact) => {
    setForm({ name: c.name, role: c.role ?? '', phone: c.phone ?? '', email: c.email ?? '', businessUnit: c.businessUnit ?? '' });
    setEditContact(c);
    setShowForm(true);
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('Remove this contact?')) return;
    await fetch(`/api/spoc/${businessId}?contactId=${contactId}`, { method: 'DELETE' });
    await fetchContacts();
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6">
      {canAdmin && (
        <div className="flex justify-end">
          <button onClick={() => { setEditContact(null); setForm({ name: '', role: '', phone: '', email: '', businessUnit: '' }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">{editContact ? 'Edit Contact' : 'Add Contact'}</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Full Name', type: 'text', required: true },
              { key: 'role', label: 'Role / Title', type: 'text' },
              { key: 'phone', label: 'Phone', type: 'tel' },
              { key: 'email', label: 'Email', type: 'email' },
              { key: 'businessUnit', label: 'Business Unit', type: 'text' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs text-slate-400 mb-1.5">{f.label}{f.required && <span className="text-red-400 ml-1">*</span>}</label>
                <input
                  type={f.type}
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">Save</button>
            <button onClick={() => { setShowForm(false); setEditContact(null); }} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm transition-all">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {contacts.map((contact, i) => {
          const gradient = AVATAR_COLORS[i % AVATAR_COLORS.length];
          return (
            <div key={contact.id} className="group relative bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 hover:bg-white/8 transition-all duration-200">
              {/* Admin controls */}
              {canAdmin && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(contact)} className="p-1.5 bg-white/10 hover:bg-indigo-600/40 rounded-lg transition-colors"><Pencil className="w-3 h-3 text-slate-400" /></button>
                  <button onClick={() => handleDelete(contact.id)} className="p-1.5 bg-white/10 hover:bg-red-600/40 rounded-lg transition-colors"><Trash2 className="w-3 h-3 text-slate-400" /></button>
                </div>
              )}

              {/* Avatar */}
              <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg mb-4', gradient)}>
                {getInitials(contact.name)}
              </div>

              <h4 className="text-sm font-semibold text-slate-200 mb-0.5">{contact.name}</h4>
              {contact.role && <p className="text-xs text-indigo-400 font-medium mb-3">{contact.role}</p>}

              <div className="space-y-2">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    {contact.phone}
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300 transition-colors truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    {contact.email}
                  </a>
                )}
                {contact.businessUnit && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Building2 className="w-3.5 h-3.5 text-slate-600" />
                    {contact.businessUnit}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {contacts.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No contacts yet</p>
        </div>
      )}
    </div>
  );
}
