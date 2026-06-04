import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/dal';
import ActivityLogsClient from './ActivityLogsClient';

export const metadata = {
  title: 'Activity Logs | SkyLedger',
};

export default async function ActivityLogsPage() {
  try {
    await requireRole('admin');
  } catch {
    redirect('/forbidden');
  }

  return <ActivityLogsClient />;
}
