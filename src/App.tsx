import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';
import { useCategoryMappings } from './hooks/useCategoryMappings';
import { useMerchantMappings } from './hooks/useMerchantMappings';
import { useUserPreferences } from './hooks/useUserPreferences';
import { LoginScreen } from './views/LoginScreen';
import { DashboardView } from './views/DashboardView';
// Story 9.9: ScanView is deprecated - scan functionality is now in EditView
// import { ScanView } from './views/ScanView';
import { EditView } from './views/EditView';
import { TrendsView } from './views/TrendsView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { Nav } from './components/Nav';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { analyzeReceipt, ReceiptType } from './services/gemini';
import { SupportedCurrency } from './services/userPreferencesService';
import {
    addTransaction as firestoreAddTransaction,
    updateTransaction as firestoreUpdateTransaction,
    deleteTransaction as firestoreDeleteTransaction,
    wipeAllTransactions
} from './services/firestore';
import { Transaction, StoreCategory } from './types/transaction';
import { Language, Currency, Theme, ColorTheme } from './types/settings';
// Story 9.10: Persistent scan state management
import { PendingScan, UserCredits, DEFAULT_CREDITS, createPendingScan } from './types/scan';
import { formatCurrency } from './utils/currency';
import { formatDate } from './utils/date';
import { getSafeDate, parseStrictNumber } from './utils/validation';
import { downloadBasicData } from './utils/csvExport';
import { TRANSLATIONS } from './utils/translations';
import { ITEMS_PER_PAGE, STORE_CATEGORIES } from './config/constants';
import { applyCategoryMappings } from './utils/categoryMatcher';
import { incrementMappingUsage } from './services/categoryMappingService';
import { incrementMerchantMappingUsage } from './services/merchantMappingService';
import { getCitiesForCountry } from './data/locations';

type View = 'dashboard' | 'scan' | 'edit' | 'trends' | 'list' | 'settings';

