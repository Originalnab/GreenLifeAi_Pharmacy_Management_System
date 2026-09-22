import React, { useState, useEffect } from 'react';
import { 
  X, UserPlus, Calendar, Phone, Mail, User as UserIcon, 
  Shield, Building2, Award, Sparkles, AlertCircle 
} from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { RoleType, User } from '../../../types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: User, tempPassword: string) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
}) => {
  const { users, createUser, systemProfile, currentUser } = usePharmacy();

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [hasManuallyEditedUsername, setHasManuallyEditedUsername] = useState(false);
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleType>('Pharmacist');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [branchName, setBranchName] = useState(
    systemProfile?.branchName || 'Greenlife Central Branch (Victoria Island)'
  );

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Auto-suggest username when typing names (unless manually altered)
  useEffect(() => {
    if (!hasManuallyEditedUsername) {
      const cleanFirst = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLast = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanFirst && cleanLast) {
        setUsername(`${cleanFirst}.${cleanLast}`);
      } else if (cleanFirst) {
        setUsername(cleanFirst);
      }
    }
  }, [firstName, lastName, hasManuallyEditedUsername]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';
    if (!username.trim()) {
      errors.username = 'Username is required';
    } else {
      const cleanUser = username.trim().toLowerCase();
      const exists = users.some(u => u.username.toLowerCase() === cleanUser);
      if (exists) {
        errors.username = 'Username is already in use by another staff member';
      }
    }

    if (!dob) {
      errors.dob = 'Date of birth is required';
    } else {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        errors.dob = 'Staff member must be at least 18 years old';
      }
    }

    if (!phone.trim()) {
      errors.phone = 'Primary telephone number is required';
    }

    if (role === 'Pharmacist' && !licenseNumber.trim()) {
      errors.licenseNumber = 'PCN / Regulatory license number is required for Pharmacists';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = createUser({
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      username: username.trim().toLowerCase(),
      dob,
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim(),
      email: email.trim() || `${username.trim().toLowerCase()}@greenlifepharmacy.ng`,
      role,
      branchName,
      licenseNumber: licenseNumber.trim(),
    });

    onUserCreated(result.user, result.tempPassword);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-brand-600 via-emerald-600 to-teal-700 p-6 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded text-white/90">
                Staff Identity & Access Provisioning
              </span>
              <h3 className="text-xl font-black mt-1">
                Create New Staff Account
              </h3>
            </div>
          </div>
          <p className="text-xs text-white/80 mt-2 font-medium">
            Register personal and professional details. Single-use temporary credentials will be generated for immediate onboarding.
          </p>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Section 1: Names & Identity */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
              <UserIcon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Personal Identity & Name</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="e.g. Kwame"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                {formErrors.firstName && (
                  <p className="text-[10px] text-rose-500 mt-1 font-medium">{formErrors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Middle Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={e => setMiddleName(e.target.value)}
                  placeholder="e.g. Kofi"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="e.g. Mensah"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                {formErrors.lastName && (
                  <p className="text-[10px] text-rose-500 mt-1 font-medium">{formErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Username & Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    System Username <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-brand-500" />
                    <span>Auto-suggested</span>
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono text-slate-400 text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value);
                      setHasManuallyEditedUsername(true);
                    }}
                    placeholder="kwame.mensah"
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                {formErrors.username && (
                  <p className="text-[10px] text-rose-500 mt-1 font-medium">{formErrors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Date of Birth (DOB) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer"
                  />
                </div>
                {formErrors.dob && (
                  <p className="text-[10px] text-rose-500 mt-1 font-medium">{formErrors.dob}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Contact Details */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
              <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Contact & Communication</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Telephone <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+233 24 123 4567"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-[10px] text-rose-500 mt-1 font-medium">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alternate Telephone <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={alternatePhone}
                    onChange={e => setAlternatePhone(e.target.value)}
                    placeholder="+233 20 987 6543"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="staff@greenlifepharmacy.ng"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Professional Role & Branch */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
              <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Role & Practice Licensing</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  System Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as RoleType)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer"
                >
                  {(currentUser.role === 'Super Admin' || currentUser.username === 'superadmin' || currentUser.username?.toLowerCase() === 'admink19') && (
                    <option value="Super Admin">Super Admin (Full Access)</option>
                  )}
                  <option value="Pharmacy Admin">Pharmacy Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Pharmacist">Pharmacist (Clinical & Dispensing)</option>
                  <option value="Cashier">Cashier (POS & Sales)</option>
                  <option value="Sales Person">Sales Person (Front-Desk & Counter Sales)</option>
                  <option value="Stock Officer">Stock Officer (Inventory & Receiving)</option>
                  <option value="Procurement Officer">Procurement Officer</option>
                  <option value="Accountant">Accountant (Finance & Ledgers)</option>
                  <option value="Auditor">Auditor (Read-Only Review)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Branch
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={branchName}
                    onChange={e => setBranchName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                PCN / Pharmacy Council License Number{' '}
                {role === 'Pharmacist' ? (
                  <span className="text-rose-500">* (Mandatory for Pharmacist)</span>
                ) : (
                  <span className="text-slate-400 font-normal">(Optional)</span>
                )}
              </label>
              <div className="relative">
                <Award className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  placeholder="e.g. PCN-2024-88492"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              {formErrors.licenseNumber && (
                <p className="text-[10px] text-rose-500 mt-1 font-medium">{formErrors.licenseNumber}</p>
              )}
            </div>
          </div>

          {/* Security Policy Notice */}
          <div className="p-3 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/50 rounded-2xl flex items-start space-x-2.5 text-brand-900 dark:text-brand-200">
            <AlertCircle className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold">Automated Credential Generation:</span> A secure temporary password will be generated upon account creation. You can copy or share it directly with the staff member, who will be required to configure a private permanent password during first login.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account & Generate Password</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
