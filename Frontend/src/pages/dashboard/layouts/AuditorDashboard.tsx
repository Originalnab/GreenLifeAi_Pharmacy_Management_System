import React, { useState } from 'react';
import { FileText, Shield, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { DashboardFilterBar, FilterPeriod, PERIOD_META } from '../widgets/DashboardFilterBar';
import { KpiCard } from '../widgets/KpiCard';

interface AuditorDashboardProps { onNavigate: (tab: string) => void }

export const AuditorDashboard: React.FC<AuditorDashboardProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const { auditLogs, approvals, currentUser } = usePharmacy();

  const m = PERIOD_META[period].multiplier;
  const auditCount    = Math.round(auditLogs.length * m * 0.3);
  const secCount      = 3; // mock failed logins / security events
  const approvedCount = approvals.filter(a => a.status === 'APPROVED').length;
  const flaggedCount  = 2; // mock flagged items

  const modules = ['pos','sales','purchasing','inventory','finance','administration','audit'] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 bg-gradient-to-r from-slate-700 via-zinc-600 to-slate-700 rounded-2xl p-6 text-white shadow-lg shadow-slate-800/20">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">Audit Review</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 text-[10px] font-bold">READ-ONLY ACCESS</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">Welcome, {currentUser.name}</h1>
            <p className="text-xs text-slate-400 mt-1">Evidence review · Transaction audit · Security monitoring · Export controls</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => onNavigate('audit')} className="flex items-center gap-2 bg-white text-slate-800 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105">
              <FileText className="w-4 h-4" />Full Audit Log
            </button>
            <button onClick={() => onNavigate('reports')} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-slate-600 transition">
              <Download className="w-4 h-4" />Export Report
            </button>
          </div>
        </div>
        <DashboardFilterBar period={period} onChange={setPeriod} className="opacity-80" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Audit Events" value={`${auditCount}`} subValue={`${PERIOD_META[period].label}`}
          icon={<FileText className="w-4 h-4" />} iconBg="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          trend="neutral" trendLabel="All recorded" accentColor="hover:border-slate-400/50" onClick={() => onNavigate('audit')} />
        <KpiCard title="Security Events" value={`${secCount}`} subValue="Failed logins / anomalies"
          icon={<Shield className="w-4 h-4" />} iconBg={secCount >= 5 ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}
          trend={secCount >= 5 ? 'down' : 'neutral'} trendLabel={secCount >= 5 ? 'Review now' : 'Normal'} accentColor="hover:border-rose-500/50" />
        <KpiCard title="Approvals Today" value={`${approvedCount}`} subValue="Authorized transactions"
          icon={<CheckCircle2 className="w-4 h-4" />} iconBg="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
          trend="neutral" trendLabel="Processed" accentColor="hover:border-emerald-500/50" />
        <KpiCard title="Flagged Items" value={`${flaggedCount}`} subValue="Unusual activity"
          icon={<AlertTriangle className="w-4 h-4" />} iconBg={flaggedCount > 0 ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}
          trend={flaggedCount > 0 ? 'down' : 'neutral'} trendLabel={flaggedCount > 0 ? 'Review required' : 'All clear'} accentColor="hover:border-amber-500/50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit event feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Audit Event Feed</h3>
            <button onClick={() => onNavigate('audit')} className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline">Full log →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.slice(0, 10).map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 max-w-[180px] truncate">{log.action}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.actorName}</td>
                    <td className="px-4 py-3 text-slate-500 capitalize">{log.module}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono">{log.timestamp?.slice(11, 19) ?? '--'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.outcome === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        log.outcome === 'WARNING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                                   'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {log.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick filters */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Filter by Module</h3>
            <div className="space-y-1.5">
              {modules.map(mod => (
                <button
                  key={mod}
                  onClick={() => onNavigate('audit')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition capitalize"
                >
                  <span>{mod}</span>
                  <span className="text-[10px] text-slate-400">{Math.floor(Math.random() * 20 + 2)} events</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Export Controls</h4>
            <div className="space-y-2">
              {['Export as CSV', 'Export as PDF', 'Print Summary'].map((action, i) => (
                <button key={i} className="w-full flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg transition">
                  <Download className="w-3.5 h-3.5" />
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
