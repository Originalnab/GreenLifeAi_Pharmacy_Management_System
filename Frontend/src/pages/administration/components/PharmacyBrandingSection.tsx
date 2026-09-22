import React, { useState } from 'react';
import { Palette, Check, CheckCircle2, Moon, Sun, Sparkles } from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { CLINICAL_THEMES } from '../../../data/themes';
import { ThemePreset } from '../../../types';

export const PharmacyBrandingSection: React.FC<{ isStandaloneTab?: boolean }> = ({ isStandaloneTab = false }) => {
  const { themePreset, setThemePreset, isDarkMode, toggleDarkMode } = usePharmacy();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSelectTheme = (themeId: ThemePreset, themeName: string) => {
    setThemePreset(themeId);
    setToastMessage(`Theme switched to "${themeName}". CSS design tokens injected into application.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-start space-x-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-600 text-white shadow-md shadow-brand-500/20">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Pharmacy Branding & UI Aesthetics
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800 uppercase tracking-wider">
                8 Curated Clinical Palettes
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Select curated clinical palettes tailored for low eye strain and high legibility during fast-paced dispensary shifts. Each theme provides an authentic 6-color design token matrix applied across POS buttons, active navigation, and receipt headers.
            </p>
          </div>
        </div>

        {/* Global Dark Mode Switcher */}
        <div className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <div className="text-left">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
              OLED Dark Mode
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {isDarkMode ? 'Night Shift Active' : 'Day Counter Mode'}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-all ${
              isDarkMode 
                ? 'bg-slate-900 text-amber-400 shadow-sm border border-slate-700' 
                : 'bg-white text-slate-700 shadow-sm border border-slate-200 hover:text-brand-600'
            }`}
            title="Toggle dark mode theme"
          >
            {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Confirmation Toast */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* 8-Theme Curated Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {CLINICAL_THEMES.map((theme) => {
          const isActive = themePreset === theme.id;
          const { sixColors } = theme;

          return (
            <div
              key={theme.id}
              onClick={() => handleSelectTheme(theme.id, theme.name)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between group relative overflow-hidden ${
                isActive
                  ? 'border-brand-600 ring-2 ring-brand-400/40 bg-brand-50/20 dark:bg-brand-950/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
              }`}
            >
              {/* Active Ribbon Badge */}
              {isActive && (
                <div className="absolute top-3 right-3 flex items-center space-x-1 px-2 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-extrabold shadow-sm">
                  <Check className="w-3 h-3" />
                  <span>Active</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Palette Icon & Title */}
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-7 h-7 rounded-xl shadow-md flex items-center justify-center text-white shrink-0 border border-white/20"
                    style={{ backgroundColor: sixColors.primary }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-brand-600 transition">
                      {theme.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {theme.subtitle}
                    </span>
                  </div>
                </div>

                {/* Atmosphere Description */}
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed min-h-[44px]">
                  {theme.atmosphere}
                </p>

                {/* 6-Color Design Token Swatch Bar */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                    <span>6-Color Design Swatch:</span>
                    <span className="font-mono text-[9px] uppercase font-bold" style={{ color: sixColors.primary }}>
                      {sixColors.primary}
                    </span>
                  </div>

                  {/* Segmented Swatch Bar */}
                  <div className="grid grid-cols-6 h-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                    <div 
                      className="h-full transition-transform hover:scale-110" 
                      style={{ backgroundColor: sixColors.primary }} 
                      title={`Token 1: Primary Main (${sixColors.primary})`} 
                    />
                    <div 
                      className="h-full transition-transform hover:scale-110" 
                      style={{ backgroundColor: sixColors.accentGlow }} 
                      title={`Token 2: Accent Glow (${sixColors.accentGlow})`} 
                    />
                    <div 
                      className="h-full transition-transform hover:scale-110" 
                      style={{ backgroundColor: sixColors.surfaceTint }} 
                      title={`Token 3: Surface Tint (${sixColors.surfaceTint})`} 
                    />
                    <div 
                      className="h-full transition-transform hover:scale-110" 
                      style={{ backgroundColor: sixColors.contrastText }} 
                      title={`Token 4: Deep Contrast (${sixColors.contrastText})`} 
                    />
                    <div 
                      className="h-full transition-transform hover:scale-110" 
                      style={{ backgroundColor: sixColors.neutralBorder }} 
                      title={`Token 5: Neutral Border (${sixColors.neutralBorder})`} 
                    />
                    <div 
                      className="h-full transition-transform hover:scale-110" 
                      style={{ backgroundColor: sixColors.vitalityCue }} 
                      title={`Token 6: Vitality Alert Cue (${sixColors.vitalityCue})`} 
                    />
                  </div>

                  {/* Token Legend Labels */}
                  <div className="flex justify-between text-[8px] text-slate-400 font-mono pt-0.5">
                    <span>600</span>
                    <span>400</span>
                    <span>50</span>
                    <span>900</span>
                    <span>Slate</span>
                    <span>Alert</span>
                  </div>
                </div>

                {/* Simulated UI Component Preview */}
                <div 
                  className="p-2.5 rounded-xl border flex items-center justify-between text-[11px]"
                  style={{
                    backgroundColor: sixColors.surfaceTint,
                    borderColor: sixColors.accentGlow,
                  }}
                >
                  <span className="font-bold font-mono text-[10px]" style={{ color: sixColors.contrastText }}>
                    Terminal Ready
                  </span>
                  <span 
                    className="px-2 py-0.5 rounded text-[9px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: sixColors.primary }}
                  >
                    POS Button
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTheme(theme.id, theme.name);
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isActive ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active Clinical Palette</span>
                    </>
                  ) : (
                    <span>Set Active Palette</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};