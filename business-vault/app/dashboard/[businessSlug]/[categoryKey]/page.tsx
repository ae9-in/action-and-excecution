export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { businesses, businessMembers, categories, organizations } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { CATEGORY_VIEW_MAP, CATEGORY_META } from '@/lib/category-config';
import { getCategorySchema } from '@/lib/category-schemas';
import { FileCategoryView } from '@/components/categories/FileCategoryView';
import { StructuredCategoryView } from '@/components/categories/StructuredCategoryView';
import { OrgChartView } from '@/components/categories/OrgChartView';
import { ContactCardsView } from '@/components/categories/ContactCardsView';
import { ShieldAlert } from 'lucide-react';


export async function generateMetadata({ params }: { params: Promise<{ businessSlug: string; categoryKey: string }> }) {
  const { categoryKey } = await params;
  const meta = CATEGORY_META[categoryKey];
  return {
    title: `${meta?.label ?? 'Category'} — Business Vault`,
    description: meta?.description ?? 'Business Vault category view',
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ businessSlug: string; categoryKey: string }>;
}) {
  const { businessSlug, categoryKey } = await params;
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
          <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-slate-200">Access Denied</h1>
          <p className="text-slate-400 mt-2 max-w-md">
            You do not have permission to access the category workspace for <strong>{business.name}</strong>.
            Please contact your system administrator to request access.
          </p>
          <Link href="/dashboard" className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
            Back to Dashboard
          </Link>
        </div>
      );
    }
  }

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.key, categoryKey))
    .limit(1);

  if (!category) notFound();

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, business.orgId!))
    .limit(1);

  const meta = CATEGORY_META[categoryKey];
  const viewType = CATEGORY_VIEW_MAP[categoryKey] ?? 'file';
  const schema = getCategorySchema(categoryKey);
  const userRole = user.role as 'user' | 'admin' | 'super_admin';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-slate-600 hover:text-slate-400 transition-colors">Businesses</Link>
        <span className="text-slate-700">/</span>
        <Link href={`/dashboard/${businessSlug}`} className="text-slate-600 hover:text-slate-400 transition-colors">{business.name}</Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300 font-medium">{meta?.label ?? category.label}</span>
      </div>

      {/* Category header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-100">{meta?.label ?? category.label}</h1>
        <span className="text-xs px-2.5 py-0.5 bg-indigo-900/40 border border-indigo-700/30 text-indigo-400 rounded-full">
          {category.viewType}
        </span>
      </div>

      {/* Category content — routed by view type */}
      {viewType === 'file' && (
        <FileCategoryView
          businessId={business.id}
          businessSlug={business.slug}
          categoryKey={categoryKey}
          categoryLabel={category.label}
          orgSlug={org?.slug ?? 'default'}
          userRole={userRole}
          categoryId={category.id}
        />
      )}

      {viewType === 'structured' && schema && (
        <StructuredCategoryView
          businessId={business.id}
          categoryKey={categoryKey}
          schema={schema}
          userRole={userRole}
        />
      )}

      {viewType === 'org-chart' && (
        <OrgChartView businessId={business.id} userRole={userRole} />
      )}

      {viewType === 'contact-cards' && (
        <ContactCardsView businessId={business.id} userRole={userRole} />
      )}

      {viewType === 'hybrid' && (
        <div className="space-y-6">
          <p className="text-xs text-slate-600 bg-white/3 border border-white/5 rounded-xl px-4 py-3">
            Competitor records + attached files. Create competitor profiles below, then attach files to each one.
          </p>
          {schema && (
            <StructuredCategoryView
              businessId={business.id}
              categoryKey={categoryKey}
              schema={schema}
              userRole={userRole}
            />
          )}
        </div>
      )}
    </div>
  );
}
