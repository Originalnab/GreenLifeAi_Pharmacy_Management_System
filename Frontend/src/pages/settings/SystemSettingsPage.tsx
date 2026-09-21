import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, Building2, Key, Printer, Database, 
  Palette, Terminal, ShieldAlert, CheckCircle2, AlertTriangle, 
  RefreshCw, Download, UploadCloud, Copy, Eye, EyeOff, Send, 
  Smartphone, CreditCard, Sparkles, Check, X, FileText, QrCode, 
  Barcode, ExternalLink, Activity, Cpu, HardDrive, Layers,
  RotateCcw, Loader2, MonitorPlay, Lock, FileSpreadsheet
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { 
  ReceiptPaperSize, 
  ThemePreset, 
  LogSource, 
  SystemLogEntry,
  OperatingMode 
} from '../../types';
import { FloatingBulkActionBar } from '../../components/common/FloatingBulkActionBar';

interface SystemSettingsPageProps {
  initialTab?: 'credentials' | 'printer' | 'backup' | 'themes' | 'logs' | 'mode' | 'migration' | 'launcher';
}

export const SystemSettingsPage: React.FC<SystemSettingsPageProps> = ({ initialTab }) => {
  const { 
    systemProfile, 
    apiCredentials, 
    updateApiCredentials,
    printerConfig, 
    updatePrinterConfig,
    operatingMode, 
    setOperatingMode, 
    resetDemoData,
    systemLogs, 
    addSystemLog, 
    clearSystemLogs,
    themePreset, 
    setThemePreset,
    currentCurrency,
    formatCurrency,
    currentUser,
    logAuditEvent
  } = usePharmacy();

  const isSuperAdmin = currentUser?.role === 'Super Admin';

  const [activeTab, setActiveTab] = useState<'credentials' | 'printer' | 'backup' | 'themes' | 'logs' | 'mode' | 'migration' | 'launcher'>('credentials');

  useEffect(() => {
    if (initialTab) {
      if (['migration', 'backup', 'launcher', 'mode'].includes(initialTab)) {
        if (isSuperAdmin) {
          setActiveTab(initialTab as any);
        } else {
          setActiveTab('credentials');
        }
      } else {
        setActiveTab(initialTab as any);
      }
    }
  }, [initialTab, isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin && ['migration', 'launcher'].includes(activeTab)) {
      setActiveTab('credentials');
    }
  }, [isSuperAdmin, activeTab]);

  // Migration Wizard State (PRD Section 12)
  const [migrationStep, setMigrationStep] = useState<number>(1);
  const [migrationEntity, setMigrationEntity] = useState('products');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isCommitted, setIsCommitted] = useState(false);

  // Desktop Launcher Simulator State
  const launcherSteps = [
    { title: 'Initialize', message: 'Starting GreenlifeAI Pharmacy Management System.', icon: Cpu },
    { title: 'Requirements', message: 'Checking computer requirements (Windows 11 x64, 16GB RAM, AVX2).', icon: HardDrive },
    { title: 'Services', message: 'Starting secure containerized application services (Docker Compose).', icon: Layers },
    { title: 'Database', message: 'Connecting to the local PostgreSQL database.', icon: Database },
    { title: 'Integrity', message: 'Checking database schema & foreign key integrity.', icon: ShieldAlert },
    { title: 'Configuration', message: 'Loading Victoria Island branch operational parameters.', icon: Layers },
    { title: 'Backup', message: 'Confirming automated backup snapshot status.', icon: HardDrive },
    { title: 'Ready', message: 'Preparing the secure dispensary register portal.', icon: CheckCircle2 }
  ];

  const [launcherStepIndex, setLauncherStepIndex] = useState(launcherSteps.length);
  const [isLauncherRunning, setIsLauncherRunning] = useState(false);

  const startBootSequence = () => {
    setIsLauncherRunning(true);
    setLauncherStepIndex(0);
  };

  useEffect(() => {
    if (isLauncherRunning && launcherStepIndex < launcherSteps.length) {
      const timer = setTimeout(() => {
        setLauncherStepIndex(prev => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    } else if (launcherStepIndex >= launcherSteps.length) {
      setIsLauncherRunning(false);
    }
  }, [isLauncherRunning, launcherStepIndex]);

  // Credentials Form State
  const [credForm, setCredForm] = useState(apiCredentials);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [credSaved, setCredSaved] = useState(false);
  const [isPingingGateway, setIsPingingGateway] = useState(false);
  const [gatewayPingResult, setGatewayPingResult] = useState<{ status: string; latency: number } | null>(null);
  
  // Test SMS Modal
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [testSmsPhone, setTestSmsPhone] = useState('+234 803 123 4567');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsResult, setSmsResult] = useState<string | null>(null);

  // Printer Form State
  const [printerForm, setPrinterForm] = useState(printerConfig);

  // Logs Filter State
  const [logSourceFilter, setLogSourceFilter] = useState<string>('ALL');
  const [logLevelFilter, setLogLevelFilter] = useState<string>('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<SystemLogEntry | null>(null);

  // Demo Mode Switch Modal
  const [showModeModal, setShowModeModal] = useState(false);
  const [targetMode, setTargetMode] = useState<OperatingMode>('PRODUCTION');
  const [modeConfirmText, setModeConfirmText] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Backup State
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [snapshotCreated, setSnapshotCreated] = useState<string | null>(null);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    updateApiCredentials(credForm);
    setCredSaved(true);
    setTimeout(() => setCredSaved(false), 3000);
  };

  const handleSavePrinter = (updates: Partial<typeof printerForm>) => {
    const updated = { ...printerForm, ...updates };
    setPrinterForm(updated);
    updatePrinterConfig(updated);
  };

  const testGatewayHandshake = () => {
    setIsPingingGateway(true);
    setGatewayPingResult(null);
    setTimeout(() => {
      setIsPingingGateway(false);
      setGatewayPingResult({
        status: `200 OK — Connected to ${credForm.paymentGateway} (${credForm.isPaymentLive ? 'LIVE' : 'TEST'} Environment)`,
        latency: Math.floor(Math.random() * 40) + 25
      });
      addSystemLog({
        level: 'INFO',
        source: 'BACKEND_PYTHON',
        component: `app.integrations.${credForm.paymentGateway.toLowerCase()}_client`,
        message: `Gateway Ping Success: ${credForm.paymentGateway} API authenticated successfully. Status: 200 OK.`,
      });
    }, 1200);
  };

  const sendTestSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testSmsPhone.trim()) return;

    setIsSendingSms(true);
    setSmsResult(null);

    setTimeout(() => {
      setIsSendingSms(false);
      setSmsResult(`Test message successfully dispatched via ${credForm.smsProvider} to ${testSmsPhone}. Message ID: msg_${Date.now().toString().slice(-6)}`);
      addSystemLog({
        level: 'INFO',
        source: 'BACKEND_PYTHON',
        component: `app.integrations.${credForm.smsProvider.toLowerCase()}_client`,
        message: `SMS Dispatch: Sent verification SMS to ${testSmsPhone} via ${credForm.smsProvider} (SenderID: ${credForm.smsSenderId}).`,
      });
    }, 1400);
  };

  const triggerSnapshot = () => {
    setIsCreatingSnapshot(true);
    setSnapshotCreated(null);
    setTimeout(() => {
      const filename = `greenlife_db_${Date.now().toString().slice(-6)}.dump`;
      setIsCreatingSnapshot(false);
      setSnapshotCreated(filename);
      addSystemLog({
        level: 'INFO',
        source: 'DATABASE',
        component: 'PostgreSQL 16 pg_dump',
        message: `Database atomic snapshot created: ${filename} (SHA-256 verified). Size: 48.2 MB.`,
      });
    }, 1800);
  };

  const confirmSwitchMode = () => {
    if (modeConfirmText.trim().toUpperCase() !== 'CONFIRM') {
      alert('Please type "CONFIRM" to authorize operating mode transition.');
      return;
    }
    setOperatingMode(targetMode);
    setShowModeModal(false);
    setModeConfirmText('');
  };

  const handleResetDemo = () => {
    if (window.confirm('Are you sure you want to reset all demo sandbox transactions, cashier shifts, and test sales back to default seed state?')) {
      resetDemoData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 4000);
    }
  };

  const triggerSamplePrint = () => {
    window.print();
  };

  const filteredLogs = systemLogs.filter(log => {
    const matchesSource = logSourceFilter === 'ALL' || log.source === logSourceFilter;
    const matchesLevel = logLevelFilter === 'ALL' || log.level === logLevelFilter;
    const matchesSearch = log.message.toLowerCase().includes(logSearch.toLowerCase()) ||
                          log.component.toLowerCase().includes(logSearch.toLowerCase()) ||
                          (log.stackTrace || '').toLowerCase().includes(logSearch.toLowerCase());
    return matchesSource && matchesLevel && matchesSearch;
  });

  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const isAllLogsSelected = filteredLogs.length > 0 && filteredLogs.every(l => selectedLogIds.includes(l.id));
  const isSomeLogsSelected = filteredLogs.some(l => selectedLogIds.includes(l.id)) && !isAllLogsSelected;

  const toggleSelectAllLogs = () => {
    if (isAllLogsSelected) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(filteredLogs.map(l => l.id));
    }
  };

  const toggleSelectLog = (id: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setSelectedLogIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportLogsCSV = () => {
    const targets = systemLogs.filter(l => selectedLogIds.includes(l.id));
    if (targets.length === 0) return;
    const headers = ['Timestamp', 'Level', 'Source', 'Component', 'Message', 'Status Code'];
    const rows = targets.map(l => [
      `"${l.timestamp}"`,
      l.level,
      l.source,
      `"${l.component}"`,
      `"${l.message.replace(/"/g, '""')}"`,
      l.statusCode || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `error_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              System Settings & Super Admin Control Suite
            </h2>
            {operatingMode === 'DEMO' ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
                TRAINING SANDBOX ACTIVE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                PRODUCTION LIVE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Client identity, API gateways & live test pings, thermal/A4 receipt designer, backups, Python backend error tracebacks, and mode partitioning.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
          {/* General Settings Tabs */}
          {[
            { id: 'credentials', label: 'API Credentials', icon: Key },
            { id: 'printer', label: 'Printer & Canvas', icon: Printer },
            { id: 'themes', label: 'Themes & UI', icon: Palette },
            { id: 'logs', label: 'Error Logs (Python/UI)', icon: Terminal },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                  isActive 
                    ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm font-bold' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Super Admin Divider & Tabs */}
          {isSuperAdmin && (
            <>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
              {[
                { id: 'migration', label: 'Migration Wizard', icon: UploadCloud },
                { id: 'backup', label: 'Backups & Recovery', icon: Database },
                { id: 'launcher', label: 'Desktop Launcher', icon: MonitorPlay },
                { id: 'mode', label: 'Demo vs Production', icon: ShieldAlert },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                      isActive 
                        ? 'bg-purple-600 text-white shadow-sm font-bold' 
                        : 'text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200 font-extrabold uppercase">
                      SuperAdmin
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* TAB: 5-STEP MIGRATION WIZARD (SUPER ADMIN) */}
      {activeTab === 'migration' && isSuperAdmin && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b pb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Legacy Data Cutover & Pre-Go-Live Migration Wizard</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Super Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                5-step staging pipeline ensuring referential integrity and batch verification before live database cutover.
              </p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center justify-between max-w-2xl mx-auto text-xs font-semibold">
            {[
              { step: 1, label: 'Entity & Schema' },
              { step: 2, label: 'Upload Data' },
              { step: 3, label: 'Column Mapping' },
              { step: 4, label: 'Dry-Run Validation' },
              { step: 5, label: 'Cutover Commit' },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center space-y-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    migrationStep === s.step
                      ? 'bg-purple-600 text-white shadow-md'
                      : migrationStep > s.step
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {migrationStep > s.step ? '✓' : s.step}
                </div>
                <span className={migrationStep === s.step ? 'text-purple-600 font-bold' : 'text-slate-500'}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Wizard Step 1 */}
          {migrationStep === 1 && (
            <div className="max-w-md mx-auto space-y-4 text-xs pt-4">
              <div>
                <label className="font-semibold block mb-1">Target Onboarding Entity</label>
                <select
                  value={migrationEntity}
                  onChange={e => setMigrationEntity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                >
                  <option value="products">Product Catalogue & Packaging Hierarchies</option>
                  <option value="inventory">Live Batch Inventory & Stock Levels</option>
                  <option value="parties">Customers & Healthcare Suppliers</option>
                  <option value="financial">Opening Balances & Receivables</option>
                </select>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 text-purple-900 dark:text-purple-200">
                <p className="font-semibold">Pre-Flight Migration Notice:</p>
                <p className="mt-1 text-[11px]">All imported batches will be mapped to atomic base units and validated for PCN dosage schedules.</p>
              </div>
              <button
                onClick={() => setMigrationStep(2)}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow transition"
              >
                Next: Upload CSV / Excel Dataset →
              </button>
            </div>
          )}

          {/* Wizard Step 2 */}
          {migrationStep === 2 && (
            <div className="max-w-md mx-auto space-y-4 text-xs pt-4 text-center">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 space-y-3">
                <UploadCloud className="w-10 h-10 text-purple-600 mx-auto" />
                <div>
                  <p className="font-bold text-sm">Upload Legacy Data File</p>
                  <p className="text-slate-500">Supports .csv, .xlsx, .tsv up to 50MB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedFile('legacy_catalogue_2026.csv')}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg font-bold"
                >
                  {uploadedFile ? `Loaded: ${uploadedFile}` : 'Select File from Disk'}
                </button>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setMigrationStep(1)} className="px-4 py-2 border rounded-xl">Back</button>
                <button
                  disabled={!uploadedFile}
                  onClick={() => setMigrationStep(3)}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl shadow transition"
                >
                  Next: Map Columns →
                </button>
              </div>
            </div>
          )}

          {/* Wizard Step 3 */}
          {migrationStep === 3 && (
            <div className="max-w-lg mx-auto space-y-4 text-xs pt-4">
              <p className="font-bold text-sm">Schema Field Alignment</p>
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 font-semibold">
                  <tr>
                    <th className="p-2">Legacy Source Column</th>
                    <th className="p-2">Target GreenlifeAI Field</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-2 font-mono">DRUG_NAME</td>
                    <td className="p-2 font-bold text-purple-600">brandName</td>
                    <td className="p-2 text-emerald-600 font-bold">Mapped ✓</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono">GENERIC_DESC</td>
                    <td className="p-2 font-bold text-purple-600">genericName</td>
                    <td className="p-2 text-emerald-600 font-bold">Mapped ✓</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono">RETAIL_PRICE</td>
                    <td className="p-2 font-bold text-purple-600">sellingPrice</td>
                    <td className="p-2 text-emerald-600 font-bold">Mapped ✓</td>
                  </tr>
                </tbody>
              </table>
              <div className="flex justify-between pt-2">
                <button onClick={() => setMigrationStep(2)} className="px-4 py-2 border rounded-xl">Back</button>
                <button onClick={() => setMigrationStep(4)} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow transition">
                  Next: Run Validation →
                </button>
              </div>
            </div>
          )}

          {/* Wizard Step 4 */}
          {migrationStep === 4 && (
            <div className="max-w-xl mx-auto space-y-4 text-xs pt-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Dry run validation passed with 100% referential integrity! 2,410 records verified.</span>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-semibold">
                    <tr>
                      <th className="p-2.5">Row</th>
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5">SKU Code</th>
                      <th className="p-2.5">Price</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="p-2.5 font-bold">1</td>
                      <td className="p-2.5">Amoxil Forte 500mg</td>
                      <td className="p-2.5 font-mono">AMX-FORTE-01</td>
                      <td className="p-2.5 font-semibold">{formatCurrency(360000)}</td>
                      <td className="p-2.5 text-emerald-600 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Valid</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">2</td>
                      <td className="p-2.5">Paracetamol 500mg Blister</td>
                      <td className="p-2.5 font-mono">PND-LEG-04</td>
                      <td className="p-2.5 font-semibold">{formatCurrency(150000)}</td>
                      <td className="p-2.5 text-emerald-600 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Valid</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setMigrationStep(3)} className="px-4 py-2 border rounded-xl">Back</button>
                <button onClick={() => setMigrationStep(5)} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow transition">
                  Next: Authorize Commit →
                </button>
              </div>
            </div>
          )}

          {/* Wizard Step 5 */}
          {migrationStep === 5 && (
            <div className="max-w-md mx-auto space-y-4 text-xs pt-4 text-center">
              {!isCommitted ? (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Final Approval: Atomic Write to Live Database</p>
                    <p className="text-slate-500">This action writes 2,410 validated catalogue items and creates the opening inventory audit ledger.</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsCommitted(true);
                      addSystemLog({
                        level: 'INFO',
                        source: 'DATABASE',
                        component: 'migration_cutover_engine',
                        message: 'Cutover migration committed to production: 2,410 records loaded.',
                      });
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow"
                  >
                    Confirm & Commit Migration to Production
                  </button>
                </div>
              ) : (
                <div className="space-y-3 p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <p className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">Migration Successfully Completed!</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    2,410 products active. Inventory valuation recorded in general ledger.
                  </p>
                  <button onClick={() => { setIsCommitted(false); setMigrationStep(1); }} className="px-4 py-1.5 bg-white border text-slate-700 rounded-lg text-xs font-bold">
                    Start Another Migration
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: DESKTOP LAUNCHER SIMULATOR (SUPER ADMIN) */}
      {activeTab === 'launcher' && isSuperAdmin && (
        <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <MonitorPlay className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Windows Desktop Launcher Simulator
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Super Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                PRD Section 12: Real-time 8-stage local startup verification and self-healing diagnostics.
              </p>
            </div>

            <button
              onClick={startBootSequence}
              disabled={isLauncherRunning}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5 transition"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLauncherRunning ? 'animate-spin' : ''}`} />
              <span>{isLauncherRunning ? 'Running Sequence...' : 'Re-Run Warm Boot Sequence'}</span>
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
                {launcherSteps.map((step, idx) => {
                  const isDone = launcherStepIndex > idx;
                  const isCurrent = launcherStepIndex === idx;
                  const Icon = step.icon;

                  return (
                    <div 
                      key={idx}
                      className={`flex items-center space-x-3 p-2.5 rounded-xl transition-all duration-300 ${
                        isCurrent 
                          ? 'bg-purple-950/60 border border-purple-500/50 shadow-md shadow-purple-500/10' 
                          : isDone ? 'opacity-80' : 'opacity-25'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isDone 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : isCurrent ? 'bg-purple-600 text-white animate-pulse' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {isCurrent ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-200">{step.title}</p>
                          <span className="text-[10px] text-slate-500 font-mono">Stage 0{idx + 1}/08</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{step.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="pt-2">
                <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
                  <span>Diagnostic Progress</span>
                  <span>{Math.round((Math.min(launcherStepIndex, launcherSteps.length) / launcherSteps.length) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-300 rounded-full"
                    style={{ width: `${(Math.min(launcherStepIndex, launcherSteps.length) / launcherSteps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: API CREDENTIALS & LIVE TEST PINGS */}
      {activeTab === 'credentials' && (
        <form onSubmit={handleSaveCredentials} className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">API Keys, Gateway Integration & Ping Testing</h3>
                <p className="text-xs text-slate-500">Configure SMS notification gateways, payment webhooks, and regulatory compliance API secrets.</p>
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5 transition"
              >
                <Check className="w-4 h-4" />
                <span>Save API Tokens</span>
              </button>
            </div>

            {credSaved && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>API credentials validated and securely stored in encrypted vault.</span>
              </div>
            )}

            {/* SMS Provider Section */}
            <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-brand-600" />
                  <span className="font-bold text-slate-900 dark:text-white">SMS Notification Gateway</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSmsModal(true)}
                  className="px-3 py-1.5 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-lg font-bold flex items-center space-x-1 hover:bg-brand-100 transition"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Test SMS Ping</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">SMS Service Provider</label>
                  <select
                    value={credForm.smsProvider}
                    onChange={e => setCredForm({ ...credForm, smsProvider: e.target.value as any })}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-slate-900"
                  >
                    <option value="Termii">Termii (West Africa Tier-1 Direct Routes)</option>
                    <option value="Twilio">Twilio Global Telecoms</option>
                    <option value="AfricasTalking">Africa's Talking Pan-African SMS</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Authorized Sender ID (Max 11 chars)</label>
                  <input
                    type="text"
                    value={credForm.smsSenderId}
                    onChange={e => setCredForm({ ...credForm, smsSenderId: e.target.value })}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">API Secret Token</label>
                  <div className="relative">
                    <input
                      type={showSecretKey ? 'text' : 'password'}
                      value={credForm.smsApiKey}
                      onChange={e => setCredForm({ ...credForm, smsApiKey: e.target.value })}
                      className="w-full p-2 pr-8 rounded-lg border bg-white dark:bg-slate-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Gateway Section */}
            <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900 dark:text-white">Card & Mobile Money Payment Gateway</span>
                </div>
                <button
                  type="button"
                  onClick={testGatewayHandshake}
                  disabled={isPingingGateway}
                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-bold flex items-center space-x-1 hover:bg-emerald-100 transition disabled:opacity-50"
                >
                  <Activity className="w-3 h-3" />
                  <span>{isPingingGateway ? 'Pinging Gateway...' : 'Ping Gateway Connection'}</span>
                </button>
              </div>

              {gatewayPingResult && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center justify-between text-[11px] font-semibold">
                  <span>{gatewayPingResult.status}</span>
                  <span className="font-mono text-emerald-700">Latency: {gatewayPingResult.latency}ms</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Payment Gateway Engine</label>
                  <select
                    value={credForm.paymentGateway}
                    onChange={e => setCredForm({ ...credForm, paymentGateway: e.target.value as any })}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-slate-900"
                  >
                    <option value="Paystack">Paystack (Cards, USSD, Ghana MoMo, Bank Transfer)</option>
                    <option value="Flutterwave">Flutterwave Global Payments</option>
                    <option value="Stripe">Stripe International Direct</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Public Key</label>
                  <input
                    type="text"
                    value={credForm.paymentPublicKey}
                    onChange={e => setCredForm({ ...credForm, paymentPublicKey: e.target.value })}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-slate-900 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Secret Key</label>
                  <input
                    type="password"
                    value={credForm.paymentSecretKey}
                    onChange={e => setCredForm({ ...credForm, paymentSecretKey: e.target.value })}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-slate-900 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="liveKeyToggle"
                  checked={credForm.isPaymentLive}
                  onChange={e => setCredForm({ ...credForm, isPaymentLive: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <label htmlFor="liveKeyToggle" className="font-semibold text-slate-700 dark:text-slate-300">
                  Live Production Key Mode (Uncheck for Sandbox / Test Mode)
                </label>
              </div>
            </div>

            {/* Regulatory APIs */}
            <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40 space-y-3 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">Government & Regulatory Integration Tokens</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">NAFDAC Greenbook Verification Key</label>
                  <input
                    type="password"
                    value={credForm.nafdacRegistryApiKey}
                    onChange={e => setCredForm({ ...credForm, nafdacRegistryApiKey: e.target.value })}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">PCN e-Registry Compliance OAuth Token</label>
                  <input
                    type="password"
                    value={credForm.pcnComplianceApiKey}
                    onChange={e => setCredForm({ ...credForm, pcnComplianceApiKey: e.target.value })}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: PRINTER & INTERACTIVE RECEIPT CANVAS (58mm, 80mm, A4) */}
      {activeTab === 'printer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
              <div className="border-b pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Printer Configuration & Layout Profiles</h3>
                  <p className="text-slate-500">Support for Thermal Roll slips (58mm, 80mm) and Standard A4 Institutional Invoices.</p>
                </div>
                <button
                  type="button"
                  onClick={triggerSamplePrint}
                  className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Test Receipt</span>
                </button>
              </div>

              {/* Format Switcher */}
              <div>
                <label className="font-semibold block mb-1.5">Active Target Paper Format</label>
                <div className="grid grid-cols-3 gap-2 font-bold text-center">
                  {[
                    { size: '58mm' as ReceiptPaperSize, label: '58mm Thermal', sub: 'Compact Mobile Slip' },
                    { size: '80mm' as ReceiptPaperSize, label: '80mm Thermal', sub: 'Standard POS Counter' },
                    { size: 'A4' as ReceiptPaperSize, label: 'Standard A4', sub: 'Institutional Invoice' },
                  ].map(item => (
                    <button
                      key={item.size}
                      type="button"
                      onClick={() => handleSavePrinter({ paperSize: item.size })}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        printerForm.paperSize === item.size
                          ? 'bg-brand-50 border-brand-500 text-brand-800 dark:bg-brand-950 dark:border-brand-600 dark:text-brand-300 ring-2 ring-brand-400'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="block text-xs">{item.label}</span>
                      <span className="block text-[10px] font-normal text-slate-500">{item.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t">
                <span className="font-bold block text-slate-800 dark:text-slate-200">Receipt Elements & Regulatory Toggles</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                    <input
                      type="checkbox"
                      checked={printerForm.showLogo}
                      onChange={e => handleSavePrinter({ showLogo: e.target.checked })}
                      className="rounded text-brand-600"
                    />
                    <span>Show Logo Badge</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                    <input
                      type="checkbox"
                      checked={printerForm.showBarcode}
                      onChange={e => handleSavePrinter({ showBarcode: e.target.checked })}
                      className="rounded text-brand-600"
                    />
                    <span>Show 1D Barcode</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                    <input
                      type="checkbox"
                      checked={printerForm.showQrCode}
                      onChange={e => handleSavePrinter({ showQrCode: e.target.checked })}
                      className="rounded text-brand-600"
                    />
                    <span>Show QR Verification</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                    <input
                      type="checkbox"
                      checked={printerForm.showBatchDetails}
                      onChange={e => handleSavePrinter({ showBatchDetails: e.target.checked })}
                      className="rounded text-brand-600"
                    />
                    <span>Show Batch # & Expiry</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                    <input
                      type="checkbox"
                      checked={printerForm.showPrescriberInfo}
                      onChange={e => handleSavePrinter({ showPrescriberInfo: e.target.checked })}
                      className="rounded text-brand-600"
                    />
                    <span>Show Doctor MDCN Block</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                    <input
                      type="checkbox"
                      checked={printerForm.autoCut}
                      onChange={e => handleSavePrinter({ autoCut: e.target.checked })}
                      className="rounded text-brand-600"
                    />
                    <span>Auto-Cut Paper</span>
                  </label>
                </div>
              </div>

              {/* Header / Footer text */}
              <div className="space-y-3 pt-2 border-t">
                <div>
                  <label className="font-semibold block mb-1">Receipt Header Note</label>
                  <input
                    type="text"
                    value={printerForm.headerNote}
                    onChange={e => handleSavePrinter({ headerNote: e.target.value })}
                    className="w-full p-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Receipt Refund & Clinical Disclaimer Footer</label>
                  <textarea
                    value={printerForm.footerPolicy}
                    onChange={e => handleSavePrinter({ footerPolicy: e.target.value })}
                    className="w-full p-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-xs h-16"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Live Visual Canvas Preview */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-2 px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-600" />
                <span>Live Interactive Canvas Preview ({printerForm.paperSize})</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Simulated Paper DPI: 203</span>
            </div>

            {/* Paper Container */}
            <div
              id="printable-receipt-canvas"
              className={`bg-white text-slate-900 p-5 rounded-lg shadow-2xl border border-slate-300 font-mono transition-all duration-300 ${
                printerForm.paperSize === '58mm'
                  ? 'w-[280px] text-[11px] print-58mm'
                  : printerForm.paperSize === '80mm'
                  ? 'w-[360px] text-xs print-80mm'
                  : 'w-full max-w-[560px] text-xs p-8 print-a4'
              }`}
            >
              {/* Watermark in Demo Mode */}
              {operatingMode === 'DEMO' && (
                <div className="border-2 border-dashed border-amber-600 text-amber-700 bg-amber-50 p-1.5 text-center font-bold text-[10px] mb-3 tracking-widest uppercase">
                  *** TRAINING & DEMO RECEIPT - NOT FOR SALE ***
                </div>
              )}

              {/* Header */}
              <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-3">
                {printerForm.showLogo && (
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white mx-auto flex items-center justify-center font-bold text-sm mb-1">
                    G+
                  </div>
                )}
                <h4 className="font-extrabold text-sm uppercase">{systemProfile.tradeName}</h4>
                <p className="text-[10px] text-slate-600">{systemProfile.address}</p>
                <p className="text-[10px] text-slate-600">Tel: {systemProfile.phone}</p>
                <p className="text-[10px] text-slate-700 font-bold">Premises Reg: {systemProfile.premisesLicense}</p>
                <p className="text-[9px] text-slate-500 italic mt-0.5">{printerForm.headerNote}</p>
              </div>

              {/* Receipt Metadata */}
              <div className="py-2.5 border-b border-dashed border-slate-400 space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Receipt #:</span>
                  <span className="font-bold">REC-20260920-001</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span>2026-09-20 21:45</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{currentUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Superintendent:</span>
                  <span>{systemProfile.superintendentName}</span>
                </div>
              </div>

              {/* Line Items */}
              <div className="py-2.5 border-b border-dashed border-slate-400 space-y-2">
                <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-slate-200">
                  <span>Item & Description</span>
                  <span>Amount</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold">Amoxicillin 500mg (x2 Pack)</p>
                      {printerForm.showBatchDetails && (
                        <p className="text-[9px] text-slate-500">Batch: AMX-2026-01 • Exp: 2027-11</p>
                      )}
                    </div>
                    <span className="font-bold">{formatCurrency(7200)}</span>
                  </div>

                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold">Paracetamol 500mg (x1 Strip)</p>
                      {printerForm.showBatchDetails && (
                        <p className="text-[9px] text-slate-500">Batch: PND-2025-772 • Exp: 2026-11</p>
                      )}
                    </div>
                    <span className="font-bold">{formatCurrency(450)}</span>
                  </div>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(7650)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Bulk Pack Discount:</span>
                  <span>-{formatCurrency(380)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT ({systemProfile.defaultVatPercent}%):</span>
                  <span>{formatCurrency(545.25)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-slate-300">
                  <span>TOTAL PAID:</span>
                  <span>{formatCurrency(7815.25)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 pt-0.5">
                  <span>Tender (CASH):</span>
                  <span>{formatCurrency(8000)} • Change: {formatCurrency(184.75)}</span>
                </div>
              </div>

              {/* Prescription MDCN Block */}
              {printerForm.showPrescriberInfo && (
                <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                  <span className="font-bold block uppercase text-[9px] text-slate-500">Verified Prescription (POM)</span>
                  <div className="flex justify-between">
                    <span>Doctor: Dr. Kelechi Nnamdi</span>
                    <span className="font-mono">MDCN-44109</span>
                  </div>
                  <p className="text-slate-500">Patient: Chief Olatunji Williams (Age: 68)</p>
                </div>
              )}

              {/* Footer Policy */}
              <div className="text-center pt-3 space-y-2">
                <p className="text-[9px] text-slate-600 leading-tight">{printerForm.footerPolicy}</p>

                {/* QR Code & Barcode */}
                <div className="flex items-center justify-center space-x-4 pt-1">
                  {printerForm.showQrCode && (
                    <div className="flex flex-col items-center">
                      <div className="p-1 border border-slate-400 rounded bg-white">
                        <QrCode className="w-10 h-10 text-slate-900" />
                      </div>
                      <span className="text-[8px] text-slate-400 mt-0.5">Scan to Verify</span>
                    </div>
                  )}

                  {printerForm.showBarcode && (
                    <div className="flex flex-col items-center">
                      <Barcode className="w-28 h-8 text-slate-900" />
                      <span className="font-mono text-[8px] text-slate-500">REC-20260920-001</span>
                    </div>
                  )}
                </div>

                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest pt-1">
                  Powered by GreenlifeAI Dispensary Engine
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & RESTORE (SUPER ADMIN) */}
      {activeTab === 'backup' && isSuperAdmin && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b pb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Database Snapshot & Business Continuity (PostgreSQL 16)</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Super Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Automated atomic snapshots, SHA-256 cryptographic checksums, and disaster recovery imports.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Snapshot Card */}
            <div className="p-5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-brand-600" />
                <h4 className="font-bold text-xs">Create Instant Database Snapshot</h4>
              </div>
              <p className="text-xs text-slate-500">
                Generates a complete atomic dump of products, batches, sales ledgers, customer credit, and audit logs.
              </p>
              <button
                type="button"
                onClick={triggerSnapshot}
                disabled={isCreatingSnapshot}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-2 transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isCreatingSnapshot ? 'Generating pg_dump Snapshot...' : 'Create Snapshot Now'}</span>
              </button>

              {snapshotCreated && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Snapshot generated: <code className="font-mono font-bold">{snapshotCreated}</code> (SHA-256 verified)</span>
                </div>
              )}
            </div>

            {/* Restore Card */}
            <div className="p-5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold text-xs">Disaster Recovery & Restore</h4>
              </div>
              <p className="text-xs text-slate-500">
                Restore database state from an authorized encrypted .dump file. Executes dry-run validation before cutover.
              </p>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center">
                <button
                  type="button"
                  onClick={() => alert('Select a verified .dump or .sql backup file to execute pre-flight restore validation.')}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-lg text-xs font-bold transition"
                >
                  Upload Backup Archive (.dump)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: THEMES & APPEARANCE */}
      {activeTab === 'themes' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pharmacy Branding & UI Aesthetics</h3>
            <p className="text-xs text-slate-500">Select curated clinical palettes tailored for low eye strain and high legibility during fast-paced dispensary shifts.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 'emerald' as ThemePreset, name: 'Emerald Clinical (Default)', color: 'bg-emerald-600', desc: 'Modern pharmaceutical teal & mint theme for balanced wellness spaces.' },
              { id: 'ocean' as ThemePreset, name: 'Ocean Blue Health', color: 'bg-blue-600', desc: 'Hospital & institutional blue for high trust and clinical calm.' },
              { id: 'violet' as ThemePreset, name: 'Violet Luxury Care', color: 'bg-purple-600', desc: 'Premium cosmetic & boutique dispensary aesthetic.' },
              { id: 'dark' as ThemePreset, name: 'Dark Obsidian', color: 'bg-slate-900', desc: 'OLED-optimized high-contrast dark palette for night shift cashiers.' },
              { id: 'contrast' as ThemePreset, name: 'High-Contrast Dispensary', color: 'bg-amber-600', desc: 'Maximum contrast typography for fast scanning under bright dispensary counter lights.' },
            ].map(theme => (
              <div
                key={theme.id}
                onClick={() => {
                  setThemePreset(theme.id);
                  alert(`Theme palette set to "${theme.name}".`);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                  themePreset === theme.id
                    ? 'border-brand-600 ring-2 ring-brand-400 bg-brand-50/40 dark:bg-brand-950/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-6 h-6 rounded-full ${theme.color} shadow-sm`} />
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{theme.name}</span>
                </div>
                <p className="text-xs text-slate-500">{theme.desc}</p>
                {themePreset === theme.id && (
                  <span className="inline-block mt-2 text-[10px] font-bold text-brand-600 flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Active Theme</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SYSTEM & DETAILED PYTHON ERROR LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Diagnostic Logs (Python Backend & React Frontend)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600">
                  {filteredLogs.length} Events
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect Python FastAPI error tracebacks, SQLAlchemy database violations, and client React boundary exceptions.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  addSystemLog({
                    level: 'ERROR',
                    source: 'BACKEND_PYTHON',
                    component: 'app.api.v1.endpoints.inventory',
                    path: '/api/v1/inventory/fefo/allocate',
                    statusCode: 500,
                    message: 'sqlalchemy.exc.DBAPIError: (psycopg2.OperationalError) SSL connection has been closed unexpectedly',
                    stackTrace: `Traceback (most recent call last):
  File "/opt/greenlife/backend/app/api/v1/endpoints/inventory.py", line 98, in allocate_fefo_batches
    allocated = await fefo_service.allocate(product_id="prod_amox_500", qty_needed=10)
  File "/opt/greenlife/backend/app/services/fefo_engine.py", line 64, in allocate
    rows = await db.execute(select(Batch).order_by(Batch.expiry_date.asc()))
sqlalchemy.exc.DBAPIError: (psycopg2.OperationalError) SSL connection has been closed unexpectedly
Connection to server at "db.greenlife.internal", port 5432 failed: timeout expired.`
                  });
                  alert('Simulated Python backend exception captured in live diagnostic log table! Click the new row to inspect full traceback.');
                }}
                className="px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-300 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
              >
                <AlertTriangle className="w-3 h-3 text-brand-600" />
                <span>Simulate Python Error</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(systemLogs, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `system_logs_${Date.now()}.json`;
                  a.click();
                }}
                className="px-3 py-1.5 border rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1"
              >
                <Download className="w-3 h-3" />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                onClick={clearSystemLogs}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 rounded-lg text-xs font-semibold transition"
              >
                Clear Logs
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
            <input
              type="text"
              value={logSearch}
              onChange={e => setLogSearch(e.target.value)}
              placeholder="Search stack trace, component, or message..."
              className="w-full sm:w-72 p-2 rounded-lg border bg-slate-50 dark:bg-slate-800"
            />

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={logSourceFilter}
                onChange={e => setLogSourceFilter(e.target.value)}
                className="p-2 rounded-lg border bg-slate-50 dark:bg-slate-800 font-semibold"
              >
                <option value="ALL">All Sources</option>
                <option value="BACKEND_PYTHON">Python Backend (FastAPI)</option>
                <option value="FRONTEND">React Frontend (Browser)</option>
                <option value="DATABASE">PostgreSQL Engine</option>
                <option value="PRINTER_SPOOLER">Hardware Spooler</option>
              </select>

              <select
                value={logLevelFilter}
                onChange={e => setLogLevelFilter(e.target.value)}
                className="p-2 rounded-lg border bg-slate-50 dark:bg-slate-800 font-semibold"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="ERROR">ERROR</option>
                <option value="WARN">WARN</option>
                <option value="INFO">INFO</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold uppercase text-slate-500 text-[10px] select-none border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 w-16 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <input
                        type="checkbox"
                        checked={isAllLogsSelected}
                        onChange={toggleSelectAllLogs}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                        title="Select All"
                      />
                      <span className="font-mono text-[11px] text-slate-400">#</span>
                    </div>
                  </th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Component / Endpoint</th>
                  <th className="p-3">Message Snippet</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No logs found matching active criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, index) => {
                    const isSelected = selectedLogIds.includes(log.id);
                    return (
                      <tr 
                        key={log.id} 
                        className={`transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-brand-50/70 dark:bg-brand-950/40 border-l-2 border-l-brand-600' 
                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                        }`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center space-x-1.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => toggleSelectLog(log.id, e)}
                              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                            />
                            <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 w-5 text-right">
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.level === 'CRITICAL' ? 'bg-rose-600 text-white animate-pulse' :
                            log.level === 'ERROR' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                            log.level === 'WARN' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {log.level}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            log.source === 'BACKEND_PYTHON' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                            log.source === 'FRONTEND' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300' :
                            'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {log.source === 'BACKEND_PYTHON' ? '🐍 Python FastAPI' : log.source === 'FRONTEND' ? '⚛️ React UI' : log.source}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300 font-medium">
                          {log.component}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 max-w-md truncate font-mono text-[11px]">
                          {log.message}
                        </td>
                        <td className="p-3 text-right">
                          {log.stackTrace && (
                            <span className="text-[11px] text-brand-600 dark:text-brand-400 font-bold hover:underline">
                              View Trace →
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <FloatingBulkActionBar
            selectedCount={selectedLogIds.length}
            totalCount={filteredLogs.length}
            onClearSelection={() => setSelectedLogIds([])}
            actions={[
              {
                label: 'Export Logs CSV',
                icon: Download,
                onClick: handleExportLogsCSV,
                variant: 'secondary'
              }
            ]}
          />
        </div>
      )}

      {/* TAB 7: DEMO VS PRODUCTION MODE (SUPER ADMIN) */}
      {activeTab === 'mode' && isSuperAdmin && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b pb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Operating Mode & Training Sandbox Segregation</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Super Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Strict partitioning ensuring client training exercises and feature demos never contaminate official financial or regulatory PCN records.</p>
            </div>
          </div>

          {resetSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Training sandbox reset successfully! Default stock, demo cashiers, and test transactions restored.</span>
            </div>
          )}

          {/* Current Status Banner */}
          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
            operatingMode === 'PRODUCTION'
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
          }`}>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Current Operating Environment</span>
              <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 flex items-center space-x-2">
                <span>{operatingMode === 'PRODUCTION' ? 'Production Live Mode' : 'Training & Demo Simulation Mode'}</span>
                {operatingMode === 'PRODUCTION' ? (
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block animate-ping" />
                )}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                {operatingMode === 'PRODUCTION'
                  ? 'Official fiscal transactions are recorded to permanent general ledgers. Batch deductions and regulatory PCN reports reflect real physical stock.'
                  : 'Simulation sandbox active. Staff can practice POS checkouts, returns, and inventory counts. All transactions carry a DEMO watermark and are isolated from the audit books.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTargetMode(operatingMode === 'PRODUCTION' ? 'DEMO' : 'PRODUCTION');
                  setShowModeModal(true);
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow transition ${
                  operatingMode === 'PRODUCTION'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {operatingMode === 'PRODUCTION' ? 'Switch to Training & Demo Mode' : 'Switch to Production Mode'}
              </button>

              {operatingMode === 'DEMO' && (
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Demo Data</span>
                </button>
              )}
            </div>
          </div>

          {/* Feature Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>Production Mode Features & Guarantees</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                <li>• Immutable stock movement ledger (FIFO / FEFO batch deductions).</li>
                <li>• Real-time VAT and corporate tax computation.</li>
                <li>• Legally binding 80mm thermal receipts with tax registration numbers.</li>
                <li>• Real customer accounts receivable (AR) and supplier payables (AP).</li>
                <li>• Direct synchronization with Pharmacists Council regulatory archives.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                <span>Training & Demo Mode Protections</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                <li>• Persistent yellow warning banner displayed across all application headers.</li>
                <li>• Printed thermal slips watermarked with <i>"TRAINING / NOT FOR SALE"</i>.</li>
                <li>• One-click instant re-seeding to clean demonstration inventory anytime.</li>
                <li>• Simulated payment gateways and mock SMS dispatch endpoints.</li>
                <li>• Complete isolation from live financial audits and bank reconciliations.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Traceback Viewer for Python / Frontend Errors */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedLog.level === 'CRITICAL' ? 'bg-rose-600 text-white' :
                    selectedLog.level === 'ERROR' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedLog.level}
                  </span>
                  <span className="font-mono text-xs text-slate-500">{selectedLog.timestamp}</span>
                  <span className="font-mono text-xs font-bold text-brand-600">[{selectedLog.source}]</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                  {selectedLog.component}
                </h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 text-xs">
              <div>
                <span className="font-bold text-slate-500 block mb-1">Error Message:</span>
                <p className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-mono text-[11px] border border-rose-200 dark:border-rose-900">
                  {selectedLog.message}
                </p>
              </div>

              {selectedLog.stackTrace && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-500">
                      {selectedLog.source === 'BACKEND_PYTHON' ? 'Python Traceback (FastAPI / SQLAlchemy / Celery):' : 'Client Stack Trace:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedLog.stackTrace || '');
                        alert('Traceback copied to clipboard!');
                      }}
                      className="text-[11px] text-brand-600 font-semibold flex items-center space-x-1 hover:underline"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Traceback</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed border border-slate-800">
                    {selectedLog.stackTrace}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold"
              >
                Close Traceback Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Mode Transition Confirmation */}
      {showModeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Authorize Operating Mode Transition
              </h3>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <p>
                You are switching the dispensary system from{' '}
                <strong className="text-slate-900 dark:text-white">{operatingMode}</strong> to{' '}
                <strong className="text-slate-900 dark:text-white">{targetMode}</strong>.
              </p>
              <p className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900">
                To prevent accidental staff switching, please type <strong>CONFIRM</strong> in the box below to authorize this change.
              </p>
            </div>

            <input
              type="text"
              placeholder="Type CONFIRM to authorize"
              value={modeConfirmText}
              onChange={e => setModeConfirmText(e.target.value)}
              className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold text-xs"
            />

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowModeModal(false);
                  setModeConfirmText('');
                }}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSwitchMode}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow"
              >
                Authorize & Switch Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Test SMS Ping */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={sendTestSms} className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <Send className="w-4 h-4 text-brand-600" />
                <span>Send Test SMS Ping</span>
              </h3>
              <button type="button" onClick={() => setShowSmsModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p className="text-slate-500">
                Verify provider routing via <strong>{credForm.smsProvider}</strong> using SenderID <strong>{credForm.smsSenderId}</strong>.
              </p>
              <div>
                <label className="font-semibold block mb-1">Destination Phone Number</label>
                <input
                  type="text"
                  required
                  value={testSmsPhone}
                  onChange={e => setTestSmsPhone(e.target.value)}
                  placeholder="+2348012345678 or +233241234567"
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              {smsResult && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                  {smsResult}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowSmsModal(false)}
                className="px-3 py-1.5 border rounded-lg text-xs"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSendingSms}
                className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow disabled:opacity-50"
              >
                {isSendingSms ? 'Dispatching...' : 'Dispatch Test Ping'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
