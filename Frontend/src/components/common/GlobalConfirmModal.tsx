import React, { useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  Info, 
  CheckCircle2, 
  X, 
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { DialogVariant } from '../../types';

export const GlobalConfirmModal: React.FC = () => {
  const { confirmDialogState, closeConfirmDialog } = usePharmacy();
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirmDialogState?.isOpen) {
      // Auto-focus the action button
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);

      // Handle keyboard Escape
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeConfirmDialog(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [confirmDialogState?.isOpen, closeConfirmDialog]);

  if (!confirmDialogState || !confirmDialogState.isOpen) return null;

  const {
    title,
    message,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isAlert = false
  } = confirmDialogState;

  const variantConfig: Record<DialogVariant, {
    iconBg: string;
    iconColor: string;
    icon: React.ReactNode;
    confirmBtn: string;
    border: string;
  }> = {
    danger: {
      iconBg: 'bg-rose-100 dark:bg-rose-950/80',
      iconColor: 'text-rose-600 dark:text-rose-400',
      icon: <Trash2 className="w-6 h-6" />,
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 focus:ring-rose-500',
      border: 'border-rose-200 dark:border-rose-900/60'
    },
    warning: {
      iconBg: 'bg-amber-100 dark:bg-amber-950/80',
      iconColor: 'text-amber-600 dark:text-amber-400',
      icon: <AlertTriangle className="w-6 h-6" />,
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30 focus:ring-amber-500',
      border: 'border-amber-200 dark:border-amber-900/60'
    },
    info: {
      iconBg: 'bg-sky-100 dark:bg-sky-950/80',
      iconColor: 'text-sky-600 dark:text-sky-400',
      icon: <Info className="w-6 h-6" />,
      confirmBtn: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/30 focus:ring-sky-500',
      border: 'border-sky-200 dark:border-sky-900/60'
    },
    primary: {
      iconBg: 'bg-brand-100 dark:bg-brand-950/80',
      iconColor: 'text-brand-600 dark:text-brand-400',
      icon: <ShieldAlert className="w-6 h-6" />,
      confirmBtn: 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/30 focus:ring-brand-500',
      border: 'border-brand-200 dark:border-brand-900/60'
    },
    success: {
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      icon: <CheckCircle2 className="w-6 h-6" />,
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 focus:ring-emerald-500',
      border: 'border-emerald-200 dark:border-emerald-900/60'
    }
  };

  const currentVariant = variantConfig[variant] || variantConfig.danger;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => closeConfirmDialog(false)}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className={`bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border ${currentVariant.border} space-y-4 animate-in zoom-in-95 duration-200 relative overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Accent Strip */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          variant === 'danger' ? 'bg-rose-500' :
          variant === 'warning' ? 'bg-amber-500' :
          variant === 'success' ? 'bg-emerald-500' :
          variant === 'info' ? 'bg-sky-500' : 'bg-brand-500'
        }`} />

        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3.5">
            <div className={`p-3 rounded-2xl ${currentVariant.iconBg} ${currentVariant.iconColor} shrink-0 mt-0.5 shadow-sm`}>
              {currentVariant.icon}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                {title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed font-medium">
                {message}
              </p>
            </div>
          </div>
          <button
            onClick={() => closeConfirmDialog(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {description && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
            {description}
          </div>
        )}

        <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {!isAlert && (
            <button
              type="button"
              onClick={() => closeConfirmDialog(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
            >
              {cancelText}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => closeConfirmDialog(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${currentVariant.confirmBtn}`}
          >
            {isAlert ? (confirmText || 'Understood') : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
