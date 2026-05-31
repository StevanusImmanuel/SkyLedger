import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/dal';
import AccountManagementClient from './AccountManagementClient';

export default async function AccountManagementPage() {
  try {
    await requireRole('admin');
  } catch {
    redirect('/login/restricted');
  }

  return <AccountManagementClient />;
}
