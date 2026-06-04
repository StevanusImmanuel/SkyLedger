'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StyledWrapper } from '@/components/auth/authstyle';
import Captcha from '@/components/auth/captcha';
import { PageTitle } from '@/components/ui/page-title';
import { FormError } from '@/components/ui/form-error';

export default function LoginPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return;

    setError('');
    setErrors({});
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const formErrors: Record<string, string> = {};
    if (!email) {
      formErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      formErrors.email = 'Invalid email address';
    }

    if (!password) {
      formErrors.password = 'Password is required';
    } else if (password.length < 8) {
      formErrors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const servErr = data.error || 'Login failed';
        setError(servErr);
        if (servErr.toLowerCase().includes('email')) {
          setErrors(prev => ({ ...prev, email: servErr }));
        } else if (servErr.toLowerCase().includes('password') || servErr.toLowerCase().includes('credential')) {
          setErrors(prev => ({ ...prev, password: servErr }));
        }
        setIsLoading(false);
        return;
      }

      // Success - redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <PageTitle title="Login" />
      <StyledWrapper>
        <div className="auth-card relative">
          <button 
            onClick={() => router.push('/')}
            className="back-btn"
          >
            ← BACK
          </button>

          <form onSubmit={handleLogin} noValidate>
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
              {/* Error Message */}
              {error && (
                <div style={{
                  padding: '10px 14px',
                  background: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: 8,
                  color: '#b91c1c',
                  fontSize: 12,
                  fontWeight: 600
                }}>
                  {error}
                </div>
              )}

              {/* User ID Field */}
              <div>
                <label className="label-text">Email Address</label>
                <div 
                  className={`input-form ${errors.email ? 'border-red-500' : ''}`}
                  style={errors.email ? { borderColor: '#ef4444' } : {}}
                >
                  <svg className="opacity-40" height={18} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="email"
                    name="email"
                    className="input-field"
                    placeholder="e.g. admin@skyledger.com"
                    disabled={isLoading}
                    onChange={() => {
                      if (errors.email) {
                        setErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                  />
                </div>
                <FormError message={errors.email || ''} />
              </div>

              {/* Password Field with Toggle */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="label-text mb-0">Security Key</label>
                  <Link href="/login/forgot-password" className="text-[10px] text-[#60a5fa] font-black cursor-pointer hover:underline uppercase">Forgot Access?</Link>
                </div>
                <div 
                  className={`input-form ${errors.password ? 'border-red-500' : ''}`}
                  style={errors.password ? { borderColor: '#ef4444' } : {}}
                >
                  <svg className="opacity-40" height={18} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="input-field"
                    placeholder="••••••••••••"
                    disabled={isLoading}
                    onChange={() => {
                      if (errors.password) {
                        setErrors(prev => ({ ...prev, password: '' }));
                      }
                    }}
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
                <FormError message={errors.password || ''} />
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
              disabled={!isVerified || isLoading}
            >
              {isLoading ? 'AUTHENTICATING...' : 'INITIALIZE SESSION'}
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