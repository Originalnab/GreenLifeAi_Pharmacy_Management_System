import React, { useState } from 'react';
import { Check, Copy, KeyRound, ShieldAlert, Eye, EyeOff, Send, X, UserCheck, ShieldCheck } from 'lucide-react';
import { User } from '../../../types';

interface UserCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  temporaryPassword: string;
  isPasswordReset?: boolean;
}

export const UserCredentialsModal: React.FC<UserCredentialsModalProps> = ({
  isOpen,
  onClose,
  user,
  temporaryPassword,
  isPasswordReset = false,
}) => {
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const credentialsText = `🏥 GREENLIFE AI PHARMACY SUITE - ${isPasswordReset ? 'PASSWORD RESET NOTIFICATION' : 'STAFF CREDENTIALS'}
Staff Member: ${user.name}
System Role: ${user.role}
Assigned Branch: ${user.branchName}

🔐 LOGIN CREDENTIALS:
• Portal URL: ${window.location.origin}
• Username: ${user.username}
• Temporary Password: ${temporaryPassword}

⚠️ SECURITY NOTICE:
You will be automatically directed to change this temporary password immediately upon signing in.`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(credentialsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy credentials', err);
    }
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(credentialsText)}`;
  const emailShareUrl = `mailto:${user.email || ''}?subject=${encodeURIComponent(`Greenlife Pharmacy Portal: ${isPasswordReset ? 'Password Reset' : 'Account Created'}`)}&body=${encodeURIComponent(credentialsText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-clinical-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              {isPasswordReset ? (
                <KeyRound className="w-6 h-6 text-white" />
              ) : (
                <UserCheck className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded text-white/90">
                {isPasswordReset ? 'Temporary Password Generated' : 'Staff Account Ready'}
              </span>
              <h3 className="text-xl font-black mt-1">
                {isPasswordReset ? 'Staff Password Reset' : 'Account Created Successfully'}
              </h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* User Info Card */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username} • {user.email || 'No email'}</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 rounded-lg border border-brand-200 dark:border-brand-800">
              {user.role}
            </span>
          </div>

          {/* Credentials Display Box */}
          <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Single-Use Temporary Credentials</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline flex items-center space-x-1"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/70 dark:border-amber-900/60 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Username / ID</p>
                <p className="font-mono text-sm font-bold text-slate-900 dark:text-white select-all mt-0.5">
                  {user.username}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/70 dark:border-amber-900/60 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Temporary Password</p>
                <p className="font-mono text-sm font-black text-brand-600 dark:text-brand-400 select-all mt-0.5 tracking-wide">
                  {showPassword ? temporaryPassword : '••••••••••••'}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 font-medium leading-relaxed">
              💡 The user is required by system policy to change this password on their very first sign-in before accessing dispensary, sales, or management features.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-md ${
                copied
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-500/20'
                  : 'bg-brand-600 hover:bg-brand-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied Credentials to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Credentials to Clipboard</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center space-x-1.5 transition text-center"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send via WhatsApp</span>
              </a>

              <a
                href={emailShareUrl}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-1.5 transition text-center"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Send via Email</span>
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
