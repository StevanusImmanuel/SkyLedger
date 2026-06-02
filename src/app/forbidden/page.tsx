'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldX, Home, ArrowLeft, Lock } from 'lucide-react';
import { PageTitle } from '@/components/ui/page-title';

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-slate-100">
      <PageTitle title="403 - Forbidden" />
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-red-200 p-8 md:p-12">
          {/* Icon Section */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="bg-red-100 p-6 rounded-2xl">
                <ShieldX size={64} className="text-red-500" strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-red-600 rounded-full p-2 border-4 border-white shadow-lg">
                <Lock size={20} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Error Code */}
          <div className="text-center mb-4">
            <div className="inline-block bg-red-50 text-red-700 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest mb-4">
              Error 403
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-red-600 mb-3 tracking-tight">
              Access Forbidden
            </h1>
            <p className="text-slate-600 text-base leading-relaxed max-w-md mx-auto">
              You don't have permission to access this resource. This area is restricted to administrators only.
            </p>
          </div>

          {/* Warning Box */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-start gap-3">
              <Lock size={20} className="text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <h3 className="text-sm font-bold text-red-900 mb-1">Administrator Access Required</h3>
                <p className="text-xs text-red-700 leading-relaxed">
                  This page requires administrator privileges. If you believe you should have access, please contact your system administrator.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-all duration-200"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
              Go Back
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1a2d5a] hover:bg-[#0f1a3a] text-white font-bold text-sm rounded-lg transition-all duration-200 shadow-lg"
            >
              <Home size={18} strokeWidth={2.5} />
              Go to Dashboard
            </Link>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-black text-slate-300 bg-white px-4 tracking-widest">
              Need Help?
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-2">Contact Support</h3>
            <p className="text-xs text-slate-600 mb-3">
              If you need administrative access or believe this is an error, contact your system administrator or support team.
            </p>
            <div className="flex gap-2">
              <div className="text-xs bg-white px-3 py-2 rounded border border-slate-200 font-mono text-slate-700">
                support@skyledger.com
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-center text-xs text-slate-400 font-bold mt-8 tracking-widest uppercase">
            © 2026 SkyLedger Logistics Corp.
          </p>
        </div>
      </div>
    </div>
  );
}
