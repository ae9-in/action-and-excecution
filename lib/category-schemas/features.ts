import type { CategorySchema } from './types';

export const featuresSchema: CategorySchema = {
  categoryKey: 'features',
  displayMode: 'table',
  primaryField: 'title',
  statusField: 'status',
  fields: [
    { key: 'title', label: 'Feature Name', type: 'text', required: true, width: 'half' },
    { key: 'description', label: 'Description', type: 'textarea', width: 'full' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: ['planned', 'in_progress', 'live', 'deprecated'], width: 'half' },
    { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high'], width: 'half' },
  ],
};
