import { db } from '@/lib/db';
import { auditLogs } from '@/drizzle/schema';

export type AuditAction = 'create' | 'edit' | 'delete' | 'role_change' | 'archive';
export type AuditEntityType =
  | 'file'
  | 'business'
  | 'user'
  | 'structured_record'
  | 'hierarchy_node'
  | 'spoc_contact'
  | 'lead'
  | 'price_record'
  | 'target_record'
  | 'competitor';

export interface AuditContext {
  actorId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  ipAddress?: string;
}

/**
 * withAudit — wraps any mutating operation and writes an audit log entry.
 * Use everywhere an Admin or Super Admin mutates data.
 *
 * @example
 * const result = await withAudit(
 *   { actorId, action: 'edit', entityType: 'lead', entityId: lead.id, beforeState: oldLead, afterState: newLead },
 *   () => db.update(leads).set(data).where(eq(leads.id, lead.id)).returning()
 * );
 */
export async function withAudit<T>(
  ctx: AuditContext,
  operation: () => Promise<T>
): Promise<T> {
  const result = await operation();

  // Insert audit log — fire-and-forget style (don't fail the request if logging fails)
  try {
    await db.insert(auditLogs).values({
      actorId: ctx.actorId,
      action: ctx.action,
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      beforeState: ctx.beforeState ?? null,
      afterState: ctx.afterState ?? null,
      ipAddress: ctx.ipAddress ?? null,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write audit entry:', err);
  }

  return result;
}

/**
 * logAudit — standalone audit entry without wrapping an operation.
 * Use when the operation is already done and you just need to log.
 */
export async function logAudit(ctx: AuditContext): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorId: ctx.actorId,
      action: ctx.action,
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      beforeState: ctx.beforeState ?? null,
      afterState: ctx.afterState ?? null,
      ipAddress: ctx.ipAddress ?? null,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write audit entry:', err);
  }
}