function App() {
    const { user, services, initError, signIn, signInWithTestCredentials, signOut } = useAuth();
    const transactions = useTransactions(user, services);
    // Story 9.7 enhancement: Also expose updateMapping for edit functionality
    const { mappings, loading: mappingsLoading, saveMapping, deleteMapping, updateMapping: updateCategoryMapping } = useCategoryMappings(user, services);
    // Story 9.5: Merchant mappings for fuzzy matching
    // Story 9.6: Also expose saveMapping for learning prompt
    // Story 9.7: Expose mappings, deleteMapping, updateMapping for Settings management UI
    const {
        mappings: merchantMappings,
        loading: merchantMappingsLoading,
        findMatch: findMerchantMatch,
        saveMapping: saveMerchantMapping,
        deleteMapping: deleteMerchantMapping,
        updateMapping: updateMerchantMapping
    } = useMerchantMappings(user, services);
    // Story 9.8: User preferences for default scan currency
    const {
        preferences: userPreferences,
        setDefaultCurrency: setDefaultScanCurrencyPref
    } = useUserPreferences(user, services);

    // UI State
    const [view, setView] = useState<View>('dashboard');
    const [scanImages, setScanImages] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    // Story 9.8: Scan options state
    const [scanStoreType, setScanStoreType] = useState<ReceiptType>('auto');
    const [scanCurrency, setScanCurrency] = useState<SupportedCurrency>('CLP');
    const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    // Story 9.10: Persistent scan state - maintains scan across navigation
    const [pendingScan, setPendingScan] = useState<PendingScan | null>(null);
    // Story 9.10: User credits for scan (MVP placeholder: 900 credits)
    const [userCredits, setUserCredits] = useState<UserCredits>(DEFAULT_CREDITS);

    // Settings
    const [lang, setLang] = useState<Language>('es');
    const [currency, setCurrency] = useState<Currency>('CLP');
    const [theme, setTheme] = useState<Theme>('light');
    const [dateFormat, setDateFormat] = useState<'LatAm' | 'US'>('LatAm');
    // Story 7.12 AC#11: Color theme selector (Story 7.17: 'normal' is default, was 'ghibli')
    const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
        const saved = localStorage.getItem('colorTheme');
        // Migration: treat old 'ghibli' as new 'normal', old 'default' as new 'professional'
        if (saved === 'ghibli' || saved === 'normal') return 'normal';
        if (saved === 'default' || saved === 'professional') return 'professional';
        return 'normal'; // Default to 'normal' (warm colors)
    });
    // Story 9.3: Default location settings (used when scan doesn't detect location)
    const [defaultCountry, setDefaultCountry] = useState(() => localStorage.getItem('defaultCountry') || '');
    const [defaultCity, setDefaultCity] = useState(() => localStorage.getItem('defaultCity') || '');
    const [wiping, setWiping] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

    // Pagination State
    const [historyPage, setHistoryPage] = useState(1);
    const [distinctAliases, setDistinctAliases] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const t = (k: string) => (TRANSLATIONS[lang] as any)[k] || k;

    // Extract distinct aliases from transactions
    useEffect(() => {
        const aliases = new Set<string>();
        transactions.forEach(d => {
            if (d.alias) aliases.add(d.alias);
        });
        setDistinctAliases(Array.from(aliases).sort());
    }, [transactions]);

    // Auto-dismiss toast after 3 seconds
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    // Story 7.12 AC#11: Persist color theme to localStorage
    useEffect(() => {
        localStorage.setItem('colorTheme', colorTheme);
    }, [colorTheme]);

    // Story 9.3: Persist default location to localStorage
    useEffect(() => {
        localStorage.setItem('defaultCountry', defaultCountry);
    }, [defaultCountry]);

    useEffect(() => {
        localStorage.setItem('defaultCity', defaultCity);
    }, [defaultCity]);

    // Story 9.8: Sync scanCurrency with user's default preference when it loads
    useEffect(() => {
        if (userPreferences.defaultCurrency) {
            setScanCurrency(userPreferences.defaultCurrency);
        }
    }, [userPreferences.defaultCurrency]);

    // Note: Theme is applied synchronously during render (before JSX return)
    // to ensure CSS variables are available when children compute memoized data

    // Story 9.9: Unified new transaction handler
    // Story 9.10: Now checks for existing pending scan and restores it (AC #2)
    // Both "+" button and camera button now go to EditView
    // Camera button also auto-opens the file picker
    const handleNewTransaction = (autoOpenFilePicker: boolean) => {
        // Story 9.10 AC#2: Check for existing pending scan
        if (pendingScan) {
            // Restore pending scan state
            setScanImages(pendingScan.images);
            setScanError(pendingScan.error || null);
            if (pendingScan.analyzedTransaction) {
                setCurrentTransaction(pendingScan.analyzedTransaction);
            } else {
                setCurrentTransaction({
                    merchant: '',
                    date: getSafeDate(null),
                    total: 0,
                    category: 'Supermarket',
                    items: []
                });
            }
            setView('edit');
            // Don't auto-open file picker when returning to pending scan
            return;
        }

        // No pending scan - create fresh session
        setScanImages([]);
        setScanError(null);
        // Story 9.8: Reset scan options to defaults
        setScanStoreType('auto');
        setScanCurrency(userPreferences.defaultCurrency || 'CLP');
        setCurrentTransaction({
            merchant: '',
            date: getSafeDate(null),
            total: 0,
            category: 'Supermarket',
            items: []
        });
        // Story 9.10 AC#1, AC#3: Create new pending scan session
        setPendingScan(createPendingScan());
        setView('edit');
        if (autoOpenFilePicker) {
            setTimeout(() => fileInputRef.current?.click(), 200);
        }
    };

    // Story 9.9: Handler to remove a photo from scan images
    // Story 9.10: Also update pending scan state
    const handleRemovePhoto = (index: number) => {
        setScanImages(prev => {
            const updatedImages = prev.filter((_, i) => i !== index);
            // Story 9.10: Update pending scan with removed image
            if (pendingScan) {
                setPendingScan({
                    ...pendingScan,
                    images: updatedImages
                });
            }
            return updatedImages;
        });
    };

    // Story 9.9: Cancel handler for new transactions
    // Story 9.10 AC#4: Clear pending scan on cancel
    const handleCancelNewTransaction = () => {
        setScanImages([]);
        setScanError(null);
        setCurrentTransaction(null);
        // Story 9.10 AC#4: Clear pending scan state on cancel
        setPendingScan(null);
        setView('dashboard');
    };

    // Legacy scan handler (for backward compatibility during transition)
    const triggerScan = () => {
        handleNewTransaction(true);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const files = Array.from(e.target.files);
        const newImages = await Promise.all(
            files.map(
                f =>
                    new Promise<string>(resolve => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.readAsDataURL(f);
                    })
            )
        );
        setScanImages(p => {
            const updatedImages = [...p, ...newImages];
            // Story 9.10 AC#3: Update pending scan with new images
            if (pendingScan) {
                setPendingScan({
                    ...pendingScan,
                    images: updatedImages,
                    status: 'images_added'
                });
            }
            return updatedImages;
        });
        // Story 9.9: No longer navigate to 'scan' view - stay in EditView
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const processScan = async () => {
        // Story 9.10 AC#7: Check if user has credits before scanning
        if (userCredits.remaining <= 0) {
            setScanError(t('noCreditsMessage'));
            setToastMessage({ text: t('noCreditsMessage'), type: 'info' });
            return;
        }

        setIsAnalyzing(true);
        setScanError(null);
        // Story 9.10: Update pending scan status to 'analyzing'
        if (pendingScan) {
            setPendingScan({ ...pendingScan, status: 'analyzing' });
        }
        try {
            // Story 9.10 AC#6: Deduct 1 credit when scan starts
            setUserCredits(prev => ({
                remaining: prev.remaining - 1,
                used: prev.used + 1
            }));

            // Story 9.8: Pass scan options (currency and store type) to analyzeReceipt
            const result = await analyzeReceipt(
                scanImages,
                scanCurrency,
                scanStoreType !== 'auto' ? scanStoreType : undefined
            );
            let d = getSafeDate(result.date);
            if (new Date(d).getFullYear() > new Date().getFullYear())
                d = new Date().toISOString().split('T')[0];
            const merchant = result.merchant || 'Unknown';
            const finalTotal = parseStrictNumber(result.total);

            // Story 9.3: Determine country and city
            // 1. If scan detected country/city, validate city exists in our list (case-insensitive)
            // 2. If scan didn't detect, fall back to user's default location
            let finalCountry = result.country || '';
            let finalCity = result.city || '';

            if (finalCountry && finalCity) {
                // Validate scanned city exists in our list for that country (case-insensitive match)
                const availableCities = getCitiesForCountry(finalCountry);
                const scannedCityLower = finalCity.toLowerCase();
                const matchedCity = availableCities.find(c => c.toLowerCase() === scannedCityLower);
                // Use the properly-cased version from our list, or clear if not found
                finalCity = matchedCity || '';
            }

            // If no location detected from scan, use defaults
            if (!finalCountry && defaultCountry) {
                finalCountry = defaultCountry;
                finalCity = defaultCity; // Use default city if no country was detected
            } else if (finalCountry && !finalCity && defaultCountry === finalCountry && defaultCity) {
                // Same country detected but no city, use default city
                finalCity = defaultCity;
            }

            // Build initial transaction from Gemini response
            const initialTransaction: Transaction = {
                merchant: merchant,
                date: d,
                total: finalTotal,
                category: result.category || 'Other',
                alias: merchant,
                items: (result.items || []).map(i => ({
                    ...i,
                    price: parseStrictNumber(i.price)
                })),
                // Include image URLs from Cloud Function response
                imageUrls: result.imageUrls,
                thumbnailUrl: result.thumbnailUrl,
                // Story 9.1: v2.6.0 fields from AI extraction
                time: result.time,
                country: finalCountry,
                city: finalCity,
                currency: result.currency,
                receiptType: result.receiptType,
                promptVersion: result.promptVersion,
                merchantSource: result.merchantSource
            };

            // Story 6.4: Apply learned category mappings (AC#1-4)
            // Only matches with confidence > 0.7 are applied
            const { transaction: categorizedTransaction, appliedMappingIds } =
                applyCategoryMappings(initialTransaction, mappings);

            // Story 6.4 AC#5: Increment usage count for applied mappings (fire-and-forget)
            if (appliedMappingIds.length > 0 && user && services) {
                appliedMappingIds.forEach(mappingId => {
                    incrementMappingUsage(services.db, user.uid, services.appId, mappingId)
                        .catch(err => console.error('Failed to increment mapping usage:', err));
                });
            }

            // Story 9.5: Apply learned merchant→alias mapping (AC#4, #5, #6)
            // Merchant name = raw from receipt (stays as-is)
            // Alias = user's preferred display name (what we learn and auto-fill)
            let finalTransaction = categorizedTransaction;
            const merchantMatch = findMerchantMatch(categorizedTransaction.merchant);
            if (merchantMatch && merchantMatch.confidence > 0.7) {
                // AC#5: Apply matched alias (targetMerchant stores the preferred alias)
                finalTransaction = {
                    ...finalTransaction,
                    alias: merchantMatch.mapping.targetMerchant,
                    // AC#6: Mark as learned
                    merchantSource: 'learned' as const
                };

                // AC#7: Increment mapping usage count (fire-and-forget)
                if (merchantMatch.mapping.id && user && services) {
                    incrementMerchantMappingUsage(services.db, user.uid, services.appId, merchantMatch.mapping.id)
                        .catch(err => console.error('Failed to increment merchant mapping usage:', err));
                }
            }

            setCurrentTransaction(finalTransaction);
            // Story 9.10: Update pending scan with analyzed transaction (status = 'analyzed')
            // Keep images for reference, but mark as analyzed
            if (pendingScan) {
                setPendingScan({
                    ...pendingScan,
                    analyzedTransaction: finalTransaction,
                    status: 'analyzed'
                });
            }
            // Clear local scan images since they're now stored in transaction
            setScanImages([]);
            setView('edit');
        } catch (e: any) {
            const errorMessage = 'Failed: ' + e.message;
            setScanError(errorMessage);
            // Story 9.10: Update pending scan with error status
            if (pendingScan) {
                setPendingScan({
                    ...pendingScan,
                    status: 'error',
                    error: errorMessage
                });
            }
            setToastMessage({ text: t('scanFailed'), type: 'info' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Transaction Handlers
    // Note: We use fire-and-forget pattern because Firestore's offline persistence
    // means addDoc/updateDoc/deleteDoc may not resolve until server confirms,
    // but local cache updates immediately. Navigate optimistically.
    const saveTransaction = async () => {
        if (!services || !user || !currentTransaction) return;
        const { db, appId } = services;

        const tDoc = {
            ...currentTransaction,
            total: parseStrictNumber(currentTransaction.total)
        };

        // Fire the Firestore operation (don't await - it will sync in background)
        if (currentTransaction.id) {
            firestoreUpdateTransaction(db, user.uid, appId, currentTransaction.id, tDoc)
                .catch(e => console.error('Update failed:', e));
        } else {
            firestoreAddTransaction(db, user.uid, appId, tDoc)
                .catch(e => console.error('Add failed:', e));
        }

        // Navigate immediately (optimistic UI)
        setView('dashboard');
        setCurrentTransaction(null);
        // Story 9.10 AC#4: Clear pending scan on successful save
        setPendingScan(null);
    };

    const deleteTransaction = async (id: string) => {
        if (!services || !user) return;
        if (!window.confirm('Delete?')) return;

        // Fire the delete (don't await)
        firestoreDeleteTransaction(services.db, user.uid, services.appId, id)
            .catch(e => console.error('Delete failed:', e));

        // Navigate immediately
        setView('dashboard');
    };

    const wipeDB = async () => {
        if (!window.confirm(t('wipeConfirm'))) return;
        if (!services || !user) return;
        setWiping(true);
        try {
            await wipeAllTransactions(services.db, user.uid, services.appId);
            alert(t('cleaned'));
        } catch (e) {
            alert('Failed to wipe');
        }
        setWiping(false);
    };

    // Export Data Handler (Story 5.2)
    const handleExportData = async () => {
        // AC#7: Empty state handling - check if no transactions
        if (transactions.length === 0) {
            setToastMessage({ text: t('noTransactionsToExport'), type: 'info' });
            return;
        }

        setExporting(true);
        try {
            // AC#4: Use requestAnimationFrame for non-blocking UI
            await new Promise(resolve => requestAnimationFrame(resolve));
            // AC#8: Use downloadBasicData from csvExport.ts (Story 5.1)
            downloadBasicData(transactions);
            // AC#6: Success feedback
            setToastMessage({ text: t('exportSuccess'), type: 'success' });
        } finally {
            setExporting(false);
        }
    };

    // Story 7.12: Theme setup using CSS custom properties (AC #6, #7, #11)
    // Story 7.17: Renamed themes - 'normal' (warm, was ghibli) is default, 'professional' (cool, was default)
    // The 'dark' class activates CSS variable overrides defined in index.html
    // The data-theme attribute activates color theme variations (normal or professional)
    const isDark = theme === 'dark';
    const themeClass = isDark ? 'dark' : '';
    const dataTheme = colorTheme === 'professional' ? 'professional' : undefined;

    // Synchronously update document.documentElement during render
    // This ensures CSS variables are available before children read them
    // Note: This is intentionally NOT in useEffect to avoid timing issues with useMemo
    if (typeof document !== 'undefined') {
        const html = document.documentElement;
        if (isDark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        // 'normal' theme (warm colors) is base CSS, 'professional' is the override
        if (colorTheme === 'professional') {
            html.setAttribute('data-theme', 'professional');
        } else {
            html.removeAttribute('data-theme');
        }
    }

    if (initError) {
        return <div className="p-10 text-center text-red-500 font-bold">Error: {initError}</div>;
    }

    if (!user) {
        return <LoginScreen onSignIn={signIn} onTestSignIn={() => signInWithTestCredentials()} t={t} />;
    }

    // Compute pagination data for history view
    const totalHistoryPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
    const historyTrans = transactions.slice(
        (historyPage - 1) * ITEMS_PER_PAGE,
        historyPage * ITEMS_PER_PAGE
    );

    // Story 9.11: Compute recently added transactions for dashboard
    // Sort by createdAt (descending) to show last 5 ADDED transactions
    // This is different from transactions (sorted by date) - shows recency of entry
    const recentlyAddedTransactions = [...transactions]
        .sort((a, b) => {
            // Handle createdAt as Firestore Timestamp or Date
            const getTime = (tx: Transaction): number => {
                if (!tx.createdAt) return 0;
                // Firestore Timestamp has toDate() method
                if (typeof tx.createdAt.toDate === 'function') {
                    return tx.createdAt.toDate().getTime();
                }
                // Fallback to Date parsing
                return new Date(tx.createdAt).getTime();
            };
            return getTime(b) - getTime(a);
        })
        .slice(0, 5);

    return (
        <div
            className={`min-h-screen max-w-md mx-auto shadow-xl border-x relative ${themeClass}`}
            data-theme={dataTheme}
            style={{
                backgroundColor: 'var(--bg)',
                color: 'var(--primary)',
                borderColor: isDark ? '#1e293b' : '#e2e8f0',
            }}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
            />

            <main className="p-6 pb-24 h-full overflow-y-auto">
                {view === 'dashboard' && (
                    <DashboardView
                        transactions={recentlyAddedTransactions as any}
                        t={t}
                        currency={currency}
                        dateFormat={dateFormat}
                        theme={theme}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate as any}
                        getSafeDate={getSafeDate}
                        onCreateNew={() => handleNewTransaction(false)}
                        onViewTrends={(_month: string | null) => {
                            // Navigation state is now managed by AnalyticsContext
                            // TODO: If month is provided, we could set initial context state
                            setView('trends');
                        }}
                        onEditTransaction={(transaction: any) => {
                            setCurrentTransaction(transaction);
                            setView('edit');
                        }}
                        onTriggerScan={triggerScan}
                        // Story 9.11: Pass all transactions for total/month calculations
                        allTransactions={transactions as any}
                        // Story 9.12: Language for category translations
                        lang={lang}
                    />
                )}

                {/* Story 9.9: ScanView is deprecated - scan functionality is now in EditView
                {view === 'scan' && (
                    <ScanView
                        scanImages={scanImages}
                        isAnalyzing={isAnalyzing}
                        scanError={scanError}
                        theme={theme}
                        t={t}
                        onBack={() => setView('dashboard')}
                        onAddPhoto={() => fileInputRef.current?.click()}
                        onProcessScan={processScan}
                    />
                )}
                */}

                {view === 'edit' && currentTransaction && (
                    <EditView
                        currentTransaction={currentTransaction as any}
                        editingItemIndex={editingItemIndex}
                        distinctAliases={distinctAliases}
                        theme={theme}
                        currency={currency}
                        t={t}
                        storeCategories={STORE_CATEGORIES as unknown as string[]}
                        formatCurrency={formatCurrency}
                        parseStrictNumber={parseStrictNumber}
                        onBack={() => setView('dashboard')}
                        onSave={saveTransaction}
                        onDelete={deleteTransaction}
                        onUpdateTransaction={setCurrentTransaction as any}
                        onSetEditingItemIndex={setEditingItemIndex}
                        onSaveMapping={saveMapping}
                        onSaveMerchantMapping={saveMerchantMapping}
                        onShowToast={(text: string) => setToastMessage({ text, type: 'success' })}
                        // Story 9.9: Cancel handler for new transactions
                        onCancel={!currentTransaction.id ? handleCancelNewTransaction : undefined}
                        // Story 9.9: Scan-related props for unified transaction flow (only for new transactions)
                        scanImages={!currentTransaction.id ? scanImages : undefined}
                        onAddPhoto={!currentTransaction.id ? () => fileInputRef.current?.click() : undefined}
                        onRemovePhoto={!currentTransaction.id ? handleRemovePhoto : undefined}
                        onProcessScan={!currentTransaction.id ? processScan : undefined}
                        isAnalyzing={!currentTransaction.id ? isAnalyzing : undefined}
                        scanError={!currentTransaction.id ? scanError : undefined}
                        // Story 9.8: Scan options (store type and currency)
                        scanStoreType={!currentTransaction.id ? scanStoreType : undefined}
                        onSetScanStoreType={!currentTransaction.id ? setScanStoreType : undefined}
                        scanCurrency={!currentTransaction.id ? scanCurrency : undefined}
                        onSetScanCurrency={!currentTransaction.id ? setScanCurrency : undefined}
                        // Story 9.10: Pending scan for visual indicator (AC #5)
                        pendingScan={!currentTransaction.id ? pendingScan : undefined}
                        // Story 9.10: Credits for display and scan blocking (AC #6, #7)
                        userCredits={userCredits}
                        // Story 9.12: Language for category translations (AC #6)
                        lang={lang}
                    />
                )}

                {view === 'trends' && (
                    <AnalyticsProvider>
                        <TrendsView
                            transactions={transactions}
                            theme={theme as 'light' | 'dark'}
                            colorTheme={colorTheme}
                            currency={currency}
                            locale={lang}
                            t={t}
                            onEditTransaction={(transaction) => {
                                setCurrentTransaction(transaction);
                                setView('edit');
                            }}
                            exporting={exporting}
                            onExporting={setExporting}
                            onUpgradeRequired={() => {
                                setToastMessage({ text: t('upgradeRequired'), type: 'info' });
                            }}
                        />
                    </AnalyticsProvider>
                )}

                {view === 'list' && (
                    <HistoryView
                        historyTrans={historyTrans as any}
                        historyPage={historyPage}
                        totalHistoryPages={totalHistoryPages}
                        theme={theme}
                        currency={currency}
                        dateFormat={dateFormat}
                        t={t}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate as any}
                        onBack={() => setView('dashboard')}
                        onEditTransaction={(transaction: any) => {
                            setCurrentTransaction(transaction);
                            setView('edit');
                        }}
                        onSetHistoryPage={setHistoryPage}
                        // Story 9.11: Duplicate detection and normalization props (AC #1-7)
                        allTransactions={transactions as any}
                        defaultCity={defaultCity}
                        defaultCountry={defaultCountry}
                        // Story 9.12: Language for category translations (AC #1, #2)
                        lang={lang}
                    />
                )}

                {view === 'settings' && (
                    <SettingsView
                        lang={lang}
                        currency={currency}
                        theme={theme}
                        dateFormat={dateFormat}
                        wiping={wiping}
                        exporting={exporting}
                        t={t}
                        onSetLang={(l: string) => setLang(l as Language)}
                        onSetCurrency={(c: string) => setCurrency(c as Currency)}
                        onSetTheme={(th: string) => setTheme(th as Theme)}
                        onSetDateFormat={(f: string) => setDateFormat(f as 'LatAm' | 'US')}
                        onExportAll={handleExportData}
                        onWipeDB={wipeDB}
                        onSignOut={signOut}
                        // Story 6.5: Category mappings management
                        // Story 9.7 enhancement: Edit functionality added
                        mappings={mappings}
                        mappingsLoading={mappingsLoading}
                        onDeleteMapping={deleteMapping}
                        onEditMapping={(id, cat) => updateCategoryMapping(id, cat as StoreCategory)}
                        // Story 7.12 AC#11: Color theme selector
                        colorTheme={colorTheme}
                        onSetColorTheme={(ct: string) => setColorTheme(ct as ColorTheme)}
                        // Story 9.3: Default location settings
                        defaultCountry={defaultCountry}
                        defaultCity={defaultCity}
                        onSetDefaultCountry={setDefaultCountry}
                        onSetDefaultCity={setDefaultCity}
                        // Story 9.7: Merchant mappings management
                        merchantMappings={merchantMappings}
                        merchantMappingsLoading={merchantMappingsLoading}
                        onDeleteMerchantMapping={deleteMerchantMapping}
                        onEditMerchantMapping={updateMerchantMapping}
                        // Story 9.8: Default scan currency setting
                        defaultScanCurrency={userPreferences.defaultCurrency}
                        onSetDefaultScanCurrency={setDefaultScanCurrencyPref}
                    />
                )}
            </main>

            <Nav
                view={view}
                setView={(v: string) => setView(v as View)}
                onScanClick={triggerScan}
                onTrendsClick={() => {
                    // Navigation state is now managed by AnalyticsContext
                    // Context resets to year level when mounted
                }}
                theme={theme}
                t={t}
            />

            {/* Toast notification for feedback (AC#6, AC#7) */}
            {toastMessage && (
                <div
                    role="status"
                    aria-live="polite"
                    className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in ${
                        toastMessage.type === 'success'
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-500 text-white'
                    }`}
                >
                    {toastMessage.text}
                </div>
            )}
        </div>
    );
}

export default App;
