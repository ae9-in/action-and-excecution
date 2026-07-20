import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  structuredRecords,
  leads,
  priceRecords,
  targetRecords,
  categories,
  businessMembers,
} from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { withAudit } from '@/lib/audit';

// GET /api/structured/[category]?businessId=
export async function GET(req: NextRequest, context: { params: Promise<{ category: string }> }) {
  try {
    const { category: categoryKey } = await context.params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    const businessId = req.nextUrl.searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

    // Access check
    if (user.role !== 'super_admin') {
      const [m] = await db
        .select()
        .from(businessMembers)
        .where(and(eq(businessMembers.userId, user.id), eq(businessMembers.businessId, businessId)))
        .limit(1);
      if (!m) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (categoryKey === 'leads_storage') {
      const result = await db.select().from(leads).where(eq(leads.businessId, businessId));
      return NextResponse.json(result);
    }
    if (categoryKey === 'prices') {
      const result = await db.select().from(priceRecords).where(eq(priceRecords.businessId, businessId)).orderBy(priceRecords.effectiveFrom);
      return NextResponse.json(result);
    }
    if (categoryKey === 'targets') {
      const result = await db.select().from(targetRecords).where(eq(targetRecords.businessId, businessId));
      return NextResponse.json(result);
    }

    const [cat] = await db.select().from(categories).where(eq(categories.key, categoryKey)).limit(1);
    if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    const result = await db
      .select()
      .from(structuredRecords)
      .where(and(eq(structuredRecords.businessId, businessId), eq(structuredRecords.categoryId, cat.id)))
      .orderBy(structuredRecords.createdAt);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in GET /api/structured/[category]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/structured/[category]
export async function POST(req: NextRequest, context: { params: Promise<{ category: string }> }) {
  try {
    const { category: categoryKey } = await context.params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    const body = await req.json();
    const { businessId, data } = body;

    if (!businessId || !data) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Verify access
    if (user.role !== 'super_admin') {
      const [m] = await db
        .select()
        .from(businessMembers)
        .where(and(eq(businessMembers.userId, user.id), eq(businessMembers.businessId, businessId)))
        .limit(1);
      if (!m) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (categoryKey === 'leads_storage') {
      const [lead] = await db.insert(leads).values({ businessId, ...data, ownerId: user.id }).returning();
      return NextResponse.json(lead, { status: 201 });
    }
    if (categoryKey === 'prices') {
      const [record] = await db.insert(priceRecords).values({ businessId, ...data, createdBy: user.id }).returning();
      return NextResponse.json(record, { status: 201 });
    }
    if (categoryKey === 'targets') {
      const [record] = await db.insert(targetRecords).values({ businessId, ...data }).returning();
      return NextResponse.json(record, { status: 201 });
    }

    const [cat] = await db.select().from(categories).where(eq(categories.key, categoryKey)).limit(1);
    if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    const [record] = await db
      .insert(structuredRecords)
      .values({ businessId, categoryId: cat.id, data, createdBy: user.id, updatedBy: user.id })
      .returning();

    return NextResponse.json(record, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/structured/[category]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/structured/[category]?recordId=
export async function PATCH(req: NextRequest, context: { params: Promise<{ category: string }> }) {
  try {
    const { category: categoryKey } = await context.params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const recordId = req.nextUrl.searchParams.get('recordId');
    if (!recordId) return NextResponse.json({ error: 'recordId required' }, { status: 400 });

    const body = await req.json();
    const { data } = body;

    let before: any, updated: any;

    if (categoryKey === 'leads_storage') {
      [before] = await db.select().from(leads).where(eq(leads.id, recordId)).limit(1);
      [updated] = await db.update(leads).set(data).where(eq(leads.id, recordId)).returning();
    } else if (categoryKey === 'prices') {
      [before] = await db.select().from(priceRecords).where(eq(priceRecords.id, recordId)).limit(1);
      [updated] = await db.update(priceRecords).set(data).where(eq(priceRecords.id, recordId)).returning();
    } else if (categoryKey === 'targets') {
      [before] = await db.select().from(targetRecords).where(eq(targetRecords.id, recordId)).limit(1);
      [updated] = await db.update(targetRecords).set(data).where(eq(targetRecords.id, recordId)).returning();
    } else {
      [before] = await db.select().from(structuredRecords).where(eq(structuredRecords.id, recordId)).limit(1);
      [updated] = await db
        .update(structuredRecords)
        .set({ data, updatedBy: user.id, updatedAt: new Date() })
        .where(eq(structuredRecords.id, recordId))
        .returning();
    }

    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await withAudit(
      {
        actorId: user.id,
        action: 'edit',
        entityType: 'structured_record',
        entityId: recordId,
        beforeState: before,
        afterState: updated,
        ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      },
      async () => updated
    );

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Error in PATCH /api/structured/[category]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/structured/[category]?recordId=
export async function DELETE(req: NextRequest, context: { params: Promise<{ category: string }> }) {
  try {
    const { category: categoryKey } = await context.params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const recordId = req.nextUrl.searchParams.get('recordId');
    if (!recordId) return NextResponse.json({ error: 'recordId required' }, { status: 400 });

    let before: any;

    if (categoryKey === 'leads_storage') {
      [before] = await db.select().from(leads).where(eq(leads.id, recordId)).limit(1);
      await withAudit(
        { actorId: user.id, action: 'delete', entityType: 'lead', entityId: recordId, beforeState: before },
        () => db.delete(leads).where(eq(leads.id, recordId))
      );
    } else if (categoryKey === 'prices') {
      [before] = await db.select().from(priceRecords).where(eq(priceRecords.id, recordId)).limit(1);
      await withAudit(
        { actorId: user.id, action: 'delete', entityType: 'price_record', entityId: recordId, beforeState: before },
        () => db.delete(priceRecords).where(eq(priceRecords.id, recordId))
      );
    } else if (categoryKey === 'targets') {
      [before] = await db.select().from(targetRecords).where(eq(targetRecords.id, recordId)).limit(1);
      await withAudit(
        { actorId: user.id, action: 'delete', entityType: 'target_record', entityId: recordId, beforeState: before },
        () => db.delete(targetRecords).where(eq(targetRecords.id, recordId))
      );
    } else {
      [before] = await db.select().from(structuredRecords).where(eq(structuredRecords.id, recordId)).limit(1);
      await withAudit(
        { actorId: user.id, action: 'delete', entityType: 'structured_record', entityId: recordId, beforeState: before },
        () => db.delete(structuredRecords).where(eq(structuredRecords.id, recordId))
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/structured/[category]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
