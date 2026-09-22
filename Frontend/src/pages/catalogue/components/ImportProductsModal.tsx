import React, { useState, useRef } from 'react';
import ExcelJS from 'exceljs';
import { 
  X, Upload, Download, FileText, CheckCircle2, AlertTriangle, AlertCircle, 
  ArrowRight, ArrowLeft, Search, Sparkles, FileSpreadsheet, Check, Info, HelpCircle
} from 'lucide-react';
import { usePharmacy } from '../../../context/PharmacyContext';
import { Product, ProductPackagingTier, Batch, BatchStatus } from '../../../types';

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedImportRow {
  rowNumber: number;
  autoId: string;
  brandName: string;
  genericName: string;
  categoryName: string;
  dosageForm: string;
  strength: string;
  packSize: string;
  manufacturer: string;
  baseUnit: string;
  packMultiplier: number;
  packCost: number;
  packPrice: number;
  stripMultiplier: number;
  stripCost: number;
  stripPrice: number;
  unitCost: number;
  sellingPrice: number;
  barcode: string;
  sku: string;
  batchNumber: string;
  expiryDate: string;
  initialStock: number;
  reorderLevel: number;
  maxStockLevel: number;
  isPrescriptionRequired: boolean;
  requiresColdChain: boolean;
  status: 'VALID' | 'WARNING' | 'ERROR';
  errors: string[];
  warnings: string[];
}

