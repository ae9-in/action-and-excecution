import { faqSchema } from './faq';
import { mailDraftSchema } from './mail-draft';
import { leadsSchema } from './leads';
import { updatesSchema } from './updates';
import { pricesSchema } from './prices';
import { targetsSchema } from './targets';
import { competitorInfoSchema } from './competitor-info';
import { featuresSchema } from './features';
import { planOfActionSchema } from './plan-of-action';
import type { CategorySchema } from './types';

export const categorySchemas: Record<string, CategorySchema> = {
  faq: faqSchema,
  mail_draft: mailDraftSchema,
  leads_storage: leadsSchema,
  updates: updatesSchema,
  prices: pricesSchema,
  targets: targetsSchema,
  competitor_info: competitorInfoSchema,
  features: featuresSchema,
  plan_of_action: planOfActionSchema,
};

export function getCategorySchema(categoryKey: string): CategorySchema | null {
  return categorySchemas[categoryKey] ?? null;
}

export type { CategorySchema, FieldConfig, FieldType } from './types';
