'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, Users, ClipboardList, LogOut, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalSearch } from '@/components/GlobalSearch';

interface DashboardNavProps {
  userRole: 'user' | 'admin' | 'super_admin';
  userName: string;
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
];

const ADMIN_NAV_ITEMS = [
  { label: 'Users', href: '/dashboard/admin/users', icon: Users },
  { label: 'Audit Logs', href: '/dashboard/admin/audit-logs', icon: ClipboardList },
];

export function DashboardNav({ userRole, userName }: DashboardNavProps) {
  const pathname = usePathname();
  const isSuperAdmin = userRole === 'super_admin';

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col bg-slate-950/80 border-r border-white/5 backdrop-blur-xl">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-200 tracking-tight">Business Vault</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-white/5">
        <GlobalSearch />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                active
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {isSuperAdmin && (
          <>
            <div className="pt-4 pb-1.5 px-3">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Admin</p>
            </div>
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                    active
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/20'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-900/60 flex items-center justify-center text-xs font-bold text-indigo-300">
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-300 truncate">{userName}</p>
            <p className="text-xs text-slate-600 capitalize">{userRole.replace('_', ' ')}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>
    </aside>
  );
}
