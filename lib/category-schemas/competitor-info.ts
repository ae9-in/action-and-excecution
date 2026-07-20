import type { CategorySchema } from './types';

export const competitorInfoSchema: CategorySchema = {
  categoryKey: 'competitor_info',
  displayMode: 'table',
  primaryField: 'name',
  fields: [
    { key: 'name', label: 'Competitor Name', type: 'text', required: true, width: 'half' },
    { key: 'website', label: 'Website', type: 'url', width: 'half', placeholder: 'https://...' },
    { key: 'marketShare', label: 'Est. Market Share (%)', type: 'number', width: 'third' },
    { key: 'strengths', label: 'Strengths', type: 'textarea', width: 'full' },
    { key: 'weaknesses', label: 'Weaknesses', type: 'textarea', width: 'full' },
  ],
};
