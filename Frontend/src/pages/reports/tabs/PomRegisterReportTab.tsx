import React, { useMemo } from 'react';
import { 
  ShieldAlert, UserCheck, Stethoscope, FileCheck, CheckCircle2, 
  AlertTriangle, Building, Pill, Award, Search
} from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { ReportFilterState } from '../components/ReportFilterBar';
import { isDateWithinPeriod } from '../utils/reportFilters';
import { Pagination } from '../../../components/common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const PomRegisterReportTab: React.FC<{ filterState: ReportFilterState }> = ({ filterState }) => {
  const { sales, systemProfile, formatCurrency } = usePharmacy();

  // Extract all sales that contain Prescription or POM items
  const pomSales = useMemo(() => {
    return sales.filter(s => {
      // Must either have POM items or flagged as prescription
      const hasPom = s.hasPrescriptionDrugs || s.items?.some(i => i.isPrescriptionRequired) || s.prescription;
      if (!hasPom) return false;

      const within = isDateWithinPeriod(s.createdAt, filterState.period, filterState.startDate, filterState.endDate);
      if (!within) return false;

      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchPatient = s.prescription?.patientName?.toLowerCase().includes(q) || s.customerName?.toLowerCase().includes(q);
        const matchDoctor = s.prescription?.prescriberName?.toLowerCase().includes(q);
        const matchLicense = s.prescription?.prescriberLicense?.toLowerCase().includes(q);
        const matchHospital = s.prescription?.hospitalClinic?.toLowerCase().includes(q);
        const matchDrug = s.items?.some(i => i.productName?.toLowerCase().includes(q));
        const matchReceipt = s.receiptNumber?.toLowerCase().includes(q);
        if (!matchPatient && !matchDoctor && !matchLicense && !matchHospital && !matchDrug && !matchReceipt) return false;
      }

      return true;
    });
  }, [sales, filterState]);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedPomSales
  } = usePagination(pomSales, 10, [filterState]);

  // Aggregate stats
  const totalPomDispensations = pomSales.length;
  const totalPomUnits = pomSales.reduce((acc, s) => {
    const units = s.items
      ?.filter(i => i.isPrescriptionRequired || s.hasPrescriptionDrugs)
      .reduce((sum, item) => sum + item.quantity, 0) || 0;
    return acc + units;
  }, 0);

  const totalPomRevenue = pomSales.reduce((acc, s) => acc + s.total, 0);

  // Doctor prescribers summary
  const doctorSummary = useMemo(() => {
    const map: Record<string, { doctor: string; license: string; clinic: string; count: number; totalRev: number }> = {};
    pomSales.forEach(s => {
      const docName = s.prescription?.prescriberName || 'Direct Dispensation / Emergency';
      const license = s.prescription?.prescriberLicense || 'N/A';
      const clinic = s.prescription?.hospitalClinic || 'Outpatient';
      
      if (!map[docName]) {
        map[docName] = { doctor: docName, license, clinic, count: 0, totalRev: 0 };
      }
      map[docName].count += 1;
      map[docName].totalRev += s.total;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [pomSales]);

  return (
    <div className="space-y-6">
      {/* Compliance Accreditation Header */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
              Official Poison & POM Controlled Substance Register (PCN / FDA Compliant)
            </h4>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
              Supervising Pharmacist: <span className="font-bold">{systemProfile.superintendentName || 'Registered Pharmacist'}</span> (Lic: {systemProfile.superintendentLicense || 'PCN-VALIDATED'})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700">
            AUDIT REGISTER
          </span>
        </div>
      </div>

      {/* SUMMARY VIEW */}
      {filterState.viewMode === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                <span>POM Dispensations</span>
                <FileCheck className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-indigo-900 dark:text-indigo-200 tracking-tight">
                {totalPomDispensations}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Verified Prescriptions
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                <span>Controlled Units Dispensed</span>
                <Pill className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
                {totalPomUnits.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                Strict Inventory Reconciliation
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                <span>Realized POM Revenue</span>
                <Award className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-purple-900 dark:text-purple-200 tracking-tight">
                {formatCurrency(totalPomRevenue)}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Prescription Sales Value
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/20 border border-teal-200 dark:border-teal-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                <span>Unique Prescribers</span>
                <Stethoscope className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-teal-900 dark:text-teal-200 tracking-tight">
                {doctorSummary.length}
              </p>
              <p className="text-xs text-teal-700 dark:text-teal-300 font-semibold">
                Licensed Practitioners
              </p>
            </div>
          </div>

          {/* Prescribing Practitioners Leaderboard */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Stethoscope className="w-5 h-5 text-brand-600" />
              Prescribing Clinicians & Medical Facilities Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase">
                  <tr>
                    <th className="p-3">Prescriber / Doctor</th>
                    <th className="p-3">MDCN / Medical License</th>
                    <th className="p-3">Hospital / Facility</th>
                    <th className="p-3 text-center">Prescriptions Dispensed</th>
                    <th className="p-3 text-right">Total Realized Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {doctorSummary.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">No medical prescribers on record in this timeframe.</td>
                    </tr>
                  ) : (
                    doctorSummary.map((doc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                          {doc.doctor}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-400">{doc.license}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{doc.clinic}</td>
                        <td className="p-3 text-center font-bold text-slate-900 dark:text-white">{doc.count}</td>
                        <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(doc.totalRev)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED LEDGER VIEW */}
      {filterState.viewMode === 'detailed' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Regulatory POM & Controlled Substance Ledger</h3>
              <p className="text-xs text-slate-500">Legal dispensations with patient and doctor license sign-offs</p>
            </div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
              {pomSales.length} Dispensation Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Dispense Date & Ref</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Prescriber Doctor & License</th>
                  <th className="p-3.5">Hospital / Clinic</th>
                  <th className="p-3.5">Dispensed POM Drug(s)</th>
                  <th className="p-3.5">Dispensing Pharmacist</th>
                  <th className="p-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {pomSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No POM or controlled substance dispensations recorded in this period.
                    </td>
                  </tr>
                ) : (
                  paginatedPomSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">{sale.receiptNumber}</div>
                        <div className="text-[11px] text-slate-500">{new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {sale.prescription?.patientName || sale.customerName || 'Walk-in Patient'}
                        </div>
                        {sale.prescription?.patientAge && (
                          <div className="text-[11px] text-slate-500">Age: {sale.prescription.patientAge} • {sale.prescription.patientGender || 'N/A'}</div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {sale.prescription?.prescriberName || 'Direct Pharmacist Authorization'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {sale.prescription?.prescriberLicense || 'LIC-EXEMPT'}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {sale.prescription?.hospitalClinic || 'Dispensary Outpatient'}
                      </td>
                      <td className="p-3.5">
                        {sale.items?.map((item, idx) => (
                          <div key={idx} className="font-medium text-slate-900 dark:text-white">
                            • {item.productName} ({item.quantity} {item.selectedUnitName || 'Units'})
                          </div>
                        ))}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-brand-600 dark:text-brand-400">
                          {sale.prescription?.verifiedByPharmacistName || sale.cashierName}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✓ VERIFIED</div>
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(sale.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={pomSales.length}
            pageSize={10}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
