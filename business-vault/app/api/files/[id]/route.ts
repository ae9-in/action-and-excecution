import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { files } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { withAudit } from '@/lib/audit';

// DELETE /api/files/[id] — soft delete, Admin+ only, audit-logged
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [file] = await db.select().from(files).where(eq(files.id, id)).limit(1);
    if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await withAudit(
      {
        actorId: user.id,
        action: 'delete',
        entityType: 'file',
        entityId: id,
        beforeState: file as any,
        afterState: { deletedAt: new Date().toISOString() } as any,
        ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      },
      () =>
        db
          .update(files)
          .set({ deletedAt: new Date() })
          .where(eq(files.id, id))
          .returning()
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/files/[id]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/files/[id]
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [file] = await db.select().from(files).where(eq(files.id, id)).limit(1);
    if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(file);
  } catch (err: any) {
    console.error('Error in GET /api/files/[id]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
