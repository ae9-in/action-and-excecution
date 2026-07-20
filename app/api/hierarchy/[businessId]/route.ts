import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { hierarchyNodes, businessMembers } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { withAudit } from '@/lib/audit';

export async function GET(req: NextRequest, context: { params: Promise<{ businessId: string }> }) {
  try {
    const { businessId } = await context.params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    if (user.role !== 'super_admin') {
      const [membership] = await db
        .select()
        .from(businessMembers)
        .where(and(eq(businessMembers.userId, user.id), eq(businessMembers.businessId, businessId)))
        .limit(1);
      if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const nodes = await db
      .select()
      .from(hierarchyNodes)
      .where(eq(hierarchyNodes.businessId, businessId))
      .orderBy(hierarchyNodes.sortOrder);

    return NextResponse.json(nodes);
  } catch (err: any) {
    console.error('Error in GET /api/hierarchy/[businessId]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ businessId: string }> }) {
  try {
    const { businessId } = await context.params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    if (user.role !== 'super_admin') {
      const [membership] = await db
        .select()
        .from(businessMembers)
        .where(and(eq(businessMembers.userId, user.id), eq(businessMembers.businessId, businessId)))
        .limit(1);
      if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, title, parentId, photoUrl, sortOrder } = body;

    const [node] = await db
      .insert(hierarchyNodes)
      .values({ businessId, name, title, parentId: parentId ?? null, photoUrl, sortOrder: sortOrder ?? 0 })
      .returning();

    return NextResponse.json(node, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/hierarchy/[businessId]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ businessId: string }> }) {
  try {
    await context.params; // consume params
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, title, parentId, photoUrl, sortOrder } = body;

    const [before] = await db.select().from(hierarchyNodes).where(eq(hierarchyNodes.id, id)).limit(1);

    const [updated] = await withAudit(
      { actorId: user.id, action: 'edit', entityType: 'hierarchy_node', entityId: id, beforeState: before as any, afterState: body as any },
      () => db.update(hierarchyNodes).set({ name, title, parentId, photoUrl, sortOrder }).where(eq(hierarchyNodes.id, id)).returning()
    );

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Error in PATCH /api/hierarchy/[businessId]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ businessId: string }> }) {
  try {
    await context.params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const nodeId = req.nextUrl.searchParams.get('nodeId');
    if (!nodeId) return NextResponse.json({ error: 'nodeId required' }, { status: 400 });

    const [before] = await db.select().from(hierarchyNodes).where(eq(hierarchyNodes.id, nodeId)).limit(1);
    await withAudit(
      { actorId: user.id, action: 'delete', entityType: 'hierarchy_node', entityId: nodeId, beforeState: before as any },
      () => db.delete(hierarchyNodes).where(eq(hierarchyNodes.id, nodeId))
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/hierarchy/[businessId]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
