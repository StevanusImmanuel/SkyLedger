'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StyledWrapper } from '@/components/auth/authstyle';

export default function UnauthorizedForm() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <StyledWrapper>
        <div className="auth-card relative">
          <button
            onClick={() => router.push('/')}
            className="back-btn"
          >
            ← BACK TO HOME
          </button>

          <div className="title-section text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/SkyLedger no text logo-Photoroom.png"
                width={44}
                height={44}
                alt="SkyLedger Logo"
                priority
              />
            </div>
            <h1 className="text-2xl font-black text-[#1a2d5a] tracking-tight">Access Denied</h1>
            <p className="text-slate-400 text-[11px] font-semibold mt-1">
              You need to be authenticated to access this resource.
            </p>
          </div>

          <div className="space-y-4 mt-8">
            {/* Warning Message */}
            <div style={{
              padding: '16px 18px',
              background: '#fef3c7',
              border: '2px solid #f59e0b',
              borderRadius: 12,
              color: '#92400e',
              fontSize: 13,
              fontWeight: 700,
              textAlign: 'center',
              animation: 'slideInUp 0.5s ease-out 0.3s forwards',
              opacity: 0
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
              <div>This page requires authentication</div>
              <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>
                Please log in to continue
              </div>
            </div>

            {/* Action Buttons */}
            <Link href="/login/auth">
              <button
                type="button"
                className="btn-primary group"
              >
                GO TO LOGIN
                <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </button>
            </Link>

            <div className="mt-4 text-center" style={{
              animation: 'slideInUp 0.5s ease-out 0.9s forwards',
              opacity: 0
            }}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Don't have an account?{' '}
                <Link href="/login/register" className="text-[#60a5fa] hover:underline ml-1">
                  Create Account
                </Link>
              </p>
            </div>

            <div className="relative my-8" style={{
              animation: 'fadeIn 0.5s ease-out 1s forwards',
              opacity: 0
            }}>
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
              <div className="relative flex justify-center text-[9px] uppercase font-black text-slate-300 bg-white px-4 tracking-[0.2em]">Or Return</div>
            </div>

            <Link href="/">
              <button
                type="button"
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748b',
                  gap: 8,
                  border: '1.5px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  animation: 'slideInUp 0.5s ease-out 1.1s forwards',
                  opacity: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1a2d5a';
                  e.currentTarget.style.color = '#1a2d5a';
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Back to Homepage
              </button>
            </Link>

            <p className="text-[9px] text-center text-slate-300 font-bold mt-8 tracking-widest uppercase" style={{
              animation: 'fadeIn 0.5s ease-out 1.2s forwards',
              opacity: 0
            }}>
              © 2026 SKYLEDGER LOGISTICS CORP.
            </p>
          </div>
        </div>
      </StyledWrapper>
    </div>
  );
}
