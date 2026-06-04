'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldX, Home, ArrowLeft, Lock } from 'lucide-react';
import { StyledWrapper } from '@/components/auth/authstyle';
import { PageTitle } from '@/components/ui/page-title';

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f0f4f8]">
      <PageTitle title="403 - Forbidden" />
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
              <div className="bg-red-100 p-4 rounded-xl">
                <ShieldX size={32} className="text-red-500" strokeWidth={2} />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-1.5 border-2 border-white">
                <Lock size={12} className="text-white" strokeWidth={3} />
              </div>
            </div>
          </div>

          {/* Badge */}
          <span className="bg-red-50 text-red-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
            Error 403
          </span>

          {/* Typography */}
          <h1 className="text-2xl font-black text-red-600 mb-3">Access Forbidden</h1>
          <p className="text-slate-500 text-xs leading-relaxed mb-6 px-4">
            Clearance level mismatch. You do not have permission to access this resource. 
            This area is restricted to administrators only.
          </p>

          {/* Warning Box */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg text-left">
            <div className="flex items-start gap-3">
              <Lock size={16} className="text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <h3 className="text-xs font-bold text-red-900 mb-0.5">Admin Role Required</h3>
                <p className="text-[10px] text-red-700 leading-relaxed">
                  Your current terminal session is unauthorized for administrative directories. If this is an error, request clearance from IT support.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary w-full"
              style={{ opacity: 1 }}
            >
              <Home size={16} className="mr-2" />
              Return to Dashboard
            </button>
            
            <button
              onClick={() => router.push('/login/auth')}
              className="external-btn w-full"
            >
              Change Account
            </button>
          </div>

          {/* Footer */}
          <p className="text-[8px] text-slate-300 font-bold mt-8 tracking-widest uppercase">
            Authorized Personnel Only © 2026 SkyLedger Logistics Corp.
          </p>
        </div>
      </StyledWrapper>
    </div>
  );
}
