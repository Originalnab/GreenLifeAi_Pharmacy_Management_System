import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export type TrendDirection = 'up' | 'down' | 'neutral';

interface KpiCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: TrendDirection;
  trendLabel?: string;
  accentColor?: string;
  onClick?: () => void;
  sparkData?: number[]; // 7 values for mini spark chart
  badge?: string;
  badgeColor?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title, value, subValue, icon, iconBg = 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400',
  trend, trendLabel, accentColor = 'hover:border-brand-500/50',
  onClick, sparkData, badge, badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
}) => {
  const maxSpark = sparkData ? Math.max(...sparkData, 1) : 1;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800
        shadow-sm transition-all duration-200
        ${accentColor}
        ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
              {title}
            </span>
            {badge && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${badgeColor}`}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1.5 leading-none">
            {value}
          </p>
          {subValue && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">{subValue}</p>
          )}
          {trend && trendLabel && (
            <div className={`flex items-center gap-1 text-[11px] font-semibold mt-1.5 ${
              trend === 'up'      ? 'text-emerald-600 dark:text-emerald-400' :
              trend === 'down'    ? 'text-rose-600 dark:text-rose-400' :
                                   'text-slate-400'
            }`}>
              {trend === 'up'      ? <ArrowUpRight className="w-3.5 h-3.5" /> :
               trend === 'down'    ? <ArrowDownRight className="w-3.5 h-3.5" /> :
                                    <Minus className="w-3.5 h-3.5" />}
              <span>{trendLabel}</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>

      {/* Sparkline */}
      {sparkData && sparkData.length > 0 && (
        <div className="mt-3 flex items-end gap-0.5 h-8">
          {sparkData.map((v, i) => (
            <div key={i} className="flex-1 flex items-end">
              <div
                style={{ height: `${Math.max(10, (v / maxSpark) * 100)}%` }}
                className={`w-full rounded-sm transition-all ${
                  i === sparkData.length - 1
                    ? 'bg-brand-500 dark:bg-brand-400'
                    : 'bg-slate-200 dark:bg-slate-700 hover:bg-brand-300 dark:hover:bg-brand-600'
                }`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
