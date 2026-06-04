'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { StyledWrapper } from '@/components/auth/authstyle';
import { PageTitle } from '@/components/ui/page-title';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
        <PageTitle title="System Failure" />
        <StyledWrapper>
          <div className="auth-card text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="bg-red-100 p-4 rounded-xl">
                  <AlertTriangle size={32} className="text-red-600" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-1 border-2 border-white">
                  <span className="text-white font-black text-xs px-1">!</span>
                </div>
              </div>
            </div>

            <span className="bg-red-50 text-red-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
              Critical Error
            </span>

            <h1 className="text-2xl font-black text-[#1a2d5a] mb-3">Terminal Failure</h1>
            <p className="text-slate-500 text-xs leading-relaxed mb-6 px-4">
              An unexpected system crash was intercepted by the global error handler. 
              The error has been logged. Please try reloading the terminal session.
            </p>

            {error.message && (
              <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Diagnostic Info</p>
                <p className="font-mono text-xs text-red-600 break-all">{error.message}</p>
              </div>
            )}

            <button
              onClick={() => reset()}
              className="btn-primary w-full"
              style={{ opacity: 1 }}
            >
              <RefreshCw size={16} className="mr-2 animate-spin-hover" />
              Reload Terminal
            </button>

            <p className="text-[8px] text-slate-300 font-bold mt-8 tracking-widest uppercase">
              SkyLedger Terminal Ops © 2026
            </p>
          </div>
        </StyledWrapper>
      </body>
    </html>
  );
}
