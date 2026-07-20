import type { CategorySchema } from './types';

export const mailDraftSchema: CategorySchema = {
  categoryKey: 'mail_draft',
  displayMode: 'cards',
  primaryField: 'subject',
  fields: [
    { key: 'subject', label: 'Subject Line', type: 'text', required: true, width: 'full' },
    { key: 'body', label: 'Email Body', type: 'richtext', required: true, width: 'full', copyable: true, placeholder: 'Use {{name}}, {{company}}, {{date}} as variables' },
    { key: 'tone', label: 'Tone', type: 'select', options: ['Formal', 'Friendly', 'Follow-up', 'Cold Outreach', 'Proposal'], width: 'half' },
    { key: 'tags', label: 'Tags', type: 'text', width: 'half' },
  ],
};
