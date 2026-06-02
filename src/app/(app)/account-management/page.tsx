import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/dal';
import AccountManagementWrapper from './AccountManagementWrapper';

export const metadata = {
  title: 'Account Management | SkyLedger',
};

export default async function AccountManagementPage() {
  try {
    await requireRole('admin');
  } catch {
    redirect('/forbidden');
  }

  return <AccountManagementWrapper />;
}