export const ImportProductsModal: React.FC<ImportProductsModalProps> = ({ isOpen, onClose }) => {
  const { categories, bulkAddProducts, formatCurrency, toast } = usePharmacy();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'VALID' | 'WARNING' | 'ERROR'>('ALL');
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [skipErrors, setSkipErrors] = useState<boolean>(true);
  const [autoCreateCategories, setAutoCreateCategories] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ count: number; newCategories: number; batchesCreated?: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Download Excel Spreadsheet Template (.xlsx) with In-Cell Dropdowns
  const handleDownloadExcelTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'GreenLife AI Pharmacy Management System';
      workbook.lastModifiedBy = 'GreenLife AI Pharmacy';
      workbook.created = new Date();
      workbook.modified = new Date();

      // 1. Data Entry Worksheet
      const worksheet = workbook.addWorksheet('Medications Import', {
        views: [{ state: 'frozen', ySplit: 1 }]
      });

      // 2. Hidden Reference Lookup Worksheet for Clean OpenXML Validation (prevents Excel XML repair errors)
      const lookupSheet = workbook.addWorksheet('LookupLists');
      lookupSheet.state = 'hidden';

      // Categories list for dropdown
      const catNames = categories.length > 0 
        ? categories.map(c => c.name) 
        : [
            'Antibiotics & Anti-Infectives',
            'Analgesics & Antipyretics',
            'Antidiabetics & Endocrine',
            'Antimalarials',
            'Cardiovascular & Antihypertensives',
            'Gastrointestinal',
            'Vitamins & Supplements',
            'Dermatologicals',
            'Respiratory & Antiasthmatics',
            'Ophthalmic & ENT',
            'General'
          ];
      
      const dosageForms = [
        'Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection',
        'Ointment', 'Cream', 'Drops', 'Inhaler', 'Suppository',
        'Gel', 'Lotion', 'Infusion'
      ];
      const unitList = [
        'Tablet', 'Capsule', 'Bottle', 'Vial', 'Ampoule',
        'Tube', 'Sachet', 'Piece', 'Pack', 'Box', 'mL'
      ];
      const pomList = ['Yes', 'No'];

      // Populate Lookup Sheet
      lookupSheet.getCell('A1').value = 'Categories';
      catNames.forEach((name, idx) => {
        lookupSheet.getCell(`A${idx + 2}`).value = name;
      });

      lookupSheet.getCell('B1').value = 'DosageForms';
      dosageForms.forEach((form, idx) => {
        lookupSheet.getCell(`B${idx + 2}`).value = form;
      });

      lookupSheet.getCell('C1').value = 'Units';
      unitList.forEach((unit, idx) => {
        lookupSheet.getCell(`C${idx + 2}`).value = unit;
      });

      lookupSheet.getCell('D1').value = 'POM';
      pomList.forEach((pom, idx) => {
        lookupSheet.getCell(`D${idx + 2}`).value = pom;
      });

      worksheet.columns = [
        { header: 'Medicine Name (Required)', key: 'name', width: 32 },
        { header: 'Generic Name', key: 'generic', width: 30 },
        { header: 'Category', key: 'category', width: 32 },
        { header: 'Dosage Form', key: 'form', width: 20 },
        { header: 'Strength', key: 'strength', width: 18 },
        { header: 'Unit', key: 'unit', width: 18 },
        { header: 'Cost Price', key: 'cost', width: 18 },
        { header: 'Selling Price (Required)', key: 'price', width: 26 },
        { header: 'Barcode', key: 'barcode', width: 22 },
        { header: 'Reorder Level', key: 'reorder', width: 18 },
        { header: 'Prescription Required', key: 'pom', width: 24 },
      ];

      // Header styling
      const headerRow = worksheet.getRow(1);
      headerRow.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F766E' } // Deep emerald/teal
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
      headerRow.height = 28;

      // Sample medication rows
      worksheet.addRow({
        name: 'Amoxil 500mg',
        generic: 'Amoxicillin Trihydrate',
        category: 'Antibiotics & Anti-Infectives',
        form: 'Capsule',
        strength: '500mg',
        unit: 'Capsule',
        cost: 1.20,
        price: 2.50,
        barcode: '8901032104501',
        reorder: 50,
        pom: 'Yes'
      });
      worksheet.addRow({
        name: 'Panadol Extra',
        generic: 'Paracetamol + Caffeine',
        category: 'Analgesics & Antipyretics',
        form: 'Tablet',
        strength: '500mg/65mg',
        unit: 'Tablet',
        cost: 0.50,
        price: 1.00,
        barcode: '8901032104502',
        reorder: 100,
        pom: 'No'
      });
      worksheet.addRow({
        name: 'Paracetamol Paediatric Suspension',
        generic: 'Paracetamol Oral',
        category: 'Analgesics & Antipyretics',
        form: 'Syrup',
        strength: '120mg/5mL',
        unit: 'Bottle',
        cost: 12.00,
        price: 20.00,
        barcode: '8901032104503',
        reorder: 30,
        pom: 'No'
      });
      worksheet.addRow({
        name: 'Gentamicin Injection',
        generic: 'Gentamicin Sulfate',
        category: 'Antibiotics & Anti-Infectives',
        form: 'Injection',
        strength: '80mg/2mL',
        unit: 'Vial',
        cost: 3.50,
        price: 7.00,
        barcode: '8901032104504',
        reorder: 20,
        pom: 'Yes'
      });
      worksheet.addRow({
        name: 'Insulin Mixtard 30/70',
        generic: 'Biphasic Isophane Insulin',
        category: 'Antidiabetics & Endocrine',
        form: 'Injection',
        strength: '100IU/mL',
        unit: 'Vial',
        cost: 85.00,
        price: 130.00,
        barcode: '',
        reorder: 20,
        pom: 'Yes'
      });

      const catRange = `LookupLists!$A$2:$A$${catNames.length + 1}`;
      const formRange = `LookupLists!$B$2:$B$${dosageForms.length + 1}`;
      const unitRange = `LookupLists!$C$2:$C$${unitList.length + 1}`;
      const pomRange = `LookupLists!$D$2:$D$${pomList.length + 1}`;

      // Apply Excel sheet reference Data Validation to rows 2 through 500
      for (let r = 2; r <= 500; r++) {
        // Column C: Category (Col 3)
        worksheet.getCell(`C${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [catRange],
          showErrorMessage: true,
          errorTitle: 'Invalid Category',
          error: 'Please select a therapeutic category from the dropdown.'
        };
        // Column D: Dosage Form (Col 4)
        worksheet.getCell(`D${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [formRange],
          showErrorMessage: true,
          errorTitle: 'Invalid Dosage Form',
          error: 'Please select a dosage form from the dropdown.'
        };
        // Column F: Unit (Col 6)
        worksheet.getCell(`F${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [unitRange],
          showErrorMessage: true,
          errorTitle: 'Invalid Unit',
          error: 'Please select a dispensing unit from the dropdown.'
        };
        // Column K: Prescription Required (Col 11)
        worksheet.getCell(`K${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [pomRange],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Yes or No.'
        };

        // Number Formatting
        worksheet.getCell(`G${r}`).numFmt = '#,##0.00';
        worksheet.getCell(`H${r}`).numFmt = '#,##0.00';
        worksheet.getCell(`J${r}`).numFmt = '#,##0';
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'GreenLife_Medications_Import_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate Excel template', err);
      toast.error('Failed to generate Excel template.', 'Template Error');
    }
  };

  // 2. Download Simplified CSV Template Function
  const handleDownloadCsvTemplate = () => {
    const headers = [
      'Medicine Name',
      'Generic Name',
      'Category',
      'Dosage Form',
      'Strength',
      'Unit',
      'Cost Price',
      'Selling Price',
      'Barcode',
      'Reorder Level',
      'Prescription Required'
    ];
    const sampleRows = [
      'Amoxil 500mg,Amoxicillin Trihydrate,Antibiotics & Anti-Infectives,Capsule,500mg,Capsule,1.20,2.50,8901032104501,50,Yes',
      'Panadol Extra,Paracetamol + Caffeine,Analgesics & Antipyretics,Tablet,500mg/65mg,Tablet,0.50,1.00,8901032104502,100,No',
      'Paracetamol Paediatric,Paracetamol Oral,Analgesics & Antipyretics,Syrup,120mg/5mL,Bottle,12.00,20.00,8901032104503,30,No',
      'Gentamicin Injection,Gentamicin Sulfate,Antibiotics & Anti-Infectives,Injection,80mg/2mL,Vial,3.50,7.00,8901032104504,20,Yes',
      'Insulin Mixtard 30/70,Biphasic Isophane Insulin,Antidiabetics & Endocrine,Injection,100IU/mL,Vial,85.00,130.00,,20,Yes'
    ];

    const templateContent = [headers.join(','), ...sampleRows].join('\n');
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'GreenLife_Medications_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Handle File Upload (Supports both .xlsx and .csv)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.getWorksheet('Medications Import') || workbook.worksheets[0];
        if (!worksheet) {
          toast.warning('Spreadsheet is empty. Please upload an Excel sheet with medication data.', 'Empty Spreadsheet');
          return;
        }

        const rows: string[][] = [];
        worksheet.eachRow({ includeEmpty: false }, (row) => {
          const values: string[] = [];
          row.eachCell({ includeEmpty: true }, (cell) => {
            let val = cell.value;
            if (val && typeof val === 'object') {
              if ('result' in val) val = (val as any).result;
              else if ('text' in val) val = (val as any).text;
              else if ('richText' in val) val = (val as any).richText.map((t: any) => t.text).join('');
            }
            values.push(val !== undefined && val !== null ? String(val).trim() : '');
          });
          if (values.some(v => v.length > 0)) {
            rows.push(values);
          }
        });

        if (rows.length < 2) {
          toast.warning('The spreadsheet must contain a header row and at least one medication row.', 'Header Row Missing');
          return;
        }

        // Convert to CSV for uniform processing
        const generatedCsv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
        setCsvContent(generatedCsv);
        parseCSV(generatedCsv);
      } catch (err) {
        console.error('Failed to parse Excel file', err);
        toast.error('Error parsing Excel spreadsheet. Please ensure it is a valid .xlsx file.', 'Parse Error');
      }
    } else {
      // Standard CSV parsing
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCsvContent(content);
        parseCSV(content);
      };
      reader.readAsText(file);
    }
  };

  // 4. Robust CSV Line Parser
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result.map(s => s.replace(/^["']|["']$/g, '').trim());
  };

  // 5. Parse & Validate CSV / Extracted Rows
  const parseCSV = (rawText: string) => {
    if (!rawText.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      toast.warning('The file must contain a header row and at least one medication row.', 'Header Row Missing');
      return;
    }

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Find index helper with disambiguation for cost vs selling price
    const getIdx = (keys: string[], excludeSubstrings: string[] = []): number => {
      // 1. Try exact match
      for (const k of keys) {
        const exactIdx = headers.findIndex(h => h === k);
        if (exactIdx !== -1) return exactIdx;
      }
      // 2. Try substring match respecting exclusion list
      for (const k of keys) {
        const subIdx = headers.findIndex(h => {
          if (excludeSubstrings.some(ex => h.includes(ex))) return false;
          return h.includes(k);
        });
        if (subIdx !== -1) return subIdx;
      }
      return -1;
    };

    // Simplified & flexible matching with strict column separation
    const idxBrand = getIdx(['medicinename', 'medicinenamerequired', 'brandname', 'productname', 'brand', 'name', 'medicine'], ['generic']);
    const idxGeneric = getIdx(['genericname', 'genericmolecule', 'generic', 'molecule', 'inn']);
    const idxCategory = getIdx(['category', 'therapeuticcategory']);
    const idxDosage = getIdx(['dosageform', 'form', 'dosage']);
    const idxStrength = getIdx(['strength', 'dose', 'potency']);
    const idxBaseUnit = getIdx(['unit', 'basedispensingunit', 'baseunit', 'dispensingunit']);
    const idxPackMult = getIdx(['packmultiplier', 'packsize', 'unitsperpack', 'boxmultiplier']);
    const idxPackCost = getIdx(['packwholesalecost', 'packcost', 'boxcost'], ['selling', 'retail']);
    const idxPackPrice = getIdx(['packretailprice', 'packprice', 'boxprice'], ['cost', 'wholesale']);
    const idxStripMult = getIdx(['stripmultiplier', 'stripsize']);
    const idxStripCost = getIdx(['stripwholesalecost', 'stripcost'], ['selling', 'retail']);
    const idxStripPrice = getIdx(['stripretailprice', 'stripprice'], ['cost', 'wholesale']);
    const idxUnitCost = getIdx(['costprice', 'unitcost', 'cost', 'basecost', 'piececost'], ['selling', 'retail']);
    const idxSellingPrice = getIdx(['sellingprice', 'sellingpricerequired', 'unitsellingprice', 'retailprice', 'unitprice', 'selling', 'price'], ['cost', 'wholesale']);
    const idxBarcode = getIdx(['barcode', 'upc', 'ean']);
    const idxSku = getIdx(['sku', 'itemcode', 'code']);
    const idxManufacturer = getIdx(['manufacturer', 'maker', 'company']);
    const idxReorder = getIdx(['reorderlevel', 'reorder', 'minstock', 'threshold']);
    const idxMaxStock = getIdx(['maxstocklevel', 'maxstock']);
    const idxPOM = getIdx(['prescriptionrequired', 'pom', 'rxrequired', 'prescription']);
    const idxColdChain = getIdx(['requirescoldchain', 'coldchain', 'refrigerated']);
    const idxBatchNumber = getIdx(['batchnumber', 'batchid', 'batchno', 'lotnumber', 'lotid', 'lotno', 'batch', 'lot']);
    const idxExpiryDate = getIdx(['expirydate', 'expiry', 'expdate', 'expirationdate', 'exp']);
    const idxInitialStock = getIdx(['initialstock', 'stockquantity', 'quantity', 'initialqty', 'qty', 'openingstock']);

    const existingCategories = new Set(categories.map(c => c.name.toLowerCase().trim()));

    const rows: ParsedImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const cols = parseCSVLine(line);

      let brandName = idxBrand !== -1 ? cols[idxBrand] || '' : cols[0] || '';
      let genericName = idxGeneric !== -1 ? cols[idxGeneric] || '' : '';
      
      // Smart Fallback: If generic name is empty, default to brand name
      if (!genericName && brandName) {
        genericName = brandName;
      }
      if (!brandName && genericName) {
        brandName = genericName;
      }

      const rawCategoryName = (idxCategory !== -1 && cols[idxCategory]) ? cols[idxCategory].trim() : 'General';
      
      // Smart Category Matching & Auto-Normalization to existing categories
      const normalizedCatInput = rawCategoryName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchedCat = categories.find(c => {
        const norm = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return norm === normalizedCatInput ||
               norm.includes(normalizedCatInput) ||
               normalizedCatInput.includes(norm) ||
               (normalizedCatInput.includes('antibiotic') && norm.includes('antibiotic')) ||
               (normalizedCatInput.includes('analgesic') && norm.includes('analgesic')) ||
               (normalizedCatInput.includes('antimalarial') && norm.includes('antimalarial')) ||
               (normalizedCatInput.includes('antidiabetic') && norm.includes('antidiabetic')) ||
               (normalizedCatInput.includes('cardio') && norm.includes('cardio')) ||
               (normalizedCatInput.includes('hypertens') && norm.includes('hypertens')) ||
               (normalizedCatInput.includes('gastro') && norm.includes('gastro')) ||
               (normalizedCatInput.includes('respiratory') && norm.includes('respiratory')) ||
               (normalizedCatInput.includes('vitamin') && norm.includes('vitamin')) ||
               (normalizedCatInput.includes('dermatolog') && norm.includes('dermatolog'));
      });

      const categoryName = matchedCat ? matchedCat.name : (rawCategoryName || 'General');
      const dosageForm = (idxDosage !== -1 && cols[idxDosage]) ? cols[idxDosage].trim() : 'Tablet';
      const strength = idxStrength !== -1 ? cols[idxStrength] || '' : '';
      
      // Base unit fallback
      let baseUnit = idxBaseUnit !== -1 ? cols[idxBaseUnit] || '' : '';
      if (!baseUnit) {
        const formLow = dosageForm.toLowerCase();
        if (formLow.includes('capsule')) baseUnit = 'Capsule';
        else if (formLow.includes('syrup') || formLow.includes('suspension')) baseUnit = 'Bottle';
        else if (formLow.includes('injection') || formLow.includes('vial')) baseUnit = 'Vial';
        else if (formLow.includes('ointment') || formLow.includes('cream') || formLow.includes('gel')) baseUnit = 'Tube';
        else if (formLow.includes('drop')) baseUnit = 'Bottle';
        else if (formLow.includes('sachet')) baseUnit = 'Sachet';
        else baseUnit = 'Tablet';
      }

      const packMultiplier = idxPackMult !== -1 ? Math.max(1, parseInt(cols[idxPackMult]) || 1) : 1;
      let packCost = idxPackCost !== -1 ? parseFloat(cols[idxPackCost].replace(/[^0-9.]/g, '')) || 0 : 0;
      let packPrice = idxPackPrice !== -1 ? parseFloat(cols[idxPackPrice].replace(/[^0-9.]/g, '')) || 0 : 0;

      const stripMultiplier = idxStripMult !== -1 ? Math.max(1, parseInt(cols[idxStripMult]) || 1) : 1;
      let stripCost = idxStripCost !== -1 ? parseFloat(cols[idxStripCost].replace(/[^0-9.]/g, '')) || 0 : 0;
      let stripPrice = idxStripPrice !== -1 ? parseFloat(cols[idxStripPrice].replace(/[^0-9.]/g, '')) || 0 : 0;

      let unitCost = idxUnitCost !== -1 ? parseFloat(cols[idxUnitCost].replace(/[^0-9.]/g, '')) || 0 : 0;
      let sellingPrice = idxSellingPrice !== -1 ? parseFloat(cols[idxSellingPrice].replace(/[^0-9.]/g, '')) || 0 : 0;

      // Smart price interpolations
      if (unitCost === 0 && packCost > 0 && packMultiplier > 0) {
        unitCost = Number((packCost / packMultiplier).toFixed(2));
      }
      if (sellingPrice === 0 && packPrice > 0 && packMultiplier > 0) {
        sellingPrice = Number((packPrice / packMultiplier).toFixed(2));
      }
      if (packCost === 0 && unitCost > 0 && packMultiplier > 1) {
        packCost = Number((unitCost * packMultiplier).toFixed(2));
      }
      if (packPrice === 0 && sellingPrice > 0 && packMultiplier > 1) {
        packPrice = Number((sellingPrice * packMultiplier).toFixed(2));
      }
      if (stripMultiplier > 1 && stripCost === 0 && unitCost > 0) {
        stripCost = Number((unitCost * stripMultiplier).toFixed(2));
      }
      if (stripMultiplier > 1 && stripPrice === 0 && sellingPrice > 0) {
        stripPrice = Number((sellingPrice * stripMultiplier).toFixed(2));
      }

      // Auto-generated Product ID
      const cleanSlug = (genericName || brandName || 'med')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 7) || 'med';
      const autoId = `prod_${cleanSlug}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

      // Auto-generated Barcode & SKU if blank
      const barcode = (idxBarcode !== -1 && cols[idxBarcode]?.trim()) 
        ? cols[idxBarcode].trim() 
        : `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const sku = (idxSku !== -1 && cols[idxSku]?.trim()) 
        ? cols[idxSku].trim() 
        : `MED-${cleanSlug.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      // Auto-generated or extracted Batch ID & FEFO Expiry
      const batchNumber = (idxBatchNumber !== -1 && cols[idxBatchNumber]?.trim())
        ? cols[idxBatchNumber].trim()
        : `BAT-${cleanSlug.toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const expiryDate = (idxExpiryDate !== -1 && cols[idxExpiryDate]?.trim())
        ? cols[idxExpiryDate].trim()
        : new Date(Date.now() + 730 * 86400000).toISOString().split('T')[0];

      const initialStock = idxInitialStock !== -1 ? Math.max(0, parseInt(cols[idxInitialStock].replace(/[^0-9]/g, '')) || 0) : 0;

      const manufacturer = (idxManufacturer !== -1 && cols[idxManufacturer]?.trim()) 
        ? cols[idxManufacturer].trim() 
        : 'Generic Pharma';
      const reorderLevel = idxReorder !== -1 ? parseInt(cols[idxReorder].replace(/[^0-9]/g, '')) || 50 : 50;
      const maxStockLevel = idxMaxStock !== -1 ? parseInt(cols[idxMaxStock].replace(/[^0-9]/g, '')) || 1000 : 1000;
      
      const pomVal = idxPOM !== -1 ? (cols[idxPOM] || '').toLowerCase().trim() : '';
      const isPrescriptionRequired = pomVal === 'yes' || pomVal === 'true' || pomVal === '1' || pomVal === 'pom' || pomVal === 'y';

      const coldVal = idxColdChain !== -1 ? (cols[idxColdChain] || '').toLowerCase().trim() : '';
      const requiresColdChain = coldVal === 'yes' || coldVal === 'true' || coldVal === '1';

      // Validation Rules: Only Medicine Name and Selling Price are strictly required
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!brandName.trim()) {
        errors.push('Missing Medicine Name');
      }
      if (sellingPrice <= 0 && packPrice <= 0) {
        errors.push('Selling price must be greater than 0.00');
      }
      if (unitCost <= 0 && packCost <= 0) {
        warnings.push('Cost price is 0.00 (Free / Donation batch)');
      }
      if (unitCost > sellingPrice && sellingPrice > 0) {
        warnings.push('Selling price is lower than cost (Negative Margin)');
      }

      const status: 'VALID' | 'WARNING' | 'ERROR' = errors.length > 0 ? 'ERROR' : warnings.length > 0 ? 'WARNING' : 'VALID';

      rows.push({
        rowNumber: i,
        autoId,
        brandName,
        genericName,
        categoryName: categoryName || 'General',
        dosageForm,
        strength,
        packSize: packMultiplier > 1 ? `Box of ${packMultiplier} ${baseUnit}s` : `Single ${baseUnit}`,
        manufacturer,
        baseUnit,
        packMultiplier,
        packCost,
        packPrice,
        stripMultiplier,
        stripCost,
        stripPrice,
        unitCost,
        sellingPrice,
        barcode,
        sku,
        batchNumber,
        expiryDate,
        initialStock,
        reorderLevel,
        maxStockLevel,
        isPrescriptionRequired,
        requiresColdChain,
        status,
        errors,
        warnings
      });
    }

    setParsedRows(rows);
    setStep(2);
  };

  // 6. Commit Valid Rows
  const handleCommitImport = () => {
    const rowsToImport = parsedRows.filter(r => {
      if (r.status === 'ERROR') return !skipErrors;
      return true;
    });

    if (rowsToImport.length === 0) {
      toast.warning('No valid rows found to import.', 'Import Empty');
      return;
    }

    setIsProcessing(true);

    const newBatches: Batch[] = [];

    const newProducts: Product[] = rowsToImport.map(r => {
      const tiers: ProductPackagingTier[] = [];
      if (r.packMultiplier > 1 && r.packPrice > 0) {
        tiers.push({
          unitName: 'Pack',
          tierType: 'PACK',
          multiplier: r.packMultiplier,
          sellingPrice: r.packPrice,
          costPrice: r.packCost
        });
      }
      if (r.stripMultiplier > 1 && r.stripPrice > 0) {
        tiers.push({
          unitName: 'Strip',
          tierType: 'STRIP',
          multiplier: r.stripMultiplier,
          sellingPrice: r.stripPrice,
          costPrice: r.stripCost
        });
      }
      tiers.push({
        unitName: r.baseUnit,
        tierType: 'PIECE',
        multiplier: 1,
        sellingPrice: r.sellingPrice,
        costPrice: r.unitCost,
        isBase: true
      });

      const totalQty = r.initialStock || 0;

      // Construct active Batch record for each product
      const batchId = `batch_${r.autoId}_${Date.now().toString(36)}`;
      newBatches.push({
        id: batchId,
        productId: r.autoId,
        productName: r.brandName,
        batchNumber: r.batchNumber,
        manufacturingDate: new Date().toISOString().split('T')[0],
        mfgDate: new Date().toISOString().split('T')[0],
        expiryDate: r.expiryDate,
        quantityOnHand: totalQty,
        availableQuantity: totalQty,
        remainingStock: totalQty,
        initialStock: totalQty,
        unitCost: r.unitCost,
        costPrice: r.unitCost,
        sellingPrice: r.sellingPrice,
        supplierId: 'supp_import',
        supplierName: r.manufacturer || 'Direct Manufacturer',
        status: 'ACTIVE' as BatchStatus,
        storageLocation: 'Main Dispensary Shelf A1',
        receivedDate: new Date().toISOString()
      });

      return {
        id: r.autoId,
        barcode: r.barcode,
        sku: r.sku,
        brandName: r.brandName,
        genericName: r.genericName,
        categoryId: `cat_${r.categoryName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        categoryName: r.categoryName,
        dosageForm: r.dosageForm,
        strength: r.strength,
        packSize: r.packSize,
        manufacturer: r.manufacturer,
        baseUnit: r.baseUnit,
        packagingTiers: tiers,
        isPrescriptionRequired: r.isPrescriptionRequired,
        requiresColdChain: r.requiresColdChain,
        reorderLevel: r.reorderLevel,
        maxStockLevel: r.maxStockLevel,
        unitCost: r.unitCost,
        sellingPrice: r.sellingPrice,
        totalQuantity: totalQty,
        availableQuantity: totalQty,
        status: totalQty > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'
      };
    });

    const result = bulkAddProducts(newProducts, autoCreateCategories, newBatches);
    setImportResult(result);
    toast.success(`Successfully onboarded ${result.count} medications into formulary catalogue!`, 'Import Completed');
    setIsProcessing(false);
    setStep(3);
  };

  // Filtered rows for Step 2 preview
  const filteredRows = parsedRows.filter(r => {
    const matchesStatus = 
      filterStatus === 'ALL' ||
      (filterStatus === 'VALID' && r.status === 'VALID') ||
      (filterStatus === 'WARNING' && r.status === 'WARNING') ||
      (filterStatus === 'ERROR' && r.status === 'ERROR');

    const matchesSearch = 
      !previewSearch.trim() ||
      r.brandName.toLowerCase().includes(previewSearch.toLowerCase()) ||
      r.genericName.toLowerCase().includes(previewSearch.toLowerCase()) ||
      r.categoryName.toLowerCase().includes(previewSearch.toLowerCase()) ||
      r.barcode.includes(previewSearch);

    return matchesStatus && matchesSearch;
  });

  const validCount = parsedRows.filter(r => r.status === 'VALID').length;
  const warningCount = parsedRows.filter(r => r.status === 'WARNING').length;
  const errorCount = parsedRows.filter(r => r.status === 'ERROR').length;
  const importableCount = parsedRows.filter(r => r.status !== 'ERROR' || !skipErrors).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Bulk Import Medications Wizard</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  Excel & CSV Engine
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Upload your drug catalogue with simplified columns, in-cell dropdown validation, and auto-generated defaults.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Progress Steps */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shrink-0">
          <div className={`flex items-center space-x-2 font-semibold ${step >= 1 ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
              1
            </span>
            <span>Upload & Download Templates</span>
          </div>
          <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <div className={`flex items-center space-x-2 font-semibold ${step >= 2 ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
              2
            </span>
            <span>Validation & Interactive Preview</span>
          </div>
          <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <div className={`flex items-center space-x-2 font-semibold ${step >= 3 ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 3 ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
              3
            </span>
            <span>Commit Summary</span>
          </div>
        </div>

        {/* STEP 1: UPLOAD & TEMPLATES */}
        {step === 1 && (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {/* Dual Download Templates Banner */}
            <div className="p-4 bg-gradient-to-r from-teal-50 via-emerald-50 to-brand-50 dark:from-slate-800/80 dark:to-slate-800/40 rounded-xl border border-teal-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Download Simplified Formulary Template</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                    11 Key Columns
                  </span>
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Only <strong>Medicine Name</strong> and <strong>Selling Price</strong> are required. Category, Dosage Form, Unit, and POM include in-cell dropdown selectors.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
                  title="Download Excel spreadsheet with in-cell dropdown selection lists"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>📗 Download Excel (.xlsx with Dropdowns)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>📄 Download CSV (.csv)</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop Upload Zone (XLSX and CSV) */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-teal-300 dark:border-teal-700/60 hover:border-teal-500 rounded-2xl p-6 text-center cursor-pointer transition bg-teal-50/20 dark:bg-slate-800/30 flex flex-col items-center justify-center space-y-2.5"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".xlsx,.xls,.csv" 
                className="hidden" 
              />
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {fileName ? `Selected File: ${fileName}` : 'Click to browse or drag & drop your Excel (.xlsx) or CSV file here'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supports .xlsx and .csv files with automated header detection
                </p>
              </div>
            </div>

            {/* Field Guide Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
                  <Info className="w-4 h-4 text-brand-600" />
                  <span>Column Field Guide & Smart Default Rules</span>
                </div>
                <span className="text-[10px] text-slate-500">Only 2 Required Columns</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-bold">
                    <tr>
                      <th className="p-2.5">Column Header</th>
                      <th className="p-2.5">Requirement</th>
                      <th className="p-2.5">Interactive Dropdown?</th>
                      <th className="p-2.5">Fallback If Left Blank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">Medicine Name</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">REQUIRED</span></td>
                      <td className="p-2.5 text-slate-500">Free text (e.g. Amoxil 500mg)</td>
                      <td className="p-2.5 text-rose-600 italic">Must be provided</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">Generic Name</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">Optional</span></td>
                      <td className="p-2.5 text-slate-500">Free text (e.g. Amoxicillin)</td>
                      <td className="p-2.5 text-slate-500">Defaults to Medicine Name</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">Category</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">Optional</span></td>
                      <td className="p-2.5 font-semibold text-emerald-600">✅ Dropdown (Antibiotics, Analgesics, etc.)</td>
                      <td className="p-2.5 text-slate-500">Defaults to "General"</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">Dosage Form</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">Optional</span></td>
                      <td className="p-2.5 font-semibold text-emerald-600">✅ Dropdown (Tablet, Capsule, Syrup, etc.)</td>
                      <td className="p-2.5 text-slate-500">Defaults to "Tablet"</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">Strength</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">Optional</span></td>
                      <td className="p-2.5 text-slate-500">Free text (e.g. 500mg, 10mg/5mL)</td>
                      <td className="p-2.5 text-slate-500">Empty string</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">Unit</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">Optional</span></td>
                      <td className="p-2.5 font-semibold text-emerald-600">✅ Dropdown (Tablet, Capsule, Bottle, etc.)</td>
                      <td className="p-2.5 text-slate-500">Inferred from Dosage Form</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">Cost Price</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">Optional</span></td>
                      <td className="p-2.5 text-slate-500">Numeric decimal</td>
                      <td className="p-2.5 text-slate-500">Defaults to 0.00</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">Selling Price</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">REQUIRED</span></td>
                      <td className="p-2.5 text-slate-500">Numeric decimal</td>
                      <td className="p-2.5 text-rose-600 italic">Must be greater than 0.00</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">Barcode</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">Optional</span></td>
                      <td className="p-2.5 text-slate-500">EAN-13 / UPC string</td>
                      <td className="p-2.5 text-emerald-600 font-medium">Auto-generated EAN-13 barcode</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">Reorder Level</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">Optional</span></td>
                      <td className="p-2.5 text-slate-500">Integer threshold</td>
                      <td className="p-2.5 text-slate-500">Defaults to 50 units</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">Prescription Required</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">Optional</span></td>
                      <td className="p-2.5 font-semibold text-emerald-600">✅ Dropdown (Yes / No)</td>
                      <td className="p-2.5 text-slate-500">Defaults to "No" (OTC)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Direct Paste Alternative */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Or Paste Raw CSV Data Directly:</span>
                <span className="text-[10px] text-slate-400">Header row required</span>
              </label>
              <textarea
                rows={4}
                value={csvContent}
                onChange={e => setCsvContent(e.target.value)}
                placeholder="Paste CSV text or table rows copied directly from Excel or Google Sheets here..."
                className="w-full p-3 font-mono text-xs border rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        )}

        {/* STEP 2: VALIDATION & INTERACTIVE PREVIEW */}
        {step === 2 && (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1 flex flex-col">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-500">Total Rows</span>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">{parsedRows.length}</p>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">🟢 Ready to Import</span>
                <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">{validCount}</p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">🟡 Warnings</span>
                <p className="text-lg font-extrabold text-amber-700 dark:text-amber-300 font-mono">{warningCount}</p>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900">
                <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">🔴 Critical Errors</span>
                <p className="text-lg font-extrabold text-rose-700 dark:text-rose-300 font-mono">{errorCount}</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center space-x-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
                {(['ALL', 'VALID', 'WARNING', 'ERROR'] as const).map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      filterStatus === status 
                        ? 'bg-brand-600 text-white shadow-sm' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {status === 'ALL' && `All (${parsedRows.length})`}
                    {status === 'VALID' && `Valid (${validCount})`}
                    {status === 'WARNING' && `Warnings (${warningCount})`}
                    {status === 'ERROR' && `Errors (${errorCount})`}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter preview list..."
                  value={previewSearch}
                  onChange={e => setPreviewSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Interactive Preview Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex-1 min-h-[240px] flex flex-col">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 sticky top-0 z-10 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">Row</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Auto-Generated ID</th>
                      <th className="p-2.5">Attached Batch & Expiry</th>
                      <th className="p-2.5">Medicine & Generic Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Form & Unit</th>
                      <th className="p-2.5 text-right">Cost Price</th>
                      <th className="p-2.5 text-right">Selling Price</th>
                      <th className="p-2.5">Barcode</th>
                      <th className="p-2.5 text-center">POM?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredRows.map(r => (
                      <tr 
                        key={r.rowNumber} 
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                          r.status === 'ERROR' ? 'bg-rose-50/30 dark:bg-rose-950/20' : 
                          r.status === 'WARNING' ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="p-2.5 font-mono text-slate-400">#{r.rowNumber}</td>
                        <td className="p-2.5 whitespace-nowrap">
                          {r.status === 'VALID' && (
                            <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Valid</span>
                            </span>
                          )}
                          {r.status === 'WARNING' && (
                            <span className="inline-flex items-center space-x-1 text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full" title={r.warnings.join(' | ')}>
                              <AlertTriangle className="w-3 h-3" />
                              <span>Warning</span>
                            </span>
                          )}
                          {r.status === 'ERROR' && (
                            <span className="inline-flex items-center space-x-1 text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full" title={r.errors.join(' | ')}>
                              <AlertCircle className="w-3 h-3" />
                              <span>Error</span>
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-brand-600 dark:text-brand-400">
                          {r.autoId}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200 block">
                            {r.batchNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            Exp: {r.expiryDate}{r.initialStock > 0 ? ` (${r.initialStock} in-stock)` : ''}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <p className="font-bold text-slate-900 dark:text-white">{r.brandName || <span className="text-rose-500 italic">Missing Name</span>}</p>
                          <p className="text-[11px] text-slate-500">{r.genericName}</p>
                          {r.errors.length > 0 && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">⚠️ {r.errors.join(', ')}</p>
                          )}
                          {r.warnings.length > 0 && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">💡 {r.warnings.join(', ')}</p>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">
                          {r.categoryName}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{r.dosageForm}</span>
                          <span className="text-[10px] text-slate-400 ml-1">({r.baseUnit})</span>
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatCurrency(r.unitCost)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(r.sellingPrice)}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-500">
                          {r.barcode}
                        </td>
                        <td className="p-2.5 text-center">
                          {r.isPrescriptionRequired ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Rx (POM)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">OTC</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center space-x-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipErrors}
                    onChange={e => setSkipErrors(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Skip rows with errors (import {importableCount} valid medications)</span>
                </label>

                <label className="flex items-center space-x-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCreateCategories}
                    onChange={e => setAutoCreateCategories(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Auto-create missing therapeutic categories</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: COMMIT SUCCESS */}
        {step === 3 && importResult && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 flex-1">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Bulk Import Completed!
              </h4>
              <p className="text-xs text-slate-500 max-w-md">
                Successfully added <strong className="text-slate-900 dark:text-white font-mono">{importResult.count}</strong> medications to your formulary catalogue with auto-generated Product IDs, barcodes, and active batch records linked to inventory.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
              {importResult.batchesCreated !== undefined && importResult.batchesCreated > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300 font-semibold flex items-center space-x-1.5">
                  <span>📦</span>
                  <span><strong>{importResult.batchesCreated} active batch records</strong> attached with FEFO expiry and warehouse tracking.</span>
                </div>
              )}

              {importResult.newCategories > 0 && (
                <div className="p-3 bg-brand-50 dark:bg-brand-950/40 rounded-xl border border-brand-200 dark:border-brand-900 text-xs text-brand-700 dark:text-brand-300 font-semibold flex items-center space-x-1.5">
                  <span>✨</span>
                  <span><strong>{importResult.newCategories} new categories</strong> registered in the system.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t pt-3 shrink-0">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!csvContent.trim()}
                onClick={() => parseCSV(csvContent)}
                className="px-6 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 flex items-center space-x-1.5 transition"
              >
                <span>Parse & Validate Data</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Upload</span>
              </button>
              <button
                type="button"
                disabled={importableCount === 0 || isProcessing}
                onClick={handleCommitImport}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Import {importableCount} Valid Medications</span>
              </button>
            </>
          )}

          {step === 3 && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                Done & View Medications
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
