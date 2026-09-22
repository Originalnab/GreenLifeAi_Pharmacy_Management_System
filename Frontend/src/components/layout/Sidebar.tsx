import React, { useState } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Receipt, Pill, 
  Truck, Boxes, Users, Wallet, BarChart3, 
  Settings, ShieldAlert, MonitorPlay, ChevronLeft, ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  collapsed, 
  setCollapsed 
}) => {
  const { hasPermission, approvals, draftSales, returns, creditNotes, creditSales, currentUser, isModuleEnabled } = usePharmacy();
  const pendingApprovalsCount = approvals.filter(a => a.status === 'PENDING').length;

  const [catalogueExpanded, setCatalogueExpanded] = useState(false);
  const [salesExpanded, setSalesExpanded] = useState(false);

  const salesSubItems = [
    { id: 'sales:ledger', label: 'Sales Invoices Ledger', icon: '🧾' },
    { id: 'sales:credit', label: 'Credit Sales & Receivables', icon: '💰', badge: creditSales?.filter(c => c.status === 'OUTSTANDING' || c.status === 'PARTIALLY_PAID').length || 0 },
    { id: 'sales:drafts', label: 'Drafts & Quotations', icon: '📝', badge: draftSales?.length || 0 },
    { id: 'sales:returns', label: 'Medication Returns', icon: '🔄', badge: returns?.length || 0 },
    { id: 'sales:credits', label: 'Customer Credit Notes', icon: '💳', badge: creditNotes?.filter(c => c.status === 'ACTIVE').length || 0 },
  ];

  const catalogueSubItems = [
    { id: 'catalogue', label: 'All Medications', icon: '📋' },
    { id: 'catalogue:categories', label: 'Therapeutic Categories', icon: '🏷️' },
    { id: 'catalogue:dosage-forms', label: 'Dosage Forms & Rules', icon: '🧪' },
    { id: 'catalogue:units', label: 'Unit Types & Packaging', icon: '📦' },
  ];

  const visibleSalesSubItems = salesSubItems.filter(sub => isModuleEnabled(sub.id));
  const visibleCatalogueSubItems = catalogueSubItems.filter(sub => isModuleEnabled(sub.id));

  const totalSalesBadge = (draftSales?.length || 0) + (returns?.length || 0) + (creditSales?.filter(c => c.status === 'OUTSTANDING' || c.status === 'PARTIALLY_PAID').length || 0);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard & Queue', icon: LayoutDashboard, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null, module: 'reports' },
    { id: 'pos', label: 'Point of Sale (POS)', icon: ShoppingCart, module: 'pos' },
    { id: 'sales', label: 'Sales & Returns', icon: Receipt, badge: totalSalesBadge > 0 ? totalSalesBadge : null, module: 'sales' },
    { id: 'catalogue', label: 'Product Catalogue', icon: Pill, module: 'catalogue' },
    { id: 'inventory', label: 'Inventory & Expiry', icon: Boxes, module: 'inventory' },
    { id: 'purchasing', label: 'Purchasing & GRN', icon: Truck, module: 'purchasing' },
    { id: 'parties', label: 'Customers & Suppliers', icon: Users, module: 'parties' },
    { id: 'finance', label: 'Finance & Loans', icon: Wallet, module: 'finance' },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, module: 'reports' },
    { id: 'settings', label: 'System Settings', icon: SlidersHorizontal, module: 'administration' },
    { id: 'administration', label: 'Administration & Profile', icon: Settings, module: 'administration' },
    { id: 'audit', label: 'Audit & Health Logs', icon: ShieldAlert, module: 'audit' },
  ];

  return (
    <aside 
      className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 z-20 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map(item => {
          // Super Admin strict requirement for System Settings
          if (item.id === 'settings' && currentUser?.role !== 'Super Admin') return null;

          // Module feature switch check
          if (!isModuleEnabled(item.id)) return null;

          const isAllowed = item.id === 'dashboard' ? true : hasPermission(item.module as any, 'read');
          if (!isAllowed) return null;

          const isSales = item.id === 'sales';
          if (isSales && visibleSalesSubItems.length === 0) return null;

          const isSalesActive = activeTab === 'sales' || activeTab.startsWith('sales:');
          const isCatalogue = item.id === 'catalogue';
          if (isCatalogue && visibleCatalogueSubItems.length === 0) return null;

          const isCatalogueActive = activeTab.startsWith('catalogue');
          const isActive = isSales ? isSalesActive : (isCatalogue ? isCatalogueActive : activeTab === item.id);
          const Icon = item.icon;

          if (isSales) {
            const defaultSalesTarget = visibleSalesSubItems[0]?.id || 'sales:ledger';
            return (
              <div key={item.id} className="space-y-1 relative group">
                <button
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    if (collapsed) {
                      setActiveTab(defaultSalesTarget);
                    } else {
                      setSalesExpanded(!salesExpanded);
                      if (!isSalesActive) {
                        setActiveTab(defaultSalesTarget);
                      }
                    }
                  }}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center px-2' : 'justify-between px-3'
                  } py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 font-bold' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400'
                    }`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!collapsed && (
                    <div className="flex items-center space-x-1.5">
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-white text-brand-700' : 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        salesExpanded ? 'rotate-90' : ''
                      } ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                  )}
                </button>

                {/* Flyout popover on collapse */}
                {collapsed && (
                  <div className="absolute left-full top-0 ml-2 p-2 bg-slate-900 text-white rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all whitespace-nowrap z-50 min-w-[210px] space-y-1">
                    <div className="px-2 py-1 font-bold text-xs text-brand-300 border-b border-slate-700 flex items-center justify-between">
                      <span>Sales & Returns</span>
                      {item.badge && <span className="bg-brand-500 text-white px-1.5 py-0.5 rounded-full text-[9px]">{item.badge}</span>}
                    </div>
                    {visibleSalesSubItems.map(sub => (
                      <button
                        key={sub.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab(sub.id);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                          (activeTab === sub.id || (sub.id === 'sales:ledger' && activeTab === 'sales'))
                            ? 'bg-brand-600 text-white font-bold' 
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span>{sub.icon}</span>
                          <span>{sub.label}</span>
                        </div>
                        {sub.badge !== undefined && sub.badge > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-brand-300 font-bold">
                            {sub.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Sub-menu accordion when expanded */}
                {!collapsed && salesExpanded && (
                  <div className="ml-5 pl-2.5 border-l-2 border-brand-200 dark:border-brand-800/60 space-y-0.5 animate-in fade-in duration-150">
                    {visibleSalesSubItems.map(sub => {
                      const isSubActive = activeTab === sub.id || (sub.id === 'sales:ledger' && activeTab === 'sales');
                      return (
                        <button
                          key={sub.id}
                          id={`nav-sub-${sub.id.replace(':', '-')}`}
                          onClick={() => setActiveTab(sub.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition ${
                            isSubActive
                              ? 'bg-brand-100 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-bold border border-brand-300 dark:border-brand-800'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="text-xs">{sub.icon}</span>
                            <span className="truncate">{sub.label}</span>
                          </div>
                          {sub.badge !== undefined && sub.badge > 0 && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
                              isSubActive ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}>
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          if (isCatalogue) {
            const defaultCatalogueTarget = visibleCatalogueSubItems[0]?.id || 'catalogue';
            return (
              <div key={item.id} className="space-y-1 relative group">
                <button
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    if (collapsed) {
                      setActiveTab(defaultCatalogueTarget);
                    } else {
                      setCatalogueExpanded(!catalogueExpanded);
                      if (!isCatalogueActive) {
                        setActiveTab(defaultCatalogueTarget);
                      }
                    }
                  }}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center px-2' : 'justify-between px-3'
                  } py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 font-bold' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400'
                    }`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!collapsed && (
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      catalogueExpanded ? 'rotate-90' : ''
                    } ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  )}
                </button>

                {/* Flyout popover on collapse */}
                {collapsed && (
                  <div className="absolute left-full top-0 ml-2 p-2 bg-slate-900 text-white rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all whitespace-nowrap z-50 min-w-[200px] space-y-1">
                    <div className="px-2 py-1 font-bold text-xs text-brand-300 border-b border-slate-700">
                      Product Catalogue
                    </div>
                    {visibleCatalogueSubItems.map(sub => (
                      <button
                        key={sub.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab(sub.id);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center space-x-2 transition ${
                          activeTab === sub.id 
                            ? 'bg-brand-600 text-white font-bold' 
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span>{sub.icon}</span>
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Sub-menu accordion when expanded */}
                {!collapsed && catalogueExpanded && (
                  <div className="ml-5 pl-2.5 border-l-2 border-brand-200 dark:border-brand-800/60 space-y-0.5 animate-in fade-in duration-150">
                    {visibleCatalogueSubItems.map(sub => {
                      const isSubActive = activeTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          id={`nav-sub-${sub.id.replace(':', '-')}`}
                          onClick={() => setActiveTab(sub.id)}
                          className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-[11px] transition ${
                            isSubActive
                              ? 'bg-brand-100 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-bold border border-brand-300 dark:border-brand-800'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          <span className="text-xs">{sub.icon}</span>
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center px-2' : 'justify-between px-3'
              } py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                isActive 
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 font-bold' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400'
                }`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white text-brand-700' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {item.badge}
                </span>
              )}

              {/* Tooltip on collapse */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50">
                  {item.label}
                  {item.badge && ` (${item.badge})`}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <div className="flex items-center space-x-2 text-xs font-medium">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Menu</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
