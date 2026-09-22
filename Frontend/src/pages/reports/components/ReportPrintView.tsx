import React from 'react';
import { usePharmacy } from '../../../context/PharmacyContext';

export interface ReportPrintViewProps {
  reportTitle: string;
  reportSubtitle: string;
  dateRangeLabel: string;
  summaryStats?: Array<{ label: string; value: string }>;
  tableHeaders: string[];
  tableRows: Array<Array<string | number>>;
}

export const ReportPrintView: React.FC<ReportPrintViewProps> = ({
  reportTitle,
  reportSubtitle,
  dateRangeLabel,
  summaryStats,
  tableHeaders,
  tableRows,
}) => {
  const { systemProfile, currentCurrency } = usePharmacy();

  return (
    <div id="printable-report" className="hidden print:block p-8 font-sans text-slate-900 bg-white">
      {/* Official Dispensary Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            {systemProfile.branchName || systemProfile.tradeName || systemProfile.legalName || 'GreenLife AI Pharmacy'}
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">{systemProfile.address || 'Dispensary Main Floor'}</p>
          <p className="text-xs text-slate-600 font-mono">
            Tel: {systemProfile.phone || '+233 20 123 4567'} | Email: {systemProfile.email || 'dispensary@greenlife.com'}
          </p>
        </div>
        <div className="text-right">
          <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold">
            Premises Reg: {systemProfile.premisesLicense || 'PCN-GAR-2026-0881'}
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-1">
            Superintendent: <span className="font-bold">{systemProfile.superintendentName || 'Pharm. Dr. Adeyemi Adeleke'}</span>
          </p>
          <p className="text-[10px] text-slate-500 font-mono">PCN Reg: {systemProfile.superintendentLicense || 'PCN-SA-88392'}</p>
        </div>
      </div>

      {/* Report Metadata Title Bar */}
      <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 mb-6 flex justify-between items-center text-xs">
        <div>
          <h2 className="font-bold text-base text-slate-900">{reportTitle}</h2>
          <p className="text-slate-600 text-[11px]">{reportSubtitle}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-800">
            Period: <span className="font-mono font-normal">{dateRangeLabel}</span>
          </p>
          <p className="text-[10px] text-slate-500 font-mono">
            Generated: {new Date().toLocaleString()} | Currency: {currentCurrency.code} ({currentCurrency.symbol})
          </p>
        </div>
      </div>

      {/* Executive Summary Metrics (If provided) */}
      {summaryStats && summaryStats.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {summaryStats.map((stat, i) => (
            <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">{stat.label}</span>
              <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5 block">{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabular Dataset */}
      <table className="w-full text-xs text-left border border-slate-300 mb-8">
        <thead className="bg-slate-100 font-bold uppercase text-[10px] border-b border-slate-300">
          <tr>
            <th className="p-2 w-10 text-center border-r border-slate-300">#</th>
            {tableHeaders.map((header, i) => (
              <th key={i} className="p-2 border-r border-slate-300 last:border-r-0">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
          {tableRows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
              <td className="p-2 text-center border-r border-slate-300 text-slate-500">{rowIndex + 1}</td>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="p-2 border-r border-slate-300 last:border-r-0">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Formal Regulatory Sign-Off Block */}
      <div className="mt-12 pt-6 border-t-2 border-slate-300 grid grid-cols-3 gap-8 text-xs">
        <div>
          <p className="font-bold text-slate-700">Prepared By / Cashier Auditor:</p>
          <div className="border-b border-slate-400 mt-8 mb-1"></div>
          <p className="text-[10px] text-slate-500">Name, Signature & Date</p>
        </div>
        <div>
          <p className="font-bold text-slate-700">Internal Audit Verification:</p>
          <div className="border-b border-slate-400 mt-8 mb-1"></div>
          <p className="text-[10px] text-slate-500">Chief Internal Auditor / Accountant</p>
        </div>
        <div>
          <p className="font-bold text-slate-700">Superintendent Pharmacist Sign-Off:</p>
          <div className="border-b border-slate-400 mt-8 mb-1"></div>
          <p className="text-[10px] text-slate-500">Accredited Pharmacist Official Seal & Stamp</p>
        </div>
      </div>
    </div>
  );
};
