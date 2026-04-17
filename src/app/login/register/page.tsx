'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StyledWrapper } from '@/components/auth/authstyle';
import Captcha from '@/components/auth/captcha';

export default function RegisterPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [generatedId, setGeneratedId] = useState('');
  const router = useRouter();

  // SkyLedger ID Generation Logic
  useEffect(() => {
    const prefix = "SL"; // SkyLedger Prefix
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 random digits
    const timestamp = Date.now().toString().slice(-2); // Last 2 digits of timestamp
    setGeneratedId(`${prefix}-${randomNum}${timestamp}`);
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return;

    // Terminal session activation
    console.log("Registering Personnel ID:", generatedId);
    document.cookie = "terminal_session=active; path=/; max-age=3600"; 
    
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
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
              {/* Full Name Field */}
              <div className="md:col-span-2">
                <label className="label-text">Personnel Full Name</label>
                <div className="input-form">
                  <svg className="opacity-40" height={16} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <input type="text" className="input-field" placeholder="e.g. John Doe" required />
                </div>
              </div>

              {/* Email Field */}
              <div className="md:col-span-2">
                <label className="label-text">Operational Email</label>
                <div className="input-form">
                  <svg className="opacity-40" height={16} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input type="email" className="input-field" placeholder="name@skyledger.com" required />
                </div>
              </div>

              {/* Auto-Generated User ID Field */}
              <div>
                <label className="label-text">System Generated ID</label>
                <div className="input-form !bg-slate-100 border-dashed !border-slate-300">
                  <svg className="opacity-40" height={16} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input 
                    type="text" 
                    className="input-field opacity-60 cursor-not-allowed" 
                    value={generatedId} 
                    readOnly 
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="label-text">Security Key</label>
                <div className="input-form">
                  <svg className="opacity-40" height={16} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input type="password" className="input-field" placeholder="••••••••" required />
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
              disabled={!isVerified}
            >
              REGISTER ACCOUNT 
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