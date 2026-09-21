import React, { useState } from 'react';
import { Users, Key, Clock, Shield, Settings, Activity } from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { DashboardFilterBar, FilterPeriod } from '../widgets/DashboardFilterBar';
import { KpiCard } from '../widgets/KpiCard';
import { ApprovalQueueWidget } from '../widgets/ApprovalQueueWidget';
import { RecommendationsPanel } from '../widgets/RecommendationCard';

interface PharmacyAdminDashboardProps { onNavigate: (tab: string) => void }

export const PharmacyAdminDashboard: React.FC<PharmacyAdminDashboardProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const { users, customRoles, approvals, approveRequest, rejectRequest, auditLogs, currentUser, formatCurrency } = usePharmacy();

  const activeUsers    = users.filter(u => u.active).length;
  const inactiveUsers  = users.filter(u => !u.active).length;
  const pendingCount   = approvals.filter(a => a.status === 'PENDING').length;
  const permChanges    = auditLogs.filter(l => l.module === 'administration').length;

  const roleStats = [
    'Super Admin','Pharmacy Admin','Manager','Pharmacist','Cashier',
    'Stock Officer','Procurement Officer','Accountant','Auditor',
  ].map(role => ({
    role,
    count: users.filter(u => u.role === role).length,
    color: role === 'Super Admin' ? 'bg-slate-700 text-slate-100' :
           role === 'Manager' ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300' :
           role === 'Pharmacist' ? 'bg-clinical-100 dark:bg-clinical-950 text-clinical-700 dark:text-clinical-300' :
           role === 'Cashier' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
           'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-4 bg-gradient-to-r from-violet-700 via-purple-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg shadow-violet-700/10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">Administration Control</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">Welcome, {currentUser.name}</h1>
            <p className="text-xs text-violet-200 mt-1">User management · Role configuration · Access control</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => onNavigate('administration')} className="flex items-center gap-2 bg-white text-violet-800 hover:bg-violet-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105">
              <Users className="w-4 h-4" />Manage Users
            </button>
            <button onClick={() => onNavigate('audit')} className="flex items-center gap-2 bg-violet-800/60 hover:bg-violet-800 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-white/20 transition">
              <Activity className="w-4 h-4" />Audit Log
            </button>
          </div>
        </div>
        <DashboardFilterBar period={period} onChange={setPeriod} className="opacity-80" />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Active Staff" value={`${activeUsers} Active`} subValue={`${inactiveUsers} inactive`}
          icon={<Users className="w-4 h-4" />} iconBg="bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400"
          trend="neutral" trendLabel="All roles assigned" accentColor="hover:border-violet-500/50" onClick={() => onNavigate('administration')} />
        <KpiCard title="Custom Roles" value={`${customRoles.length} Defined`} subValue="Role templates"
          icon={<Key className="w-4 h-4" />} iconBg="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
          trend="neutral" trendLabel="Configurable" accentColor="hover:border-blue-500/50" />
        <KpiCard title="Pending Approvals" value={`${pendingCount} Pending`} subValue="Awaiting decision"
          icon={<Clock className="w-4 h-4" />} iconBg="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
          trend={pendingCount > 3 ? 'down' : 'neutral'} trendLabel={pendingCount > 3 ? 'Review now' : 'In control'} accentColor="hover:border-amber-500/50" />
        <KpiCard title="Permission Changes" value={`${permChanges}`} subValue="Audit events"
          icon={<Shield className="w-4 h-4" />} iconBg="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
          trend="neutral" trendLabel="All logged" accentColor="hover:border-emerald-500/50" onClick={() => onNavigate('audit')} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Staff directory */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Staff Directory</h3>
              <button onClick={() => onNavigate('administration')} className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline">Manage →</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-clinical-500 flex items-center justify-center text-white text-[10px] font-extrabold flex-shrink-0">{u.name.charAt(0)}</div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                            <p className="text-[10px] text-slate-400">{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-semibold">{u.role}</td>
                      <td className="px-4 py-3 text-slate-500">{u.branchName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role distribution */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Role Distribution</h3>
            <div className="grid grid-cols-3 gap-3">
              {roleStats.map((rs, i) => (
                <div key={i} className={`rounded-lg px-3 py-2.5 ${rs.color}`}>
                  <p className="text-lg font-extrabold">{rs.count}</p>
                  <p className="text-[10px] font-semibold leading-tight mt-0.5 opacity-80">{rs.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <ApprovalQueueWidget approvals={approvals} onApprove={approveRequest} onReject={rejectRequest} formatCurrency={formatCurrency} />
          <RecommendationsPanel recommendations={[
            { type: 'info', title: 'Review dormant accounts', description: `${inactiveUsers} inactive accounts. Verify they are correctly deactivated.`, actionLabel: 'Users', onAction: () => onNavigate('administration') },
            { type: 'neutral', title: `${customRoles.length} custom roles configured`, description: 'Review and ensure all custom roles follow least-privilege principles.', actionLabel: 'Roles', onAction: () => onNavigate('administration') },
          ]} />
        </div>
      </div>

      {/* Audit events */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Recent Permission & Access Events</h3>
          <button onClick={() => onNavigate('audit')} className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline">Full log →</button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {auditLogs.slice(0, 5).map((log, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{log.action}</p>
                <p className="text-[11px] text-slate-500 truncate">{log.actorName} · {log.module}</p>
              </div>
              <p className="text-[10px] text-slate-400 flex-shrink-0">{log.timestamp?.slice(11, 16)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
