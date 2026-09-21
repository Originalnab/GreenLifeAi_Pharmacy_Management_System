import React from 'react';
import { CheckCircle2, Shield, Database, Wifi, HardDrive, Activity, Users } from 'lucide-react';

interface SystemHealthWidgetProps {
  activeUserCount: number;
  failedLoginCount: number;
  lastBackup: string;
  onNavigate: (tab: string) => void;
}

type HealthStatus = 'ok' | 'warning' | 'error';
interface HealthItem { label: string; value: string; status: HealthStatus; icon: React.ReactNode }

export const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({
  activeUserCount, failedLoginCount, lastBackup, onNavigate,
}) => {
  const items: HealthItem[] = [
    { label: 'API Service',     value: 'Operational',  status: 'ok',      icon: <Wifi className="w-4 h-4" /> },
    { label: 'Database',        value: 'Healthy',       status: 'ok',      icon: <Database className="w-4 h-4" /> },
    { label: 'Backup Service',  value: lastBackup,      status: 'ok',      icon: <Shield className="w-4 h-4" /> },
    { label: 'Disk Usage',      value: '38% Used',      status: 'ok',      icon: <HardDrive className="w-4 h-4" /> },
    { label: 'Active Sessions', value: `${activeUserCount} users`, status: 'ok', icon: <Users className="w-4 h-4" /> },
    {
      label: 'Security Events',
      value: failedLoginCount > 0 ? `${failedLoginCount} failed logins` : 'No anomalies',
      status: failedLoginCount >= 5 ? 'warning' : 'ok',
      icon: <Activity className="w-4 h-4" />,
    },
  ];

  const statusColor: Record<HealthStatus, string> = {
    ok:      'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error:   'text-rose-600 dark:text-rose-400',
  };
  const dotColor: Record<HealthStatus, string> = {
    ok:      'bg-emerald-500',
    warning: 'bg-amber-500',
    error:   'bg-rose-500',
  };

  return (
    <div className="bg-slate-900 dark:bg-slate-950 rounded-xl border border-slate-800 shadow-md overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <h3 className="font-bold text-white text-sm">System Health</h3>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          className="text-[11px] text-slate-400 hover:text-brand-400 font-semibold transition"
        >
          Diagnostics →
        </button>
      </div>

      <div className="p-5 grid grid-cols-2 gap-3">
        {items.map((item, i) => (
          <div key={i} className="bg-slate-800/60 rounded-lg px-3 py-2.5 flex items-start gap-2">
            <div className={`mt-0.5 flex-shrink-0 ${statusColor[item.status]}`}>{item.icon}</div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide truncate">{item.label}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor[item.status]}`} />
                <p className={`text-xs font-bold truncate ${statusColor[item.status]}`}>{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>FEFO Enforcement Active</span>
          <span className="ml-2">·</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-1" />
          <span>Immutable Audit Ledger ON</span>
        </div>
      </div>
    </div>
  );
};
