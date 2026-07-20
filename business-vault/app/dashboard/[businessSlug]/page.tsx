export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { businesses, businessMembers, categories, files, structuredRecords, leads, priceRecords, targetRecords, hierarchyNodes, spocContacts } from '@/drizzle/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';
import Link from 'next/link';
import { CATEGORY_META } from '@/lib/category-config';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

function CategoryIcon({ name }: { name: string }) {
  const Icon = (LucideIcons as any)[name] ?? LucideIcons.Folder;
  return <Icon className="w-6 h-6" />;
}

const CATEGORY_BG_COLORS = [
  'bg-indigo-900/30 border-indigo-700/30 text-indigo-400',
  'bg-violet-900/30 border-violet-700/30 text-violet-400',
  'bg-blue-900/30 border-blue-700/30 text-blue-400',
  'bg-rose-900/30 border-rose-700/30 text-rose-400',
  'bg-amber-900/30 border-amber-700/30 text-amber-400',
  'bg-emerald-900/30 border-emerald-700/30 text-emerald-400',
];

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');
  const user = session.user as any;

  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.slug, businessSlug))
    .limit(1);

  if (!business) notFound();

  if (user.role !== 'super_admin') {
    const [membership] = await db
      .select()
      .from(businessMembers)
      .where(and(eq(businessMembers.userId, user.id), eq(businessMembers.businessId, business.id)))
      .limit(1);
    if (!membership) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <LucideIcons.ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-slate-200">Access Denied</h1>
          <p className="text-slate-400 mt-2 max-w-md">
            You do not have permission to access the workspace for <strong>{business.name}</strong>.
            Please contact your system administrator to request access.
          </p>
          <Link href="/dashboard" className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
            Back to Dashboard
          </Link>
        </div>
      );
    }
  }

  const allCategories = await db.select().from(categories).orderBy(categories.sortOrder);

  // Optimized grouped database queries to minimize network roundtrips
  const [
    filesCountGroup,
    structuredCountGroup,
    [hierarchyRes],
    [spocRes],
    [leadsRes],
    [pricesRes],
    [targetsRes]
  ] = await Promise.all([
    db
      .select({ categoryId: files.categoryId, val: sql<number>`count(*)` })
      .from(files)
      .where(and(eq(files.businessId, business.id), isNull(files.deletedAt)))
      .groupBy(files.categoryId),
    db
      .select({ categoryId: structuredRecords.categoryId, val: sql<number>`count(*)` })
      .from(structuredRecords)
      .where(eq(structuredRecords.businessId, business.id))
      .groupBy(structuredRecords.categoryId),
    db.select({ val: sql<number>`count(*)` }).from(hierarchyNodes).where(eq(hierarchyNodes.businessId, business.id)),
    db.select({ val: sql<number>`count(*)` }).from(spocContacts).where(eq(spocContacts.businessId, business.id)),
    db.select({ val: sql<number>`count(*)` }).from(leads).where(eq(leads.businessId, business.id)),
    db.select({ val: sql<number>`count(*)` }).from(priceRecords).where(eq(priceRecords.businessId, business.id)),
    db.select({ val: sql<number>`count(*)` }).from(targetRecords).where(eq(targetRecords.businessId, business.id)),
  ]);

  const filesCountMap: Record<number, number> = {};
  filesCountGroup.forEach((g) => {
    if (g.categoryId !== null) {
      filesCountMap[g.categoryId] = Number(g.val);
    }
  });

  const structuredCountMap: Record<number, number> = {};
  structuredCountGroup.forEach((g) => {
    if (g.categoryId !== null) {
      structuredCountMap[g.categoryId] = Number(g.val);
    }
  });

  const countMap: Record<string, number> = {};
  allCategories.forEach((cat) => {
    let count = 0;
    if (cat.key === 'hierarchy') {
      count = Number(hierarchyRes?.val ?? 0);
    } else if (cat.key === 'spoc') {
      count = Number(spocRes?.val ?? 0);
    } else if (cat.key === 'leads_storage') {
      count = Number(leadsRes?.val ?? 0);
    } else if (cat.key === 'prices') {
      count = Number(pricesRes?.val ?? 0);
    } else if (cat.key === 'targets') {
      count = Number(targetsRes?.val ?? 0);
    } else if (cat.viewType === 'file') {
      count = filesCountMap[cat.id] ?? 0;
    } else {
      count = structuredCountMap[cat.id] ?? 0;
    }
    countMap[cat.key] = count;
  });


  return (
    <div className="space-y-8">
      {/* Business header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center border border-white/10">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
          ) : (
            <LucideIcons.Building2 className="w-7 h-7 text-slate-600" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-400 text-sm transition-colors">
              Businesses
            </Link>
            <span className="text-slate-700">/</span>
            <h1 className="text-2xl font-bold text-slate-100">{business.name}</h1>
          </div>
          {business.description && (
            <p className="text-sm text-slate-500 mt-0.5">{business.description}</p>
          )}
        </div>
      </div>

      {/* Category grid — 18 cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {allCategories.map((cat, i) => {
            const meta = CATEGORY_META[cat.key];
            const colorClass = CATEGORY_BG_COLORS[i % CATEGORY_BG_COLORS.length];
            return (
              <Link
                key={cat.id}
                href={`/dashboard/${businessSlug}/${cat.key}`}
                id={`category-${cat.key}`}
                className={cn(
                  'group flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
                  colorClass
                )}
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <CategoryIcon name={meta?.icon ?? 'Folder'} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold leading-tight">{cat.label}</p>
                  <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 bg-white/10 text-slate-300 rounded-full font-medium group-hover:bg-white/20 transition-colors">
                    {countMap[cat.key] ?? 0} items
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
