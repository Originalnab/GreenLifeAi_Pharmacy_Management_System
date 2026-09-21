import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, BookOpen } from 'lucide-react';

interface WorkflowGuideNoticeProps {
  title: string;
  subtitle?: string;
  summary?: string;
  tag?: string;
  badge?: string;
  badgeText?: string;
  compact?: boolean;
  children?: React.ReactNode;
  icon?: React.ElementType;
  variant?: 'blue' | 'emerald' | 'purple' | 'amber' | 'brand';
  defaultOpen?: boolean;
  className?: string;
}

export const WorkflowGuideNotice: React.FC<WorkflowGuideNoticeProps> = ({
  title,
  subtitle,
  summary,
  tag,
  badge,
  badgeText,
  compact = false,
  children,
  icon: Icon = BookOpen,
  variant = 'blue',
  defaultOpen = false,
  className = '',
}) => {
  const effectiveBadge = badge || badgeText || tag || 'Educational Guide';
  const effectiveSubtitle = summary || subtitle || 'Clinical guidelines, regulatory rules, and real-world pharmacy examples';
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleClickToggle = () => {
    setIsOpen(prev => !prev);
  };

  const variantColors = {
    blue: {
      border: 'border-blue-200 dark:border-blue-900',
      bg: 'bg-blue-50/70 dark:bg-blue-950/30',
      iconBg: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
      text: 'text-blue-900 dark:text-blue-100',
      subtext: 'text-blue-700 dark:text-blue-400',
    },
    emerald: {
      border: 'border-emerald-200 dark:border-emerald-900',
      bg: 'bg-emerald-50/70 dark:bg-emerald-950/30',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
      text: 'text-emerald-900 dark:text-emerald-100',
      subtext: 'text-emerald-700 dark:text-emerald-400',
    },
    purple: {
      border: 'border-purple-200 dark:border-purple-900',
      bg: 'bg-purple-50/70 dark:bg-purple-950/30',
      iconBg: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      btn: 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm',
      text: 'text-purple-900 dark:text-purple-100',
      subtext: 'text-purple-700 dark:text-purple-400',
    },
    amber: {
      border: 'border-amber-200 dark:border-amber-900',
      bg: 'bg-amber-50/70 dark:bg-amber-950/30',
      iconBg: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm',
      text: 'text-amber-900 dark:text-amber-100',
      subtext: 'text-amber-700 dark:text-amber-400',
    },
    brand: {
      border: 'border-brand-200 dark:border-brand-900',
      bg: 'bg-brand-50/70 dark:bg-brand-950/30',
      iconBg: 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300',
      badge: 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-300',
      btn: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm',
      text: 'text-slate-900 dark:text-white',
      subtext: 'text-slate-600 dark:text-slate-400',
    },
  }[variant];

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${variantColors.border} ${variantColors.bg} ${className}`}
    >
      {/* Header Bar - Always visible, click to open/close */}
      <div 
        className={`${compact ? 'p-2.5' : 'p-3.5'} flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer select-none`} 
        onClick={handleClickToggle}
      >
        <div className="flex items-center space-x-2.5">
          <div className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} rounded-xl flex items-center justify-center shrink-0 ${variantColors.iconBg}`}>
            <Icon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className={`font-bold ${compact ? 'text-xs' : 'text-xs sm:text-sm'} ${variantColors.text}`}>
                {title}
              </h4>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide uppercase ${variantColors.badge}`}>
                {effectiveBadge}
              </span>
            </div>
            <p className={`text-[11px] line-clamp-1 ${variantColors.subtext}`}>
              {effectiveSubtitle}
            </p>
          </div>
        </div>

        {/* Action Toggle Button */}
        <div className="flex items-center space-x-2 self-end sm:self-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClickToggle();
            }}
            className={`${compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} rounded-xl font-semibold flex items-center space-x-1.5 transition ${variantColors.btn}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isOpen ? 'Close Guidance' : 'Read about this & examples'}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content Section */}
      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-current/10 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="mt-2 text-xs leading-relaxed">
            {children ? (
              children
            ) : (
              <p className="text-slate-700 dark:text-slate-300">
                {effectiveSubtitle}
              </p>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-current/10 flex justify-between items-center text-[10px] opacity-60">
            <span>Click open button or header bar to expand or close guidance</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="hover:underline font-semibold"
            >
              Close guidance ▴
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
