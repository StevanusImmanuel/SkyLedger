'use client';

import { useState, useEffect } from 'react';

export default function LiveTimestamp() {
  const [hasMounted, setHasMounted] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    setHasMounted(true);
    
    const formatTime = () => {
      return new Date().toISOString().replace('T', ' ').split('.')[0];
    };

    // Set initial time
    setTime(formatTime());

    // Update every second
    const timer = setInterval(() => {
      setTime(formatTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // During SSR (Server Side Rendering), hasMounted is false.
  // We return a matching empty span or a generic label to prevent the mismatch.
  if (!hasMounted) {
    return (
      <span className="text-[11px] font-mono text-slate-500 font-semibold tracking-tighter">
        DATA TIMESTAMP: LOADING...
      </span>
    );
  }

  return (
    <span className="text-[11px] font-mono text-slate-500 font-semibold tracking-tighter">
      DATA TIMESTAMP: {time} UTC
    </span>
  );
}