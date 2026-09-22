import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Check, Star, AlertCircle,
  Shield, UserCheck, Stethoscope, DollarSign, Package,
  ShoppingCart, Calculator, FileCheck, Award, Info, TrendingUp
} from 'lucide-react';
import { User, RoleType, getUserAssignedRoles, getUserPrimaryRole } from '../../../types';
import { usePharmacy } from '../../../context/PharmacyContext';

interface AssignUserRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

interface RoleConfig {
  role: RoleType;
  icon: React.ElementType;
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  keyPermissions: string;
}

const SYSTEM_ROLES: RoleConfig[] = [
  {
    role: 'Super Admin',
    icon: Shield,
    color: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60',
    badgeText: 'text-purple-700 dark:text-purple-300',
    description: 'Unrestricted master platform governance, database maintenance, system-wide settings & safety backups.',
    keyPermissions: 'Full Access • System Backup/Reset • Global RBAC'
  },
  {
    role: 'Pharmacy Admin',
    icon: ShieldCheck,
    color: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    description: 'Facility administration, staff directory management, dispensary branding, formulary price margins & reporting.',
    keyPermissions: 'Staff Directory • Premises Profile • Pricing Rules'
  },
  {
    role: 'Manager',
    icon: Award,
    color: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
    badgeText: 'text-blue-700 dark:text-blue-300',
    description: 'Operational oversight, supervisor price overrides, shift audits, customer credit ceilings & staff scheduling.',
    keyPermissions: 'Shift Audits • PO Authorizations • Price Overrides'
  },
  {
    role: 'Pharmacist',
    icon: Stethoscope,
    color: 'text-teal-600 dark:text-teal-400',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/60',
    badgeText: 'text-teal-700 dark:text-teal-300',
    description: 'Prescription dispensing, clinical dosage evaluation, drug interaction checks, batch intake inspection.',
    keyPermissions: 'Clinical Dispensation • Rx Verification • Batch Intake'
  },
  {
    role: 'Cashier',
    icon: DollarSign,
    color: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    description: 'Counter POS checkout, cash desk transactions, receipt issuance, return intake, and shift cash-up reconciliation.',
    keyPermissions: 'POS Counter • Cash/Momo Tenders • Shift Settlement'
  },
  {
    role: 'Sales Person',
    icon: TrendingUp,
    color: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    description: 'Front-desk dispensations, counter checkouts, pro-forma customer quotations, patient management & personal performance tracking.',
    keyPermissions: 'Personal Sales Dashboard • Counter POS • Draft Quotes'
  },
  {
    role: 'Stock Officer',
    icon: Package,
    color: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    description: 'Warehouse inventory control, storage bin allocation, FEFO expiry segregation, batch stock counts & quarantine.',
    keyPermissions: 'Bin Allocations • Expiry FEFO • Stock Takes'
  },
  {
    role: 'Procurement Officer',
    icon: ShoppingCart,
    color: 'text-cyan-600 dark:text-cyan-400',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950/60',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    description: 'Supplier relationship management, purchase order generation, quotation comparisons & GRN receipt recording.',
    keyPermissions: 'Purchase Orders • Vendor Quotations • GRN Intake'
  },
  {
    role: 'Accountant',
    icon: Calculator,
    color: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
    description: 'Financial ledger maintenance, daily cash-up audit, vendor credit management, operating disbursements & tax reports.',
    keyPermissions: 'General Ledger • Expense Vouchers • Financial Reports'
  },
  {
    role: 'Auditor',
    icon: FileCheck,
    color: 'text-slate-600 dark:text-slate-400',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300',
    description: 'Independent regulatory oversight, tamper-evident audit log review, compliance reporting & read-only ledger audit.',
    keyPermissions: 'Audit Trails • Regulatory PCN Inspection • Read-Only Logs'
  }
];

