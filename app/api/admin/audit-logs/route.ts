import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { auditLogs, users } from '@/drizzle/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/admin/audit-logs — super_admin only
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;

  if (user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      beforeState: auditLogs.beforeState,
      afterState: auditLogs.afterState,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
      actorEmail: users.email,
      actorName: users.fullName,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json(logs);
}
