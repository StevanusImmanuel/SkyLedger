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
            <h1 className="text-2xl font-black text-[#1a2d5a] tracking-tight">Authentication Required</h1>
            <p className="text-slate-400 text-[11px] font-semibold mt-1">
              Please log in to access this terminal resource.
            </p>
          </div>

          <div className="space-y-4 mt-8">
            {/* Info Message - styled like login form inputs */}
            <div style={{
              padding: '16px 18px',
              background: '#f8fafc',
              border: '1.5px solid #1a2d5a',
              borderRadius: 10,
              color: '#1a2d5a',
              fontSize: 13,
              fontWeight: 700,
              textAlign: 'center',
              animation: 'slideInUp 0.5s ease-out 0.3s forwards',
              opacity: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                RESTRICTED ACCESS
              </div>
              <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>
                This page requires valid terminal credentials
              </div>
            </div>

            {/* Primary Action Button */}
            <Link href="/login/auth">
              <button
                type="button"
                className="btn-primary group"
              >
                INITIALIZE SESSION
                <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </button>
            </Link>

            <div className="mt-4 text-center" style={{
              animation: 'slideInUp 0.5s ease-out 0.9s forwards',
              opacity: 0
            }}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                New to the platform?{' '}
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
              <div className="relative flex justify-center text-[9px] uppercase font-black text-slate-300 bg-white px-4 tracking-[0.2em]">Alternative Actions</div>
            </div>

            <div className="flex gap-3" style={{
              animation: 'slideInUp 0.5s ease-out 1.1s forwards',
              opacity: 0
            }}>
              <Link href="/" className="flex-1">
                <button
                  type="button"
                  className="external-btn w-full"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  Homepage
                </button>
              </Link>
              <Link href="/tracking" className="flex-1">
                <button
                  type="button"
                  className="external-btn w-full"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Track Cargo
                </button>
              </Link>
            </div>

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

