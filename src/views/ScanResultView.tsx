/**
 * ScanResultView Component
 *
 * Story 14.15: Scan Flow Integration
 * Epic 14: Core Implementation
 *
 * Full-screen transaction editor that matches mockup #4 "Edit Transaction (Interactive)".
 * This is shown when the camera button is pressed, providing a blank form ready for input.
 *
 * Features:
 * - Editable merchant name input
 * - Clickable metadata tags: Category, Location, Date, Time, Currency
 * - Items list with add/edit capability
 * - Pre-filled defaults: Location & Currency from settings, Date & Time from now
 * - Single "Guardar Transacción" button
 *
 * @see docs/uxui/mockups/01_views/scan-overlay.html (State 4)
 * @see docs/sprint-artifacts/epic14/stories/story-14.15-scan-flow-integration.md
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, X, Calendar, Clock, Plus, Check, Pencil, Camera, Scan } from 'lucide-react';
import { Transaction, TransactionItem, StoreCategory, ItemCategory } from '../types/transaction';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { CategoryBadge } from '../components/CategoryBadge';
import { LocationSelect } from '../components/LocationSelect';
import { getItemCategoryColors } from '../config/categoryColors';
import { translateItemGroup } from '../utils/categoryTranslations';
import {
  sanitizeMerchantName,
  sanitizeItemName,
  sanitizeLocation,
  sanitizeSubcategory,
} from '../utils/sanitize';
import type { Language } from '../utils/translations';

// All 32 store categories for dropdown - Story 14.15 (alphabetical order)
const ALL_STORE_CATEGORIES: StoreCategory[] = [
  'Automotive', 'Bakery', 'BankingFinance', 'Bazaar', 'BooksMedia', 'Butcher',
  'CharityDonation', 'Clothing', 'Education', 'Electronics', 'Entertainment',
  'Furniture', 'GardenCenter', 'GasStation', 'Hardware', 'HealthBeauty',
  'HomeGoods', 'HotelLodging', 'Jewelry', 'Medical', 'OfficeSupplies', 'Optical',
  'PetShop', 'Pharmacy', 'Restaurant', 'Services', 'SportsOutdoors', 'StreetVendor',
  'Supermarket', 'ToysGames', 'Transport', 'TravelAgency', 'Veterinary', 'Other',
];

// All item categories for item edit modal (alphabetical order)
const ALL_ITEM_CATEGORIES: ItemCategory[] = [
  'Alcohol', 'Automotive', 'Baby Products', 'Bakery', 'Beverages', 'Books & Media',
  'Cleaning Supplies', 'Clothing', 'Crafts & Hobbies', 'Dairy & Eggs', 'Electronics',
  'Frozen Foods', 'Furniture', 'Garden', 'Hardware', 'Health & Beauty', 'Household',
  'Meat & Seafood', 'Office & Stationery', 'Pantry', 'Personal Care', 'Pet Supplies',
  'Pharmacy', 'Produce', 'Service', 'Snacks', 'Sports & Outdoors', 'Supplements',
  'Tax & Fees', 'Tobacco', 'Toys & Games', 'Other',
];

export interface ScanResultViewProps {
  /** Transaction data (null for new transaction) */
  transaction: Transaction | null;
  /** Whether processing/analyzing is in progress */
  isProcessing: boolean;
  /** Estimated time remaining for processing in seconds */
  processingEta?: number | null;
  /** Receipt image thumbnail (after successful scan) */
  thumbnailUrl?: string;
  /** Pending image URL (selected but not yet processed) */
  pendingImageUrl?: string;
  /** Callback when user saves the transaction */
  onSave: (transaction: Transaction) => Promise<void>;
  /** Callback when user clicks back/cancel */
  onCancel: () => void;
  /** Theme for styling */
  theme: 'light' | 'dark';
  /** Translation function */
  t: (key: string) => string;
  /** Currency format function */
  formatCurrency: (amount: number, currency: string) => string;
  /** Default currency code from settings */
  currency: string;
  /** Default location (city) from settings */
  defaultCity?: string;
  /** Default country from settings */
  defaultCountry?: string;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Language for translations */
  lang?: Language;
  /** Callback when user selects a photo (file input) */
  onPhotoSelect?: (file: File) => void;
  /** Callback when user clicks process button (after photo selected) */
  onProcessScan?: () => void;
}

