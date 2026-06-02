'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StyledWrapper } from '@/components/auth/authstyle';
import Captcha from '@/components/auth/captcha';
import { PageTitle } from '@/components/ui/page-title';

export default function ForgotPasswordPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return;

    setError('');
    setSuccess('');
    setResetLink('');
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;

    try {
      const res = await fetch('/api/password-reset?action=request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to request password reset');
        setIsLoading(false);
        return;
      }

      setSuccess(data.message);

      // In development, show the reset link
      if (data.resetLink) {
        setResetLink(data.resetLink);
      }

      setIsLoading(false);
    } catch (err) {
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <PageTitle title="Forgot Password" />
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
              <h1 className="text-2xl font-black text-[#1a2d5a] tracking-tight">Reset Password</h1>
              <p className="text-slate-400 text-[11px] font-semibold mt-1">
                Enter your email to receive a password reset link.
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
                  {success}
                </div>
              )}

              {/* Development Reset Link */}
              {resetLink && (
                <div style={{
                  padding: '10px 14px',
                  background: '#dbeafe',
                  border: '1px solid #3b82f6',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  <div style={{ color: '#1e40af', marginBottom: 6 }}>Development Mode - Reset Link:</div>
                  <Link
                    href={resetLink.replace(window.location.origin, '')}
                    style={{ color: '#2563eb', textDecoration: 'underline', wordBreak: 'break-all' }}
                  >
                    Click here to reset password
                  </Link>
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

              {/* Email Field */}
              <div>
                <label className="label-text">Email Address</label>
                <div className="input-form">
                  <svg className="opacity-40" height={18} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    type="email"
                    name="email"
                    className="input-field"
                    placeholder="e.g. admin@skyledger.com"
                    required
                    disabled={isLoading || !!success}
                  />
                </div>
              </div>
            </div>

            <Captcha onVerify={setIsVerified} />

            <button
              type="submit"
              className="btn-primary mt-6 group"
              disabled={!isVerified || isLoading || !!success}
            >
              {isLoading ? 'SENDING...' : success ? 'REQUEST SENT' : 'SEND RESET LINK'}
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
