import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';
import { useCategoryMappings } from './hooks/useCategoryMappings';
import { useMerchantMappings } from './hooks/useMerchantMappings';
import { useSubcategoryMappings } from './hooks/useSubcategoryMappings';
import { useUserPreferences } from './hooks/useUserPreferences';
// Story 10.6: Insight profile hook for insight generation
import { useInsightProfile } from './hooks/useInsightProfile';
// Story 10.7: Batch session tracking for multi-receipt scanning
import { useBatchSession } from './hooks/useBatchSession';
import { LoginScreen } from './views/LoginScreen';
import { DashboardView } from './views/DashboardView';
// Story 9.9: ScanView is deprecated - scan functionality is now in EditView
// import { ScanView } from './views/ScanView';
import { EditView } from './views/EditView';
import { TrendsView } from './views/TrendsView';
// Story 10a.4: Insights History View (replaces HistoryView in insights tab)
import { InsightsView } from './views/InsightsView';
import { SettingsView } from './views/SettingsView';
import { Nav } from './components/Nav';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
// Story 10.6: Insight card components
import { InsightCard } from './components/insights/InsightCard';
import { BuildingProfileCard } from './components/insights/BuildingProfileCard';
// Story 10.7: Batch summary component
import { BatchSummary } from './components/insights/BatchSummary';
// Story 11.1: Batch upload components for multi-image processing
import { BatchUploadPreview, BatchProcessingProgress, MAX_BATCH_IMAGES } from './components/scan';
import type { BatchItemResult } from './components/scan';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
// Story 10a.2: Import for building analytics initial state
import { getQuarterFromMonth } from './utils/analyticsHelpers';
import type { AnalyticsNavigationState } from './types/analytics';
import { HistoryFiltersProvider, type HistoryFilterState } from './contexts/HistoryFiltersContext';
import type { HistoryNavigationPayload } from './views/TrendsView';
import { analyzeReceipt, ReceiptType } from './services/gemini';
import { SupportedCurrency } from './services/userPreferencesService';
import {
    addTransaction as firestoreAddTransaction,
    updateTransaction as firestoreUpdateTransaction,
    deleteTransaction as firestoreDeleteTransaction,
    wipeAllTransactions
} from './services/firestore';
// Story 10.6: Insight generation service
// Story 10.7: Added silence and historical comparison functions
import {
    generateInsightForTransaction,
    silenceInsights,
    clearSilence,
    isInsightsSilenced,
    getLastWeekTotal,
    setLocalCache,
} from './services/insightEngineService';
import { Transaction, StoreCategory } from './types/transaction';
// Story 10.6: Insight types
import { Insight } from './types/insight';
import { Language, Currency, Theme, ColorTheme } from './types/settings';
// Story 9.10: Persistent scan state management
import { PendingScan, UserCredits, DEFAULT_CREDITS, createPendingScan } from './types/scan';
import { formatCurrency } from './utils/currency';
import { formatDate } from './utils/date';
import { getSafeDate, parseStrictNumber } from './utils/validation';
import { downloadBasicData } from './utils/csvExport';
import { TRANSLATIONS } from './utils/translations';
// Story 10a.4: ITEMS_PER_PAGE removed - no longer used after HistoryView replaced
import { STORE_CATEGORIES } from './config/constants';
import { applyCategoryMappings } from './utils/categoryMatcher';
import { incrementMappingUsage } from './services/categoryMappingService';
import { incrementMerchantMappingUsage } from './services/merchantMappingService';
import { getCitiesForCountry } from './data/locations';

