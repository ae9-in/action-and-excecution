import type { CategorySchema } from './types';

export const faqSchema: CategorySchema = {
  categoryKey: 'faq',
  displayMode: 'accordion',
  primaryField: 'question',
  fields: [
    { key: 'question', label: 'Question', type: 'text', required: true, width: 'full' },
    { key: 'answer', label: 'Answer', type: 'richtext', required: true, width: 'full' },
    { key: 'tags', label: 'Tags', type: 'text', width: 'full', placeholder: 'e.g. billing, onboarding' },
  ],
};
