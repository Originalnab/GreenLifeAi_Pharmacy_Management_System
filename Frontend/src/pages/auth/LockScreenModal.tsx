import React, { useState } from 'react';
import { Lock, ArrowRight, LogOut, ShieldCheck, AlertCircle } from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';

export const LockScreenModal: React.FC = () => {
  const { currentUser, isScreenLocked, unlockScreen, logout } = usePharmacy();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isScreenLocked) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your password to unlock terminal.');
      return;
    }

    const success = unlockScreen(password);
    if (!success) {
      setError('Incorrect password. Please verify credentials.');
      setPassword('');
    } else {
      setError(null);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-sm w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-5 text-slate-100">
        
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-lg shadow-brand-500/20">
          {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center space-x-1.5 text-xs text-brand-400 font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Terminal Screen Locked</span>
          </div>
          <h3 className="font-extrabold text-lg text-white">{currentUser.name}</h3>
          <p className="text-xs text-slate-400">{currentUser.role} • {currentUser.branchName}</p>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-3 text-xs">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password to resume..."
            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-brand-500 rounded-xl text-center font-medium focus:ring-2 focus:ring-brand-500/20 outline-none transition"
          />

          <button
            type="submit"
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md shadow-brand-600/20 flex items-center justify-center space-x-1.5 transition"
          >
            <span>Unlock Terminal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={logout}
            className="text-slate-400 hover:text-rose-400 font-medium flex items-center space-x-1.5 transition text-[11px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Account / Sign Out</span>
          </button>

          <span className="text-[10px] text-slate-500 flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Secure</span>
          </span>
        </div>

      </div>
    </div>
  );
};
