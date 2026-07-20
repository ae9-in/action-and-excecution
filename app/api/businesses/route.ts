import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { businesses, businessMembers } from '@/drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';
import { randomUUID } from 'crypto';

// GET /api/businesses — returns businesses visible to the current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    let allBusinesses;

    if (user.role === 'super_admin') {
      allBusinesses = await db.select().from(businesses).where(eq(businesses.status, 'active'));
    } else {
      const memberships = await db
        .select({ businessId: businessMembers.businessId })
        .from(businessMembers)
        .where(eq(businessMembers.userId, user.id));

      const businessIds = memberships.map((m) => m.businessId);
      if (businessIds.length === 0) return NextResponse.json([]);

      allBusinesses = await db
        .select()
        .from(businesses)
        .where(and(inArray(businesses.id, businessIds), eq(businesses.status, 'active')));
    }

    return NextResponse.json(allBusinesses);
  } catch (err: any) {
    console.error('Error in GET /api/businesses:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/businesses — Admin+ creates a new business
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, logoUrl } = body;

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const slugBase = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const slug = `${slugBase}-${randomUUID().slice(0, 6)}`;

    // Verify slug uniqueness
    const [existing] = await db.select().from(businesses).where(eq(businesses.slug, slug)).limit(1);
    if (existing) {
      return NextResponse.json({ error: 'A business with this name already exists' }, { status: 400 });
    }

    const [business] = await db
      .insert(businesses)
      .values({
        orgId: user.orgId,
        name,
        slug,
        description,
        logoUrl,
        createdBy: user.id,
      })
      .returning();

    // Auto-assign creator as member with edit access
    await db.insert(businessMembers).values({
      businessId: business.id,
      userId: user.id,
      accessLevel: 'edit',
    });

    await logAudit({
      actorId: user.id,
      action: 'create',
      entityType: 'business',
      entityId: business.id,
      afterState: business as any,
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json(business, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/businesses:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
