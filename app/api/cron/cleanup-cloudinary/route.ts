import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { files } from '@/drizzle/schema';
import { lte, isNotNull, and, eq } from 'drizzle-orm';
import { deleteCloudinaryAsset } from '@/lib/cloudinary';

// GET /api/cron/cleanup-cloudinary
// Triggered by Vercel Cron or any HTTP scheduler with x-cron-secret header
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Find all files soft-deleted more than 30 days ago
  const staleFiles = await db
    .select()
    .from(files)
    .where(
      and(
        isNotNull(files.deletedAt),
        lte(files.deletedAt, thirtyDaysAgo)
      )
    );

  let deleted = 0;
  let errors = 0;

  for (const file of staleFiles) {
    try {
      if (file.cloudinaryPublicId) {
        const resourceType =
          file.resourceType === 'pdf' ? 'raw' : (file.resourceType as 'image' | 'video' | 'raw');
        await deleteCloudinaryAsset(file.cloudinaryPublicId, resourceType);
      }

      // Hard-delete from DB
      await db.delete(files).where(eq(files.id, file.id));

      deleted++;
    } catch (err) {
      console.error(`Failed to delete Cloudinary asset ${file.cloudinaryPublicId}:`, err);
      errors++;
    }
  }

  return NextResponse.json({
    processed: staleFiles.length,
    deleted,
    errors,
    timestamp: new Date().toISOString(),
  });
}
