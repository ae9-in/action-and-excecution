import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { files, fileContents, businessMembers } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as any;

    const { id } = await context.params;

    // Fetch file metadata
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, id))
      .limit(1);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Verify access
    if (user.role !== 'super_admin') {
      const [membership] = await db
        .select()
        .from(businessMembers)
        .where(and(eq(businessMembers.userId, user.id), eq(businessMembers.businessId, file.businessId)))
        .limit(1);
      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch file contents binary blob
    const [content] = await db
      .select()
      .from(fileContents)
      .where(eq(fileContents.fileId, id))
      .limit(1);

    if (!content) {
      return NextResponse.json({ error: 'File content not found' }, { status: 404 });
    }

    const buffer = Buffer.from(content.base64Data, 'base64');
    
    // Return streaming response with appropriate headers
    return new Response(buffer, {
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.title)}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/files/download:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
