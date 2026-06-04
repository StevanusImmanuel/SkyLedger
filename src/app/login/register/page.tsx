'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StyledWrapper } from '@/components/auth/authstyle';
import Captcha from '@/components/auth/captcha';
import { PageTitle } from '@/components/ui/page-title';
import { FormError } from '@/components/ui/form-error';

export default function RegisterPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return;

    setError('');
    setErrors({});
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const department = formData.get('department') as string;
    const termsChecked = (e.target as HTMLFormElement).elements.namedItem('terms') as HTMLInputElement | null;
    const isTermsChecked = termsChecked ? termsChecked.checked : false;

    const formErrors: Record<string, string> = {};

    // Name validation
    if (!name) {
      formErrors.name = 'Personnel full name is required';
    } else if (name.length < 2) {
      formErrors.name = 'Name must be at least 2 characters';
    } else if (name.length > 255) {
      formErrors.name = 'Name must not exceed 255 characters';
    }

    // Email validation
    if (!email) {
      formErrors.email = 'Operational email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      formErrors.email = 'Invalid email address';
    }

    // Department validation
    if (department && department.length > 100) {
      formErrors.department = 'Department must not exceed 100 characters';
    }

    // Password validation
    if (!password) {
      formErrors.password = 'Security key is required';
    } else {
      if (password.length < 8) {
        formErrors.password = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(password)) {
        formErrors.password = 'Must contain at least one uppercase letter';
      } else if (!/[0-9]/.test(password)) {
        formErrors.password = 'Must contain at least one number';
      }
    }

    // Terms validation
    if (!isTermsChecked) {
      formErrors.terms = 'You must agree to the terminal protocol';
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, department }),
      });

      const data = await res.json();

      if (!res.ok) {
        const servErr = data.error || 'Registration failed';
        setError(servErr);
        if (servErr.toLowerCase().includes('email')) {
          setErrors(prev => ({ ...prev, email: servErr }));
        } else if (servErr.toLowerCase().includes('name')) {
          setErrors(prev => ({ ...prev, name: servErr }));
        } else if (servErr.toLowerCase().includes('password')) {
          setErrors(prev => ({ ...prev, password: servErr }));
        } else if (servErr.toLowerCase().includes('department')) {
          setErrors(prev => ({ ...prev, department: servErr }));
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
      <PageTitle title="Register" />
      <StyledWrapper>
        <div className="auth-card relative">
          <button 
            onClick={() => router.push('/login/auth')}
            className="back-btn"
          >
            ← LOGIN
          </button>

          <form onSubmit={handleRegister} noValidate>
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
                <div 
                  className={`input-form ${errors.name ? 'border-red-500' : ''}`}
                  style={errors.name ? { borderColor: '#ef4444' } : {}}
                >
                  <svg className="opacity-40" height={16} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    name="name"
                    className="input-field"
                    placeholder="e.g. John Doe"
                    disabled={isLoading}
                    onChange={() => {
                      if (errors.name) {
                        setErrors(prev => ({ ...prev, name: '' }));
                      }
                    }}
                  />
                </div>
                <FormError message={errors.name || ''} />
              </div>

              {/* Email Field */}
              <div className="md:col-span-2">
                <label className="label-text">Operational Email</label>
                <div 
                  className={`input-form ${errors.email ? 'border-red-500' : ''}`}
                  style={errors.email ? { borderColor: '#ef4444' } : {}}
                >
                  <svg className="opacity-40" height={16} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    type="email"
                    name="email"
                    className="input-field"
                    placeholder="name@skyledger.com"
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

              {/* Department Field */}
              <div className="md:col-span-2">
                <label className="label-text">Department</label>
                <div 
                  className={`input-form ${errors.department ? 'border-red-500' : ''}`}
                  style={errors.department ? { borderColor: '#ef4444' } : {}}
                >
                  <svg className="opacity-40" height={16} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <input
                    type="text"
                    name="department"
                    className="input-field"
                    placeholder="e.g. Operations"
                    disabled={isLoading}
                    onChange={() => {
                      if (errors.department) {
                        setErrors(prev => ({ ...prev, department: '' }));
                      }
                    }}
                  />
                </div>
                <FormError message={errors.department || ''} />
              </div>

              {/* Password Field */}
              <div className="md:col-span-2">
                <label className="label-text">Security Key</label>
                <div 
                  className={`input-form ${errors.password ? 'border-red-500' : ''}`}
                  style={errors.password ? { borderColor: '#ef4444' } : {}}
                >
                  <svg className="opacity-40" height={16} viewBox="0 0 24 24" fill="none" stroke="#1a2d5a" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type="password"
                    name="password"
                    className="input-field"
                    placeholder="••••••••"
                    disabled={isLoading}
                    onChange={() => {
                      if (errors.password) {
                        setErrors(prev => ({ ...prev, password: '' }));
                      }
                    }}
                  />
                </div>
                <FormError message={errors.password || ''} />
              </div>
            </div>

            <Captcha onVerify={setIsVerified} />

            {/* Terms and Protocol Agreement */}
            <div className="flex flex-col gap-1 mt-4">
              <div className="flex items-start gap-2">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 rounded border-slate-300 accent-[#1a2d5a] cursor-pointer" 
                  id="terms" 
                  name="terms"
                  disabled={isLoading}
                  onChange={(e) => {
                    if (errors.terms && e.target.checked) {
                      setErrors(prev => ({ ...prev, terms: '' }));
                    }
                  }}
                />
                <label htmlFor="terms" className="text-[10px] text-slate-500 font-bold cursor-pointer leading-tight uppercase">
                  I agree to the terminal protocol and data privacy regulations.
                </label>
              </div>
              <FormError message={errors.terms || ''} />
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