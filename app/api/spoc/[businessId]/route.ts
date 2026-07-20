import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { spocContacts, businessMembers } from '@/drizzle/schema';
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

    const contacts = await db
      .select()
      .from(spocContacts)
      .where(eq(spocContacts.businessId, businessId));

    return NextResponse.json(contacts);
  } catch (err: any) {
    console.error('Error in GET /api/spoc/[businessId]:', err);
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
    const { name, role, phone, email, businessUnit } = body;

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const [contact] = await db
      .insert(spocContacts)
      .values({ businessId, name, role, phone, email, businessUnit })
      .returning();

    return NextResponse.json(contact, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/spoc/[businessId]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ businessId: string }> }) {
  try {
    await context.params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...rest } = body;

    const [before] = await db.select().from(spocContacts).where(eq(spocContacts.id, id)).limit(1);
    if (!before) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

    const [updated] = await withAudit(
      { actorId: user.id, action: 'edit', entityType: 'spoc_contact', entityId: id, beforeState: before as any, afterState: rest as any },
      () => db.update(spocContacts).set(rest).where(eq(spocContacts.id, id)).returning()
    );

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Error in PATCH /api/spoc/[businessId]:', err);
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

    const contactId = req.nextUrl.searchParams.get('contactId');
    if (!contactId) return NextResponse.json({ error: 'contactId required' }, { status: 400 });

    const [before] = await db.select().from(spocContacts).where(eq(spocContacts.id, contactId)).limit(1);
    if (!before) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

    await withAudit(
      { actorId: user.id, action: 'delete', entityType: 'spoc_contact', entityId: contactId, beforeState: before as any },
      () => db.delete(spocContacts).where(eq(spocContacts.id, contactId))
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/spoc/[businessId]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
