import React, { useMemo } from 'react';
import { 
  Users, ShieldCheck, UserCheck, Key, Lock, 
  CheckCircle2, AlertCircle, Building2, UserX
} from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { ReportFilterState } from '../components/ReportFilterBar';
import { Pagination } from '../../../components/common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const UsersReportTab: React.FC<{ filterState: ReportFilterState }> = ({ filterState }) => {
  const { users, auditLogs } = usePharmacy();

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchName = u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
        const matchRole = u.role?.toLowerCase().includes(q);
        const matchBranch = u.branchName?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchBranch && !matchEmail) return false;
      }

      if (filterState.secondaryFilter && filterState.secondaryFilter !== 'ALL') {
        if (u.role !== filterState.secondaryFilter) return false;
      }

      return true;
    });
  }, [users, filterState.searchQuery, filterState.secondaryFilter]);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedUsers
  } = usePagination(filteredUsers, 10, [filterState]);

  // Aggregate metrics
  const totalUsers = filteredUsers.length;
  const activeUsers = filteredUsers.filter(u => u.active).length;
  const inactiveUsers = filteredUsers.filter(u => !u.active).length;
  const roleGroups = useMemo(() => {
    const map: Record<string, number> = {};
    filteredUsers.forEach(u => {
      map[u.role] = (map[u.role] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredUsers]);

  return (
    <div className="space-y-6">
      {/* SUMMARY VIEW */}
      {filterState.viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                <span>Total Staff Accounts</span>
                <Users className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-indigo-900 dark:text-indigo-200 tracking-tight">
                {totalUsers}
              </p>
              <p className="text-xs text-slate-500 font-medium">Configured Staff Credentials</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                <span>Active Operators</span>
                <UserCheck className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
                {activeUsers}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">Enabled System Access</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                <span>Role Classifications</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-purple-900 dark:text-purple-200 tracking-tight">
                {roleGroups.length}
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold">Permission Boundaries</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                <span>Security Audit Events</span>
                <Key className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-amber-900 dark:text-amber-200 tracking-tight">
                {auditLogs.length}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">System Audit Trail</p>
            </div>
          </div>

          {/* Role Headcount Distribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              Dispensary Staff Roles & Headcount Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {roleGroups.map(([role, count]) => (
                <div key={role} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{role}</span>
                    <span className="text-[11px] text-slate-500">Authorized Role</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
                    {count} {count === 1 ? 'User' : 'Users'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED LEDGER VIEW */}
      {filterState.viewMode === 'detailed' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Dispensary Staff & User Directory Ledger</h3>
              <p className="text-xs text-slate-500">Security permissions, branch assignments, and professional license records</p>
            </div>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800">
              {filteredUsers.length} Users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Staff Name & Username</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Dispensary Branch</th>
                  <th className="p-3.5">Phone & Email</th>
                  <th className="p-3.5">License Number</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No staff users found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">@{u.username}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">{u.branchName || 'Main Dispensary'}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        <div>{u.phone || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">{u.licenseNumber || '—'}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {u.active ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredUsers.length}
            pageSize={10}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
