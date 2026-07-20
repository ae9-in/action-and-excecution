import type { CategorySchema } from './types';

export const planOfActionSchema: CategorySchema = {
  categoryKey: 'plan_of_action',
  displayMode: 'task-list',
  primaryField: 'title',
  statusField: 'status',
  sortBy: 'dueDate',
  sortOrder: 'asc',
  fields: [
    { key: 'title', label: 'Task', type: 'text', required: true, width: 'full' },
    { key: 'owner', label: 'Owner', type: 'text', width: 'half', placeholder: 'Person responsible' },
    { key: 'dueDate', label: 'Due Date', type: 'date', width: 'half' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: ['pending', 'in_progress', 'completed', 'blocked'], width: 'half' },
    { key: 'notes', label: 'Notes', type: 'textarea', width: 'full' },
  ],
};
