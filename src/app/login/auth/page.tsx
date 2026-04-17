'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StyledWrapper } from '@/components/auth/authstyle';
import Captcha from '@/components/auth/captcha';

export default function LoginPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return;

    // Set the terminal session cookie (expires in 1 hour)
    document.cookie = "terminal_session=active; path=/; max-age=3600"; 
    
    // Initialize session and redirect to terminal dashboard
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <StyledWrapper>
        <div className="auth-card relative">
          <button 
            onClick={() => router.push('/')}
            className="back-btn"
          >
            ← BACK
          </button>

          <form onSubmit={handleLogin}>
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
              <h1 className="text-2xl font-black text-[#1a2d5a] tracking-tight">Welcome Back</h1>
              <p className="text-slate-400 text-[11px] font-semibold mt-1">
                Enter your credentials to access the terminal.
              </p>
            </div>

            <div className="space-y-4 mt-8">
              {/* User ID Field */}
              <div>
                <label className="label-text">User Identification</label>
                <div className="input-form">
                  <svg className="opacity-40" height={18} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <input type="text" className="input-field" placeholder="e.g. DISPATCH_CHIEF_01" required />
                </div>
              </div>

              {/* Password Field with Toggle */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="label-text mb-0">Security Key</label>
                  <span className="text-[10px] text-[#60a5fa] font-black cursor-pointer hover:underline uppercase">Forgot Access?</span>
                </div>
                <div className="input-form">
                  <svg className="opacity-40" height={18} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="input-field" 
                    placeholder="••••••••••••" 
                    required 
                  />
                  {/* Password Toggle Button */}
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Captcha onVerify={setIsVerified} />

            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-[#1a2d5a] cursor-pointer" id="remember" />
              <label htmlFor="remember" className="text-[11px] text-slate-500 font-bold cursor-pointer">Remember terminal session</label>
            </div>

            <button 
              type="submit" 
              className="btn-primary mt-6 group" 
              disabled={!isVerified}
            >
              INITIALIZE SESSION 
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </button>

            <div className="mt-4 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                New to the platform?{' '}
                <Link href="/login/register" className="text-[#60a5fa] hover:underline ml-1">
                  Create Account
                </Link>
              </p>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
              <div className="relative flex justify-center text-[9px] uppercase font-black text-slate-300 bg-white px-4 tracking-[0.2em]">External Auth</div>
            </div>

            <div className="flex gap-3">
              <button type="button" className="external-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Biometrics
              </button>
              <button type="button" className="external-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                SSO Hub
              </button>
            </div>

            <p className="text-[9px] text-center text-slate-300 font-bold mt-8 tracking-widest uppercase">
              © 2026 SKYLEDGER LOGISTICS CORP.
            </p>
          </form>
        </div>
      </StyledWrapper>
    </div>
  );
}