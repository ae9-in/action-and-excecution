export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { businesses, businessMembers } from '@/drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { BusinessCard } from '@/components/BusinessCard';
import { NewBusinessButton } from '@/components/NewBusinessButton';
import { Plus } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = session.user as any;

  let allBusinesses: typeof import('@/drizzle/schema').businesses.$inferSelect[] = [];
  if (user.role === 'super_admin') {
    allBusinesses = await db.select().from(businesses).where(eq(businesses.status, 'active'));
  } else {
    const memberships = await db
      .select({ businessId: businessMembers.businessId })
      .from(businessMembers)
      .where(eq(businessMembers.userId, user.id));

    const ids = memberships.map((m) => m.businessId);
    if (ids.length === 0) {
      allBusinesses = [];
    } else {
      allBusinesses = await db
        .select()
        .from(businesses)
        .where(and(inArray(businesses.id, ids), eq(businesses.status, 'active')));
    }
  }

  const canCreate = user.role === 'admin' || user.role === 'super_admin';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Businesses</h1>
          <p className="text-sm text-slate-500 mt-1">
            {allBusinesses.length} business{allBusinesses.length !== 1 ? 'es' : ''} accessible
          </p>
        </div>
        {canCreate && <NewBusinessButton />}
      </div>

      {/* Grid */}
      {allBusinesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-slate-700" />
          </div>
          <h2 className="text-lg font-semibold text-slate-400 mb-2">No businesses yet</h2>
          <p className="text-sm text-slate-600 max-w-sm">
            {canCreate
              ? 'Create your first business to get started.'
              : 'You haven\'t been assigned to any business yet. Ask your admin.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {allBusinesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      )}
    </div>
  );
}
