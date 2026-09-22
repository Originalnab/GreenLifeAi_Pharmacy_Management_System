import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { AlertTriangle, CheckCircle2, Info, X, AlertCircle } from 'lucide-react';
import { ToastItem } from '../../types';

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const duration = toast.duration || 4500;
  const [progress, setProgress] = useState<number>(100);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = 50;
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev - decrement;
        if (next <= 0) {
          clearInterval(timer);
          setTimeout(() => onDismiss(toast.id), 0);
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, isPaused, onDismiss, toast.id]);

  const styleMap = {
    success: {
      card: 'bg-emerald-950/90 dark:bg-emerald-950/95 border-emerald-600/70 text-emerald-100 shadow-emerald-950/60',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
      progressBar: 'bg-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    },
    error: {
      card: 'bg-rose-950/90 dark:bg-rose-950/95 border-rose-600/70 text-rose-100 shadow-rose-950/60',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
      progressBar: 'bg-rose-400',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    },
    warning: {
      card: 'bg-amber-950/90 dark:bg-amber-950/95 border-amber-600/70 text-amber-100 shadow-amber-950/60',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
      progressBar: 'bg-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    },
    info: {
      card: 'bg-sky-950/90 dark:bg-sky-950/95 border-sky-600/70 text-sky-100 shadow-sky-950/60',
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />,
      progressBar: 'bg-sky-400',
      badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
    }
  };

  const style = styleMap[toast.type] || styleMap.info;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative overflow-hidden flex flex-col p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in slide-in-from-right-5 fade-in pointer-events-auto ${style.card}`}
    >
      <div className="flex items-start space-x-3">
        {style.icon}
        <div className="flex-1 pr-2 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-bold text-xs tracking-wide">
              {toast.title || (
                toast.type === 'success' ? 'Operation Completed' :
                toast.type === 'error' ? 'Operation Failed' :
                toast.type === 'warning' ? 'Attention Required' : 'Dispensary Notice'
              )}
            </span>
          </div>
          <p className="text-xs leading-relaxed opacity-95 font-medium break-words">
            {toast.message}
          </p>
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="p-1 rounded-lg hover:bg-white/10 transition text-white/70 hover:text-white shrink-0"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Countdown Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 overflow-hidden">
        <div 
          className={`h-full transition-all duration-75 linear ${style.progressBar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const GlobalNotificationToast: React.FC = () => {
  const { toasts, dismissToast } = usePharmacy();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9998] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <ToastCard 
          key={toast.id} 
          toast={toast} 
          onDismiss={dismissToast} 
        />
      ))}
    </div>
  );
};