/**
 * ScanResultView - Interactive transaction editor matching mockup #4
 */
export const ScanResultView: React.FC<ScanResultViewProps> = ({
  transaction,
  isProcessing,
  processingEta,
  thumbnailUrl,
  pendingImageUrl,
  onSave,
  onCancel,
  theme: _theme,
  t,
  formatCurrency,
  currency,
  defaultCity = '',
  defaultCountry = '',
  isSaving = false,
  lang = 'es',
  onPhotoSelect,
  onProcessScan,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const merchantInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhotoSelect) {
      onPhotoSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Open file picker
  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Form state - initialized with defaults or transaction data
  const [merchantName, setMerchantName] = useState('');
  const [category, setCategory] = useState<StoreCategory>('Other');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Item edit modal state
  const [editingItem, setEditingItem] = useState<{ index: number; item: TransactionItem } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ItemCategory>('Other');
  const [newItemSubcategory, setNewItemSubcategory] = useState('');
  const [showItemCategoryPicker, setShowItemCategoryPicker] = useState(false);

  // Initialize form with defaults or transaction data
  useEffect(() => {
    const now = new Date();

    if (transaction) {
      // Populate from existing transaction
      setMerchantName(transaction.alias || transaction.merchant || '');
      setCategory((transaction.category as StoreCategory) || 'Other');
      setCity(transaction.city || defaultCity);
      setCountry(transaction.country || defaultCountry);
      setDate(transaction.date || now.toISOString().split('T')[0]);
      setTime(transaction.time || now.toTimeString().slice(0, 5));
      setItems(transaction.items || []);
      setSelectedCurrency(transaction.currency || currency);
    } else {
      // New transaction - pre-fill defaults
      setMerchantName('');
      setCategory('Other');
      setCity(defaultCity);
      setCountry(defaultCountry);
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toTimeString().slice(0, 5));
      setItems([]);
      setSelectedCurrency(currency);
    }
  }, [transaction, defaultCity, defaultCountry, currency]);

  // Focus merchant input on mount (when not processing)
  useEffect(() => {
    if (!isProcessing && merchantInputRef.current) {
      merchantInputRef.current.focus();
    }
  }, [isProcessing]);

  // Calculate total from items
  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.dropdown-wrapper')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Toggle dropdown
  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  // Handle save - with input sanitization for security
  const handleSave = useCallback(async () => {
    if (isSaving || isProcessing) return;

    // Sanitize all user inputs before saving
    const sanitizedMerchant = sanitizeMerchantName(merchantName) || t('unknown') || 'Desconocido';
    const sanitizedCity = sanitizeLocation(city);
    const sanitizedCountry = sanitizeLocation(country);

    // Sanitize item fields
    const sanitizedItems = items.map((item) => ({
      ...item,
      name: sanitizeItemName(item.name),
      subcategory: item.subcategory ? sanitizeSubcategory(item.subcategory) : undefined,
    }));

    const newTransaction: Transaction = {
      id: transaction?.id || `trans_${Date.now()}`,
      merchant: sanitizedMerchant,
      alias: sanitizedMerchant || undefined,
      category: category,
      city: sanitizedCity,
      country: sanitizedCountry,
      date: date,
      time: time,
      total: total,
      currency: selectedCurrency,
      items: sanitizedItems,
      createdAt: transaction?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSave(newTransaction);
  }, [transaction, merchantName, category, city, country, date, time, total, selectedCurrency, items, onSave, isSaving, isProcessing, t]);

  // Add new item
  const handleAddItem = () => {
    setEditingItem({
      index: -1, // -1 means new item
      item: { name: '', price: 0, category: 'Other', subcategory: '' }
    });
    setNewItemName('');
    setNewItemPrice('');
    setNewItemCategory('Other');
    setNewItemSubcategory('');
    setShowItemCategoryPicker(false);
  };

  // Edit existing item
  const handleEditItem = (index: number) => {
    const item = items[index];
    setEditingItem({ index, item });
    setNewItemName(item.name);
    setNewItemPrice(item.price.toString());
    setNewItemCategory((item.category as ItemCategory) || 'Other');
    setNewItemSubcategory(item.subcategory || '');
    setShowItemCategoryPicker(false);
  };

  // Save item (add or update) - with input sanitization for security
  const handleSaveItem = () => {
    if (!editingItem || !newItemName.trim()) return;

    const price = parseFloat(newItemPrice) || 0;
    const newItem: TransactionItem = {
      ...editingItem.item,
      name: sanitizeItemName(newItemName),
      price: price,
      category: newItemCategory,
      subcategory: sanitizeSubcategory(newItemSubcategory) || undefined,
      categorySource: 'user',
    };

    if (editingItem.index === -1) {
      // Add new item
      setItems([...items, newItem]);
    } else {
      // Update existing item
      const updated = [...items];
      updated[editingItem.index] = newItem;
      setItems(updated);
    }

    setEditingItem(null);
    setShowItemCategoryPicker(false);
  };

  // Delete item
  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return t('selectDate') || 'Seleccionar';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'es' ? 'es-CL' : 'en-US', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  // Get currency symbol
  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      CLP: '$', USD: 'US$', EUR: '€', ARS: 'AR$', PEN: 'S/', COP: '$', MXN: '$'
    };
    return symbols[curr] || '$';
  };

  return (
    <div
      className="relative"
      style={{
        paddingBottom: 'calc(6rem + var(--safe-bottom, 0px))',
      }}
    >
      {/* Header - matching HistoryView/TrendsView style exactly */}
      <div
        className="sticky px-4"
        style={{
          top: 0,
          zIndex: 50,
          backgroundColor: 'var(--bg)',
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            height: '72px',
            paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
          }}
        >
          {/* Left side: Back button + Title */}
          <div className="flex items-center gap-0">
            <button
              onClick={onCancel}
              className="min-w-10 min-h-10 flex items-center justify-center -ml-1"
              aria-label={t('back')}
              style={{ color: 'var(--text-primary)' }}
            >
              <ChevronLeft size={28} strokeWidth={2.5} />
            </button>
            <h1
              className="font-semibold"
              style={{
                fontFamily: 'var(--font-family)',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '20px',
              }}
            >
              {t('scanViewTitle') || 'Escanea'}
            </h1>
          </div>
          {/* Right side: Close button */}
          <button
            onClick={onCancel}
            className="min-w-10 min-h-10 flex items-center justify-center"
            aria-label={t('cancel')}
            style={{ color: 'var(--text-primary)' }}
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Main content - Card with edge spacing */}
      <div className="px-3 pb-4">
        <div
          className="rounded-2xl px-4 pt-5 pb-4"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            minHeight: 'calc(100vh - 72px - 6rem - 24px)',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Header: Metadata + Thumbnail */}
          <div
            className="flex justify-between items-start gap-4 mb-5 pb-4"
            style={{ borderBottom: '1px solid var(--border-light)' }}
          >
            {/* Left: Metadata */}
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              {/* Merchant name - Editable input */}
              <input
                ref={merchantInputRef}
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder={t('merchantPlaceholder') || 'Comercio'}
                className="text-xl font-bold w-full bg-transparent border-none outline-none"
                style={{ color: 'var(--text-primary)' }}
                disabled={isProcessing}
              />

              {/* Row 1: Category only */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Category Badge - Clickable */}
                <div className="relative dropdown-wrapper">
                  <button
                    onClick={() => toggleDropdown('category')}
                    className="cursor-pointer"
                    disabled={isProcessing}
                  >
                    <CategoryBadge category={category} lang={lang} showIcon maxWidth="120px" />
                  </button>
                  {openDropdown === 'category' && (
                    <div
                      className="fixed left-3 right-3 mt-1 rounded-xl shadow-lg z-50 overflow-hidden max-h-96 overflow-y-auto"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        top: 'auto',
                      }}
                    >
                      <div className="flex flex-wrap gap-2 p-3">
                        {ALL_STORE_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            className="rounded-full transition-colors"
                            style={{
                              outline: category === cat ? '2px solid var(--primary)' : 'none',
                              outlineOffset: '1px',
                            }}
                            onClick={() => {
                              setCategory(cat);
                              setOpenDropdown(null);
                            }}
                          >
                            <CategoryBadge category={cat} lang={lang} showIcon />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Location - Using LocationSelect component */}
                <LocationSelect
                  country={country}
                  city={city}
                  onCountryChange={setCountry}
                  onCityChange={setCity}
                  inputStyle={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                  }}
                  countryPlaceholder={t('country') || 'País'}
                  cityPlaceholder={t('city') || 'Ciudad / Comuna'}
                  t={t}
                />
              </div>

              {/* Row 2: Date + Time + Currency */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Date Tag */}
                <div className="relative dropdown-wrapper">
                  <button
                    onClick={() => toggleDropdown('date')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-secondary)',
                    }}
                    disabled={isProcessing}
                  >
                    <Calendar size={12} />
                    <span>{formatDisplayDate(date)}</span>
                  </button>
                  {openDropdown === 'date' && (
                    <div
                      className="absolute top-full left-0 mt-2 min-w-[200px] rounded-xl shadow-lg z-50 p-3"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      {/* Floating label input */}
                      <div className="relative mb-3">
                        <label
                          className="absolute -top-2 left-2.5 px-1 text-[10px] font-medium z-10"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--primary)',
                          }}
                        >
                          {t('date') || 'Fecha'}
                        </label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full h-10 px-3 pr-2 rounded-lg text-sm cursor-pointer"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                      <button
                        onClick={() => setOpenDropdown(null)}
                        className="w-full py-2 rounded-lg text-sm font-medium"
                        style={{
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                        }}
                      >
                        {t('confirm') || 'Confirmar'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Time Tag */}
                <div className="relative dropdown-wrapper">
                  <button
                    onClick={() => toggleDropdown('time')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-secondary)',
                    }}
                    disabled={isProcessing}
                  >
                    <Clock size={12} />
                    <span>{time || '--:--'}</span>
                  </button>
                  {openDropdown === 'time' && (
                    <div
                      className="absolute top-full left-0 mt-2 min-w-[160px] rounded-xl shadow-lg z-50 p-3"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      {/* Floating label input */}
                      <div className="relative mb-3">
                        <label
                          className="absolute -top-2 left-2.5 px-1 text-[10px] font-medium z-10"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--primary)',
                          }}
                        >
                          {t('time') || 'Hora'}
                        </label>
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full h-10 px-3 pr-2 rounded-lg text-sm cursor-pointer"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                      <button
                        onClick={() => setOpenDropdown(null)}
                        className="w-full py-2 rounded-lg text-sm font-medium"
                        style={{
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                        }}
                      >
                        {t('confirm') || 'Confirmar'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Currency Tag */}
                <div className="relative dropdown-wrapper">
                  <button
                    onClick={() => toggleDropdown('currency')}
                    className="flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-secondary)',
                    }}
                    disabled={isProcessing}
                  >
                    <span>{getCurrencySymbol(selectedCurrency)}</span>
                  </button>
                  {openDropdown === 'currency' && (
                    <div
                      className="absolute top-full right-0 mt-2 min-w-[200px] rounded-xl shadow-lg z-50 p-3"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      {/* Floating label select */}
                      <div className="relative mb-3">
                        <label
                          className="absolute -top-2 left-2.5 px-1 text-[10px] font-medium z-10"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--primary)',
                          }}
                        >
                          {t('currency') || 'Moneda'}
                        </label>
                        <select
                          value={selectedCurrency}
                          onChange={(e) => setSelectedCurrency(e.target.value)}
                          className="w-full h-10 px-3 pr-8 rounded-lg text-sm cursor-pointer appearance-none"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-primary)',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 10px center',
                          }}
                        >
                          <option value="CLP">CLP - Peso Chileno</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="ARS">ARS - Peso Argentino</option>
                          <option value="PEN">PEN - Sol Peruano</option>
                          <option value="COP">COP - Peso Colombiano</option>
                          <option value="MXN">MXN - Peso Mexicano</option>
                        </select>
                      </div>
                      <button
                        onClick={() => setOpenDropdown(null)}
                        className="w-full py-2 rounded-lg text-sm font-medium"
                        style={{
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                        }}
                      >
                        {t('confirm') || 'Confirmar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Interactive Scan Thumbnail */}
            <div
              className="relative flex-shrink-0"
              style={{ width: '88px', height: '110px' }}
            >
              {/* Hidden file input for photo selection */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="true"
              />

              {/* Animation keyframes */}
              <style>
                {`
                  @keyframes scan-breathe {
                    0%, 100% { transform: scale(1); opacity: 0.9; }
                    50% { transform: scale(1.03); opacity: 1; }
                  }
                  @keyframes scan-pulse-border {
                    0%, 100% { border-color: var(--primary); opacity: 0.6; }
                    50% { border-color: var(--primary); opacity: 1; }
                  }
                  @keyframes process-pulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                    50% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
                  }
                  @keyframes processing-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}
              </style>

              {thumbnailUrl ? (
                /* STATE 3: Success - Scanned receipt with checkmark */
                <div
                  className="w-full h-full rounded-xl overflow-hidden relative cursor-pointer"
                  style={{
                    border: '2px solid var(--success)',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.2)',
                  }}
                  onClick={handleOpenFilePicker}
                >
                  <img
                    src={thumbnailUrl}
                    alt={t('receiptThumbnail') || 'Receipt'}
                    className="w-full h-full object-cover"
                  />
                  {/* Success checkmark overlay */}
                  <div
                    className="absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--success)' }}
                  >
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                </div>
              ) : pendingImageUrl ? (
                /* STATE 2: Pending - Photo selected, ready to process */
                <button
                  onClick={isProcessing ? undefined : onProcessScan}
                  disabled={isProcessing}
                  className="w-full h-full rounded-xl overflow-hidden relative cursor-pointer"
                  style={{
                    border: '2px solid var(--success)',
                    animation: !prefersReducedMotion && !isProcessing ? 'process-pulse 1.5s ease-in-out infinite' : 'none',
                  }}
                  aria-label={t('processScan') || 'Procesar'}
                >
                  {/* Preview image with overlay */}
                  <img
                    src={pendingImageUrl}
                    alt={t('receiptThumbnail') || 'Receipt'}
                    className="w-full h-full object-cover"
                    style={{ opacity: isProcessing ? 0.5 : 0.8 }}
                  />
                  {/* Process overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/30">
                    {isProcessing ? (
                      /* Processing spinner */
                      <>
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white border-t-transparent"
                          style={{
                            animation: !prefersReducedMotion ? 'processing-spin 1s linear infinite' : 'none',
                          }}
                        />
                        <span className="text-[9px] font-semibold uppercase text-white">
                          {t('processing') || 'Procesando'}
                        </span>
                      </>
                    ) : (
                      /* Ready to process button */
                      <>
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'var(--success)' }}
                        >
                          <Scan size={18} className="text-white" strokeWidth={2.5} />
                        </div>
                        <span className="text-[9px] font-bold uppercase text-white drop-shadow-sm">
                          {t('processScan') || 'Procesar'}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              ) : (
                /* STATE 1: Empty - Animated scan button invitation */
                <button
                  onClick={handleOpenFilePicker}
                  disabled={isProcessing}
                  className="w-full h-full rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '2px dashed var(--primary)',
                    animation: !prefersReducedMotion && !isProcessing ? 'scan-pulse-border 2s ease-in-out infinite' : 'none',
                  }}
                  aria-label={t('scan') || 'Escanear'}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--primary-light)',
                      animation: !prefersReducedMotion && !isProcessing ? 'scan-breathe 2s ease-in-out infinite' : 'none',
                    }}
                  >
                    <Camera
                      size={20}
                      style={{ color: 'var(--primary)' }}
                      strokeWidth={2}
                    />
                  </div>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--primary)' }}
                  >
                    {t('scan') || 'Escanear'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="mb-3.5">
            <div
              className="text-xs uppercase tracking-wider mb-2.5 font-semibold"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {t('items') || 'Items'}
            </div>

            {/* Items */}
            {items.map((item, index) => (
              <div
                key={index}
                onClick={() => handleEditItem(index)}
                className="flex justify-between items-center p-3 rounded-lg mb-1.5 cursor-pointer transition-all hover:opacity-80"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {item.name}
                    </span>
                    <Pencil size={12} style={{ color: 'var(--text-tertiary)', opacity: 0.6 }} />
                  </div>
                  <div className="flex gap-1.5">
                    <CategoryBadge category={item.category as StoreCategory || category} lang={lang} mini />
                    {item.subcategory && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        {item.subcategory}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(item.price, selectedCurrency)}
                </span>
              </div>
            ))}

            {/* Add Item Button */}
            <button
              onClick={handleAddItem}
              className="w-full p-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium"
              style={{
                border: '2px dashed var(--border-light)',
                backgroundColor: 'transparent',
                color: 'var(--primary)',
              }}
              disabled={isProcessing}
            >
              <Plus size={14} strokeWidth={2.5} />
              {t('addItem') || 'Agregar Item'}
            </button>
          </div>

          {/* Total */}
          <div
            className="flex justify-between items-center p-3 rounded-xl mb-3.5"
            style={{ backgroundColor: 'var(--primary-light)' }}
          >
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {t('total') || 'Total'} ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
            <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
              {formatCurrency(total, selectedCurrency)}
            </span>
          </div>

          {/* Save Button / Processing Indicator */}
          {isProcessing ? (
            /* Processing State - Shows spinner and ETA */
            <div
              className="w-full h-11 rounded-xl font-medium flex items-center justify-center gap-2 text-sm"
              style={{
                backgroundColor: 'var(--positive-bg, #dcfce7)',
                color: 'var(--positive-primary, #16a34a)',
              }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 border-current border-t-transparent"
                style={{
                  animation: !prefersReducedMotion ? 'processing-spin 1s linear infinite' : 'none',
                }}
              />
              <span>
                {t('processingReceipt') || 'Procesando boleta'}...
                {processingEta != null && processingEta > 0 && ` ~${Math.ceil(processingEta)}s`}
              </span>
            </div>
          ) : (
            /* Save Button */
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-11 rounded-xl font-medium text-white flex items-center justify-center gap-1.5 text-sm transition-all"
              style={{
                backgroundColor: isSaving ? 'var(--success-muted, #86efac)' : 'var(--success, #22c55e)',
                opacity: isSaving ? 0.7 : 1,
                transform: isSaving && !prefersReducedMotion ? 'scale(0.98)' : 'scale(1)',
              }}
            >
              <Check size={16} strokeWidth={2.5} />
              {isSaving ? (t('saving') || 'Guardando...') : (t('saveTransaction') || 'Guardar Transacción')}
            </button>
          )}
        </div>
      </div>

      {/* Item Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setEditingItem(null)}
          />
          {/* Modal */}
          <div
            className="relative w-[calc(100%-32px)] max-w-md rounded-2xl p-5 shadow-xl"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              animation: prefersReducedMotion ? 'none' : 'modalFadeIn 0.2s ease-out',
            }}
          >
            <style>
              {`
                @keyframes modalFadeIn {
                  from { opacity: 0; transform: scale(0.95); }
                  to { opacity: 1; transform: scale(1); }
                }
              `}
            </style>
            <div className="flex justify-between items-center mb-4">
              <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingItem.index === -1 ? (t('addItem') || 'Agregar Item') : (t('editItem') || 'Editar Item')}
              </span>
              <button
                onClick={() => setEditingItem(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <X size={16} style={{ color: 'var(--text-primary)' }} />
              </button>
            </div>

            {/* Name Input - Floating label style */}
            <div className="mb-4">
              <div className="relative">
                <label
                  className="absolute -top-2 left-2.5 px-1 text-[10px] font-medium z-10"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--primary)',
                  }}
                >
                  {t('itemName') || 'Nombre'}
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder={t('itemNamePlaceholder') || 'Nombre del item'}
                  autoFocus
                />
              </div>
            </div>

            {/* Price Input - Floating label style */}
            <div className="mb-4">
              <div className="relative">
                <label
                  className="absolute -top-2 left-2.5 px-1 text-[10px] font-medium z-10"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--primary)',
                  }}
                >
                  {t('itemPrice') || 'Precio'}
                </label>
                <input
                  type="number"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Item Category Selector - Floating label style with button */}
            <div className="mb-4">
              <div className="relative">
                <label
                  className="absolute -top-2 left-2.5 px-1 text-[10px] font-medium z-10"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--primary)',
                  }}
                >
                  {t('itemCategory') || 'Categoría del Item'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowItemCategoryPicker(true)}
                  className="w-full h-11 px-3 rounded-lg text-sm text-left flex items-center justify-between"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
                    style={{
                      backgroundColor: getItemCategoryColors(newItemCategory).bg,
                      color: getItemCategoryColors(newItemCategory).fg,
                    }}
                  >
                    {translateItemGroup(newItemCategory, lang)}
                  </span>
                  <ChevronLeft size={16} className="rotate-[-90deg]" style={{ color: 'var(--text-tertiary)' }} />
                </button>
              </div>
            </div>

            {/* Subcategory Input - Floating label style, no placeholder */}
            <div className="mb-4">
              <div className="relative">
                <label
                  className="absolute -top-2 left-2.5 px-1 text-[10px] font-medium z-10"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--primary)',
                  }}
                >
                  {t('itemSubcategory') || 'Subcategoría del Item'}
                </label>
                <input
                  type="text"
                  value={newItemSubcategory}
                  onChange={(e) => setNewItemSubcategory(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {editingItem.index !== -1 && (
                <button
                  onClick={() => {
                    handleDeleteItem(editingItem.index);
                    setEditingItem(null);
                  }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: 'var(--error-light)',
                    color: 'var(--error)',
                  }}
                >
                  {t('delete') || 'Eliminar'}
                </button>
              )}
              <button
                onClick={handleSaveItem}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: 'var(--primary)' }}
                disabled={!newItemName.trim()}
              >
                {editingItem.index === -1 ? (t('add') || 'Agregar') : (t('save') || 'Guardar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Category Picker Modal - Full screen popup with X close button */}
      {showItemCategoryPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowItemCategoryPicker(false)}
          />
          {/* Modal */}
          <div
            className="relative w-[calc(100%-32px)] max-w-md max-h-[80vh] rounded-2xl shadow-xl overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              animation: prefersReducedMotion ? 'none' : 'modalFadeIn 0.2s ease-out',
            }}
          >
            {/* Header with X close button */}
            <div
              className="sticky top-0 flex justify-between items-center px-5 py-4"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-light)',
              }}
            >
              <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('itemCategory') || 'Categoría del Item'}
              </span>
              <button
                onClick={() => setShowItemCategoryPicker(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                aria-label={t('close') || 'Cerrar'}
              >
                <X size={18} style={{ color: 'var(--text-primary)' }} />
              </button>
            </div>

            {/* Category Grid */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 64px)' }}>
              <div className="flex flex-wrap gap-2.5">
                {ALL_ITEM_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase transition-all"
                    style={{
                      backgroundColor: getItemCategoryColors(cat).bg,
                      color: getItemCategoryColors(cat).fg,
                      outline: newItemCategory === cat ? '3px solid var(--primary)' : 'none',
                      outlineOffset: '2px',
                      transform: newItemCategory === cat ? 'scale(1.05)' : 'scale(1)',
                    }}
                    onClick={() => {
                      setNewItemCategory(cat);
                      setShowItemCategoryPicker(false);
                    }}
                  >
                    {translateItemGroup(cat, lang)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanResultView;
