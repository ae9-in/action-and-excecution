export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AuditLogsClient from './AuditLogsClient';

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const user = session.user as any;
  if (user.role !== 'super_admin') redirect('/dashboard');

  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page ?? '1');

  return <AuditLogsClient page={page} />;
}
