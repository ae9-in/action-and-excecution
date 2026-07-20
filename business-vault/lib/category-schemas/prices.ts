import type { CategorySchema } from './types';

export const pricesSchema: CategorySchema = {
  categoryKey: 'prices',
  displayMode: 'timeline',
  primaryField: 'itemName',
  sortBy: 'effectiveFrom',
  sortOrder: 'desc',
  fields: [
    { key: 'itemName', label: 'Item / Service', type: 'text', required: true, width: 'half' },
    { key: 'value', label: 'Price', type: 'number', required: true, width: 'third' },
    { key: 'currency', label: 'Currency', type: 'select', options: ['INR', 'USD', 'EUR', 'GBP', 'AED'], width: 'third' },
    { key: 'effectiveFrom', label: 'Effective From', type: 'date', required: true, width: 'third' },
    { key: 'note', label: 'Note', type: 'textarea', width: 'full' },
  ],
};
