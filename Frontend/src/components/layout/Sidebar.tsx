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
  const { hasPermission, approvals } = usePharmacy();
  const pendingApprovalsCount = approvals.filter(a => a.status === 'PENDING').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard & Queue', icon: LayoutDashboard, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null, module: 'reports' },
    { id: 'pos', label: 'Point of Sale (POS)', icon: ShoppingCart, module: 'pos' },
    { id: 'sales', label: 'Sales & Returns', icon: Receipt, module: 'sales' },
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

  const [catalogueExpanded, setCatalogueExpanded] = useState(true);

  const catalogueSubItems = [
    { id: 'catalogue', label: 'All Medications', icon: '📋' },
    { id: 'catalogue:categories', label: 'Therapeutic Categories', icon: '🏷️' },
    { id: 'catalogue:dosage-forms', label: 'Dosage Forms & Rules', icon: '🧪' },
    { id: 'catalogue:predictor-rules', label: 'Predictor Unit Rules', icon: '⚖️' },
    { id: 'catalogue:units', label: 'Unit Types & Packaging', icon: '📦' },
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
          const isAllowed = hasPermission(item.module as any, 'read');
          if (!isAllowed) return null;

          const isCatalogue = item.id === 'catalogue';
          const isCatalogueActive = activeTab.startsWith('catalogue');
          const isActive = isCatalogue ? isCatalogueActive : activeTab === item.id;
          const Icon = item.icon;

          if (isCatalogue) {
            return (
              <div key={item.id} className="space-y-1">
                <button
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    if (collapsed) {
                      setActiveTab('catalogue');
                    } else {
                      setCatalogueExpanded(!catalogueExpanded);
                      if (!isCatalogueActive) {
                        setActiveTab('catalogue');
                      }
                    }
                  }}
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

                  {!collapsed && (
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      catalogueExpanded ? 'rotate-90' : ''
                    } ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  )}

                  {/* Flyout popover on collapse */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 p-2 bg-slate-900 text-white rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all whitespace-nowrap z-50 min-w-[200px] space-y-1">
                      <div className="px-2 py-1 font-bold text-xs text-brand-300 border-b border-slate-700">
                        Product Catalogue
                      </div>
                      {catalogueSubItems.map(sub => (
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
                </button>

                {/* Sub-menu accordion when expanded */}
                {!collapsed && catalogueExpanded && (
                  <div className="ml-5 pl-2.5 border-l-2 border-brand-200 dark:border-brand-800/60 space-y-0.5 animate-in fade-in duration-150">
                    {catalogueSubItems.map(sub => {
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
