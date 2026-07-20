import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { files, businessMembers } from '@/drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';

// GET /api/files?businessId=&categoryId=
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    const { searchParams } = req.nextUrl;
    const businessId = searchParams.get('businessId');
    const categoryId = searchParams.get('categoryId');

    if (!businessId || !categoryId) {
      return NextResponse.json({ error: 'businessId and categoryId required' }, { status: 400 });
    }

    // Verify access
    if (user.role !== 'super_admin') {
      const [membership] = await db
        .select()
        .from(businessMembers)
        .where(and(eq(businessMembers.userId, user.id), eq(businessMembers.businessId, businessId)))
        .limit(1);
      if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.businessId, businessId),
          eq(files.categoryId, parseInt(categoryId)),
          isNull(files.deletedAt)
        )
      )
      .orderBy(files.createdAt);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in GET /api/files:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/files — record a Cloudinary upload in the database
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    const body = await req.json();
    const {
      businessId,
      categoryId,
      title,
      cloudinaryPublicId,
      cloudinaryUrl,
      thumbnailUrl,
      resourceType,
      fileSizeBytes,
      tags,
      competitorId,
    } = body;

    if (!businessId || !categoryId || !title || !cloudinaryPublicId || !cloudinaryUrl || !resourceType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify permission to upload (any assigned member or admin+)
    if (user.role !== 'super_admin') {
      const [membership] = await db
        .select()
        .from(businessMembers)
        .where(and(eq(businessMembers.userId, user.id), eq(businessMembers.businessId, businessId)))
        .limit(1);
      if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [file] = await db
      .insert(files)
      .values({
        businessId,
        categoryId: parseInt(categoryId),
        title,
        cloudinaryPublicId,
        cloudinaryUrl,
        thumbnailUrl,
        resourceType,
        fileSizeBytes,
        tags,
        competitorId: competitorId ?? null,
        uploadedBy: user.id,
      })
      .returning();

    return NextResponse.json(file, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/files:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
