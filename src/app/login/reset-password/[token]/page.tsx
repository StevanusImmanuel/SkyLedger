'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { StyledWrapper } from '@/components/auth/authstyle';
import Captcha from '@/components/auth/captcha';

export default function ResetPasswordPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return;

    setError('');
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/password-reset?action=reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login/auth');
      }, 2000);
    } catch (err) {
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <StyledWrapper>
        <div className="auth-card relative">
          <button
            onClick={() => router.push('/login/auth')}
            className="back-btn"
          >
            ← BACK TO LOGIN
          </button>

          <form onSubmit={handleSubmit}>
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
              <h1 className="text-2xl font-black text-[#1a2d5a] tracking-tight">Set New Password</h1>
              <p className="text-slate-400 text-[11px] font-semibold mt-1">
                Enter your new password below.
              </p>
            </div>

            <div className="space-y-4 mt-8">
              {/* Success Message */}
              {success && (
                <div style={{
                  padding: '10px 14px',
                  background: '#dcfce7',
                  border: '1px solid #10b981',
                  borderRadius: 8,
                  color: '#065f46',
                  fontSize: 12,
                  fontWeight: 600
                }}>
                  ✅ Password reset successful! Redirecting to login...
                </div>
              )}

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

              {/* New Password Field */}
              <div>
                <label className="label-text">New Password</label>
                <div className="input-form">
                  <svg className="opacity-40" height={18} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="input-field"
                    placeholder="••••••••"
                    required
                    disabled={isLoading || success}
                    minLength={8}
                  />
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
                <p className="text-[10px] text-slate-400 mt-1 ml-1">Minimum 8 characters</p>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="label-text">Confirm Password</label>
                <div className="input-form">
                  <svg className="opacity-40" height={18} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className="input-field"
                    placeholder="••••••••"
                    required
                    disabled={isLoading || success}
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Captcha onVerify={setIsVerified} />

            <button
              type="submit"
              className="btn-primary mt-6 group"
              disabled={!isVerified || isLoading || success}
            >
              {isLoading ? 'RESETTING...' : success ? 'SUCCESS!' : 'RESET PASSWORD'}
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </button>

            <div className="mt-4 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Remember your password?{' '}
                <Link href="/login/auth" className="text-[#60a5fa] hover:underline ml-1">
                  Back to Login
                </Link>
              </p>
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
