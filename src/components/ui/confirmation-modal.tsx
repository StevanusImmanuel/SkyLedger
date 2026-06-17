'use client';

import React from 'react';
import { X } from 'lucide-react';

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'create' | 'update' | 'delete' | 'default' | 'deactivate';
  isLoading?: boolean;
  error?: string | null;
};

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'create',
  isLoading = false,
  error = null,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const variantColors = {
    create: {
      bg: 'bg-[#1a2d5a]',
      hover: 'hover:bg-[#001a42]',
      border: 'border-[#1a2d5a]',
    },
    update: {
      bg: 'bg-[#1a2d5a]',
      hover: 'hover:bg-[#001a42]',
      border: 'border-[#1a2d5a]',
    },
    default: {
      bg: 'bg-[#1a2d5a]',
      hover: 'hover:bg-[#001a42]',
      border: 'border-[#1a2d5a]',
    },
    delete: {
      bg: 'bg-[#FF0000]',
      hover: 'hover:bg-[#cc0000]',
      border: 'border-[#FF0000]',
    },
    deactivate: {
      bg: 'bg-[#FF0000]',
      hover: 'hover:bg-[#cc0000]',
      border: 'border-[#FF0000]',
    },
  };

  const colors = variantColors[variant];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isLoading}
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div style={{
            margin: '16px 24px 0 24px',
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`${colors.bg} ${colors.hover} text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
