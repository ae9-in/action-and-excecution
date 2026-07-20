import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/DashboardNav';

export const metadata: Metadata = {
  title: 'Dashboard — Business Vault',
  description: 'Manage your business operations from one place',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = session.user as any;

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <DashboardNav userRole={user.role} userName={user.name ?? user.email} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
