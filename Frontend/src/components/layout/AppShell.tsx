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
  const getInitialTab = (): string => {
    try {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (hash) return hash;
      const saved = localStorage.getItem('greenlife_active_page');
      if (saved) return saved;
    } catch (e) {
      // fallback
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const { operatingMode } = usePharmacy();

  const handleSetActiveTab = React.useCallback((tab: string) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('greenlife_active_page', tab);
      if (window.location.hash.replace(/^#\/?/, '') !== tab) {
        window.location.hash = `#/${tab}`;
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Listen to browser navigation / back-forward buttons
  React.useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (hash && hash !== activeTab) {
        setActiveTabState(hash);
        try {
          localStorage.setItem('greenlife_active_page', hash);
        } catch (e) {}
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [activeTab]);

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {operatingMode === 'DEMO' && (
        <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-extrabold text-xs py-1 px-4 text-center flex items-center justify-center space-x-2 shadow-sm border-b border-amber-600 animate-in slide-in-from-top duration-200 select-none">
          <AlertTriangle className="w-4 h-4 text-slate-950 animate-pulse shrink-0" />
          <span>TRAINING & DEMO MODE ACTIVE — Simulated sandbox data. Real production financial ledger and PCN reports are isolated.</span>
          <button 
            onClick={() => handleSetActiveTab('settings')} 
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
          setActiveTab={handleSetActiveTab} 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
        />
        <main className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-4 md:p-6 transition-colors">
          {children(activeTab, handleSetActiveTab)}
        </main>
      </div>
    </div>
  );
};
