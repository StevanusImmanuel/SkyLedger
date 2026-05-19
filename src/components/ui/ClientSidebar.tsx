'use client';

import { SessionNavBar } from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';

export function ClientSidebar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed left-0 z-40 h-full w-[3.5rem] shrink-0 border-r border-[#e8edf4] bg-white" />
    );
  }

  return <SessionNavBar />;
}
