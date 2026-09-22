import React from 'react';
import { usePharmacy } from '../../context/PharmacyContext';

// Role-specific layouts
import { SuperAdminDashboard }     from './layouts/SuperAdminDashboard';
import { PharmacyAdminDashboard }  from './layouts/PharmacyAdminDashboard';
import { ManagerDashboard }        from './layouts/ManagerDashboard';
import { PharmacistDashboard }     from './layouts/PharmacistDashboard';
import { CashierDashboard }        from './layouts/CashierDashboard';
import { SalesPersonDashboard }    from './layouts/SalesPersonDashboard';
import { StockOfficerDashboard }   from './layouts/StockOfficerDashboard';
import { ProcurementDashboard }    from './layouts/ProcurementDashboard';
import { AccountantDashboard }     from './layouts/AccountantDashboard';
import { AuditorDashboard }        from './layouts/AuditorDashboard';
import { CustomRoleDashboard }     from './layouts/CustomRoleDashboard';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { currentUser } = usePharmacy();

  switch (currentUser.role) {
    case 'Super Admin':
      return <SuperAdminDashboard onNavigate={onNavigate} />;
    case 'Pharmacy Admin':
      return <PharmacyAdminDashboard onNavigate={onNavigate} />;
    case 'Manager':
      return <ManagerDashboard onNavigate={onNavigate} />;
    case 'Pharmacist':
      return <PharmacistDashboard onNavigate={onNavigate} />;
    case 'Cashier':
      return <CashierDashboard onNavigate={onNavigate} />;
    case 'Sales Person':
      return <SalesPersonDashboard onNavigate={onNavigate} />;
    case 'Stock Officer':
      return <StockOfficerDashboard onNavigate={onNavigate} />;
    case 'Procurement Officer':
      return <ProcurementDashboard onNavigate={onNavigate} />;
    case 'Accountant':
      return <AccountantDashboard onNavigate={onNavigate} />;
    case 'Auditor':
      return <AuditorDashboard onNavigate={onNavigate} />;
    default:
      return <CustomRoleDashboard onNavigate={onNavigate} />;
  }
};
