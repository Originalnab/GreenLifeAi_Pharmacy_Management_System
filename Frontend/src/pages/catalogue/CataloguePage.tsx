import React, { useState, useEffect } from 'react';
import { 
  Pill, Plus, Search, Filter, Edit2, Snowflake, 
  CheckCircle2, AlertTriangle, AlertCircle, X, Sparkles, 
  ArrowRightLeft, Layers, ShieldCheck, DollarSign, Check, Type,
  Tag, BookOpen, Sliders, Trash2, Info, HelpCircle, Save,
  Box, Package, Droplets, Syringe, Wind, Download, Printer, CheckSquare,
  Table, LayoutGrid, FileSpreadsheet
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Product, ProductPackagingTier, Category, DosagePreset, UnitType } from '../../types';
import { FloatingBulkActionBar } from '../../components/common/FloatingBulkActionBar';
import { WorkflowGuideNotice } from '../../components/common/WorkflowGuideNotice';
import { FieldGuideNotice } from '../../components/common/FieldGuideNotice';

interface CataloguePageProps {
  activeSubTab?: string;
  onSelectSubTab?: (subTab: string) => void;
}

export const CataloguePage: React.FC<CataloguePageProps> = ({ activeSubTab, onSelectSubTab }) => {
  const { 
    products, 
    categories, 
    addCategory, 
    updateCategory, 
    deleteCategory,
    dosagePresets,
    updateDosagePreset,
    addDosagePreset,
    deleteDosagePreset,
    addProduct, 
    updateProduct, 
    hasPermission, 
    formatCurrency, 
    currentCurrency, 
    unitTypes,
    addUnitType,
    updateUnitType,
    deleteUnitType,
    globalBulkDiscountPercent,
    setGlobalBulkDiscountPercent
  } = usePharmacy();

  // Active in-page subtab
  const [currentSubTab, setCurrentSubTab] = useState<'products' | 'categories' | 'dosage-forms' | 'predictor-rules' | 'units'>('products');

  useEffect(() => {
    if (activeSubTab) {
      if (activeSubTab === 'catalogue:categories') setCurrentSubTab('categories');
      else if (activeSubTab === 'catalogue:dosage-forms') setCurrentSubTab('dosage-forms');
      else if (activeSubTab === 'catalogue:predictor-rules') setCurrentSubTab('predictor-rules');
      else if (activeSubTab === 'catalogue:units') setCurrentSubTab('units');
      else setCurrentSubTab('products');
    }
  }, [activeSubTab]);

  const handleTabSwitch = (tab: 'products' | 'categories' | 'dosage-forms' | 'predictor-rules' | 'units') => {
    setCurrentSubTab(tab);
    if (onSelectSubTab) {
      if (tab === 'categories') onSelectSubTab('catalogue:categories');
      else if (tab === 'dosage-forms') onSelectSubTab('catalogue:dosage-forms');
      else if (tab === 'predictor-rules') onSelectSubTab('catalogue:predictor-rules');
      else if (tab === 'units') onSelectSubTab('catalogue:units');
      else onSelectSubTab('catalogue');
    }
  };

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPrescriptionFilter, setSelectedPrescriptionFilter] = useState('ALL');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Packaging & Pricing Predictor State for Product Modal
  const [baseUnit, setBaseUnit] = useState('Tablet');
  const [customUnitMode, setCustomUnitMode] = useState(false);
  const [hasStrip, setHasStrip] = useState(true);
  const [stripMultiplier, setStripMultiplier] = useState(10);
  const [hasPack, setHasPack] = useState(true);
  const [packMultiplier, setPackMultiplier] = useState(100);
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState(globalBulkDiscountPercent || 10);

  // Base pricing for Product Modal
  const [pieceCost, setPieceCost] = useState(18.00);
  const [piecePrice, setPiecePrice] = useState(30.00);

  // Packaging tiers prices
  const [stripCost, setStripCost] = useState(180.00);
  const [stripPrice, setStripPrice] = useState(280.00);
  const [packCost, setPackCost] = useState(1800.00);
  const [packPrice, setPackPrice] = useState(2600.00);

  // Form general state for Product Modal
  const [formData, setFormData] = useState({
    brandName: '',
    genericName: '',
    barcode: '',
    sku: '',
    dosageForm: 'Tablet' as any,
    strength: '500mg',
    packSize: '10x10 Blister Pack',
    categoryId: categories[0]?.id || '',
    categoryName: categories[0]?.name || '',
    manufacturer: '',
    isPrescriptionRequired: false,
    requiresColdChain: false,
    reorderLevel: 50,
    maxStockLevel: 500,
  });

  // Category Modal State
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catFormData, setCatFormData] = useState({ name: '', code: '', description: '' });

  // Dosage Form Modal State
  const [showDosageModal, setShowDosageModal] = useState(false);
  const [editingDosageKey, setEditingDosageKey] = useState<string | null>(null);
  const [isNewDosageForm, setIsNewDosageForm] = useState(false);
  const [dosageFormData, setDosageFormData] = useState<DosagePreset & { formName: string }>({
    formName: '',
    baseUnit: 'Piece',
    recommendedUnits: ['Piece'],
    hasStrip: false,
    stripMultiplier: 1,
    hasPack: true,
    packMultiplier: 1,
    packDescription: 'Standard Pack',
    clinicalNote: ''
  });

  // Unit Type Modal State
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [unitFormData, setUnitFormData] = useState<Omit<UnitType, 'id'>>({
    name: '',
    plural: '',
    category: 'DISPENSING_BASE',
    description: ''
  });
  const [unitCategoryFilter, setUnitCategoryFilter] = useState<'ALL' | 'DISPENSING_BASE' | 'SUB_CONTAINER' | 'CONTAINER'>('ALL');
  const [unitSearch, setUnitSearch] = useState('');
  const [selectedUnitCategory, setSelectedUnitCategory] = useState<string>('ALL');
  const [unitViewMode, setUnitViewMode] = useState<'table' | 'grid'>('table');
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

  const filteredUnits = unitTypes.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(unitSearch.toLowerCase()) ||
                          (u.description || '').toLowerCase().includes(unitSearch.toLowerCase());
    const matchesCategory = selectedUnitCategory === 'ALL' || u.category === selectedUnitCategory;
    return matchesSearch && matchesCategory;
  });

  const isAllUnitsSelected = filteredUnits.length > 0 && filteredUnits.every(u => selectedUnitIds.includes(u.id));

  const toggleSelectAllUnits = () => {
    if (isAllUnitsSelected) {
      setSelectedUnitIds([]);
    } else {
      setSelectedUnitIds(filteredUnits.map(u => u.id));
    }
  };

  const toggleSelectUnit = (id: string) => {
    setSelectedUnitIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportUnitsCSV = () => {
    const targets = unitTypes.filter(u => selectedUnitIds.includes(u.id));
    if (targets.length === 0) return;
    const headers = ['Unit Name', 'Plural', 'Category', 'Description', 'Is Custom'];
    const rows = targets.map(u => [
      `"${u.name}"`,
      `"${u.plural}"`,
      u.category,
      `"${(u.description || '').replace(/"/g, '""')}"`,
      u.isCustom ? 'Yes' : 'No'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `unit_types_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const canCreate = hasPermission('catalogue', 'create');

  // Intelligent Price Predictor from Piece Price
  const predictFromPiecePrice = (pPrice: number, pCost: number) => {
    const rawStripPrice = pPrice * stripMultiplier;
    const sPrice = Math.round(rawStripPrice * (1 - (bulkDiscountPercent * 0.5) / 100));
    setStripPrice(sPrice);
    setStripCost(pCost * stripMultiplier);

    const rawPackPrice = pPrice * packMultiplier;
    const pkPrice = Math.round(rawPackPrice * (1 - bulkDiscountPercent / 100));
    setPackPrice(pkPrice);
    setPackCost(pCost * packMultiplier);
  };

  // Intelligent Price Decomposition from Pack Price
  const decomposeFromPackPrice = (pkPrice: number, pkCost: number) => {
    if (packMultiplier <= 0) return;
    const baseP = pkPrice / packMultiplier;
    const singleP = Math.round(baseP * 1.15 * 100) / 100;
    setPiecePrice(singleP);
    setPieceCost(Math.round((pkCost / packMultiplier) * 100) / 100);

    const sPrice = Math.round((pkPrice / (packMultiplier / stripMultiplier)) * 1.05);
    setStripPrice(sPrice);
    setStripCost(Math.round((pkCost / (packMultiplier / stripMultiplier)) * 100) / 100);
  };

  // Live Margin Calculations on Piece Tier
  const profitAmount = piecePrice - pieceCost;
  const marginPercent = piecePrice > 0 ? ((piecePrice - pieceCost) / piecePrice) * 100 : 0;
  const markupPercent = pieceCost > 0 ? ((piecePrice - pieceCost) / pieceCost) * 100 : 0;

  // Margin Risk Assessment
  const getMarginRisk = (margin: number) => {
    if (margin < 0) {
      return {
        level: 'CRITICAL',
        badge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300',
        label: 'CRITICAL: Selling Below Cost (Loss)',
        description: 'You will incur a net loss on every unit dispensed.'
      };
    } else if (margin < 15) {
      return {
        level: 'LOW',
        badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
        label: 'CAUTION: Thin Profit Margin (<15%)',
        description: 'Vulnerable to supplier price inflation and holding overheads.'
      };
    } else if (margin <= 40) {
      return {
        level: 'HEALTHY',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
        label: 'OPTIMAL: Healthy Commercial Margin (15% - 40%)',
        description: 'In line with national pharmaceutical community retail benchmarks.'
      };
    } else {
      return {
        level: 'HIGH',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300',
        label: 'PREMIUM: High Markup (>40%)',
        description: 'Strong profitability on specialty or slow-moving chronic lines.'
      };
    }
  };

  const riskInfo = getMarginRisk(marginPercent);

  // Handle Intelligent Auto-Suggestion when Dosage Form changes
  const handleDosageFormChange = (newForm: string) => {
    setFormData(prev => ({ ...prev, dosageForm: newForm as any }));
    const preset = dosagePresets[newForm];
    if (preset) {
      setBaseUnit(preset.baseUnit);
      setCustomUnitMode(false);
      setHasStrip(preset.hasStrip);
      setStripMultiplier(preset.stripMultiplier);
      setHasPack(preset.hasPack);
      setPackMultiplier(preset.packMultiplier);
      if (!formData.packSize || formData.packSize.includes('Pack') || formData.packSize.includes('Bottle') || formData.packSize.includes('Tube') || formData.packSize.includes('Canister')) {
        setFormData(prev => ({ ...prev, packSize: preset.packDescription }));
      }
      const rawStrip = piecePrice * preset.stripMultiplier;
      setStripPrice(Math.round(rawStrip * (1 - (bulkDiscountPercent * 0.5) / 100)));
      setStripCost(pieceCost * preset.stripMultiplier);

      const rawPack = piecePrice * preset.packMultiplier;
      setPackPrice(Math.round(rawPack * (1 - bulkDiscountPercent / 100)));
      setPackCost(pieceCost * preset.packMultiplier);
    }
  };

  // Open Add Modal with fresh defaults based on default Tablet preset
  const openAddModal = () => {
    setEditingProduct(null);
    const defaultForm = 'Tablet';
    const preset = dosagePresets[defaultForm] || {
      baseUnit: 'Tablet',
      recommendedUnits: ['Tablet', 'Strip'],
      hasStrip: true,
      stripMultiplier: 10,
      hasPack: true,
      packMultiplier: 100,
      packDescription: '10x10 Blister Pack',
      clinicalNote: ''
    };

    setFormData({
      brandName: '',
      genericName: '',
      barcode: '',
      sku: '',
      dosageForm: defaultForm,
      strength: '500mg',
      packSize: preset.packDescription,
      categoryId: categories[0]?.id || '',
      categoryName: categories[0]?.name || '',
      manufacturer: '',
      isPrescriptionRequired: false,
      requiresColdChain: false,
      reorderLevel: 50,
      maxStockLevel: 500,
    });
    setBaseUnit(preset.baseUnit);
    setCustomUnitMode(false);
    setHasStrip(preset.hasStrip);
    setStripMultiplier(preset.stripMultiplier);
    setHasPack(preset.hasPack);
    setPackMultiplier(preset.packMultiplier);
    setPieceCost(18.00);
    setPiecePrice(30.00);
    setBulkDiscountPercent(globalBulkDiscountPercent || 10);
    predictFromPiecePrice(30.00, 18.00);
    setShowAddModal(true);
  };

  // Filtered products list with enriched filters
  const filteredProducts = products.filter(p => {
    const matchSearch = p.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm);
    const matchCat = selectedCat === 'ALL' || p.categoryId === selectedCat;
    const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    const matchPOM = selectedPrescriptionFilter === 'ALL' || 
      (selectedPrescriptionFilter === 'POM' ? p.isPrescriptionRequired : !p.isPrescriptionRequired);
    return matchSearch && matchCat && matchStatus && matchPOM;
  });

  const isAllSelected = filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length;
  const isSomeSelected = selectedProductIds.length > 0 && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandName || !formData.genericName) {
      alert('Please fill out medication name and generic details.');
      return;
    }

    const cat = categories.find(c => c.id === formData.categoryId);
    const catName = cat ? cat.name : 'General';

    const tiers: ProductPackagingTier[] = [];
    if (hasPack) {
      tiers.push({
        unitName: 'Pack',
        multiplier: packMultiplier,
        sellingPrice: packPrice,
        costPrice: packCost
      });
    }
    if (hasStrip) {
      tiers.push({
        unitName: 'Strip',
        multiplier: stripMultiplier,
        sellingPrice: stripPrice,
        costPrice: stripCost
      });
    }
    tiers.push({
      unitName: baseUnit,
      multiplier: 1,
      sellingPrice: piecePrice,
      costPrice: pieceCost,
      isBase: true
    });

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        ...formData,
        categoryName: catName,
        baseUnit,
        packagingTiers: tiers,
        bulkDiscountPercent,
        unitCost: pieceCost,
        sellingPrice: piecePrice
      });
      setEditingProduct(null);
    } else {
      addProduct({
        ...formData,
        categoryName: catName,
        baseUnit,
        packagingTiers: tiers,
        bulkDiscountPercent,
        unitCost: pieceCost,
        sellingPrice: piecePrice,
        totalQuantity: 0,
        availableQuantity: 0,
        status: 'OUT_OF_STOCK'
      });
    }

    setShowAddModal(false);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      brandName: p.brandName,
      genericName: p.genericName,
      barcode: p.barcode,
      sku: p.sku,
      dosageForm: p.dosageForm,
      strength: p.strength,
      packSize: p.packSize,
      categoryId: p.categoryId,
      categoryName: p.categoryName,
      manufacturer: p.manufacturer,
      isPrescriptionRequired: p.isPrescriptionRequired,
      requiresColdChain: p.requiresColdChain,
      reorderLevel: p.reorderLevel,
      maxStockLevel: p.maxStockLevel,
    });

    setBaseUnit(p.baseUnit || 'Tablet');
    setPieceCost(p.unitCost);
    setPiecePrice(p.sellingPrice);
    setBulkDiscountPercent(p.bulkDiscountPercent || 10);

    const packTier = p.packagingTiers?.find(t => t.unitName === 'Pack' || t.unitName === 'Box' || t.unitName === 'Bottle' || t.unitName === 'Tube');
    const stripTier = p.packagingTiers?.find(t => t.unitName === 'Strip' || t.unitName === 'Blister');

    if (packTier) {
      setHasPack(true);
      setPackMultiplier(packTier.multiplier);
      setPackPrice(packTier.sellingPrice);
      setPackCost(packTier.costPrice);
    } else {
      setHasPack(false);
    }

    if (stripTier) {
      setHasStrip(true);
      setStripMultiplier(stripTier.multiplier);
      setStripPrice(stripTier.sellingPrice);
      setStripCost(stripTier.costPrice);
    } else {
      setHasStrip(false);
    }

    setShowAddModal(true);
  };

  // Category Actions
  const handleOpenAddCategory = () => {
    setEditingCat(null);
    setCatFormData({ name: '', code: '', description: '' });
    setShowCatModal(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setCatFormData({ name: cat.name, code: cat.code, description: cat.description || '' });
    setShowCatModal(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormData.name || !catFormData.code) {
      alert('Please provide category name and short code.');
      return;
    }
    if (editingCat) {
      updateCategory(editingCat.id, catFormData);
    } else {
      addCategory(catFormData);
    }
    setShowCatModal(false);
  };

  const handleDeleteCategory = (cat: Category) => {
    const success = deleteCategory(cat.id);
    if (!success) {
      alert(`Cannot delete "${cat.name}": There are active medications currently categorized under it. Please reassign those medications first.`);
    }
  };

  // Dosage Form Preset Actions
  const handleOpenEditDosageForm = (formName: string) => {
    const preset = dosagePresets[formName];
    if (!preset) return;
    setEditingDosageKey(formName);
    setIsNewDosageForm(false);
    setDosageFormData({
      formName,
      ...preset
    });
    setShowDosageModal(true);
  };

  const handleOpenAddDosageForm = () => {
    setEditingDosageKey(null);
    setIsNewDosageForm(true);
    setDosageFormData({
      formName: '',
      baseUnit: 'Piece',
      recommendedUnits: ['Piece', 'Pack'],
      hasStrip: false,
      stripMultiplier: 1,
      hasPack: true,
      packMultiplier: 1,
      packDescription: 'Standard Box',
      clinicalNote: 'Dispensed per single unit.'
    });
    setShowDosageModal(true);
  };

  const handleSaveDosageForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dosageFormData.formName) {
      alert('Please enter dosage formulation name.');
      return;
    }
    const cleanPreset: DosagePreset = {
      baseUnit: dosageFormData.baseUnit,
      recommendedUnits: dosageFormData.recommendedUnits,
      hasStrip: dosageFormData.hasStrip,
      stripMultiplier: dosageFormData.stripMultiplier,
      hasPack: dosageFormData.hasPack,
      packMultiplier: dosageFormData.packMultiplier,
      packDescription: dosageFormData.packDescription,
      clinicalNote: dosageFormData.clinicalNote
    };

    if (isNewDosageForm) {
      addDosagePreset(dosageFormData.formName, cleanPreset);
    } else if (editingDosageKey) {
      updateDosagePreset(editingDosageKey, cleanPreset);
    }
    setShowDosageModal(false);
  };

  const handleDeleteDosageForm = (formName: string) => {
    const success = deleteDosagePreset(formName);
    if (!success) {
      alert(`Cannot delete formulation "${formName}": Active medications in catalogue are registered with this dosage form.`);
    }
  };

  // Unit Type Actions
  const handleSaveUnitType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitFormData.name) {
      alert('Please enter unit name.');
      return;
    }
    addUnitType(unitFormData);
    setShowUnitModal(false);
    setUnitFormData({ name: '', plural: '', category: 'DISPENSING_BASE', description: '' });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header & Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Pill className="w-5 h-5 text-brand-600" />
            <span>Pharmaceutical Catalogue & Multi-Unit Master</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Intelligent pack/box pricing, therapeutic classifications, clinical dosage rules, and packaging unit prediction.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {currentSubTab === 'products' && canCreate && (
            <button
              id="add-medicine-btn"
              onClick={openAddModal}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medication</span>
            </button>
          )}

          {currentSubTab === 'categories' && canCreate && (
            <button
              id="add-category-btn"
              onClick={handleOpenAddCategory}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          )}

          {currentSubTab === 'dosage-forms' && canCreate && (
            <button
              id="add-dosage-btn"
              onClick={handleOpenAddDosageForm}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Formulation</span>
            </button>
          )}

          {(currentSubTab === 'predictor-rules' || currentSubTab === 'units') && canCreate && (
            <button
              id="add-unit-type-btn"
              onClick={() => setShowUnitModal(true)}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Unit Type</span>
            </button>
          )}
        </div>
      </div>

      {/* Synchronized Sub-Navigation Tabs */}
      <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto text-xs font-semibold">
        <button
          id="subtab-all-products"
          onClick={() => handleTabSwitch('products')}
          className={`px-3.5 py-2 rounded-lg flex items-center space-x-2 transition whitespace-nowrap ${
            currentSubTab === 'products'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <span>📋</span>
          <span>All Medications</span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded-full font-mono">
            {products.length}
          </span>
        </button>

        <button
          id="subtab-categories"
          onClick={() => handleTabSwitch('categories')}
          className={`px-3.5 py-2 rounded-lg flex items-center space-x-2 transition whitespace-nowrap ${
            currentSubTab === 'categories'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <span>🏷️</span>
          <span>Therapeutic Categories</span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded-full font-mono">
            {categories.length}
          </span>
        </button>

        <button
          id="subtab-dosage-forms"
          onClick={() => handleTabSwitch('dosage-forms')}
          className={`px-3.5 py-2 rounded-lg flex items-center space-x-2 transition whitespace-nowrap ${
            currentSubTab === 'dosage-forms'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <span>🧪</span>
          <span>Dosage Forms & Clinical Rules</span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded-full font-mono">
            {Object.keys(dosagePresets).length}
          </span>
        </button>

        <button
          id="subtab-predictor-rules"
          onClick={() => handleTabSwitch('predictor-rules')}
          className={`px-3.5 py-2 rounded-lg flex items-center space-x-2 transition whitespace-nowrap ${
            currentSubTab === 'predictor-rules'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <span>⚖️</span>
          <span>Predictor Rules & Models</span>
        </button>

        <button
          id="subtab-units"
          onClick={() => handleTabSwitch('units')}
          className={`px-3.5 py-2 rounded-lg flex items-center space-x-2 transition whitespace-nowrap ${
            currentSubTab === 'units'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <span>📦</span>
          <span>Unit Types & Packaging</span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded-full font-mono">
            {unitTypes.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: ALL MEDICATIONS & FORMULATIONS TABLE */}
      {/* ========================================================================= */}
      {currentSubTab === 'products' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by brand name, generic substance, SKU, barcode..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCat}
                onChange={e => setSelectedCat(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-medium"
              >
                <option value="ALL">All Therapeutic Classes</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-medium"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>

              <select
                value={selectedPrescriptionFilter}
                onChange={e => setSelectedPrescriptionFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-medium"
              >
                <option value="ALL">All Legal Classes</option>
                <option value="POM">Prescription Only (POM)</option>
                <option value="OTC">Over The Counter (OTC)</option>
              </select>
            </div>
          </div>

          {/* Table with Multi-Unit Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 w-16 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={el => { if (el) el.indeterminate = isSomeSelected; }}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500 cursor-pointer"
                          title="Select all filtered medications"
                        />
                        <span className="font-mono text-slate-500 font-bold">#</span>
                      </div>
                    </th>
                    <th className="p-3">Medicine & Generic</th>
                    <th className="p-3">Therapeutic Class</th>
                    <th className="p-3">Packaging Hierarchy & Prices</th>
                    <th className="p-3">Base Unit Cost</th>
                    <th className="p-3">Base Unit Price</th>
                    <th className="p-3">Gross Margin</th>
                    <th className="p-3">Stock Available</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map((prod, index) => {
                    const isSelected = selectedProductIds.includes(prod.id);
                    const margin = prod.sellingPrice > 0 ? ((prod.sellingPrice - prod.unitCost) / prod.sellingPrice) * 100 : 0;
                    return (
                      <tr 
                        key={prod.id} 
                        className={`transition-colors ${
                          isSelected 
                            ? 'bg-brand-50/70 dark:bg-brand-950/40 border-l-2 border-l-brand-600' 
                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="p-3 w-16 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectProduct(prod.id)}
                              className="rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500 cursor-pointer"
                            />
                            <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{prod.brandName}</p>
                          <p className="text-[11px] text-slate-500">{prod.genericName} • {prod.strength}</p>
                          <div className="flex items-center space-x-2 pt-0.5">
                            <span className="font-mono text-[9px] text-slate-400">{prod.sku}</span>
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.2 rounded font-medium">
                              {prod.dosageForm}
                            </span>
                            {prod.isPrescriptionRequired && (
                              <span className="text-[9px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-1.5 py-0.2 rounded font-bold">
                                POM
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{prod.categoryName}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1.5 max-w-sm">
                            {prod.packagingTiers && prod.packagingTiers.length > 0 ? (
                              prod.packagingTiers.map((tier, i) => (
                                <span 
                                  key={i} 
                                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold"
                                >
                                  <strong className="text-slate-800 dark:text-slate-200">{tier.unitName}</strong> ({tier.multiplier}): <span className="text-brand-600 dark:text-brand-400 font-bold">{formatCurrency(tier.sellingPrice)}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[11px]">Standard Single Pack</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-mono font-medium">{formatCurrency(prod.unitCost)}</td>
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(prod.sellingPrice)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            margin < 0 ? 'bg-rose-100 text-rose-800' :
                            margin < 15 ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                          {prod.availableQuantity} {prod.baseUnit || 'units'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            prod.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            prod.status === 'LOW_STOCK' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {prod.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => openEdit(prod)}
                            className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="Edit medicine and pricing tiers"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Floating Bulk Action Bar */}
          <FloatingBulkActionBar
            selectedCount={selectedProductIds.length}
            totalCount={filteredProducts.length}
            onClearSelection={() => setSelectedProductIds([])}
            actions={[
              {
                label: 'Export CSV',
                icon: <Download className="w-3.5 h-3.5" />,
                onClick: () => {
                  alert(`Exporting ${selectedProductIds.length} selected medicines to CSV.`);
                }
              },
              {
                label: 'Print Labels',
                icon: <Printer className="w-3.5 h-3.5" />,
                onClick: () => {
                  window.print();
                }
              }
            ]}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: THERAPEUTIC CATEGORIES HUB */}
      {/* ========================================================================= */}
      {currentSubTab === 'categories' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Explanatory Caption Card */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-sm flex items-start space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-blue-950 dark:text-blue-200">
                Therapeutic Classification & Pharmacological Registry
              </h3>
              <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-0.5 leading-relaxed">
                Therapeutic categories classify medications based on their target organ system and pharmacological mechanism (e.g. Antibiotics, Analgesics, Antihypertensives). 
                Proper categorization streamlines clinical dispensing search at Point of Sale, ensures regulatory compliance, and powers segregated financial reporting.
              </p>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => {
              const count = products.filter(p => p.categoryId === cat.id).length;
              return (
                <div 
                  key={cat.id} 
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-brand-300 transition group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                        {cat.code}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {count} {count === 1 ? 'Medicine' : 'Medicines'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 transition">
                      {cat.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {cat.description || 'Standard pharmaceutical classification.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenEditCategory(cat)}
                      className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded font-medium flex items-center space-x-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded font-medium flex items-center space-x-1"
                      title={count > 0 ? "Cannot delete category with active products" : "Delete category"}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: DOSAGE FORMS & CLINICAL FORMULATION RULES */}
      {/* ========================================================================= */}
      {currentSubTab === 'dosage-forms' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Explanatory Caption Card */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800/80 dark:to-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-sm flex items-start space-x-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                Clinical Dosage Forms & Dispensing Rule Presets
              </h3>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5 leading-relaxed">
                Dosage forms define the physical drug formulation (solid oral, liquid oral, parenteral injectable, aerosol, topical). 
                Configuring clinical rules here automatically configures default base units, strip packaging availability, and default pack ratios 
                so inventory managers never have to make redundant selections when registering drugs.
              </p>
            </div>
          </div>

          {/* Dosage Form Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(dosagePresets).map(([formName, preset]) => {
              const productCount = products.filter(p => p.dosageForm === formName).length;
              return (
                <div 
                  key={formName}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <Pill className="w-4 h-4 text-emerald-600" />
                        <span>{formName}</span>
                      </span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold text-slate-600 dark:text-slate-400">
                        {productCount} {productCount === 1 ? 'Drug' : 'Drugs'}
                      </span>
                    </div>

                    {/* Presets Specifications */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Dispensing Base Unit:</span>
                        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{preset.baseUnit}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Strip Packaging:</span>
                        <span className="font-semibold">
                          {preset.hasStrip ? `Enabled (${preset.stripMultiplier} ${preset.baseUnit}s/strip)` : 'Disabled (Liquid / Inhaler)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Standard Pack:</span>
                        <span className="font-semibold">
                          {preset.hasPack ? `${preset.packMultiplier} ${preset.baseUnit}s/box` : 'Single Container'}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      "{preset.clinicalNote}"
                    </p>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenEditDosageForm(formName)}
                      className="px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded font-medium flex items-center space-x-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Rule</span>
                    </button>
                    {preset.isCustom && (
                      <button
                        onClick={() => handleDeleteDosageForm(formName)}
                        className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded font-medium flex items-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: PREDICTOR UNIT RULES & PACKAGING HIERARCHY (NO PRICES) */}
      {/* ========================================================================= */}
      {currentSubTab === 'predictor-rules' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Explanatory Caption Card */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800/80 dark:to-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/60 shadow-sm flex items-start space-x-3">
            <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-md shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-purple-950 dark:text-purple-200">
                Packaging Hierarchy Multipliers & Predictive Ratio Models (No Prices)
              </h3>
              <p className="text-xs text-purple-800/80 dark:text-purple-300/80 mt-0.5 leading-relaxed">
                Configure packaging hierarchy ratios and bidirectional volume multipliers. 
                When registering medications, the Intelligent Predictor uses these unit relationships (e.g. 1 Box = 10 Strips = 100 Tablets; 1 Canister = 200 Actuations) 
                to automatically decompose bulk prices into loose unit prices and calculate profit margins — without you having to enter prices for each rule. 
                Existing rules are saved permanently so any cashier or inventory manager can leverage them across any medicine.
              </p>
            </div>
          </div>

          {/* Global Bulk Incentive / Volume Discount Setting */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-brand-600" />
                <span>Global Pack Volume Discount Incentive (Default Prediction Factor)</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Discount applied automatically when predicting full pack prices from individual loose units to incentivize bulk customer purchases.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {[5, 8, 10, 15].map(pct => (
                <button
                  key={pct}
                  onClick={() => setGlobalBulkDiscountPercent(pct)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    globalBulkDiscountPercent === pct
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {pct}%
                </button>
              ))}
              <div className="flex items-center space-x-1 pl-2 border-l border-slate-200 dark:border-slate-700">
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={globalBulkDiscountPercent}
                  onChange={e => setGlobalBulkDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="w-14 p-1.5 text-center font-bold border rounded bg-slate-50 dark:bg-slate-800 text-xs"
                />
                <span className="text-xs text-slate-500">%</span>
              </div>
            </div>
          </div>

          {/* Reusable Packaging Models Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-brand-600" />
                <h5 className="font-bold text-xs">Solid Oral Strip Model</h5>
              </div>
              <p className="text-[11px] text-slate-500">
                1 Pack = 10 Strips = 100 Tablets / Capsules. Loose pieces carry a 15% dispensing overhead.
              </p>
              <div className="text-[10px] font-mono bg-slate-50 dark:bg-slate-800 p-2 rounded border">
                Strip = 10x Base • Pack = 100x Base
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-brand-600" />
                <h5 className="font-bold text-xs">Liquid Volume Model</h5>
              </div>
              <p className="text-[11px] text-slate-500">
                Dispensed by volumetric mL (e.g. 5mL pediatric dose) or entire amber Bottle (100mL standard).
              </p>
              <div className="text-[10px] font-mono bg-slate-50 dark:bg-slate-800 p-2 rounded border">
                Bottle = 100x Base mL (Strip Disabled)
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center space-x-2">
                <Syringe className="w-4 h-4 text-brand-600" />
                <h5 className="font-bold text-xs">Parenteral Injectable Model</h5>
              </div>
              <p className="text-[11px] text-slate-500">
                Dispensed per single Ampoule or sterile Rubber-stoppered Vial. Wholesale box contains 10 units.
              </p>
              <div className="text-[10px] font-mono bg-slate-50 dark:bg-slate-800 p-2 rounded border">
                Box = 10x Base Ampoule / Vial
              </div>
            </div>
          </div>

          {/* Unit Directory Registry */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  Active Clinical Packaging & Dispensing Units Directory
                </h4>
                <p className="text-[11px] text-slate-500">
                  Registered unit types available in prescription cart items, inventory ledgers, and packaging hierarchies.
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-1 text-xs">
                {(['ALL', 'DISPENSING_BASE', 'SUB_CONTAINER', 'CONTAINER'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setUnitCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      unitCategoryFilter === cat
                        ? 'bg-brand-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'All' : cat === 'DISPENSING_BASE' ? 'Base Units' : cat === 'SUB_CONTAINER' ? 'Sub-Containers' : 'Outer Packs'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
              {unitTypes
                .filter(u => unitCategoryFilter === 'ALL' || u.category === unitCategoryFilter)
                .map(unit => (
                  <div 
                    key={unit.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{unit.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                          unit.category === 'DISPENSING_BASE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          unit.category === 'SUB_CONTAINER' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {unit.category === 'DISPENSING_BASE' ? 'Base Unit' : unit.category === 'SUB_CONTAINER' ? 'Sub-Pack' : 'Outer Pack'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {unit.description || 'Clinical packaging unit.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-400">
                      <span>{unit.isDefault ? 'Core System Unit' : 'Custom Added'}</span>
                      {!unit.isDefault && (
                        <button
                          onClick={() => deleteUnitType(unit.id)}
                          className="text-rose-600 hover:text-rose-800 font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 5: UNIT TYPES & PACKAGING REGISTRY */}
      {/* ========================================================================= */}
      {currentSubTab === 'units' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Dispensary Unit Types & Packaging Registry</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  {unitTypes.length} Configured Units
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Define atomic base units (Tablets, Pieces, mL) and commercial packaging tiers (Packs, Boxes, Strips) used in bidirectional price prediction and POS deduction.
              </p>
            </div>

            {canCreate && (
              <button
                onClick={() => setShowUnitModal(true)}
                className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Unit Type</span>
              </button>
            )}
          </div>

          {/* Educational Guidance: What They Are, How They Work & Examples (Collapsible / Hoverable) */}
          <WorkflowGuideNotice
            title="Clinical Guide: Packaging Tiers, Atomic Base Units & Hierarchy Multipliers"
            subtitle="Understand how bulk containers convert into clinical dispensing doses with zero inventory drift"
            badgeText="Dispensing Precision"
            variant="purple"
            icon={BookOpen}
          >
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Pharmaceuticals are distributed in bulk (boxes/cartons) but prescribed in clinical dosing units (tablets, mL). 
                GreenLifeAI standardizes these relationships so cashiers can dispense at any tier while maintaining 100% stock precision:
              </p>

              {/* 3 Tier Explanation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-white/90 dark:bg-slate-900/80 rounded-xl border border-emerald-100 dark:border-emerald-900/50 space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-xs text-emerald-900 dark:text-emerald-300">Tier 1: Atomic Base Unit</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    The smallest indivisible clinical dose prescribed and deducted in POS.
                  </p>
                  <div className="text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 p-1.5 rounded font-mono">
                    Examples: <strong>Tablet</strong>, <strong>Capsule</strong>, <strong>mL</strong>, <strong>Ampoule</strong>, <strong>Suppository</strong>
                  </div>
                </div>

                <div className="p-3 bg-white/90 dark:bg-slate-900/80 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span className="font-bold text-xs text-indigo-900 dark:text-indigo-300">Tier 2: Intermediate Sub-Container</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Blisters or cards holding a fixed number of base units to dispense without cutting foil.
                  </p>
                  <div className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 p-1.5 rounded font-mono">
                    Examples: <strong>Strip</strong> (10 tabs), <strong>Card</strong> (14 caps), <strong>Sachet</strong> (1 sachet)
                  </div>
                </div>

                <div className="p-3 bg-white/90 dark:bg-slate-900/80 rounded-xl border border-purple-100 dark:border-purple-900/50 space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span className="font-bold text-xs text-purple-900 dark:text-purple-300">Tier 3: Outer Bulk Container</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    The commercial manufacturer package received from wholesalers.
                  </p>
                  <div className="text-[10px] bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 p-1.5 rounded font-mono">
                    Examples: <strong>Pack/Box</strong> (100 tabs), <strong>Bottle</strong> (100mL), <strong>Carton</strong> (24 bottles)
                  </div>
                </div>
              </div>

              {/* Concrete Real-World Examples */}
              <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-[11px] space-y-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Real-World Pharmacy Examples of How to Use These:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/80">
                    <strong className="text-slate-900 dark:text-white">Example 1 (Oral Solid): Panadol Extra</strong>
                    <p className="mt-0.5">
                      Base Unit: <code className="font-mono text-emerald-600 font-bold">Tablet</code> | Strip: <code className="font-mono text-indigo-600 font-bold">10 Tablets</code> | Pack: <code className="font-mono text-purple-600 font-bold">100 Tablets (10 Strips)</code>.
                      Selling 1 Strip at POS automatically decrements 10 Tablets from the inventory balance!
                    </p>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/80">
                    <strong className="text-slate-900 dark:text-white">Example 2 (Oral Liquid): Amoxil Suspension</strong>
                    <p className="mt-0.5">
                      Base Unit: <code className="font-mono text-emerald-600 font-bold">mL</code> | Pack: <code className="font-mono text-purple-600 font-bold">Bottle of 100mL</code>.
                      Dispenser can bill either exact prescribed volume (e.g., 50mL) or complete sealed bottles with automated bulk incentive.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </WorkflowGuideNotice>

          {/* Filters & Search & View Toggle */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={unitSearch}
                onChange={e => setUnitSearch(e.target.value)}
                placeholder="Search unit types or descriptions..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center space-x-1 overflow-x-auto pb-1">
                {(['ALL', 'CONTAINER', 'SUB_CONTAINER', 'DISPENSING_BASE'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedUnitCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                      selectedUnitCategory === cat
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Units' : cat === 'CONTAINER' ? 'Containers' : cat === 'SUB_CONTAINER' ? 'Sub-Containers' : 'Atomic Base'}
                  </button>
                ))}
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg shrink-0">
                <button
                  onClick={() => setUnitViewMode('table')}
                  className={`p-1.5 rounded ${unitViewMode === 'table' ? 'bg-white dark:bg-slate-900 shadow text-brand-600' : 'text-slate-400'}`}
                  title="Table View"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setUnitViewMode('grid')}
                  className={`p-1.5 rounded ${unitViewMode === 'grid' ? 'bg-white dark:bg-slate-900 shadow text-brand-600' : 'text-slate-400'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Unit Display */}
          {unitViewMode === 'table' ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 select-none">
                    <tr>
                      <th className="p-3 w-16 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <input
                            type="checkbox"
                            checked={isAllUnitsSelected}
                            onChange={toggleSelectAllUnits}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                            title="Select All"
                          />
                          <span className="font-mono text-[11px] text-slate-400">#</span>
                        </div>
                      </th>
                      <th className="p-3">Unit Name</th>
                      <th className="p-3">Plural Form</th>
                      <th className="p-3">Packaging Category</th>
                      <th className="p-3">Standard Classification</th>
                      <th className="p-3">Clinical Description</th>
                      <th className="p-3">System Identifier</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUnits.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No unit types found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUnits.map((unit, index) => {
                        const isSelected = selectedUnitIds.includes(unit.id);
                        return (
                          <tr 
                            key={unit.id}
                            className={`transition-colors ${
                              isSelected 
                                ? 'bg-brand-50/70 dark:bg-brand-950/40 border-l-2 border-l-brand-600' 
                                : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectUnit(unit.id)}
                                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                                />
                                <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 w-5 text-right">
                                  {index + 1}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{unit.name}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">{unit.plural || '—'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                unit.category === 'CONTAINER' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                                unit.category === 'SUB_CONTAINER' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                                'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}>
                                {unit.category === 'CONTAINER' ? 'Outer Package' : unit.category === 'SUB_CONTAINER' ? 'Sub-Container' : 'Atomic Base'}
                              </span>
                            </td>
                            <td className="p-3">
                              {unit.isCustom ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  Custom
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  Recommended
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-500 max-w-xs truncate">{unit.description}</td>
                            <td className="p-3 font-mono text-[11px] text-brand-600">{unit.id}</td>
                            <td className="p-3 text-right">
                              {!unit.isDefault && (
                                <button
                                  onClick={() => deleteUnitType(unit.id)}
                                  className="text-rose-600 hover:text-rose-800 font-semibold p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                                  title="Delete unit type"
                                >
                                  <Trash2 className="w-3.5 h-3.5 inline" />
                                </button>
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
                selectedCount={selectedUnitIds.length}
                totalCount={filteredUnits.length}
                onClearSelection={() => setSelectedUnitIds([])}
                actions={[
                  {
                    label: 'Export Units CSV',
                    icon: FileSpreadsheet,
                    onClick: handleExportUnitsCSV,
                    variant: 'secondary'
                  }
                ]}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredUnits.map(unit => (
                <div
                  key={unit.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-brand-300 dark:hover:border-brand-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <span>{unit.name}</span>
                        {unit.plural && <span className="text-xs text-slate-400 font-normal">({unit.plural})</span>}
                      </h4>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        unit.category === 'CONTAINER' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                        unit.category === 'SUB_CONTAINER' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {unit.category === 'CONTAINER' ? 'Outer Package' : unit.category === 'SUB_CONTAINER' ? 'Sub-Container' : 'Atomic Base'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {unit.isCustom ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Custom
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Recommended
                        </span>
                      )}
                      {!unit.isDefault && (
                        <button
                          onClick={() => deleteUnitType(unit.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                          title="Delete unit type"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {unit.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Unit Identifier: <code className="font-mono text-brand-600">{unit.id}</code></span>
                    {unit.category === 'DISPENSING_BASE' && (
                      <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Atomic Base Unit</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT MEDICATION MODAL */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingProduct ? 'Edit Pharmaceutical & Pricing Model' : 'Register New Pharmaceutical Formulation'}
                </h3>
                <p className="text-xs text-slate-500">Intelligent pack/box pricing with volume incentive prediction</p>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)}><X className="w-4 h-4" /></button>
            </div>

            {/* Guidance Banner */}
            <div className="p-3 bg-brand-50/60 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/50 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-brand-900 dark:text-brand-300">
                <Info className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Formulation & Multiplier Architecture</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Every medication is configured with an <strong>Atomic Base Unit</strong> (e.g. Tablet or mL) and <strong>Commercial Packaging Multipliers</strong> (Strips and Packs). This enables cashiers to sell single tablets, full strips, or wholesale boxes while GreenLifeAI automatically calculates volume discounts and maintains exact inventory balance.
              </p>
            </div>

            {/* SECTION 1: GENERAL IDENTIFICATION & STRENGTH */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                1. Clinical Drug Identification & Strength
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Brand Name <span className="text-rose-500">*</span>
                    </label>
                    <FieldGuideNotice label="Read about this & examples" variant="brand">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Commercial trade name</p>
                      <p>💡 <strong>Examples:</strong> <code className="font-mono text-brand-600 bg-brand-50 dark:bg-brand-950 px-1 rounded">Amoxil Forte</code> or <code className="font-mono text-brand-600 bg-brand-50 dark:bg-brand-950 px-1 rounded">Panadol Extra</code> (printed on customer retail box).</p>
                    </FieldGuideNotice>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.brandName}
                    onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="e.g. Amoxil Forte, Panadol Extra, Ventolin Evohaler..."
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Active Generic Molecule (INN) <span className="text-rose-500">*</span>
                    </label>
                    <FieldGuideNotice label="Read about this & examples" variant="brand">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Clinical chemical entity</p>
                      <p>💡 <strong>Examples:</strong> <code className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 rounded">Amoxicillin Trihydrate</code> or <code className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 rounded">Paracetamol + Caffeine</code> (used for bio-equivalent substitution).</p>
                    </FieldGuideNotice>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.genericName}
                    onChange={e => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Amoxicillin Trihydrate, Paracetamol + Caffeine..."
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-medium focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">Therapeutic Category</label>
                    <FieldGuideNotice label="Read about this & examples" variant="brand">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Pharmacological class</p>
                      <p>💡 <strong>Examples:</strong> <em>Antibiotics & Anti-Infectives</em>, <em>Analgesics & Antipyretics</em>, or <em>Antihypertensives</em>.</p>
                    </FieldGuideNotice>
                  </div>
                  <select
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-brand-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">Dosage Form</label>
                    <FieldGuideNotice label="Read about this & examples" variant="brand">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Auto-Configures Packaging</p>
                      <p>💡 <strong>Examples:</strong> Selecting <em>Tablet</em> auto-sets base unit to <code>Tablet</code> with 10-tab strip; selecting <em>Syrup</em> sets <code>mL</code> with 100mL bottle.</p>
                    </FieldGuideNotice>
                  </div>
                  <select
                    value={formData.dosageForm}
                    onChange={e => handleDosageFormChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
                  >
                    {Object.keys(dosagePresets).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">Strength / Potency</label>
                    <FieldGuideNotice label="Read about this & examples" variant="brand">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Concentration per unit</p>
                      <p>💡 <strong>Examples:</strong> <code className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 rounded">500mg</code> (for tablet), <code className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 rounded">250mg/5mL</code> (for syrup), or <code className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 rounded">100IU/mL</code>.</p>
                    </FieldGuideNotice>
                  </div>
                  <input
                    type="text"
                    value={formData.strength}
                    onChange={e => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="e.g. 500mg, 250mg/5mL, 100mcg/puff..."
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-mono focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">Commercial Pack Description</label>
                    <FieldGuideNotice label="Read about this & examples" variant="brand">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Outer packaging text</p>
                      <p>💡 <strong>Examples:</strong> <em>"Box of 10x10 Blister Pack"</em> or <em>"100mL Amber Glass Bottle with 5mL Dosing Spoon"</em>.</p>
                    </FieldGuideNotice>
                  </div>
                  <input
                    type="text"
                    value={formData.packSize}
                    onChange={e => setFormData({ ...formData, packSize: e.target.value })}
                    placeholder="e.g. Box of 10 Strips × 10 Tablets (100 Tabs)..."
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: SMART AUTO-SELECT & PACKAGING HIERARCHY */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-brand-600" />
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                    2. Packaging Hierarchy & Multipliers
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">Atomic base unit used for ledger accounting</span>
              </div>

              {/* Intelligent Suggestion Banner with Manual Override Freedom */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      Smart Auto-Select: Base unit set to <strong>{baseUnit}</strong> for <strong>{formData.dosageForm}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium border border-emerald-200 dark:border-emerald-800">
                    100% Manual Override Enabled
                  </span>
                </div>
                
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {dosagePresets[formData.dosageForm]?.clinicalNote || 'Select an atomic dispensing unit or customize below.'}
                </p>

                {/* Quick Recommendation Switching Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/50">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Quick switch:
                  </span>
                  {dosagePresets[formData.dosageForm]?.recommendedUnits.map(unitOpt => (
                    <button
                      key={unitOpt}
                      type="button"
                      onClick={() => {
                        setBaseUnit(unitOpt);
                        setCustomUnitMode(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
                        baseUnit === unitOpt && !customUnitMode
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100/50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {baseUnit === unitOpt && !customUnitMode && <Check className="w-3 h-3 text-white" />}
                      <span>{unitOpt}</span>
                      {unitOpt === dosagePresets[formData.dosageForm]?.baseUnit && (
                        <span className="text-[9px] opacity-80 font-normal">(Auto)</span>
                      )}
                    </button>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => setCustomUnitMode(!customUnitMode)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition flex items-center space-x-1 ${
                      customUnitMode
                        ? 'bg-brand-600 text-white'
                        : 'text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-dashed border-brand-300 dark:border-brand-700'
                    }`}
                  >
                    <Type className="w-3 h-3" />
                    <span>{customUnitMode ? 'Using Custom Unit' : 'Custom Unit...'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold block">Base Dispensing Unit</label>
                  </div>
                  {customUnitMode ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={baseUnit}
                        onChange={e => setBaseUnit(e.target.value)}
                        placeholder="e.g. Nebule, Vial..."
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 font-bold text-brand-600"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setCustomUnitMode(false)}
                        className="p-2 text-slate-400 hover:text-slate-600"
                        title="Revert to dropdown"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={baseUnit}
                      onChange={e => setBaseUnit(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 font-bold"
                    >
                      <optgroup label="Clinical Dispensing Units">
                        {unitTypes.filter(u => u.category === 'DISPENSING_BASE').map(u => (
                          <option key={u.id} value={u.name}>{u.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Containers & Sub-Containers">
                        {unitTypes.filter(u => u.category !== 'DISPENSING_BASE').map(u => (
                          <option key={u.id} value={u.name}>{u.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  )}
                  <p className="text-[10px] text-slate-500 mt-1">
                    💡 Single clinical unit dispensed at POS (e.g. <code>Tablet</code>, <code>mL</code>).
                  </p>
                </div>

                <div>
                  <label className="font-semibold block mb-1 flex items-center space-x-1">
                    <input 
                      type="checkbox" 
                      checked={hasStrip} 
                      onChange={e => setHasStrip(e.target.checked)} 
                      className="rounded text-brand-600"
                    />
                    <span>Strip Multiplier</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="1"
                      disabled={!hasStrip}
                      value={stripMultiplier}
                      onChange={e => {
                        const m = parseInt(e.target.value) || 1;
                        setStripMultiplier(m);
                        predictFromPiecePrice(piecePrice, pieceCost);
                      }}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 disabled:opacity-50 font-bold"
                    />
                    <span className="text-slate-500 text-[10px]">{baseUnit}s</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    💡 Base units in 1 blister strip (e.g. <code>10 Tablets</code> per strip).
                  </p>
                </div>

                <div>
                  <label className="font-semibold block mb-1 flex items-center space-x-1">
                    <input 
                      type="checkbox" 
                      checked={hasPack} 
                      onChange={e => setHasPack(e.target.checked)} 
                      className="rounded text-brand-600"
                    />
                    <span>Pack/Box Multiplier</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="1"
                      disabled={!hasPack}
                      value={packMultiplier}
                      onChange={e => {
                        const m = parseInt(e.target.value) || 1;
                        setPackMultiplier(m);
                        predictFromPiecePrice(piecePrice, pieceCost);
                      }}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 disabled:opacity-50 font-bold"
                    />
                    <span className="text-slate-500 text-[10px]">{baseUnit}s</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    💡 Total base units in 1 full outer box (e.g. <code>100 Tablets</code> per box).
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 3: INTELLIGENT BIDIRECTIONAL PRICE PREDICTOR */}
            <div className="p-4 bg-brand-50/50 dark:bg-brand-950/30 rounded-xl border border-brand-200 dark:border-brand-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span className="font-bold text-xs text-brand-900 dark:text-brand-200">
                    3. Intelligent Bidirectional Price Predictor ({currentCurrency.code})
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-[11px]">
                  <span className="text-slate-500">Pack Volume Incentive:</span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={bulkDiscountPercent}
                    onChange={e => {
                      const disc = parseFloat(e.target.value) || 0;
                      setBulkDiscountPercent(disc);
                      predictFromPiecePrice(piecePrice, pieceCost);
                    }}
                    className="w-12 p-1 text-center bg-white dark:bg-slate-800 border rounded text-xs font-bold"
                  />
                  <span>% off</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                💡 Enter your <strong>Single Unit Cost & Price</strong> below. The system automatically calculates cost and selling price for Strips and full Boxes, factoring in your volume incentive discount!
              </p>

              {/* Pricing Tiers Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* 1. PIECE TIER */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm space-y-2">
                  <div className="flex justify-between items-center font-bold">
                    <span>Single {baseUnit}</span>
                    <span className="text-[10px] bg-brand-100 text-brand-800 px-1 rounded">Base</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Unit Cost ({currentCurrency.symbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pieceCost}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setPieceCost(val);
                        predictFromPiecePrice(piecePrice, val);
                      }}
                      className="w-full p-1.5 border rounded font-mono font-bold"
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">e.g. GH₵1.50 per tab</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Selling Price ({currentCurrency.symbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      value={piecePrice}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setPiecePrice(val);
                        predictFromPiecePrice(val, pieceCost);
                      }}
                      className="w-full p-1.5 border rounded font-mono font-extrabold text-brand-600"
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">e.g. GH₵2.50 per tab</span>
                  </div>
                </div>

                {/* 2. STRIP TIER */}
                {hasStrip && (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm space-y-2">
                    <div className="flex justify-between items-center font-bold">
                      <span>Strip ({stripMultiplier}x)</span>
                      <span className="text-[10px] text-slate-500">Auto-Predict</span>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Strip Cost ({currentCurrency.symbol})</label>
                      <input
                        type="number"
                        step="0.01"
                        value={stripCost}
                        onChange={e => setStripCost(parseFloat(e.target.value) || 0)}
                        className="w-full p-1.5 border rounded font-mono font-bold"
                      />
                      <span className="text-[9px] text-slate-400 block mt-0.5">e.g. {stripMultiplier} × GH₵1.50 = GH₵15.00</span>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Strip Selling Price ({currentCurrency.symbol})</label>
                      <input
                        type="number"
                        step="0.01"
                        value={stripPrice}
                        onChange={e => setStripPrice(parseFloat(e.target.value) || 0)}
                        className="w-full p-1.5 border rounded font-mono font-extrabold text-brand-600"
                      />
                      <span className="text-[9px] text-slate-400 block mt-0.5">e.g. GH₵24.00 per strip</span>
                    </div>
                  </div>
                )}

                {/* 3. PACK TIER */}
                {hasPack && (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm space-y-2">
                    <div className="flex justify-between items-center font-bold">
                      <span>Pack/Box ({packMultiplier}x)</span>
                      <button
                        type="button"
                        onClick={() => decomposeFromPackPrice(packPrice, packCost)}
                        className="text-[10px] text-brand-600 hover:underline flex items-center space-x-0.5"
                        title="Decompose box price into single unit prices"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Decompose</span>
                      </button>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Pack Cost ({currentCurrency.symbol})</label>
                      <input
                        type="number"
                        step="0.01"
                        value={packCost}
                        onChange={e => setPackCost(parseFloat(e.target.value) || 0)}
                        className="w-full p-1.5 border rounded font-mono font-bold"
                      />
                      <span className="text-[9px] text-slate-400 block mt-0.5">e.g. 100 × GH₵1.50 = GH₵150.00</span>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Pack Selling Price ({currentCurrency.symbol})</label>
                      <input
                        type="number"
                        step="0.01"
                        value={packPrice}
                        onChange={e => setPackPrice(parseFloat(e.target.value) || 0)}
                        className="w-full p-1.5 border rounded font-mono font-extrabold text-brand-600"
                      />
                      <span className="text-[9px] text-slate-400 block mt-0.5">e.g. GH₵225.00 with {bulkDiscountPercent}% disc</span>
                    </div>
                  </div>
                )}
              </div>

              {/* LIVE MARGIN & RISK ASSESSMENT CARD */}
              <div className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${riskInfo.badge}`}>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="font-bold block">{riskInfo.label}</span>
                    <span className="text-[10px] opacity-90">{riskInfo.description}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <div>
                    <span className="text-[10px] opacity-75 block">Profit per {baseUnit}</span>
                    <strong className="font-mono">{formatCurrency(profitAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] opacity-75 block">Gross Margin</span>
                    <strong className="font-mono">{marginPercent.toFixed(1)}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] opacity-75 block">Markup</span>
                    <strong className="font-mono">{markupPercent.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: INVENTORY THRESHOLDS & REGULATORY CONTROLS */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                4. Inventory Thresholds & Regulatory Controls
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Minimum Reorder Level ({baseUnit}s)
                    </label>
                    <span className="text-[10px] text-slate-400">Auto PO Alert Trigger</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={formData.reorderLevel}
                    onChange={e => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                  />
                  <FieldGuideNotice label="Read about reorder levels & examples" title="Minimum Reorder Alert">
                    <p>
                      Set to a safety threshold (e.g., <code className="font-mono font-bold text-slate-700 dark:text-slate-300">50</code>) to trigger automated procurement warnings when only 50 {baseUnit}s remain on dispensary shelves before stockouts occur.
                    </p>
                  </FieldGuideNotice>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Maximum Storage Capacity ({baseUnit}s)
                    </label>
                    <span className="text-[10px] text-slate-400">Storage Ceiling Limit</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxStockLevel}
                    onChange={e => setFormData({ ...formData, maxStockLevel: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                  />
                  <FieldGuideNotice label="Read about storage capacity & examples" title="Storage Ceiling Limit">
                    <p>
                      Set to your physical dispensary ceiling (e.g., <code className="font-mono font-bold text-slate-700 dark:text-slate-300">500</code>) to prevent bulk over-ordering that exceeds dispensary shelf space.
                    </p>
                  </FieldGuideNotice>
                </div>
              </div>

              {/* Regulatory Checkboxes */}
              <div className="pt-2 border-t flex flex-wrap items-center gap-6 text-xs">
                <div>
                  <label className="flex items-center space-x-2 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPrescriptionRequired}
                      onChange={e => setFormData({ ...formData, isPrescriptionRequired: e.target.checked })}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>Prescription Only Medication (POM)</span>
                  </label>
                  <p className="text-[10px] text-slate-500 pl-6">
                    💡 Restricts POS dispensing to verified prescriptions with valid Prescriber & Patient ID.
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-2 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiresColdChain}
                      onChange={e => setFormData({ ...formData, requiresColdChain: e.target.checked })}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>Requires Cold Chain (2°C - 8°C)</span>
                  </label>
                  <p className="text-[10px] text-slate-500 pl-6">
                    💡 Flags temperature-monitored storage in pharmaceutical refrigerator (e.g. Insulins, Vaccines).
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow transition"
              >
                Save Medication & Pricing
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT THERAPEUTIC CATEGORY MODAL */}
      {/* ========================================================================= */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveCategory} className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingCat ? 'Edit Therapeutic Category' : 'Add New Therapeutic Category'}
                </h3>
                <p className="text-xs text-slate-500">Classification for pharmacological sorting and regulatory audits</p>
              </div>
              <button type="button" onClick={() => setShowCatModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catFormData.name}
                  onChange={e => setCatFormData({ ...catFormData, name: e.target.value })}
                  placeholder="e.g. Antihypertensives"
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Short Code (2-4 uppercase letters) *</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={catFormData.code}
                  onChange={e => setCatFormData({ ...catFormData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. CVS"
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Clinical Description & Scope</label>
                <textarea
                  rows={3}
                  value={catFormData.description}
                  onChange={e => setCatFormData({ ...catFormData, description: e.target.value })}
                  placeholder="e.g. Medications used in management of systemic hypertension and heart failure."
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowCatModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT / ADD DOSAGE FORM CLINICAL RULE MODAL */}
      {/* ========================================================================= */}
      {showDosageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveDosageForm} className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {isNewDosageForm ? 'Register Custom Dosage Formulation' : `Edit Clinical Rule: ${editingDosageKey}`}
                </h3>
                <p className="text-xs text-slate-500">Auto-suggestion packaging ratios & clinical guidelines</p>
              </div>
              <button type="button" onClick={() => setShowDosageModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              {isNewDosageForm && (
                <div>
                  <label className="font-semibold block mb-1">Formulation Name *</label>
                  <input
                    type="text"
                    required
                    value={dosageFormData.formName}
                    onChange={e => setDosageFormData({ ...dosageFormData, formName: e.target.value })}
                    placeholder="e.g. Transdermal Patch, Pessary, Nebulizer..."
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Default Base Dispensing Unit</label>
                  <select
                    value={dosageFormData.baseUnit}
                    onChange={e => setDosageFormData({ ...dosageFormData, baseUnit: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    {unitTypes.filter(u => u.category === 'DISPENSING_BASE').map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Standard Pack Packaging Name</label>
                  <input
                    type="text"
                    value={dosageFormData.packDescription}
                    onChange={e => setDosageFormData({ ...dosageFormData, packDescription: e.target.value })}
                    placeholder="e.g. Box of 10x10 Blister"
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2">
                  <label className="flex items-center space-x-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dosageFormData.hasStrip}
                      onChange={e => setDosageFormData({ ...dosageFormData, hasStrip: e.target.checked })}
                      className="rounded text-brand-600"
                    />
                    <span>Strip Tier Enabled</span>
                  </label>
                  {dosageFormData.hasStrip && (
                    <div>
                      <label className="text-[10px] text-slate-500 block">Units per Strip</label>
                      <input
                        type="number"
                        min="1"
                        value={dosageFormData.stripMultiplier}
                        onChange={e => setDosageFormData({ ...dosageFormData, stripMultiplier: parseInt(e.target.value) || 1 })}
                        className="w-full p-1.5 border rounded font-mono font-bold"
                      />
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2">
                  <label className="flex items-center space-x-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dosageFormData.hasPack}
                      onChange={e => setDosageFormData({ ...dosageFormData, hasPack: e.target.checked })}
                      className="rounded text-brand-600"
                    />
                    <span>Pack Tier Enabled</span>
                  </label>
                  {dosageFormData.hasPack && (
                    <div>
                      <label className="text-[10px] text-slate-500 block">Units per Pack</label>
                      <input
                        type="number"
                        min="1"
                        value={dosageFormData.packMultiplier}
                        onChange={e => setDosageFormData({ ...dosageFormData, packMultiplier: parseInt(e.target.value) || 1 })}
                        className="w-full p-1.5 border rounded font-mono font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Clinical Dispensing Guidance Note</label>
                <textarea
                  rows={3}
                  value={dosageFormData.clinicalNote}
                  onChange={e => setDosageFormData({ ...dosageFormData, clinicalNote: e.target.value })}
                  placeholder="Clinical guidance shown to dispenser when auto-selecting this form..."
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowDosageModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow"
              >
                Save Formulation Rule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD CUSTOM UNIT TYPE MODAL */}
      {/* ========================================================================= */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveUnitType} className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-brand-600" />
                  <span>Add Clinical Packaging Unit Type</span>
                </h3>
                <p className="text-xs text-slate-500">Define single clinical units or commercial packaging tiers for POS and inventory math</p>
              </div>
              <button type="button" onClick={() => setShowUnitModal(false)}><X className="w-4 h-4" /></button>
            </div>

            {/* In-Modal Guidance Card */}
            <div className="p-3 bg-brand-50/60 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/50 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-brand-900 dark:text-brand-300">
                <Info className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Purpose of Dispensary Unit Types</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Unit types tell the system how medicines are counted, divided, and billed. Whether a drug is dispensed as a single plastic <strong>Nebule</strong>, a <strong>Vial</strong>, or a <strong>10-tab Blister Strip</strong>, setting up the right unit guarantees accurate stock deductions and prevents billing confusion.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Field 1: Singular Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Unit Name (Singular) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Used for single-count dosing & prescriptions</span>
                </div>
                <input
                  type="text"
                  required
                  value={unitFormData.name}
                  onChange={e => setUnitFormData({ ...unitFormData, name: e.target.value })}
                  placeholder="e.g. Nebule, Vial, Suppository, Cartridge, Patch..."
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-brand-500"
                />
                <FieldGuideNotice label="Read about unit names & examples" title="Single-Count Dosing Unit">
                  <p>Used for single-count dosing & prescription tracking.</p>
                  <p className="mt-1">
                    <strong>Examples:</strong> <code className="font-mono text-brand-600 bg-brand-50 dark:bg-brand-950 px-1 rounded">Nebule</code> (for respiratory mist), <code className="font-mono text-brand-600 bg-brand-50 dark:bg-brand-950 px-1 rounded">Vial</code> (for injectable antibiotic powder), or <code className="font-mono text-brand-600 bg-brand-50 dark:bg-brand-950 px-1 rounded">Pessary</code>.
                  </p>
                </FieldGuideNotice>
              </div>

              {/* Field 2: Plural Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Plural Form
                  </label>
                  <span className="text-[10px] text-slate-400">Displayed when quantity &gt; 1</span>
                </div>
                <input
                  type="text"
                  value={unitFormData.plural}
                  onChange={e => setUnitFormData({ ...unitFormData, plural: e.target.value })}
                  placeholder="e.g. Nebules, Vials, Suppositories, Cartridges, Patches..."
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-brand-500"
                />
                <FieldGuideNotice label="Read about plural usage & examples" title="Receipt & Label Plural Formatting">
                  <p>Displayed when quantity &gt; 1 across sales receipts and clinical instructions.</p>
                  <p className="mt-1">
                    <strong>Examples:</strong> <code className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 rounded">Nebules</code> (printed on receipt e.g. "Take 2 Nebules via nebulizer daily"), <code className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 rounded">Vials</code>, or <code className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 rounded">Blister Strips</code>.
                  </p>
                </FieldGuideNotice>
              </div>

              {/* Field 3: Hierarchy Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Packaging Hierarchy Level <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Controls stock counting math</span>
                </div>
                <select
                  value={unitFormData.category}
                  onChange={e => setUnitFormData({ ...unitFormData, category: e.target.value as any })}
                  className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-brand-500"
                >
                  <option value="DISPENSING_BASE">Atomic Base Dispensing Unit (e.g. Tablet, mL, Ampoule, Piece)</option>
                  <option value="SUB_CONTAINER">Intermediate Sub-Container (e.g. Strip, Card, Blister, Sachet)</option>
                  <option value="CONTAINER">Outer Bulk Packaging (e.g. Pack, Box, Carton, Tin, Bottle)</option>
                </select>

                <FieldGuideNotice label="Read hierarchy level guide & examples" title="Packaging Hierarchy Classification">
                  <div className="space-y-1.5 text-xs">
                    {unitFormData.category === 'DISPENSING_BASE' && (
                      <div>
                        <strong className="text-emerald-700 dark:text-emerald-400 flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Atomic Base Dispensing Unit Selected:</span>
                        </strong>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                          The single lowest clinical unit. Stock balance and ledger deductions are tracked in this unit.
                          <br /><strong>Example 1:</strong> <code>Tablet</code> for oral solid medication.
                          <br /><strong>Example 2:</strong> <code>mL</code> for cough syrups and oral suspensions.
                        </p>
                      </div>
                    )}
                    {unitFormData.category === 'SUB_CONTAINER' && (
                      <div>
                        <strong className="text-indigo-700 dark:text-indigo-400 flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Intermediate Sub-Container Selected:</span>
                        </strong>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                          Holds a group of base units to dispense quickly without cutting blister seals.
                          <br /><strong>Example 1:</strong> <code>Strip</code> containing 10 tablets.
                          <br /><strong>Example 2:</strong> <code>Sachet</code> containing 1 single oral rehydration salts powder dose.
                        </p>
                      </div>
                    )}
                    {unitFormData.category === 'CONTAINER' && (
                      <div>
                        <strong className="text-purple-700 dark:text-purple-400 flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Outer Bulk Container Selected:</span>
                        </strong>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                          Wholesale commercial packaging received from distributors and suppliers.
                          <br /><strong>Example 1:</strong> <code>Box / Pack</code> holding 10 strips (100 tablets).
                          <br /><strong>Example 2:</strong> <code>Carton</code> holding 24 bottles of suspension.
                        </p>
                      </div>
                    )}
                  </div>
                </FieldGuideNotice>
              </div>

              {/* Field 4: Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Clinical Description & Usage Scope
                  </label>
                  <span className="text-[10px] text-slate-400">Staff reference guidelines</span>
                </div>
                <textarea
                  rows={2}
                  value={unitFormData.description}
                  onChange={e => setUnitFormData({ ...unitFormData, description: e.target.value })}
                  placeholder="Explain how dispensary staff and technicians should identify or dispense this unit..."
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-brand-500"
                />
                <FieldGuideNotice label="Read description tips & clinical examples" title="Clinical Usage & Guidelines">
                  <div className="space-y-1">
                    <p><strong>Example 1:</strong> <em>"Single-dose 2.5mL plastic respiratory nebule for bronchodilator inhalation."</em></p>
                    <p><strong>Example 2:</strong> <em>"Transdermal adhesive patch releasing 25mcg/hr active substance over 72 hours."</em></p>
                  </div>
                </FieldGuideNotice>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowUnitModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow transition"
              >
                Save Unit Type
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
