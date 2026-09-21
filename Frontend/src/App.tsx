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

export const App: React.FC = () => {
  return (
    <PharmacyProvider>
      <AppShell>
        {(activeTab, setActiveTab) => {
          switch (activeTab) {
            case 'dashboard':
              return <DashboardPage onNavigate={setActiveTab} />;
            case 'pos':
              return <PointOfSalePage />;
            case 'sales':
              return <SalesHistoryPage />;
            case 'catalogue':
            case 'catalogue:categories':
            case 'catalogue:dosage-forms':
            case 'catalogue:predictor-rules':
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
        }}
      </AppShell>
    </PharmacyProvider>
  );
};

export default App;