export const AssignUserRolesModal: React.FC<AssignUserRolesModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const { assignUserRoles, currentUser } = usePharmacy();
  const [selectedRoles, setSelectedRoles] = useState<RoleType[]>([]);
  const [primaryRole, setPrimaryRole] = useState<RoleType>('Pharmacist');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isCurrentSuperAdmin = 
    currentUser.role === 'Super Admin' || 
    currentUser.username?.toLowerCase() === 'admink19' || 
    currentUser.username === 'superadmin' || 
    currentUser.primaryRole === 'Super Admin' ||
    (Array.isArray(currentUser.assignedRoles) && currentUser.assignedRoles.includes('Super Admin'));

  const visibleRoles = SYSTEM_ROLES.filter(cfg => {
    if (cfg.role === 'Super Admin' && !isCurrentSuperAdmin) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (user) {
      const assigned = getUserAssignedRoles(user);
      const primary = getUserPrimaryRole(user);
      setSelectedRoles(assigned);
      setPrimaryRole(primary);
      setErrorMsg(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleToggleRole = (role: RoleType) => {
    setErrorMsg(null);
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) {
        setErrorMsg('Staff member must have at least one assigned role.');
        return;
      }
      const updated = selectedRoles.filter(r => r !== role);
      setSelectedRoles(updated);
      if (primaryRole === role) {
        setPrimaryRole(updated[0]);
      }
    } else {
      const updated = [...selectedRoles, role];
      setSelectedRoles(updated);
      if (selectedRoles.length === 0) {
        setPrimaryRole(role);
      }
    }
  };

  const handleSetPrimaryRole = (role: RoleType, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedRoles.includes(role)) {
      setSelectedRoles(prev => [...prev, role]);
    }
    setPrimaryRole(role);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoles.length === 0) {
      setErrorMsg('Please select at least one role for this staff member.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const success = await assignUserRoles(user.id, selectedRoles, primaryRole);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save assigned roles.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-xl border border-brand-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Assign Roles & RBAC Authority</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                  Multi-Role Support
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure role assignments and default sign-in privileges for this staff member
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Quick Info Banner */}
        <div className="p-4 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
              <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
                <span>@{user.username}</span>
                <span>•</span>
                <span>{user.email}</span>
                {user.licenseNumber && (
                  <>
                    <span>•</span>
                    <span className="text-brand-600 dark:text-brand-400 font-semibold">{user.licenseNumber}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Active Role</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800 inline-block mt-0.5">
              {user.role}
            </span>
          </div>
        </div>

        {/* Explanatory Notice */}
        <div className="px-5 pt-4">
          <div className="bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/50 rounded-xl p-3 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <div className="text-xs text-brand-900 dark:text-brand-200 space-y-1">
              <p className="font-semibold">How Multi-Role Assignment Works:</p>
              <ul className="list-disc list-inside text-[11px] text-brand-800 dark:text-brand-300 space-y-0.5">
                <li>Check all roles this staff member is authorized to perform.</li>
                <li>Set their <strong>Primary Role (★)</strong> — the user will sign in with this role by default.</li>
                <li>Staff members can switch seamlessly between their assigned roles in the top header.</li>
              </ul>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Roles Selection Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="space-y-2.5">
            {visibleRoles.map((cfg) => {
              const isChecked = selectedRoles.includes(cfg.role);
              const isPrimary = primaryRole === cfg.role;
              const IconComp = cfg.icon;

              return (
                <div
                  key={cfg.role}
                  onClick={() => handleToggleRole(cfg.role)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                    isChecked
                      ? isPrimary
                        ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-400 dark:border-brand-700 shadow-sm ring-1 ring-brand-400 dark:ring-brand-600'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-300 dark:border-slate-700'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Checkbox */}
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by container onClick
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                      />
                    </div>

                    {/* Role Icon & Details */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded-lg ${cfg.badgeBg}`}>
                          <IconComp className={`w-3.5 h-3.5 ${cfg.color}`} />
                        </div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{cfg.role}</span>
                        {isPrimary && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center space-x-1">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            <span>PRIMARY (DEFAULT SIGN-IN)</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {cfg.description}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                        {cfg.keyPermissions}
                      </p>
                    </div>
                  </div>

                  {/* Make Primary Action Button */}
                  <div className="shrink-0 flex items-center space-x-2">
                    {isChecked ? (
                      <button
                        type="button"
                        onClick={(e) => handleSetPrimaryRole(cfg.role, e)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                          isPrimary
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-950 hover:text-amber-700'
                        }`}
                        title={isPrimary ? 'Currently set as primary sign-in role' : 'Set as default primary sign-in role'}
                      >
                        <Star className={`w-3 h-3 ${isPrimary ? 'fill-white text-white' : 'text-slate-400'}`} />
                        <span>{isPrimary ? 'Primary' : 'Make Primary'}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium italic">Unassigned</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-700 dark:text-slate-300">{selectedRoles.length}</span> role{selectedRoles.length === 1 ? '' : 's'} assigned • Primary: <span className="font-bold text-brand-600 dark:text-brand-400">{primaryRole}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedRoles.length === 0}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Role Assignments'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
