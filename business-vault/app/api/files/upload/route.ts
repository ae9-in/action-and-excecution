import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { files, fileContents, businessMembers } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as any;

    const formData = await req.formData();
    const fileObj = formData.get('file') as File | null;
    const businessId = formData.get('businessId') as string | null;
    const categoryIdStr = formData.get('categoryId') as string | null;
    const title = formData.get('title') as string | null;
    const competitorId = formData.get('competitorId') as string | null;
    const tagsStr = formData.get('tags') as string | null;

    if (!fileObj || !businessId || !categoryIdStr || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify upload permission
    if (user.role !== 'super_admin') {
      const [membership] = await db
        .select()
        .from(businessMembers)
        .where(and(eq(businessMembers.userId, user.id), eq(businessMembers.businessId, businessId)))
        .limit(1);
      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Read binary data and convert to base64
    const buffer = Buffer.from(await fileObj.arrayBuffer());
    const base64Data = buffer.toString('base64');
    const fileSizeBytes = fileObj.size;
    const mimeType = fileObj.type;

    // Resolve resourceType
    let resourceType: 'image' | 'video' | 'raw' | 'pdf' = 'raw';
    if (mimeType.startsWith('image/')) {
      resourceType = 'image';
    } else if (mimeType.startsWith('video/')) {
      resourceType = 'video';
    } else if (mimeType === 'application/pdf') {
      resourceType = 'pdf';
    }

    // Insert metadata and contents in a single transaction
    const [insertedFile] = await db.transaction(async (tx) => {
      const [f] = await tx
        .insert(files)
        .values({
          businessId,
          categoryId: parseInt(categoryIdStr),
          title,
          resourceType,
          mimeType,
          fileSizeBytes,
          tags: tagsStr ? JSON.parse(tagsStr) : null,
          competitorId: competitorId || null,
          uploadedBy: user.id,
        })
        .returning();

      await tx.insert(fileContents).values({
        fileId: f.id,
        base64Data,
      });

      return [f];
    });

    return NextResponse.json(insertedFile, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/files/upload:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
