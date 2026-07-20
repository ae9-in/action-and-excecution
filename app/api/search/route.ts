import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { files, structuredRecords, businessMembers, businesses } from '@/drizzle/schema';
import { sql, eq, and, inArray, isNull } from 'drizzle-orm';

// GET /api/search?q=
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;

  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ files: [], records: [] });

  // Determine accessible business IDs
  let accessibleBusinessIds: string[] = [];
  if (user.role === 'super_admin') {
    const allBusinesses = await db.select({ id: businesses.id }).from(businesses);
    accessibleBusinessIds = allBusinesses.map((b) => b.id);
  } else {
    const memberships = await db
      .select({ businessId: businessMembers.businessId })
      .from(businessMembers)
      .where(eq(businessMembers.userId, user.id));
    accessibleBusinessIds = memberships.map((m) => m.businessId);
  }

  if (accessibleBusinessIds.length === 0) return NextResponse.json({ files: [], records: [] });

  // Full-text search on files (GIN index)
  const fileResults = await db
    .select()
    .from(files)
    .where(
      and(
        inArray(files.businessId, accessibleBusinessIds),
        isNull(files.deletedAt),
        sql`to_tsvector('english', ${files.title} || ' ' || COALESCE(array_to_string(${files.tags}, ' '), '')) @@ plainto_tsquery('english', ${q})`
      )
    )
    .limit(20);

  // Full-text search on structured_records (JSONB cast to text)
  const recordResults = await db
    .select()
    .from(structuredRecords)
    .where(
      and(
        inArray(structuredRecords.businessId, accessibleBusinessIds),
        sql`${structuredRecords.data}::text ILIKE ${'%' + q + '%'}`
      )
    )
    .limit(20);

  return NextResponse.json({ files: fileResults, records: recordResults });
}
