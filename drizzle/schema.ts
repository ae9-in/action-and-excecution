import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  bigint,
  numeric,
  date,
  jsonb,
  serial,
  bigserial,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================================
// CORE TABLES
// ============================================================

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['user', 'admin', 'super_admin'] }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by'), // self-reference, added via FK later
});

export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  description: text('description'),
  status: text('status', { enum: ['active', 'archived'] }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
});

export const businessMembers = pgTable(
  'business_members',
  {
    businessId: uuid('business_id')
      .references(() => businesses.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    accessLevel: text('access_level', { enum: ['view', 'edit'] }).default('view'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.businessId, table.userId] }),
  })
);

// ============================================================
// CATEGORY SYSTEM
// ============================================================

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  label: text('label').notNull(),
  icon: text('icon').notNull(),
  viewType: text('view_type', { enum: ['file', 'structured', 'hybrid'] }).notNull(),
  sortOrder: integer('sort_order').notNull(),
});

// ============================================================
// FILE-BASED CATEGORIES
// ============================================================

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  competitorId: uuid('competitor_id'), // FK to competitors added after
  title: text('title').notNull(),
  cloudinaryPublicId: text('cloudinary_public_id'),
  cloudinaryUrl: text('cloudinary_url'),
  thumbnailUrl: text('thumbnail_url'),
  resourceType: text('resource_type', { enum: ['image', 'video', 'raw', 'pdf'] }).notNull(),
  mimeType: text('mime_type'),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }),
  tags: text('tags').array(),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const fileContents = pgTable('file_contents', {
  fileId: uuid('file_id').primaryKey().references(() => files.id, { onDelete: 'cascade' }),
  base64Data: text('base64_data').notNull(),
});

// ============================================================
// STRUCTURED CATEGORY DATA (generic)
// ============================================================

export const structuredRecords = pgTable('structured_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  data: jsonb('data').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// SPECIALIZED STRUCTURED TABLES
// ============================================================

export const hierarchyNodes = pgTable('hierarchy_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  parentId: uuid('parent_id'), // self-reference
  name: text('name').notNull(),
  title: text('title'),
  photoUrl: text('photo_url'),
  sortOrder: integer('sort_order').default(0),
});

export const spocContacts = pgTable('spoc_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  role: text('role'),
  phone: text('phone'),
  email: text('email'),
  businessUnit: text('business_unit'),
});

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  contact: text('contact'),
  source: text('source'),
  stage: text('stage', { enum: ['new', 'contacted', 'qualified', 'won', 'lost'] }).default('new'),
  ownerId: uuid('owner_id').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const priceRecords = pgTable('price_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  itemName: text('item_name').notNull(),
  value: numeric('value').notNull(),
  currency: text('currency').default('INR'),
  effectiveFrom: date('effective_from').notNull(),
  note: text('note'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const targetRecords = pgTable('target_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  metricName: text('metric_name').notNull(),
  targetValue: numeric('target_value').notNull(),
  achievedValue: numeric('achieved_value').default('0'),
  periodStart: date('period_start'),
  periodEnd: date('period_end'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const competitors = pgTable('competitors', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  notes: text('notes'),
  website: text('website'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// AUDIT LOG (insert-only, super_admin visible)
// ============================================================

export const auditLogs = pgTable('audit_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  actorId: uuid('actor_id').references(() => users.id),
  action: text('action').notNull(), // 'create' | 'edit' | 'delete' | 'role_change'
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  beforeState: jsonb('before_state'),
  afterState: jsonb('after_state'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// PHASE 2 (schema only, no UI/logic)
// ============================================================

export const automatedWorkflows = pgTable('automated_workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  triggerType: text('trigger_type'),
  config: jsonb('config'),
  isActive: boolean('is_active').default(true),
});

export const evaluatorRuns = pgTable('evaluator_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  workflowId: uuid('workflow_id').references(() => automatedWorkflows.id),
  result: jsonb('result'),
  score: numeric('score'),
  runAt: timestamp('run_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// RELATIONS
// ============================================================

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  businesses: many(businesses),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, { fields: [users.orgId], references: [organizations.id] }),
  businessMembers: many(businessMembers),
  uploadedFiles: many(files),
  leads: many(leads),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  organization: one(organizations, { fields: [businesses.orgId], references: [organizations.id] }),
  members: many(businessMembers),
  files: many(files),
  structuredRecords: many(structuredRecords),
  hierarchyNodes: many(hierarchyNodes),
  spocContacts: many(spocContacts),
  leads: many(leads),
  priceRecords: many(priceRecords),
  targetRecords: many(targetRecords),
  competitors: many(competitors),
}));

export const businessMembersRelations = relations(businessMembers, ({ one }) => ({
  business: one(businesses, { fields: [businessMembers.businessId], references: [businesses.id] }),
  user: one(users, { fields: [businessMembers.userId], references: [users.id] }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  business: one(businesses, { fields: [files.businessId], references: [businesses.id] }),
  category: one(categories, { fields: [files.categoryId], references: [categories.id] }),
  uploadedBy: one(users, { fields: [files.uploadedBy], references: [users.id] }),
  competitor: one(competitors, { fields: [files.competitorId], references: [competitors.id] }),
}));

export const structuredRecordsRelations = relations(structuredRecords, ({ one }) => ({
  business: one(businesses, { fields: [structuredRecords.businessId], references: [businesses.id] }),
  category: one(categories, { fields: [structuredRecords.categoryId], references: [categories.id] }),
  createdBy: one(users, { fields: [structuredRecords.createdBy], references: [users.id] }),
  updatedBy: one(users, { fields: [structuredRecords.updatedBy], references: [users.id] }),
}));

export const competitorsRelations = relations(competitors, ({ one, many }) => ({
  business: one(businesses, { fields: [competitors.businessId], references: [businesses.id] }),
  files: many(files),
}));

// ============================================================
// TYPE EXPORTS
// ============================================================

export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type BusinessMember = typeof businessMembers.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type File = typeof files.$inferSelect;
export type StructuredRecord = typeof structuredRecords.$inferSelect;
export type HierarchyNode = typeof hierarchyNodes.$inferSelect;
export type SpocContact = typeof spocContacts.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type PriceRecord = typeof priceRecords.$inferSelect;
export type TargetRecord = typeof targetRecords.$inferSelect;
export type Competitor = typeof competitors.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type FileContent = typeof fileContents.$inferSelect;
