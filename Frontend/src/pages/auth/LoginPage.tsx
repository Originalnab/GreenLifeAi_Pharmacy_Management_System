import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, 
  Sparkles, CheckCircle2, ArrowRight, ShieldAlert, KeyRound, 
  Store, HelpCircle, X, ChevronRight, Laptop
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { initialUsers } from '../../data/mock/users';

export const LoginPage: React.FC = () => {
  const { login, failedLoginAttempts, lockoutUntil, isDarkMode, toggleDarkMode, systemProfile } = usePharmacy();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [lockCountdown, setLockCountdown] = useState<number>(0);

  // Secret Demo unlock check: "User 1224" and "user1224"
  const cleanIdent = identifier.trim().toLowerCase();
  const cleanPass = password.trim();
  const isDemoUnlocked = 
    (cleanIdent === 'user 1224' || cleanIdent === 'user1224') && cleanPass === 'user1224';

  // Handle countdown timer if locked out
  useEffect(() => {
    if (!lockoutUntil) {
      setLockCountdown(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Detect Caps Lock
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockActive(e.getModifierState('CapsLock'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter both your identifier and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await login(identifier, password, rememberMe);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your identifier and password.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Authentication error');
    }
  };

  const handleQuickRoleSelect = async (usr: typeof initialUsers[0]) => {
    setIdentifier(usr.username);
    setPassword(usr.password || 'Admin@1234');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await login(usr.username, usr.password || 'Admin@1234', rememberMe);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Login failed');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-950 text-slate-100 relative overflow-hidden font-sans select-none">
      
      {/* Dynamic Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Navigation */}
      <header className="px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-500/25">
            <span>G+</span>
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base tracking-tight flex items-center space-x-1.5">
              <span>Greenlife</span>
              <span className="text-brand-400">AI</span>
              <span className="text-[10px] bg-brand-950 text-brand-300 border border-brand-800 px-1.5 py-0.5 rounded font-mono font-semibold">
                Enterprise v2.4
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Pharmacy Management Suite</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-full text-xs text-slate-400">
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium text-slate-300 truncate max-w-[220px]">
              {systemProfile?.branchName || 'Greenlife Central Branch'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="max-w-md w-full space-y-4">

          {/* Login Card */}
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl shadow-black/60 relative space-y-6">
            
            {/* Card Header */}
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Staff Authentication Portal
              </h2>
              <p className="text-xs text-slate-400">
                Sign in with your pharmacy staff credentials to access dispensary operations.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-start space-x-2.5 text-xs text-rose-200 animate-in fade-in slide-in-from-top-1 duration-150">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Lockout Banner */}
            {lockCountdown > 0 && (
              <div className="p-3.5 bg-amber-950/60 border border-amber-800/80 rounded-xl flex items-start space-x-2.5 text-xs text-amber-200 animate-pulse">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Account Access Throttled</p>
                  <p className="text-[11px] text-amber-300/90 mt-0.5">
                    Security cooldown active. Please wait <strong className="font-mono text-white text-sm">{lockCountdown}s</strong> before retrying.
                  </p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Identifier Field */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  Staff Identifier / Username / Email
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    disabled={isLoading || lockCountdown > 0}
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. Admink19, pharm_amaka, or email..."
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-brand-500 rounded-xl text-slate-100 placeholder:text-slate-600 font-medium focus:ring-2 focus:ring-brand-500/20 transition outline-none text-xs"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold transition"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLoading || lockCountdown > 0}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter account security password..."
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-brand-500 rounded-xl text-slate-100 placeholder:text-slate-600 font-medium focus:ring-2 focus:ring-brand-500/20 transition outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Caps Lock Warning */}
                {capsLockActive && (
                  <p className="text-[11px] text-amber-400 flex items-center space-x-1 pt-0.5">
                    <span>⚠️</span>
                    <span>Caps Lock is currently ON</span>
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-400 hover:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-[11px] font-medium">Keep terminal session signed in</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || lockCountdown > 0}
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-brand-600/25 flex items-center justify-center space-x-2 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-xs"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </div>
                ) : (
                  <>
                    <span>Authenticate & Enter Dispensary</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* UNLOCKED DEMO ROLE SWITCHER (Only shown when user types User 1224 / user1224) */}
            {isDemoUnlocked && (
              <div className="pt-4 border-t border-slate-800 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-3 bg-emerald-950/70 border border-emerald-700/60 rounded-xl flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-extrabold text-emerald-300 text-xs">✨ Developer & Demo Mode Unlocked</p>
                    <p className="text-[10px] text-emerald-400/90">Select a staff role below to simulate instant authenticated entry:</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {initialUsers.map(usr => (
                    <button
                      key={usr.id}
                      type="button"
                      onClick={() => handleQuickRoleSelect(usr)}
                      className="p-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-brand-500/50 rounded-xl text-left transition flex items-center justify-between group shadow-sm"
                    >
                      <div>
                        <p className="font-bold text-slate-200 group-hover:text-brand-300 transition">{usr.role}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{usr.name}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-brand-400 transition" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Card Footer Security Guarantee */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span>Local Vault Enforced</span>
              </span>
              <span>AES-256 Shift Ledger</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-[11px] text-slate-600 z-10 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-900">
        <p>© 2026 GreenlifeAI Technologies. Pharmaceutical Healthcare Information Systems.</p>
        <div className="flex items-center space-x-4">
          <span>Version 2.4.0-Production</span>
          <span>•</span>
          <span>Offline Terminal Ready</span>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-brand-400 font-bold">
                <KeyRound className="w-4 h-4" />
                <span>Credential Recovery Guide</span>
              </div>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl space-y-2 text-emerald-200">
                <div className="flex items-center space-x-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Recovery Ticket Generated</span>
                </div>
                <p className="text-[11px] text-emerald-300">
                  Please contact your designated Pharmacy Super Administrator or Branch Manager. They can reset your password or unlock your account from <strong>Administration & Staff Control</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => { setForgotSuccess(false); setShowForgotModal(false); }}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold mt-2"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  In compliance with clinical pharmacy audit requirements, password resets must be authorized by a <strong>Super Admin</strong> or <strong>Branch Administrator</strong>.
                </p>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-300">Default Super Admin Credentials:</p>
                  <p>Username: <code className="text-brand-400 font-mono">Admink19</code></p>
                  <p>Password: <code className="text-brand-400 font-mono">Admin1224</code></p>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotSuccess(true)}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md transition"
                >
                  Request Administrator Reset
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
