'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { StyledWrapper } from '@/components/auth/authstyle';

export default function RestrictedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50">
      <StyledWrapper>
        <div className="auth-card text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="bg-slate-100 p-4 rounded-xl">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-1 border-2 border-white">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="3">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
            </div>
          </div>

          <span className="bg-blue-50 text-[#1a2d5a] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
            Secure Terminal Access
          </span>
          
          <h1 className="text-2xl font-black text-[#1a2d5a] mb-3">Restricted Access</h1>
          <p className="text-slate-500 text-xs leading-relaxed mb-8 px-4">
            You are attempting to access a secured logistics environment. 
            To proceed to the SkyLedger Terminal, please verify your credentials.
          </p>

          <div className="space-y-3">
            <button 
              onClick={() => router.push('/login/auth')}
              className="btn-primary"
            >
              <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
              </svg>
              Return to Login
            </button>
            
            <button className="external-btn w-full">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Contact IT Support
            </button>
          </div>

          <div className="flex justify-center gap-4 mt-8 opacity-40">
             <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-500">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                AES-256
             </div>
             <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-500">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8l-8.2-1.8L3 8l6.7 3.5-3.5 3.5L3 14l1 1 1-1 3.5 3.5L13 21l1.2-1.8z" /></svg>
                Encrypted
             </div>
          </div>
          
          <p className="text-[8px] text-slate-300 font-bold mt-8 tracking-widest uppercase">
            Authorized Personnel Only © 2026 SkyLedger Logistics Corp
          </p>
        </div>
      </StyledWrapper>
    </div>
  );
}