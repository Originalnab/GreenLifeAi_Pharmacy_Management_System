import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, 
  AlertCircle, ArrowRight, LogOut, KeyRound 
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';

export const MandatoryPasswordChangeModal: React.FC = () => {
  const { currentUser, changeUserPassword, logout } = usePharmacy();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password requirement checks
  const hasMinLength = newPassword.length >= 6;
  const hasMixedCase = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = hasMinLength && passwordsMatch && currentPassword.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentPassword.trim()) {
      setErrorMessage('Please enter your current temporary password.');
      return;
    }

    if (!hasMinLength) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = changeUserPassword(currentUser.id, currentPassword, newPassword);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to update password. Please check your credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Security Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded text-white/95">
                Mandatory Security Requirement
              </span>
              <h3 className="text-xl font-black mt-1">
                Update Temporary Password
              </h3>
            </div>
          </div>
          <p className="text-xs text-white/90 mt-2 leading-relaxed">
            Welcome, <span className="font-bold underline">{currentUser.name}</span>. You have logged in using a single-use temporary password. To access pharmacy records, please configure a new confidential permanent password.
          </p>
        </div>

        {/* User Identity Context Card */}
        <div className="px-6 pt-5 pb-1">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white">{currentUser.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Username: @{currentUser.username}</p>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                {currentUser.role}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[130px]">{currentUser.branchName}</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 flex items-start space-x-2 animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <p className="text-xs font-semibold">{errorMessage}</p>
            </div>
          )}

          {/* Current Temporary Password */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Current Temporary Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter temporary password provided by admin"
                className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              New Permanent Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Choose strong permanent password"
                className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new permanent password"
                className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Password Security Checklist */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
            <p className="font-bold text-slate-700 dark:text-slate-300 text-[10px] uppercase tracking-wider">
              Security Checklist
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <div className={`flex items-center space-x-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>At least 6 characters</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${hasMixedCase ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Upper & lowercase</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Contains a number</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Passwords match</span>
              </div>
            </div>
          </div>

          {/* Submit and Sign Out Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-md transition ${
                isFormValid && !isSubmitting
                  ? 'bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving New Password...' : 'Save Password & Enter System'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2 px-3 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cancel & Sign Out</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
