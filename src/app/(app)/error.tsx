'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { StyledWrapper } from '@/components/auth/authstyle';
import { PageTitle } from '@/components/ui/page-title';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console or logging service
    console.error('App runtime crash:', error);
  }, [error]);

  return (
    <div className="w-full flex items-center justify-center min-h-[70vh] p-4">
      <PageTitle title="Application Error" />
      <StyledWrapper>
        <div className="auth-card text-center mx-auto" style={{ maxWidth: '440px' }}>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="bg-amber-100 p-4 rounded-xl">
                <AlertCircle size={32} className="text-amber-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-600 rounded-full p-1 border-2 border-white">
                <span className="text-white font-black text-xs px-1">!</span>
              </div>
            </div>
          </div>

          <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
            Application Interruption
          </span>

          <h1 className="text-xl font-black text-[#1a2d5a] mb-2">Intermittent Failure</h1>
          <p className="text-slate-500 text-xs leading-relaxed mb-6 px-4">
            A component inside the terminal encountered a rendering exception. You can reload this view or navigate away using the sidebar.
          </p>

          {error.message && (
            <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Error Details</p>
              <p className="font-mono text-[11px] text-amber-700 break-all">{error.message}</p>
            </div>
          )}

          <button
            onClick={() => reset()}
            className="btn-primary w-full"
            style={{ opacity: 1 }}
          >
            <RefreshCw size={16} className="mr-2 animate-spin-hover" />
            Retry View
          </button>
        </div>
      </StyledWrapper>
    </div>
  );
}
