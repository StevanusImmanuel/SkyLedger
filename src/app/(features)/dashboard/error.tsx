'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an analytics provider if needed
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-50 p-4 rounded-full mb-6">
        <AlertTriangle className="w-10 h-10 text-red-600" />
      </div>
      
      <h2 className="text-2xl font-black text-[#1a2d5a] italic uppercase tracking-tighter mb-2">
        Operational Failure
      </h2>
      
      <p className="text-slate-500 text-sm max-w-md mb-8 font-medium">
        We encountered an error while processing the analytics data. This may be due to a synchronization issue with the cargo database.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 bg-[#1a2d5a] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#253d75] transition-all shadow-lg shadow-blue-900/10"
        >
          <RotateCcw size={18} />
          RETRY SYSTEM
        </button>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
        >
          <Home size={18} />
          RETURN HOME
        </Link>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-12 p-4 bg-slate-50 rounded-lg border border-slate-100 text-left">
          <p className="text-[10px] font-mono text-slate-400 uppercase mb-2">Technical Logs:</p>
          <code className="text-xs text-red-500 font-mono break-all">
            {error.message || "Unknown operational error"}
          </code>
        </div>
      )}
    </div>
  );
}