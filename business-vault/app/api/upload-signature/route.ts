import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateUploadSignature } from '@/lib/cloudinary';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { orgSlug, businessSlug, categoryKey, resourceType } = body;

  if (!orgSlug || !businessSlug || !categoryKey || !resourceType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const fileId = randomUUID();

  const signature = generateUploadSignature({
    orgSlug,
    businessSlug,
    categoryKey,
    fileId,
    resourceType,
  });

  return NextResponse.json(signature);
}
