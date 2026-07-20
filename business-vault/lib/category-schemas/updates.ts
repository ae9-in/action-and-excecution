import type { CategorySchema } from './types';

export const updatesSchema: CategorySchema = {
  categoryKey: 'updates',
  displayMode: 'feed',
  primaryField: 'title',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  fields: [
    { key: 'title', label: 'Update Title', type: 'text', required: true, width: 'full' },
    { key: 'body', label: 'Details', type: 'richtext', required: true, width: 'full' },
    { key: 'type', label: 'Type', type: 'select', options: ['announcement', 'milestone', 'issue', 'release', 'other'], width: 'half' },
  ],
};
