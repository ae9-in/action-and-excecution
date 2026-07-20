import type { CategorySchema } from './types';

export const leadsSchema: CategorySchema = {
  categoryKey: 'leads_storage',
  displayMode: 'table',
  primaryField: 'name',
  statusField: 'stage',
  fields: [
    { key: 'name', label: 'Lead Name', type: 'text', required: true, width: 'half' },
    { key: 'contact', label: 'Contact', type: 'text', width: 'half', placeholder: 'Phone or email' },
    { key: 'source', label: 'Source', type: 'text', width: 'half', placeholder: 'e.g. Website, Referral' },
    { key: 'stage', label: 'Stage', type: 'select', required: true, width: 'half', options: ['new', 'contacted', 'qualified', 'won', 'lost'] },
    { key: 'notes', label: 'Notes', type: 'textarea', width: 'full' },
  ],
};
