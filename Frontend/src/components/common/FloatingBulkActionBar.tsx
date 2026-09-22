import React from 'react';
import { CheckSquare, X, LucideIcon } from 'lucide-react';

export interface BulkAction {
  label: string;
  icon?: LucideIcon | React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface FloatingBulkActionBarProps {
  selectedCount: number;
  totalCount?: number;
  onClearSelection: () => void;
  actions?: BulkAction[];
}

export const FloatingBulkActionBar: React.FC<FloatingBulkActionBarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  actions = []
}) => {
  if (selectedCount <= 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center space-x-4 max-w-xl">
        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center text-white">
            <CheckSquare className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white">
            {selectedCount} {totalCount ? `of ${totalCount}` : ''} Selected
          </span>
        </div>

        <div className="h-4 w-px bg-slate-700 shrink-0" />

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {actions.map((act, index) => {
            const isDanger = act.variant === 'danger';
            const isPrimary = act.variant === 'primary';
            return (
              <button
                key={index}
                onClick={act.onClick}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shrink-0 ${
                  isDanger
                    ? 'bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/40'
                    : isPrimary
                    ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {act.icon && (
                  <span className="shrink-0 flex items-center">
                    {React.isValidElement(act.icon) ? (
                      act.icon
                    ) : (
                      React.createElement(act.icon as React.ComponentType<{ className?: string }>, { className: 'w-3.5 h-3.5' })
                    )}
                  </span>
                )}
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-slate-700 shrink-0" />

        {/* Clear / Close Button */}
        <button
          onClick={onClearSelection}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Deselect all rows"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
