'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StyledWrapper } from '@/components/auth/authstyle';
import Captcha from '@/components/auth/captcha';
import { PageTitle } from '@/components/ui/page-title';

export default function RegisterPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return;

    setError('');
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const department = formData.get('department') as string;

    try {
      const res = await fetch('/api/auth?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, department }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
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
      <PageTitle title="Register" />
      <StyledWrapper>
        <div className="auth-card relative">
          <button 
            onClick={() => router.push('/login/auth')}
            className="back-btn"
          >
            ← LOGIN
          </button>

          <form onSubmit={handleRegister}>
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
              <h1 className="text-2xl font-black text-[#1a2d5a] tracking-tight">Create Identity</h1>
              <p className="text-slate-400 text-[11px] font-semibold mt-1">
                Register your credentials to the SkyLedger network.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {/* Error Message */}
              {error && (
                <div className="md:col-span-2" style={{
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

              {/* Full Name Field */}
              <div className="md:col-span-2">
                <label className="label-text">Personnel Full Name</label>
                <div className="input-form">
                  <svg className="opacity-40" height={16} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    name="name"
                    className="input-field"
                    placeholder="e.g. John Doe"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="md:col-span-2">
                <label className="label-text">Operational Email</label>
                <div className="input-form">
                  <svg className="opacity-40" height={16} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    type="email"
                    name="email"
                    className="input-field"
                    placeholder="name@skyledger.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Department Field */}
              <div className="md:col-span-2">
                <label className="label-text">Department</label>
                <div className="input-form">
                  <svg className="opacity-40" height={16} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <input
                    type="text"
                    name="department"
                    className="input-field"
                    placeholder="e.g. Operations"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="md:col-span-2">
                <label className="label-text">Security Key</label>
                <div className="input-form">
                  <svg className="opacity-40" height={16} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type="password"
                    name="password"
                    className="input-field"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <Captcha onVerify={setIsVerified} />

            {/* Terms and Protocol Agreement */}
            <div className="flex items-start gap-2 mt-4">
              <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-300 accent-[#1a2d5a] cursor-pointer" id="terms" required />
              <label htmlFor="terms" className="text-[10px] text-slate-500 font-bold cursor-pointer leading-tight uppercase">
                I agree to the terminal protocol and data privacy regulations.
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary mt-6 group"
              disabled={!isVerified || isLoading}
            >
              {isLoading ? 'CREATING ACCOUNT...' : 'REGISTER ACCOUNT'}
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </button>

            <div className="mt-4 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Already registered?{' '}
                <Link href="/login/auth" className="text-[#60a5fa] hover:underline ml-1">
                  Access Terminal
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