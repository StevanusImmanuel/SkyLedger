'use client';

import { useState, useEffect } from 'react';

interface ClientTimestampProps {
  timestamp: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ClientTimestamp({ timestamp, className, style }: ClientTimestampProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={className} style={style}>--:--</span>;
  }

  const formattedTime = new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return <span className={className} style={style}>{formattedTime}</span>;
}
