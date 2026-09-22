import React, { useState } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { usePharmacy } from '../../context/PharmacyContext';
import { AlertTriangle } from 'lucide-react';
import { GlobalNotificationToast } from '../common/GlobalNotificationToast';
import { GlobalConfirmModal } from '../common/GlobalConfirmModal';

interface AppShellProps {
  children: (activeTab: string, setActiveTab: (tab: string) => void) => React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const { operatingMode } = usePharmacy();

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {operatingMode === 'DEMO' && (
        <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-extrabold text-xs py-1 px-4 text-center flex items-center justify-center space-x-2 shadow-sm border-b border-amber-600 animate-in slide-in-from-top duration-200 select-none">
          <AlertTriangle className="w-4 h-4 text-slate-950 animate-pulse shrink-0" />
          <span>TRAINING & DEMO MODE ACTIVE — Simulated sandbox data. Real production financial ledger and PCN reports are isolated.</span>
          <button 
            onClick={() => setActiveTab('settings')} 
            className="ml-2 text-amber-950 underline hover:text-black font-black transition"
          >
            Switch to Production →
          </button>
        </div>
      )}
      <GlobalNotificationToast />
      <GlobalConfirmModal />
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
        />
        <main className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-4 md:p-6 transition-colors">
          {children(activeTab, setActiveTab)}
        </main>
      </div>
    </div>
  );
};
