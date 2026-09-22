import React, { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle2, FileText, Activity } from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { DashboardFilterBar, FilterPeriod, PERIOD_META } from '../widgets/DashboardFilterBar';
import { KpiCard } from '../widgets/KpiCard';
import { ExpiryRiskWidget } from '../widgets/ExpiryRiskWidget';
import { RecommendationsPanel } from '../widgets/RecommendationCard';

interface PharmacistDashboardProps { onNavigate: (tab: string) => void }

export const PharmacistDashboard: React.FC<PharmacistDashboardProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const { batches, sales, products, currentUser } = usePharmacy();

  const m = PERIOD_META[period].multiplier;
  const expiring30  = batches.filter(b => { const d = (new Date(b.expiryDate).getTime() - new Date('2026-09-20').getTime()) / 86400000; return d > 0 && d <= 30; }).length;
  const expiring60  = batches.filter(b => { const d = (new Date(b.expiryDate).getTime() - new Date('2026-09-20').getTime()) / 86400000; return d > 0 && d <= 60; }).length;
  const rxRequired  = products.filter(p => p.isPrescriptionRequired).length;
  const dispensed   = Math.round(sales.length * m * 0.3);
  const prescPending = 4; // mock
  const controlledFlags = 2; // mock

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 bg-gradient-to-r from-teal-700 via-clinical-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg shadow-teal-700/10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">Pharmacist Workspace</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-[10px] font-bold">FEFO ACTIVE</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-100 text-[10px] font-bold">POM LOCK ON</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">Welcome, {currentUser.name}</h1>
            <p className="text-xs text-teal-200 mt-1">Prescription review · Medicine safety · Dispensing oversight</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => onNavigate('inventory')} className="flex items-center gap-2 bg-white text-teal-800 hover:bg-teal-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105">
              <Clock className="w-4 h-4" />Expiry Queue
            </button>
            <button onClick={() => onNavigate('catalogue')} className="flex items-center gap-2 bg-teal-800/60 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-white/20 transition">
              <FileText className="w-4 h-4" />Catalogue
            </button>
          </div>
        </div>
        <DashboardFilterBar period={period} onChange={setPeriod} className="mt-1" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Prescriptions Pending" value={`${prescPending} Pending`} subValue="Awaiting pharmacist review"
          icon={<FileText className="w-5 h-5" />} iconBg="bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400"
          trend={prescPending > 3 ? 'down' : 'neutral'} trendLabel="Review queue active" accentColor="hover:border-teal-500/50" />
        <KpiCard title="Controlled Drug Flags" value={`${controlledFlags} Flags`} subValue="POM medications flagged"
          icon={<AlertTriangle className="w-5 h-5" />} iconBg="bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
          trend={controlledFlags > 0 ? 'down' : 'neutral'} trendLabel="Review required" accentColor="hover:border-rose-500/50" />
        <KpiCard title="Expiring < 30 Days" value={`${expiring30} Batches`} subValue="Critical quarantine window"
          icon={<Clock className="w-5 h-5" />} iconBg="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
          trend={expiring30 > 2 ? 'down' : 'neutral'} trendLabel="Immediate attention" accentColor="hover:border-amber-500/50" onClick={() => onNavigate('inventory')} />
        <KpiCard title="Dispensed This Period" value={`${dispensed}`} subValue="Completed dispensings"
          icon={<CheckCircle2 className="w-5 h-5" />} iconBg="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
          trend="up" trendLabel="Processed safely" accentColor="hover:border-emerald-500/50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpiryRiskWidget batches={batches} onNavigate={onNavigate} />

        {/* Prescription queue mock */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Prescription Review Queue</h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">{prescPending} pending</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[
              { ref: 'RX-2026-0041', patient: 'A. Mensah', prescriber: 'Dr. Owusu', items: 'Amoxicillin 500mg, Paracetamol 500mg', status: 'PENDING' },
              { ref: 'RX-2026-0040', patient: 'B. Asante', prescriber: 'Dr. Boateng', items: 'Metformin 500mg', status: 'PENDING' },
              { ref: 'RX-2026-0039', patient: 'C. Darko', prescriber: 'Dr. Acheampong', items: 'Amlodipine 5mg', status: 'PENDING' },
              { ref: 'RX-2026-0038', patient: 'D. Osei', prescriber: 'Dr. Kwame', items: 'Ibuprofen 400mg (OTC)', status: 'REVIEW' },
            ].map((rx, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <div className={`flex-shrink-0 mt-1 w-2 h-2 rounded-full ${rx.status === 'PENDING' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{rx.ref}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${rx.status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'}`}>{rx.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{rx.patient} · {rx.prescriber}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{rx.items}</p>
                </div>
                <button className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex-shrink-0 hover:underline">Review</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety gating */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-3">Medicine Safety Controls</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300">
          {[
            { label: 'FEFO Batch Enforcement', ok: true },
            { label: 'POM Prescription Lock', ok: true },
            { label: 'Expired Batch Blocking', ok: true },
            { label: 'Immutable Stock Ledger', ok: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-2.5">
              <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${item.ok ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className="font-semibold">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <RecommendationsPanel recommendations={[
        ...(expiring30 > 0 ? [{ type: 'critical' as const, title: `${expiring30} batches expire in < 30 days`, description: 'Initiate quarantine review and evaluate return to supplier eligibility.', actionLabel: 'Expiry Queue', onAction: () => onNavigate('inventory') }] : []),
        { type: 'info', title: `${rxRequired} products require prescriptions`, description: 'Ensure all POM dispensings have been reviewed and approved by a pharmacist.', },
        { type: 'positive', title: 'All safety controls active', description: 'FEFO, POM lock, and batch blocking are all operating correctly.', },
      ]} title="Clinical Recommendations" />
    </div>
  );
};
