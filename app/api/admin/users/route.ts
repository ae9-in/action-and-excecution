import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/audit';

// GET /api/admin/users — super_admin only
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;
  if (user.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const allUsers = await db
    .select({ id: users.id, email: users.email, fullName: users.fullName, role: users.role, isActive: users.isActive, createdAt: users.createdAt })
    .from(users);

  return NextResponse.json(allUsers);
}

// POST /api/admin/users — create admin account, super_admin only
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = session.user as any;
  if (actor.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { email, fullName, password, role } = body;

  if (!email || !fullName || !password) {
    return NextResponse.json({ error: 'Email, name, and password required' }, { status: 400 });
  }

  // Can only create user or admin accounts, not super_admin
  if (role === 'super_admin') {
    return NextResponse.json({ error: 'Cannot create super_admin via this endpoint' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [newUser] = await db
    .insert(users)
    .values({ orgId: actor.orgId, email, fullName, passwordHash, role: role ?? 'user', createdBy: actor.id })
    .returning({ id: users.id, email: users.email, fullName: users.fullName, role: users.role });

  await logAudit({
    actorId: actor.id,
    action: 'create',
    entityType: 'user',
    entityId: newUser.id,
    afterState: { email, fullName, role } as any,
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json(newUser, { status: 201 });
}

// PATCH /api/admin/users — toggle active status or change role, super_admin only
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = session.user as any;
  if (actor.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { userId, isActive, role } = body;

  const [before] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!before) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Prevent demoting/deactivating another super_admin
  if (before.role === 'super_admin') {
    return NextResponse.json({ error: 'Cannot modify super_admin accounts' }, { status: 400 });
  }

  const updates: Partial<typeof before> = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (role && role !== 'super_admin') updates.role = role;

  const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();

  await logAudit({
    actorId: actor.id,
    action: 'role_change',
    entityType: 'user',
    entityId: userId,
    beforeState: { isActive: before.isActive, role: before.role } as any,
    afterState: updates as any,
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json(updated);
}
