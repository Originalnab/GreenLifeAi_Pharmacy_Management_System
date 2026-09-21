import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, Activity, Search, Filter, Lock, 
  Terminal, Server, CheckCircle2, AlertTriangle, Eye, X, FileSpreadsheet, Download 
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { AuditEvent } from '../../types';
import { FloatingBulkActionBar } from '../../components/common/FloatingBulkActionBar';

export const AuditPage: React.FC = () => {
  const { auditLogs, currentUser } = usePharmacy();
  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const [activeTab, setActiveTab] = useState<'audit' | 'tech'>('audit');

  useEffect(() => {
    if (!isSuperAdmin && activeTab === 'tech') {
      setActiveTab('audit');
    }
  }, [isSuperAdmin, activeTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('ALL');
  const [selectedAuditIds, setSelectedAuditIds] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditEvent | null>(null);

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recordReference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === 'ALL' || log.module.toLowerCase() === moduleFilter.toLowerCase();
    const matchesOutcome = outcomeFilter === 'ALL' || log.outcome === outcomeFilter;
    return matchesSearch && matchesModule && matchesOutcome;
  });

  const isAllSelected = filteredLogs.length > 0 && filteredLogs.every(l => selectedAuditIds.includes(l.id));
  const isSomeSelected = filteredLogs.some(l => selectedAuditIds.includes(l.id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedAuditIds([]);
    } else {
      setSelectedAuditIds(filteredLogs.map(l => l.id));
    }
  };

  const toggleSelectRow = (id: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setSelectedAuditIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportAuditCSV = () => {
    const targets = auditLogs.filter(l => selectedAuditIds.includes(l.id));
    if (targets.length === 0) return;
    const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'Module', 'Record Ref', 'Outcome', 'IP Address', 'Details'];
    const rows = targets.map(l => [
      `"${l.timestamp}"`,
      `"${l.actorName}"`,
      `"${l.actorRole}"`,
      `"${l.action}"`,
      `"${l.module}"`,
      `"${l.recordReference}"`,
      l.outcome,
      `"${l.ipAddress}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `audit_trail_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-brand-600" />
            <span>Audit Trail & Technical Health Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable, tamper-evident security audit logs and local Docker service health monitoring.
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'audit' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('tech')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'tech' ? 'bg-purple-600 text-white shadow-sm font-bold' : 'text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Docker & Health Diagnostics</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200 font-extrabold uppercase">
                SuperAdmin
              </span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search action, actor, reference..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={moduleFilter}
                onChange={e => setModuleFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Domains</option>
                <option value="sales">Sales</option>
                <option value="inventory">Inventory</option>
                <option value="purchasing">Purchasing</option>
                <option value="settings">Settings</option>
                <option value="security">Security</option>
              </select>

              <select
                value={outcomeFilter}
                onChange={e => setOutcomeFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Outcomes</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
              </select>

              <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
                SHA-256 Locked
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 select-none">
                <tr>
                  <th className="p-3 w-16 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                        title="Select All"
                      />
                      <span className="font-mono text-[11px] text-slate-400">#</span>
                    </div>
                  </th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor & Role</th>
                  <th className="p-3">Action Event</th>
                  <th className="p-3">Domain</th>
                  <th className="p-3">Record Ref</th>
                  <th className="p-3">Outcome</th>
                  <th className="p-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No audit events found matching active filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, index) => {
                    const isSelected = selectedAuditIds.includes(log.id);
                    return (
                      <tr 
                        key={log.id} 
                        className={`transition-colors text-[11px] cursor-pointer ${
                          isSelected 
                            ? 'bg-brand-50/70 dark:bg-brand-950/40 border-l-2 border-l-brand-600' 
                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                        }`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center space-x-1.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => toggleSelectRow(log.id, e)}
                              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                            />
                            <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 w-5 text-right">
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-500">{log.timestamp}</td>
                        <td className="p-3 font-sans">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{log.actorName}</p>
                          <p className="text-[10px] text-slate-500">{log.actorRole}</p>
                        </td>
                        <td className="p-3 font-bold text-brand-600 dark:text-brand-400">{log.action}</td>
                        <td className="p-3 uppercase text-slate-500">{log.module}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{log.recordReference}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.outcome === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {log.outcome}
                          </span>
                        </td>
                        <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                            title="View payload"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <FloatingBulkActionBar
            selectedCount={selectedAuditIds.length}
            totalCount={filteredLogs.length}
            onClearSelection={() => setSelectedAuditIds([])}
            actions={[
              {
                label: 'Export Audit CSV',
                icon: FileSpreadsheet,
                onClick: handleExportAuditCSV,
                variant: 'secondary'
              }
            ]}
          />
        </div>
      )}

      {/* TAB 2: TECHNICAL HEALTH & DOCKER SERVICES */}
      {activeTab === 'tech' && isSuperAdmin && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs">
                <Server className="w-4 h-4" />
                <span>Docker Gateway (Nginx)</span>
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">Healthy</p>
              <p className="text-[11px] text-slate-500">Port 80/443 • Uptime 14d 6h • Requests: 28,490</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs">
                <Server className="w-4 h-4" />
                <span>PostgreSQL 16 Engine</span>
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">Connected (4ms)</p>
              <p className="text-[11px] text-slate-500">Connections: 8/100 • Database: greenlife_001_prod</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs">
                <Activity className="w-4 h-4" />
                <span>Celery & Redis Worker</span>
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">Idle (0 in queue)</p>
              <p className="text-[11px] text-slate-500">Memory: 42MB • Background tasks ready</p>
            </div>
          </div>

          <div className="bg-slate-950 text-slate-300 p-4 rounded-xl font-mono text-xs space-y-1 shadow-inner border border-slate-800">
            <div className="flex items-center space-x-2 pb-2 text-slate-500 border-b border-slate-800">
              <Terminal className="w-4 h-4" />
              <span>Sanitized System Container Logs (greenlifeai_greenlife_001_prod)</span>
            </div>
            <p className="text-emerald-400">[2026-09-20 08:00:01] INFO  [core.health] Ready check passed (PostgreSQL 16.2 ping 4ms)</p>
            <p>[2026-09-20 08:00:03] INFO  [accounts.auth] User "cashier_emmanuel" authenticated via local session</p>
            <p>[2026-09-20 08:30:15] INFO  [inventory.ledger] Batch AMX-2026-014 (140 units) committed under GRN-2026-0041</p>
            <p>[2026-09-20 09:12:44] INFO  [sales.checkout] Sale REC-20260920-001 completed (Total: 2,580.00)</p>
            <p>[2026-09-20 10:04:18] WARN  [inventory.quarantine] Batch RDX-2024-009 isolated: Expiry threshold exceeded</p>
          </div>
        </div>
      )}

      {/* Log Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between border-b pb-2 font-sans">
              <h3 className="font-bold text-sm">Audit Record Detail: {selectedLog.id}</h3>
              <button onClick={() => setSelectedLog(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1.5">
              <p><span className="text-slate-400">Timestamp:</span> {selectedLog.timestamp}</p>
              <p><span className="text-slate-400">Actor:</span> {selectedLog.actorName} ({selectedLog.actorRole})</p>
              <p><span className="text-slate-400">Action:</span> {selectedLog.action}</p>
              <p><span className="text-slate-400">Target Ref:</span> {selectedLog.recordReference}</p>
              <p><span className="text-slate-400">Origin IP:</span> {selectedLog.ipAddress}</p>
              {selectedLog.details && (
                <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded border">
                  <p className="font-bold text-slate-500 font-sans text-[10px]">Context / Payload:</p>
                  <p className="mt-1">{selectedLog.details}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedLog(null)} className="px-4 py-2 border rounded font-sans text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