// Story 10a.3: Changed 'list' to 'insights' (InsightsView will be added in 10a.4)
type View = 'dashboard' | 'scan' | 'edit' | 'trends' | 'insights' | 'settings';

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
    // Story 9.15: Subcategory mappings for learning and management
    const {
        mappings: subcategoryMappings,
        loading: subcategoryMappingsLoading,
        saveMapping: saveSubcategoryMapping,
        deleteMapping: deleteSubcategoryMapping,
        updateMappingTarget: updateSubcategoryMapping
    } = useSubcategoryMappings(user, services);
    // Story 9.8: User preferences for default scan currency
    const {
        preferences: userPreferences,
        setDefaultCurrency: setDefaultScanCurrencyPref
    } = useUserPreferences(user, services);
    // Story 10.6: Insight profile for insight generation
    const {
        profile: insightProfile,
        cache: insightCache,
        recordShown: recordInsightShown,
        trackTransaction: trackTransactionForInsight,
        incrementCounter: incrementInsightCounter,
    } = useInsightProfile(user, services);
    // Story 10.7: Batch session tracking for multi-receipt scanning
    const {
        session: batchSession,
        addToBatch,
        clearBatch,
        // isBatchMode is exposed by hook but we calculate it inline in JSX
    } = useBatchSession();

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
    // Story 10.6: Insight card state (AC #1, #4)
    const [currentInsight, setCurrentInsight] = useState<Insight | null>(null);
    const [showInsightCard, setShowInsightCard] = useState(false);
    // Story 10.7: Batch summary state (AC #1, #2)
    const [showBatchSummary, setShowBatchSummary] = useState(false);
    // Story 11.1: Batch upload state for multi-image processing (AC #1-9)
    const [batchImages, setBatchImages] = useState<string[]>([]);
    const [showBatchPreview, setShowBatchPreview] = useState(false);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
    const [batchResults, setBatchResults] = useState<BatchItemResult[]>([]);
    // Story 11.1: Cancel batch processing state (state for future UI use, ref for loop)
    const [_batchCancelRequested, setBatchCancelRequested] = useState(false);
    const [showBatchCancelConfirm, setShowBatchCancelConfirm] = useState(false);
    const batchCancelRef = useRef(false); // Ref for immediate access in loop

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

    // Story 10a.4: historyPage state removed - HistoryView no longer used in insights tab
    const [distinctAliases, setDistinctAliases] = useState<string[]>([]);

    // Story 9.20: Pending filters for navigation from Analytics to History
    // When user clicks a badge in Analytics, we store the filters here,
    // then pass them as initialState to HistoryFiltersProvider
    const [pendingHistoryFilters, setPendingHistoryFilters] = useState<HistoryFilterState | null>(null);

    // Story 10a.2: Initial analytics state for "This Month" navigation
    // When user clicks "This Month" card, store the month to initialize TrendsView at month level
    const [analyticsInitialState, setAnalyticsInitialState] = useState<AnalyticsNavigationState | null>(null);

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

    // Story 9.20: Clear pending history filters when navigating AWAY from insights view
    // Story 10a.3: Renamed 'list' to 'insights'
    // This ensures filters are applied when entering insights view, but cleared when leaving
    // so that returning to insights view normally shows unfiltered transactions
    useEffect(() => {
        // Clear filters when navigating away from insights view (not when entering it)
        if (view !== 'insights' && pendingHistoryFilters) {
            setPendingHistoryFilters(null);
        }
    }, [view]); // Only depend on view, not pendingHistoryFilters

    // Story 10a.2: Clear analytics initial state when navigating AWAY from trends view
    // This ensures initial state is applied when entering trends, but cleared when leaving
    // so that returning to trends normally shows year-level view
    useEffect(() => {
        if (view !== 'trends' && analyticsInitialState) {
            setAnalyticsInitialState(null);
        }
    }, [view]); // Only depend on view, not analyticsInitialState

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

        // Story 11.1: Detect multi-image upload (AC #2, #7)
        if (newImages.length > 1) {
            // Check max limit (AC #7)
            if (newImages.length > MAX_BATCH_IMAGES) {
                setToastMessage({ text: t('batchMaxLimitError'), type: 'info' });
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            // Show batch preview (AC #2)
            setBatchImages(newImages);
            setShowBatchPreview(true);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Single image - standard flow (AC #1)
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

    // Story 11.1: Batch image processing (AC #3, #4, #5, #6)
    // Process each image separately and create individual transactions
    const processBatchImages = async () => {
        if (!services || !user) return;
        if (userCredits.remaining < batchImages.length) {
            setToastMessage({ text: t('noCreditsMessage'), type: 'info' });
            return;
        }

        setShowBatchPreview(false);
        setIsBatchProcessing(true);
        setBatchProgress({ current: 0, total: batchImages.length });
        // Reset cancel state
        setBatchCancelRequested(false);
        setShowBatchCancelConfirm(false);
        batchCancelRef.current = false;

        // Initialize results with pending status
        const initialResults: BatchItemResult[] = batchImages.map((_, index) => ({
            index,
            status: 'pending' as const,
        }));
        setBatchResults(initialResults);

        const results: BatchItemResult[] = [...initialResults];
        const { db, appId } = services;

        // Process each image sequentially (AC #3)
        for (let i = 0; i < batchImages.length; i++) {
            // Check for cancel request before processing next image
            if (batchCancelRef.current) {
                // Mark remaining items as cancelled (not processed)
                for (let j = i; j < batchImages.length; j++) {
                    results[j] = { ...results[j], status: 'pending' };
                }
                setBatchResults([...results]);
                break;
            }

            // Update current item to processing
            results[i] = { ...results[i], status: 'processing' };
            setBatchResults([...results]);
            setBatchProgress({ current: i + 1, total: batchImages.length });

            try {
                // Process single image (credit deducted after successful save)
                const result = await analyzeReceipt(
                    [batchImages[i]],
                    scanCurrency,
                    scanStoreType !== 'auto' ? scanStoreType : undefined
                );

                let d = getSafeDate(result.date);
                if (new Date(d).getFullYear() > new Date().getFullYear())
                    d = new Date().toISOString().split('T')[0];
                const merchant = result.merchant || 'Unknown';
                const finalTotal = parseStrictNumber(result.total);

                // Apply location logic
                const finalCountry = result.country || defaultCountry || '';
                let finalCity = result.city || '';
                if (finalCountry && finalCity) {
                    const availableCities = getCitiesForCountry(finalCountry);
                    const matchedCity = availableCities.find(c => c.toLowerCase() === finalCity.toLowerCase());
                    finalCity = matchedCity || '';
                }
                if (!finalCity && defaultCountry === finalCountry && defaultCity) {
                    finalCity = defaultCity;
                }

                // Build transaction
                const transaction: Transaction = {
                    merchant: merchant,
                    date: d,
                    total: finalTotal,
                    category: result.category || 'Other',
                    alias: merchant,
                    items: (result.items || []).map(item => ({
                        ...item,
                        price: parseStrictNumber(item.price)
                    })),
                    imageUrls: result.imageUrls,
                    thumbnailUrl: result.thumbnailUrl,
                    time: result.time,
                    country: finalCountry,
                    city: finalCity,
                    currency: result.currency,
                    receiptType: result.receiptType,
                    promptVersion: result.promptVersion,
                    merchantSource: result.merchantSource
                };

                // Apply category mappings
                const { transaction: categorizedTx, appliedMappingIds } =
                    applyCategoryMappings(transaction, mappings);

                // Increment mapping usage (fire-and-forget)
                if (appliedMappingIds.length > 0) {
                    appliedMappingIds.forEach(mappingId => {
                        incrementMappingUsage(db, user.uid, appId, mappingId)
                            .catch(err => console.error('Failed to increment mapping usage:', err));
                    });
                }

                // Apply merchant mappings
                let finalTx = categorizedTx;
                const merchantMatch = findMerchantMatch(categorizedTx.merchant);
                if (merchantMatch && merchantMatch.confidence > 0.7) {
                    finalTx = {
                        ...finalTx,
                        alias: merchantMatch.mapping.targetMerchant,
                        merchantSource: 'learned' as const
                    };
                    if (merchantMatch.mapping.id) {
                        incrementMerchantMappingUsage(db, user.uid, appId, merchantMatch.mapping.id)
                            .catch(err => console.error('Failed to increment merchant mapping usage:', err));
                    }
                }

                // Save transaction (AC #8)
                const transactionId = await firestoreAddTransaction(db, user.uid, appId, finalTx);
                const txWithId = { ...finalTx, id: transactionId };

                // Deduct credit AFTER successful save (prevents credit loss on API failure)
                setUserCredits(prev => ({
                    remaining: prev.remaining - 1,
                    used: prev.used + 1
                }));

                // Add to batch session for summary
                const insight = await generateInsightForTransaction(
                    txWithId,
                    transactions,
                    insightProfile || { schemaVersion: 1, firstTransactionDate: null as any, totalTransactions: 0, recentInsights: [] },
                    insightCache
                );
                addToBatch(txWithId, insight);

                // Update result to success
                results[i] = {
                    index: i,
                    status: 'success',
                    merchant: finalTx.alias || finalTx.merchant,
                    total: finalTx.total,
                };
                setBatchResults([...results]);

            } catch (error: any) {
                // AC #6: Continue with remaining images on failure
                console.error(`Batch image ${i + 1} failed:`, error);
                results[i] = {
                    index: i,
                    status: 'failed',
                    error: error.message || 'Unknown error',
                };
                setBatchResults([...results]);
            }
        }

        // Processing complete
        setIsBatchProcessing(false);

        // Count successes
        const successCount = results.filter(r => r.status === 'success').length;
        const failCount = results.filter(r => r.status === 'failed').length;

        // AC #5: Show batch summary after all processed
        if (successCount > 0) {
            // Short delay to show completion state (matches READY_DISPLAY_MS from useScanState)
            const BATCH_COMPLETE_DELAY_MS = 500;
            setTimeout(() => {
                setShowBatchSummary(true);
                setBatchImages([]);
                setBatchResults([]);
            }, BATCH_COMPLETE_DELAY_MS);
        } else {
            // All failed - show error
            setToastMessage({ text: t('scanFailed'), type: 'info' });
            setBatchImages([]);
            setBatchResults([]);
        }

        // Show partial failure warning (AC #6)
        if (failCount > 0 && successCount > 0) {
            setToastMessage({
                text: t('batchPartialWarning').replace('{count}', String(failCount)),
                type: 'info'
            });
        }
    };

    // Story 11.1: Cancel batch preview
    const handleCancelBatchPreview = () => {
        setShowBatchPreview(false);
        setBatchImages([]);
    };

    // Story 11.1: Handle cancel request during batch processing
    const handleBatchCancelRequest = () => {
        // Show confirmation dialog
        setShowBatchCancelConfirm(true);
    };

    // Story 11.1: Confirm batch cancellation
    const handleBatchCancelConfirm = () => {
        batchCancelRef.current = true;
        setBatchCancelRequested(true);
        setShowBatchCancelConfirm(false);
    };

    // Story 11.1: Dismiss cancel confirmation (continue processing)
    const handleBatchCancelDismiss = () => {
        setShowBatchCancelConfirm(false);
    };

    // Story 11.1: Remove image from batch
    const handleRemoveBatchImage = (index: number) => {
        setBatchImages(prev => {
            const updated = prev.filter((_, i) => i !== index);
            // If only 1 image left, switch to single image flow
            if (updated.length === 1) {
                setShowBatchPreview(false);
                setScanImages(updated);
                // Initialize pending scan for single image
                if (!pendingScan) {
                    setPendingScan(createPendingScan());
                }
                setPendingScan(prev => prev ? { ...prev, images: updated, status: 'images_added' } : null);
                setView('edit');
                return [];
            }
            return updated;
        });
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

        // Navigate immediately (optimistic UI) - AC #4: Card appears AFTER save confirmation
        setView('dashboard');
        setCurrentTransaction(null);
        // Story 9.10 AC#4: Clear pending scan on successful save
        setPendingScan(null);

        // Fire the Firestore operation and chain insight generation for new transactions
        if (currentTransaction.id) {
            // Update existing transaction - no insight generation
            firestoreUpdateTransaction(db, user.uid, appId, currentTransaction.id, tDoc)
                .catch(e => console.error('Update failed:', e));
        } else {
            // Story 10.6: Async side-effect pattern for insight generation (AC #2)
            // Story 10.7: Extended for batch mode tracking and silence support
            // Story 10a.4: Chain operations to capture real transaction ID for insight history

            // Increment scan counter for sprinkle distribution
            incrementInsightCounter();

            // Get profile or use default if not loaded yet
            const profile = insightProfile || {
                schemaVersion: 1 as const,
                firstTransactionDate: null as any,
                totalTransactions: 0,
                recentInsights: [],
            };

            // Story 10.7 AC#7: Check if insights are silenced
            const silenced = isInsightsSilenced(insightCache);

            // Fire and forget chain: add transaction → generate insight → record with real ID
            firestoreAddTransaction(db, user.uid, appId, tDoc)
                .then(async (transactionId) => {
                    // Generate insight with real transaction ID
                    const txWithId = { ...tDoc, id: transactionId } as Transaction;
                    const insight = await generateInsightForTransaction(
                        txWithId,
                        transactions,
                        profile,
                        insightCache
                    );

                    // Story 10.7: Add transaction and insight to batch session
                    addToBatch(txWithId, insight);

                    // Story 10.7 AC#7: If silenced, skip showing individual insight
                    if (silenced) {
                        // Still track transaction for stats but don't show card
                        const txDate = tDoc.date ? new Date(tDoc.date) : new Date();
                        trackTransactionForInsight(txDate)
                            .catch(err => console.warn('Failed to track transaction:', err));
                        return;
                    }

                    // Story 10.7 AC#1: Show batch summary when 3+ receipts (after adding current)
                    // Check updated batch session (addToBatch is async state update, so check count + 1)
                    const willBeBatchMode = (batchSession?.receipts.length ?? 0) + 1 >= 3;
                    if (willBeBatchMode) {
                        setShowBatchSummary(true);
                        // Don't show individual insight card in batch mode
                    } else {
                        // Standard insight card flow
                        setCurrentInsight(insight);
                        setShowInsightCard(true);
                    }

                    // AC #9: Record insight shown in UserInsightProfile (if not fallback)
                    // Story 10a.4: Pass real transaction ID and full insight content for history
                    if (insight && insight.id !== 'building_profile') {
                        recordInsightShown(insight.id, transactionId, {
                            title: insight.title,
                            message: insight.message,
                            icon: insight.icon,
                            category: insight.category,
                        }).catch(err => console.warn('Failed to record insight:', err));
                    }

                    // Track transaction for profile stats (fire-and-forget)
                    const txDate = tDoc.date ? new Date(tDoc.date) : new Date();
                    trackTransactionForInsight(txDate)
                        .catch(err => console.warn('Failed to track transaction:', err));
                })
                .catch(err => {
                    console.warn('Transaction save or insight generation failed:', err);
                    // Story 10.7: Still add to batch even if insight generation failed
                    const txWithTemp = { ...tDoc, id: 'temp' } as Transaction;
                    addToBatch(txWithTemp, null);

                    // Story 10.7: Show batch summary if in batch mode, otherwise fallback card
                    if (!silenced) {
                        const willBeBatchMode = (batchSession?.receipts.length ?? 0) + 1 >= 3;
                        if (willBeBatchMode) {
                            setShowBatchSummary(true);
                        } else {
                            // Show fallback on error - never show nothing (AC #3)
                            setCurrentInsight(null);
                            setShowInsightCard(true);
                        }
                    }
                });
        }
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

    // Story 9.20: Handler for navigating from Analytics to History with pre-applied filters (AC #4)
    // Story 10a.4: This now navigates to InsightsView (pending filters kept for future use)
    // This is called when user clicks a transaction count badge on a drill-down card
    const handleNavigateToHistory = (payload: HistoryNavigationPayload) => {
        // Create a complete filter state from the navigation payload
        const filterState: HistoryFilterState = {
            temporal: payload.temporal,
            category: payload.category,
            location: {}, // Location filter not set from analytics navigation
        };

        // Store the filters (kept for potential future use with filtered insights)
        setPendingHistoryFilters(filterState);

        // Navigate to insights view (Story 10a.4: now shows InsightsView)
        setView('insights');
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

    // Story 10a.4: History pagination removed - HistoryView replaced with InsightsView

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
                {/* Story 10a.1: Wrap DashboardView with HistoryFiltersProvider for filter context (AC #2, #6) */}
                {view === 'dashboard' && (
                    <HistoryFiltersProvider>
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
                            onViewTrends={(month: string | null) => {
                                // Story 10a.2: Build initial analytics state when month is provided (AC #1, #2)
                                if (month) {
                                    // month format is "YYYY-MM" (e.g., "2024-12")
                                    const year = month.substring(0, 4);
                                    const quarter = getQuarterFromMonth(month);
                                    setAnalyticsInitialState({
                                        temporal: {
                                            level: 'month',
                                            year,
                                            quarter,
                                            month,
                                        },
                                        category: { level: 'all' },
                                        chartMode: 'aggregation',
                                        drillDownMode: 'temporal',
                                    });
                                } else {
                                    // Total Spent - default to year view
                                    setAnalyticsInitialState(null);
                                }
                                setView('trends');
                            }}
                            onEditTransaction={(transaction: any) => {
                                setCurrentTransaction(transaction);
                                setView('edit');
                            }}
                            onTriggerScan={triggerScan}
                            // Story 10a.1: Pass all transactions for full paginated list (AC #3)
                            allTransactions={transactions as any}
                            // Story 9.12: Language for category translations
                            lang={lang}
                        />
                    </HistoryFiltersProvider>
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
                        language={lang}
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
                        // Story 9.15: Subcategory learning prompt
                        onSaveSubcategoryMapping={saveSubcategoryMapping}
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
                    // Story 10a.2: Pass initial state to navigate to specific month (AC #1, #2)
                    // Key forces remount when initial state changes to apply new initial value
                    <AnalyticsProvider
                        key={analyticsInitialState ? JSON.stringify(analyticsInitialState.temporal) : 'default'}
                        initialState={analyticsInitialState ?? undefined}
                    >
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
                            // Story 9.20: Navigation from analytics badge to filtered History (AC #3)
                            onNavigateToHistory={handleNavigateToHistory}
                        />
                    </AnalyticsProvider>
                )}

                {/* Story 10a.4: InsightsView - Insight History (AC #1-6) */}
                {view === 'insights' && (
                    <InsightsView
                        onBack={() => setView('dashboard')}
                        onEditTransaction={(transactionId: string) => {
                            // AC4: Navigate to transaction by finding it in the list
                            const tx = transactions.find(t => t.id === transactionId);
                            if (tx) {
                                setCurrentTransaction(tx);
                                setView('edit');
                            }
                        }}
                        theme={theme}
                        t={t}
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
                        // Story 9.15: Subcategory mappings management
                        subcategoryMappings={subcategoryMappings}
                        subcategoryMappingsLoading={subcategoryMappingsLoading}
                        onDeleteSubcategoryMapping={deleteSubcategoryMapping}
                        onUpdateSubcategoryMapping={updateSubcategoryMapping}
                        // Story 9.18: Push notifications settings
                        db={services?.db || null}
                        userId={user?.uid || null}
                        appId={services?.appId || null}
                        onShowToast={(text: string) => setToastMessage({ text, type: 'success' })}
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

            {/* Story 9.14: PWA update notification */}
            <PWAUpdatePrompt />

            {/* Story 10.6: Insight card after transaction save (AC #1, #3, #4) */}
            {showInsightCard && (
                currentInsight && currentInsight.id !== 'building_profile'
                    ? <InsightCard
                        insight={currentInsight}
                        onDismiss={() => setShowInsightCard(false)}
                        theme={theme as 'light' | 'dark'}
                      />
                    : <BuildingProfileCard
                        onDismiss={() => setShowInsightCard(false)}
                        theme={theme as 'light' | 'dark'}
                      />
            )}

            {/* Story 11.1: Batch upload preview for multi-image selection (AC #2) */}
            {showBatchPreview && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <BatchUploadPreview
                        images={batchImages}
                        theme={theme as 'light' | 'dark'}
                        t={t}
                        onConfirm={processBatchImages}
                        onCancel={handleCancelBatchPreview}
                        onRemoveImage={handleRemoveBatchImage}
                    />
                </div>
            )}

            {/* Story 11.1: Batch processing progress (AC #4) */}
            {isBatchProcessing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <BatchProcessingProgress
                        current={batchProgress.current}
                        total={batchProgress.total}
                        results={batchResults}
                        theme={theme as 'light' | 'dark'}
                        currency={currency}
                        t={t}
                        onCancel={handleBatchCancelRequest}
                    />
                </div>
            )}

            {/* Story 11.1: Batch cancel confirmation dialog */}
            {showBatchCancelConfirm && (
                <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
                    <div
                        className="rounded-xl p-6 max-w-sm w-full shadow-xl"
                        style={{
                            backgroundColor: 'var(--surface)',
                            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                        }}
                        role="alertdialog"
                        aria-labelledby="cancel-dialog-title"
                        aria-describedby="cancel-dialog-desc"
                    >
                        <h3
                            id="cancel-dialog-title"
                            className="text-lg font-bold mb-2"
                            style={{ color: 'var(--primary)' }}
                        >
                            {t('batchCancelConfirmTitle')}
                        </h3>
                        <p
                            id="cancel-dialog-desc"
                            className="text-sm mb-6"
                            style={{ color: 'var(--secondary)' }}
                        >
                            {t('batchCancelConfirmMessage').replace(
                                '{count}',
                                String(batchResults.filter(r => r.status === 'success').length)
                            )}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleBatchCancelConfirm}
                                className="flex-1 py-2.5 px-4 rounded-lg font-medium text-white transition-colors"
                                style={{ backgroundColor: '#ef4444' }}
                            >
                                {t('batchCancelConfirmYes')}
                            </button>
                            <button
                                onClick={handleBatchCancelDismiss}
                                className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors"
                                style={{
                                    backgroundColor: isDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                                    color: 'var(--secondary)',
                                }}
                            >
                                {t('batchCancelConfirmNo')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Story 10.7: Batch summary for multi-receipt sessions (AC #1, #2, #3, #4, #6) */}
            {showBatchSummary && batchSession && (
                <BatchSummary
                    receipts={batchSession.receipts}
                    insights={batchSession.insights}
                    totalAmount={batchSession.totalAmount}
                    lastWeekTotal={getLastWeekTotal(transactions)}
                    onSilence={() => {
                        // AC #6: Toggle silence - silence for 4 hours or clear if already silenced
                        const newCache = isInsightsSilenced(insightCache)
                            ? clearSilence(insightCache)
                            : silenceInsights(insightCache, 4);
                        setLocalCache(newCache);
                    }}
                    onDismiss={() => {
                        setShowBatchSummary(false);
                        clearBatch();
                        // Story 11.1: Redirect to Home after batch processing completes
                        setView('dashboard');
                    }}
                    isSilenced={isInsightsSilenced(insightCache)}
                    theme={theme as 'light' | 'dark'}
                />
            )}
        </div>
    );
}

export default App;
