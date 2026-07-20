'use client';

import { Archive, Building2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    logoUrl?: string | null;
    status: string | null;
  };
  categoryCount?: number;
}

const CARD_GRADIENTS = [
  'from-indigo-900/40 to-slate-900/40',
  'from-violet-900/40 to-slate-900/40',
  'from-blue-900/40 to-slate-900/40',
  'from-teal-900/40 to-slate-900/40',
  'from-amber-900/40 to-slate-900/40',
];

export function BusinessCard({ business, categoryCount = 18 }: BusinessCardProps) {
  const gradientIndex = business.name.charCodeAt(0) % CARD_GRADIENTS.length;
  const gradient = CARD_GRADIENTS[gradientIndex];
  const isArchived = business.status === 'archived';

  return (
    <Link
      href={`/dashboard/${business.slug}`}
      className={cn(
        'group relative bg-gradient-to-br border border-white/10 rounded-2xl p-6 transition-all duration-300',
        'hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-900/20 hover:-translate-y-0.5',
        gradient,
        isArchived && 'opacity-50 grayscale'
      )}
    >
      {/* Logo / icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-6 h-6 text-slate-400" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {isArchived && (
            <span className="flex items-center gap-1 text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
              <Archive className="w-3 h-3" /> Archived
            </span>
          )}
          <span className="text-xs text-slate-500 bg-white/5 px-2.5 py-0.5 rounded-full">
            {categoryCount} categories
          </span>
        </div>
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold text-slate-200 mb-1 group-hover:text-white transition-colors">
        {business.name}
      </h3>
      {business.description && (
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {business.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="text-xs text-slate-600">View all categories</span>
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}
