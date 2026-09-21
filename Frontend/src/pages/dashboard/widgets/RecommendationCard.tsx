import React from 'react';
import { AlertTriangle, TrendingUp, Info, CheckCircle2, ChevronRight } from 'lucide-react';

export type RecommendationType = 'critical' | 'warning' | 'positive' | 'info' | 'neutral';

export interface Recommendation {
  type: RecommendationType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const TYPE_CONFIG: Record<RecommendationType, {
  border: string;
  bg: string;
  icon: React.ReactNode;
  badge: string;
  badgeBg: string;
}> = {
  critical: {
    border: 'border-l-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
    badge: 'Critical',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    badge: 'Warning',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
  },
  positive: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
    badge: 'Insight',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
  },
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    icon: <Info className="w-4 h-4 text-blue-500" />,
    badge: 'Info',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  },
  neutral: {
    border: 'border-l-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800/40',
    icon: <CheckCircle2 className="w-4 h-4 text-slate-400" />,
    badge: 'Note',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
  },
};

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  title?: string;
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendations, title = 'Smart Recommendations',
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
        </div>
        <span className="text-[10px] font-bold text-slate-400">AI-ASSISTED</span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {recommendations.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            All systems nominal — no action required.
          </div>
        ) : (
          recommendations.map((rec, i) => {
            const cfg = TYPE_CONFIG[rec.type];
            return (
              <div
                key={i}
                className={`px-4 py-3.5 border-l-4 ${cfg.border} ${cfg.bg} flex items-start gap-3`}
              >
                <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badgeBg}`}>
                      {cfg.badge}
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{rec.title}</p>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {rec.description}
                  </p>
                </div>
                {rec.actionLabel && rec.onAction && (
                  <button
                    onClick={rec.onAction}
                    className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 whitespace-nowrap mt-0.5"
                  >
                    {rec.actionLabel}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
