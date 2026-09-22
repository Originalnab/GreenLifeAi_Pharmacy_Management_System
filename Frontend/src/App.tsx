import React from 'react';
import { PharmacyProvider } from './context/PharmacyContext';
import { AppShell } from './components/layout/AppShell';

// Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PointOfSalePage } from './pages/pos/PointOfSalePage';
import { SalesHistoryPage } from './pages/sales/SalesHistoryPage';
import { CataloguePage } from './pages/catalogue/CataloguePage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { PurchasingPage } from './pages/purchasing/PurchasingPage';
import { PartiesPage } from './pages/parties/PartiesPage';
import { FinancePage } from './pages/finance/FinancePage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { AdministrationPage } from './pages/administration/AdministrationPage';
import { AuditPage } from './pages/audit/AuditPage';
import { LauncherSimulationPage } from './pages/launcher/LauncherSimulationPage';
import { SystemSettingsPage } from './pages/settings/SystemSettingsPage';
import { LoginPage } from './pages/auth/LoginPage';
import { LockScreenModal } from './pages/auth/LockScreenModal';
import { MandatoryPasswordChangeModal } from './pages/auth/MandatoryPasswordChangeModal';

import { usePharmacy } from './context/PharmacyContext';

const AppRouter: React.FC<{ activeTab: string; setActiveTab: (tab: string) => void }> = ({ activeTab, setActiveTab }) => {
  const { currentUser, isModuleEnabled } = usePharmacy();

  // Guard System Settings strictly to Super Admin
  if (activeTab === 'settings' && currentUser?.role !== 'Super Admin') {
    return <DashboardPage onNavigate={setActiveTab} />;
  }

  // Guard against navigating to disabled feature modules
  if (!isModuleEnabled(activeTab)) {
    return <DashboardPage onNavigate={setActiveTab} />;
  }

  switch (activeTab) {
    case 'dashboard':
      return <DashboardPage onNavigate={setActiveTab} />;
    case 'pos':
      return <PointOfSalePage />;
    case 'sales':
    case 'sales:ledger':
    case 'sales:credit':
    case 'sales:drafts':
    case 'sales:returns':
    case 'sales:credits':
      return <SalesHistoryPage activeSubTabKey={activeTab} onSelectSubTab={setActiveTab} onNavigate={setActiveTab} />;
    case 'catalogue':
    case 'catalogue:categories':
    case 'catalogue:dosage-forms':
    case 'catalogue:units':
      return <CataloguePage activeSubTab={activeTab} onSelectSubTab={setActiveTab} />;
    case 'inventory':
      return <InventoryPage />;
    case 'purchasing':
      return <PurchasingPage />;
    case 'parties':
      return <PartiesPage />;
    case 'finance':
      return <FinancePage />;
    case 'reports':
      return <ReportsPage />;
    case 'settings':
      return <SystemSettingsPage />;
    case 'administration':
      return <AdministrationPage />;
    case 'audit':
      return <AuditPage />;
    case 'launcher':
      return <SystemSettingsPage initialTab="launcher" />;
    default:
      return <DashboardPage onNavigate={setActiveTab} />;
  }
};

const DEMO_USERNAMES = new Set([
  'admink19', 'superadmin', 'mgr_koffi', 'acct_zainab', 'admin_clara', 'pharm_amaka',
  'cashier_emmanuel', 'stock_tunde', 'proc_kwame', 'audit_justice'
]);

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, isScreenLocked, currentUser, operatingMode } = usePharmacy();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const isDemoAccount = currentUser?.username && (
    DEMO_USERNAMES.has(currentUser.username.toLowerCase()) || 
    currentUser.id?.startsWith('usr_') ||
    operatingMode === 'DEMO'
  );

  // Enforce mandatory password update on temporary credential accounts only (exempt demo accounts)
  if (currentUser?.mustChangePassword && !isDemoAccount) {
    return <MandatoryPasswordChangeModal />;
  }

  return (
    <>
      <AppShell>
        {(activeTab, setActiveTab) => (
          <AppRouter activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
      </AppShell>
      {isScreenLocked && <LockScreenModal />}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <PharmacyProvider>
      <AuthenticatedApp />
    </PharmacyProvider>
  );
};

export default App;
