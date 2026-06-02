'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { PageTitle } from '@/components/ui/page-title';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <PageTitle title="404 - Not Found" />
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12">
          {/* Icon Section */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="bg-slate-100 p-6 rounded-2xl">
                <FileQuestion size={64} className="text-slate-400" strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-red-500 rounded-full p-2 border-4 border-white shadow-lg">
                <span className="text-white font-black text-xl">!</span>
              </div>
            </div>
          </div>

          {/* Error Code */}
          <div className="text-center mb-4">
            <div className="inline-block bg-blue-50 text-[#1a2d5a] text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest mb-4">
              Error 404
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#1a2d5a] mb-3 tracking-tight">
              Page Not Found
            </h1>
            <p className="text-slate-600 text-base leading-relaxed max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved.
              Please check the URL or return to the homepage.
            </p>
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
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1a2d5a] hover:bg-[#0f1a3a] text-white font-bold text-sm rounded-lg transition-all duration-200 shadow-lg"
            >
              <Home size={18} strokeWidth={2.5} />
              Return Home
            </Link>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-black text-slate-300 bg-white px-4 tracking-widest">
              Quick Links
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg transition-all duration-200 border border-slate-200"
            >
              Dashboard
            </Link>
            <Link
              href="/shipments"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg transition-all duration-200 border border-slate-200"
            >
              Shipments
            </Link>
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
