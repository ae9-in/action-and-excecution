import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { businesses, businessMembers, users } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { withAudit } from '@/lib/audit';

async function canAccess(userId: string, businessId: string, role: string) {
  if (role === 'super_admin') return true;
  const [membership] = await db
    .select()
    .from(businessMembers)
    .where(and(eq(businessMembers.userId, userId), eq(businessMembers.businessId, businessId)))
    .limit(1);
  return !!membership;
}

// GET /api/businesses/[id]
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    const ok = await canAccess(user.id, id, user.role);
    if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [business] = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
    if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const members = await db
      .select({ userId: businessMembers.userId, accessLevel: businessMembers.accessLevel, email: users.email, fullName: users.fullName })
      .from(businessMembers)
      .innerJoin(users, eq(businessMembers.userId, users.id))
      .where(eq(businessMembers.businessId, id));

    return NextResponse.json({ ...business, members });
  } catch (err: any) {
    console.error('Error in GET /api/businesses/[id]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/businesses/[id] — Admin+, audit-logged
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [before] = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const { name, description, logoUrl, status } = body;

    const [updated] = await withAudit(
      {
        actorId: user.id,
        action: 'edit',
        entityType: 'business',
        entityId: id,
        beforeState: before as any,
        afterState: { name, description, logoUrl, status } as any,
        ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      },
      () =>
        db
          .update(businesses)
          .set({ name, description, logoUrl, status })
          .where(eq(businesses.id, id))
          .returning()
    );

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Error in PATCH /api/businesses/[id]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/businesses/[id] — archives (soft delete), Admin+, audit-logged
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [before] = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await withAudit(
      {
        actorId: user.id,
        action: 'archive',
        entityType: 'business',
        entityId: id,
        beforeState: before as any,
        afterState: { status: 'archived' } as any,
        ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      },
      () => db.update(businesses).set({ status: 'archived' }).where(eq(businesses.id, id)).returning()
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/businesses/[id]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
