import type { CategorySchema } from './types';

export const targetsSchema: CategorySchema = {
  categoryKey: 'targets',
  displayMode: 'timeline',
  primaryField: 'metricName',
  statusField: 'achieved',
  sortBy: 'periodStart',
  sortOrder: 'desc',
  fields: [
    { key: 'metricName', label: 'Metric', type: 'text', required: true, width: 'half' },
    { key: 'targetValue', label: 'Target Value', type: 'number', required: true, width: 'third' },
    { key: 'achievedValue', label: 'Achieved Value', type: 'number', width: 'third' },
    { key: 'periodStart', label: 'Period Start', type: 'date', width: 'third' },
    { key: 'periodEnd', label: 'Period End', type: 'date', width: 'third' },
  ],
};
