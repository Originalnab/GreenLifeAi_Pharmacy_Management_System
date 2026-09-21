import React, { useState, useEffect } from 'react';
import { 
  MonitorPlay, CheckCircle2, Loader2, RotateCcw, 
  ShieldCheck, Database, HardDrive, Cpu, Layers 
} from 'lucide-react';

export const LauncherSimulationPage: React.FC = () => {
  const steps = [
    { title: 'Initialize', message: 'Starting GreenlifeAI Pharmacy Management System.', icon: Cpu },
    { title: 'Requirements', message: 'Checking computer requirements (Windows 11 x64, 16GB RAM, AVX2).', icon: HardDrive },
    { title: 'Services', message: 'Starting secure containerized application services (Docker Compose).', icon: Layers },
    { title: 'Database', message: 'Connecting to the local PostgreSQL database.', icon: Database },
    { title: 'Integrity', message: 'Checking database schema & foreign key integrity.', icon: ShieldCheck },
    { title: 'Configuration', message: 'Loading Victoria Island branch operational parameters.', icon: Layers },
    { title: 'Backup', message: 'Confirming automated backup snapshot status.', icon: HardDrive },
    { title: 'Ready', message: 'Preparing the secure dispensary register portal.', icon: CheckCircle2 }
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(steps.length);
  const [isRunning, setIsRunning] = useState(false);

  const startBootSequence = () => {
    setIsRunning(true);
    setCurrentStepIndex(0);
  };

  useEffect(() => {
    if (isRunning && currentStepIndex < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    } else if (currentStepIndex >= steps.length) {
      setIsRunning(false);
    }
  }, [isRunning, currentStepIndex]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <MonitorPlay className="w-5 h-5 text-brand-600" />
            <span>Windows Desktop Launcher Simulator</span>
          </h2>
          <p className="text-xs text-slate-500">
            PRD Section 12: Real-time 8-stage local startup verification and self-healing diagnostics.
          </p>
        </div>

        <button
          onClick={startBootSequence}
          disabled={isRunning}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Running Sequence...' : 'Re-Run Warm Boot Sequence'}</span>
        </button>
      </div>

      {/* Launcher Window Mockup */}
      <div className="bg-slate-950 text-white rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* Title Bar */}
        <div className="bg-slate-900/80 px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-xs font-semibold text-slate-400 pl-2">GreenlifeAI System Launcher v1.0</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
            PORT: 8080 (127.0.0.1)
          </span>
        </div>

        {/* Steps List */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {steps.map((step, idx) => {
              const isDone = currentStepIndex > idx;
              const isCurrent = currentStepIndex === idx;
              const Icon = step.icon;

              return (
                <div 
                  key={idx}
                  className={`flex items-center space-x-3 p-2.5 rounded-xl transition-all duration-300 ${
                    isCurrent 
                      ? 'bg-brand-950/60 border border-brand-500/50 shadow-md shadow-brand-500/10' 
                      : isDone ? 'opacity-80' : 'opacity-25'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isDone 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : isCurrent ? 'bg-brand-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold">{step.title}</span>
                      {isDone && <span className="text-[10px] text-emerald-400 font-semibold font-mono">OK</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{step.message}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex justify-between text-xs text-slate-400 font-semibold pb-1.5">
              <span>Overall Startup Readiness:</span>
              <span className="font-mono text-emerald-400">
                {Math.min(100, Math.round((currentStepIndex / steps.length) * 100))}%
              </span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
              <div 
                style={{ width: `${Math.min(100, Math.round((currentStepIndex / steps.length) * 100))}%` }}
                className="h-full bg-gradient-to-r from-brand-500 to-clinical-400 transition-all duration-300 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
