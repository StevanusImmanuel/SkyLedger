import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/dal';
import AccountManagementWrapper from './AccountManagementWrapper';

export default async function AccountManagementPage() {
  try {
    await requireRole('admin');
  } catch {
    redirect('/login/restricted');
  }

  return <AccountManagementWrapper />;
}
