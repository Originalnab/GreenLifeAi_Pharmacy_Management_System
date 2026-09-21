import React from 'react';
import { Layout, ArrowRight } from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';

interface CustomRoleDashboardProps { onNavigate: (tab: string) => void }

export const CustomRoleDashboard: React.FC<CustomRoleDashboardProps> = ({ onNavigate }) => {
  const { currentUser } = usePharmacy();

  const permittedPages = [
    { tab: 'pos',          label: 'Point of Sale',   desc: 'Process sales and payments' },
    { tab: 'sales',        label: 'Sales History',    desc: 'View transaction records' },
    { tab: 'inventory',    label: 'Inventory',         desc: 'Check stock levels' },
    { tab: 'catalogue',    label: 'Product Catalogue', desc: 'Browse medicine catalogue' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">{currentUser.role}</span>
        </div>
        <h1 className="text-2xl font-extrabold">Welcome, {currentUser.name}</h1>
        <p className="text-sm text-slate-400 mt-1">Your dashboard is configured by your administrator.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/50">
            <Layout className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Your Permitted Pages</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">You can access the following sections based on your assigned role permissions.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          {permittedPages.map((page, i) => (
            <button
              key={i}
              onClick={() => onNavigate(page.tab)}
              className="flex items-center justify-between gap-3 px-4 py-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/30 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 transition group text-left"
            >
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400">{page.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{page.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 flex-shrink-0 transition" />
            </button>
          ))}
        </div>
      </div>

      <div className="bg-brand-50 dark:bg-brand-950/20 rounded-xl border border-brand-200 dark:border-brand-800 p-5 text-center">
        <p className="text-sm text-brand-700 dark:text-brand-300 font-semibold">
          Need access to additional modules?
        </p>
        <p className="text-xs text-brand-600/70 dark:text-brand-400/70 mt-1">
          Contact your Pharmacy Administrator to update your role permissions.
        </p>
      </div>
    </div>
  );
};
