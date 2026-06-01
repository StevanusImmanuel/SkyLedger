'use client';

import dynamic from 'next/dynamic';

const AccountManagementClient = dynamic(() => import('./AccountManagementClient'), {
  ssr: false,
});

export default function AccountManagementWrapper() {
  return <AccountManagementClient />;
}
