'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faRotateRight } from '@fortawesome/free-solid-svg-icons';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error('Settings Module Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
        <FontAwesomeIcon icon={faTriangleExclamation} size="2xl" />
      </div>

      <h2 className="text-xl font-bold text-[#1a2d5a] mb-2">
        Configuration Load Failure
      </h2>
      
      <p className="text-sm text-slate-500 max-w-md mb-6">
        The system encountered an error while loading your profile settings. 
        This may be due to a temporary connection drop with the server.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a2d5a] text-white text-sm font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
        >
          <FontAwesomeIcon icon={faRotateRight} />
          RETRY INITIALIZATION
        </button>
        
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          RETURN TO DASHBOARD
        </button>
      </div>

      {error.digest && (
        <p className="mt-8 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          Error Signature: {error.digest}
        </p>
      )}
    </div>
  );
}