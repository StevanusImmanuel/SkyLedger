'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { StyledWrapper } from '@/components/auth/authstyle';
import { PageTitle } from '@/components/ui/page-title';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f0f4f8]">
      <PageTitle title="404 - Page Not Found" />
      <StyledWrapper>
        <div className="auth-card text-center mx-auto" style={{ maxWidth: '440px' }}>
          {/* Back Button */}
          <button 
            onClick={() => router.back()}
            className="back-btn"
          >
            <ArrowLeft size={12} strokeWidth={3} className="mr-1" />
            BACK
          </button>

          {/* Icon Section */}
          <div className="flex justify-center mb-6 mt-6">
            <div className="relative">
              <div className="bg-slate-100 p-4 rounded-xl">
                <FileQuestion size={32} className="text-slate-400" strokeWidth={2} />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1 border-2 border-white">
                <span className="text-white font-black text-[10px] px-1.5">?</span>
              </div>
            </div>
          </div>

          {/* Badge */}
          <span className="bg-blue-50 text-[#1a2d5a] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
            Error 404
          </span>

          {/* Typography */}
          <h1 className="text-2xl font-black text-[#1a2d5a] mb-3">Page Not Found</h1>
          <p className="text-slate-500 text-xs leading-relaxed mb-8 px-4">
            The requested terminal path does not exist, has been restricted, or was moved. 
            Please check the URL routing or return to the main dashboard.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary w-full"
              style={{ opacity: 1 }}
            >
              <Home size={16} className="mr-2" />
              Go to Dashboard
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="external-btn w-full"
            >
              Return Home
            </button>
          </div>

          {/* Footer */}
          <p className="text-[8px] text-slate-300 font-bold mt-8 tracking-widest uppercase">
            © 2026 SkyLedger Logistics Corp.
          </p>
        </div>
      </StyledWrapper>
    </div>
  );
}
