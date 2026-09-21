import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, X, Sparkles } from 'lucide-react';

interface FieldGuideNoticeProps {
  label?: string; // e.g. "Read about this", "Clinical Note & Examples", "Field Guidance"
  title?: string;
  children: React.ReactNode;
  variant?: 'subtle' | 'brand' | 'amber' | 'blue';
  className?: string;
  defaultOpen?: boolean;
}

export const FieldGuideNotice: React.FC<FieldGuideNoticeProps> = ({
  label = 'Read about this & examples',
  title,
  children,
  variant = 'blue',
  className = '',
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleClickToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
  };

  const variantStyles = {
    blue: {
      btn: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border-blue-200 dark:border-blue-800',
      box: 'bg-blue-50/95 dark:bg-slate-900/95 border-blue-200 dark:border-blue-800/80 text-blue-950 dark:text-blue-100',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    brand: {
      btn: 'text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 dark:hover:bg-brand-900/60 border-brand-200 dark:border-brand-800',
      box: 'bg-brand-50/95 dark:bg-slate-900/95 border-brand-200 dark:border-brand-800/80 text-slate-900 dark:text-slate-100',
      icon: 'text-brand-600 dark:text-brand-400',
    },
    amber: {
      btn: 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border-amber-200 dark:border-amber-800',
      box: 'bg-amber-50/95 dark:bg-slate-900/95 border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-100',
      icon: 'text-amber-600 dark:text-amber-400',
    },
    subtle: {
      btn: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700',
      box: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200',
      icon: 'text-slate-500',
    }
  }[variant];

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button / Chip - Click to open/close */}
      <button
        type="button"
        onClick={handleClickToggle}
        title="Click to view guidance and examples"
        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg border text-[10px] font-medium transition cursor-pointer shadow-xs ${variantStyles.btn} ${
          isOpen ? 'ring-2 ring-brand-500/40 ring-offset-1 font-bold' : ''
        }`}
      >
        <HelpCircle className={`w-3 h-3 ${variantStyles.icon}`} />
        <span>{label}</span>
        {isOpen ? (
          <ChevronUp className="w-2.5 h-2.5 opacity-70" />
        ) : (
          <ChevronDown className="w-2.5 h-2.5 opacity-70" />
        )}
      </button>

      {/* Popover / Collapsible Content Panel */}
      {isOpen && (
        <div 
          className={`mt-1.5 p-3 rounded-xl border shadow-lg backdrop-blur-sm z-30 transition-all duration-150 animate-in fade-in slide-in-from-top-1 text-[11px] leading-relaxed ${variantStyles.box}`}
          style={{ maxWidth: '420px', width: 'max-content', minWidth: '280px' }}
        >
          <div className="flex items-center justify-between border-b border-current/10 pb-1.5 mb-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>{title || 'Clinical Guidance & Purpose'}</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition"
              title="Close guidance"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5">
            {children}
          </div>

          <div className="mt-2 pt-1 border-t border-current/10 flex justify-between items-center text-[9px] opacity-60">
            <span>Click open button or ✕ to close guidance</span>
          </div>
        </div>
      )}
    </div>
  );
};
