/**
 * Professional CSV and PDF Export Utilities for GreenLife AI Pharmacy Management System
 */

export interface ExportPdfOptions {
  title: string;
  subtitle?: string;
  voucherNumber?: string;
  dateLabel?: string;
  pharmacyProfile?: {
    legalName?: string;
    tradeName?: string;
    branchName?: string;
    premisesLicense?: string;
    superintendentName?: string;
    superintendentLicense?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  metadata?: Array<{ label: string; value: string }>;
  summaryCards?: Array<{ label: string; value: string }>;
  tableHeaders: string[];
  tableRows: Array<Array<string | number>>;
  authorName?: string;
  authorRole?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Downloads standard UTF-8 CSV with Excel BOM
 */
export const downloadCsv = (
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | undefined | null>>
) => {
  const sanitize = (val: string | number | undefined | null): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const headerRow = headers.map(sanitize).join(',');
  const dataRows = rows.map(r => r.map(sanitize).join(',')).join('\n');
  const csvContent = '\uFEFF' + headerRow + '\n' + dataRows;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 500);
};

/**
 * Spools a pristine printable document into a hidden iframe and launches the native Save-to-PDF / Print dialog
 */
export const printOrSavePdf = (options: ExportPdfOptions) => {
  const {
    title,
    subtitle = 'Official Pharmacy Records & Regulatory Audit Dossier',
    voucherNumber,
    dateLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    pharmacyProfile = {},
    metadata = [],
    summaryCards = [],
    tableHeaders = [],
    tableRows = [],
    authorName = 'Pharmacist Auditor',
    authorRole = 'Authorized Officer',
    orientation = tableHeaders.length > 7 ? 'landscape' : 'portrait',
  } = options;

  const branchName = pharmacyProfile.branchName || pharmacyProfile.tradeName || pharmacyProfile.legalName || 'GreenLife AI Pharmacy';
  const address = pharmacyProfile.address || 'Dispensary Main Floor, Victoria Island';
  const phone = pharmacyProfile.phone || '+233 20 123 4567';
  const email = pharmacyProfile.email || 'records@greenlife.com';
  const premisesLicense = pharmacyProfile.premisesLicense || 'PCN-GAR-2026-0881';
  const superintendentName = pharmacyProfile.superintendentName || 'Pharm. Dr. Adeyemi Adeleke';
  const superintendentLicense = pharmacyProfile.superintendentLicense || 'PCN-SA-88392';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${title} - ${voucherNumber || 'Export'}</title>
      <style>
        @page {
          size: A4 ${orientation};
          margin: 12mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 0;
          font-size: 11px;
          line-height: 1.4;
        }
        .header {
          border-bottom: 2px solid #059669;
          padding-bottom: 12px;
          margin-bottom: 14px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .pharmacy-title {
          font-size: 18px;
          font-weight: 800;
          color: #065f46;
          text-transform: uppercase;
          letter-spacing: -0.5px;
          margin: 0 0 3px 0;
        }
        .pharmacy-sub {
          font-size: 10px;
          color: #475569;
          margin: 0 0 2px 0;
        }
        .pharmacy-reg-badge {
          display: inline-block;
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
          padding: 3px 8px;
          border-radius: 4px;
          font-family: monospace;
          font-weight: bold;
          font-size: 10px;
        }
        .doc-title-bar {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-left: 4px solid #059669;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .doc-title {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 2px 0;
        }
        .doc-subtitle {
          font-size: 10px;
          color: #64748b;
          margin: 0;
        }
        .voucher-badge {
          background: #065f46;
          color: #ffffff;
          font-family: monospace;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 4px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 8px;
          margin-bottom: 14px;
        }
        .meta-item {
          background: #f1f5f9;
          padding: 6px 10px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }
        .meta-label {
          font-size: 9px;
          text-transform: uppercase;
          font-weight: 700;
          color: #64748b;
          display: block;
        }
        .meta-val {
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
          margin-bottom: 14px;
        }
        .summary-card {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 6px;
          padding: 8px 10px;
          text-align: center;
        }
        .summary-label {
          font-size: 9px;
          text-transform: uppercase;
          font-weight: 700;
          color: #065f46;
          display: block;
        }
        .summary-value {
          font-size: 14px;
          font-weight: 800;
          color: #064e3b;
          font-family: monospace;
          margin-top: 2px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 18px;
          font-size: 10px;
        }
        th {
          background: #f1f5f9;
          color: #334155;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 9px;
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          text-align: left;
        }
        th.text-right, td.text-right { text-align: right; }
        th.text-center, td.text-center { text-align: center; }
        td {
          border: 1px solid #e2e8f0;
          padding: 5px 8px;
          color: #1e293b;
        }
        tr:nth-child(even) td {
          background: #f8fafc;
        }
        .footer-signatures {
          margin-top: 24px;
          padding-top: 12px;
          border-top: 1px solid #cbd5e1;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          font-size: 9.5px;
        }
        .sig-line {
          border-bottom: 1px solid #94a3b8;
          height: 35px;
          margin-bottom: 4px;
        }
        .sig-title {
          font-weight: 700;
          color: #334155;
        }
        .disclaimer {
          margin-top: 16px;
          font-size: 8.5px;
          color: #94a3b8;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="pharmacy-title">🌿 ${branchName}</h1>
          <p class="pharmacy-sub">${address} • Tel: ${phone} • ${email}</p>
          <p class="pharmacy-sub">Superintendent: <strong>${superintendentName}</strong> (${superintendentLicense})</p>
        </div>
        <div style="text-align: right;">
          <div class="pharmacy-reg-badge">License: ${premisesLicense}</div>
          <p class="pharmacy-sub" style="margin-top: 4px;">Date: <strong>${dateLabel}</strong></p>
          <p class="pharmacy-sub">System: GreenLife AI Healthcare v2.0</p>
        </div>
      </div>

      <div class="doc-title-bar">
        <div>
          <div class="doc-title">${title}</div>
          <div class="doc-subtitle">${subtitle}</div>
        </div>
        ${voucherNumber ? `<div class="voucher-badge">${voucherNumber}</div>` : ''}
      </div>

      ${metadata.length > 0 ? `
        <div class="meta-grid">
          ${metadata.map(m => `
            <div class="meta-item">
              <span class="meta-label">${m.label}</span>
              <span class="meta-val">${m.value}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${summaryCards.length > 0 ? `
        <div class="summary-grid">
          ${summaryCards.map(s => `
            <div class="summary-card">
              <span class="summary-label">${s.label}</span>
              <div class="summary-value">${s.value}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 30px;">#</th>
            ${tableHeaders.map(h => {
              const isNum = h.toLowerCase().includes('cost') || h.toLowerCase().includes('price') || h.toLowerCase().includes('total') || h.toLowerCase().includes('subtotal') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('value');
              const isCenter = h.toLowerCase().includes('qty') || h.toLowerCase().includes('units') || h.toLowerCase().includes('status') || h.toLowerCase().includes('type') || h.toLowerCase().includes('date');
              return `<th class="${isNum ? 'text-right' : isCenter ? 'text-center' : ''}">${h}</th>`;
            }).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRows.map((row, idx) => `
            <tr>
              <td class="text-center" style="color: #64748b;">${idx + 1}</td>
              ${row.map((cell, cIdx) => {
                const h = tableHeaders[cIdx] || '';
                const isNum = h.toLowerCase().includes('cost') || h.toLowerCase().includes('price') || h.toLowerCase().includes('total') || h.toLowerCase().includes('subtotal') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('value');
                const isCenter = h.toLowerCase().includes('qty') || h.toLowerCase().includes('units') || h.toLowerCase().includes('status') || h.toLowerCase().includes('type') || h.toLowerCase().includes('date');
                return `<td class="${isNum ? 'text-right' : isCenter ? 'text-center' : ''}">${cell ?? ''}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer-signatures">
        <div>
          <div class="sig-line"></div>
          <div class="sig-title">Generated & Prepared By:</div>
          <div>${authorName} (${authorRole})</div>
        </div>
        <div>
          <div class="sig-line"></div>
          <div class="sig-title">Pharmacy Superintendent / Auditor Review:</div>
          <div>${superintendentName}</div>
        </div>
        <div>
          <div class="sig-line"></div>
          <div class="sig-title">Official Branch Receiving Stamp:</div>
          <div>Approved for Dispensary Registry</div>
        </div>
      </div>

      <div class="disclaimer">
        This document is an official pharmaceutical inventory and procurement audit record generated by GreenLife AI Healthcare PMS. Formatted for compliance with Pharmacy Council regulations.
      </div>
    </body>
    </html>
  `;

  // Create isolated invisible iframe for spooling
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.opacity = '0.01';
  iframe.style.border = 'none';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Print spool error:', e);
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  }, 350);
};
