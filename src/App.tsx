import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';
import { LoginScreen } from './views/LoginScreen';
import { DashboardView } from './views/DashboardView';
import { ScanView } from './views/ScanView';
import { EditView } from './views/EditView';
import { TrendsView } from './views/TrendsView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { Nav } from './components/Nav';
import { analyzeReceipt } from './services/gemini';
import {
    addTransaction as firestoreAddTransaction,
    updateTransaction as firestoreUpdateTransaction,
    deleteTransaction as firestoreDeleteTransaction,
    wipeAllTransactions
} from './services/firestore';
import { Transaction } from './types/transaction';
import { Language, Currency, Theme } from './types/settings';
import { formatCurrency } from './utils/currency';
import { formatDate } from './utils/date';
import { getSafeDate, parseStrictNumber } from './utils/validation';
import { exportToCSV } from './utils/csv';
import { getColor } from './utils/colors';
import { TRANSLATIONS } from './utils/translations';
import { ITEMS_PER_PAGE, STORE_CATEGORIES } from './config/constants';

type View = 'dashboard' | 'scan' | 'edit' | 'trends' | 'list' | 'settings';

interface PieData {
    label: string;
    value: number;
    color: string;
}

interface BarData {
    label: string;
    total: number;
    segments: Array<{
        label: string;
        value: number;
        color: string;
    }>;
}

function App() {
    const { user, services, initError, signIn, signInWithTestCredentials, signOut } = useAuth();
    const transactions = useTransactions(user, services);

    // UI State
    const [view, setView] = useState<View>('dashboard');
    const [scanImages, setScanImages] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

    // Settings
    const [lang, setLang] = useState<Language>('es');
    const [currency, setCurrency] = useState<Currency>('CLP');
    const [theme, setTheme] = useState<Theme>('light');
    const [dateFormat, setDateFormat] = useState<'LatAm' | 'US'>('LatAm');
    const [wiping, setWiping] = useState(false);

    // Analytics State
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
    const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

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

    // Scan Handlers
    const triggerScan = () => {
        setScanImages([]);
        setView('scan');
        setTimeout(() => fileInputRef.current?.click(), 200);
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
        setScanImages(p => [...p, ...newImages]);
        setView('scan');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const processScan = async () => {
        setIsAnalyzing(true);
        setScanError(null);
        try {
            const result = await analyzeReceipt(scanImages, currency);
            let d = getSafeDate(result.date);
            if (new Date(d).getFullYear() > new Date().getFullYear())
                d = new Date().toISOString().split('T')[0];
            const merchant = result.merchant || 'Unknown';
            const finalTotal = parseStrictNumber(result.total);

            setCurrentTransaction({
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
                thumbnailUrl: result.thumbnailUrl
            });
            setScanImages([]);
            setView('edit');
        } catch (e: any) {
            alert('Scan failed: ' + e.message);
            setScanError('Failed: ' + e.message);
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

    // Analytics Computation
    const getTrendsData = (): {
        pieData: PieData[];
        barData: BarData[];
        total: number;
        filteredTrans: Transaction[];
    } => {
        const filtered = transactions.filter(t => {
            if (selectedMonth && !t.date.startsWith(selectedMonth)) return false;
            if (!selectedMonth && !t.date.startsWith(selectedYear)) return false;
            if (selectedCategory && t.category !== selectedCategory) return false;
            if (selectedGroup && !t.items.some(i => i.category === selectedGroup)) return false;
            if (selectedSubcategory && !t.items.some(i => i.subcategory === selectedSubcategory))
                return false;
            return true;
        });

        const pieMap: Record<string, number> = {};
        const barMap: Record<
            string,
            { total: number; segments: Record<string, number> }
        > = {};

        filtered.forEach(t => {
            let key = 'Other';
            if (!selectedCategory) {
                key = t.category || 'Other';
            } else if (!selectedGroup) {
                if (t.items?.length) {
                    t.items.forEach(i => {
                        pieMap[i.category || 'Grp'] = (pieMap[i.category || 'Grp'] || 0) + i.price;
                    });
                } else {
                    pieMap['General'] = (pieMap['General'] || 0) + t.total;
                }
            } else if (!selectedSubcategory) {
                if (t.items?.length) {
                    t.items.forEach(i => {
                        if (i.category === selectedGroup)
                            pieMap[i.subcategory || 'Itm'] =
                                (pieMap[i.subcategory || 'Itm'] || 0) + i.price;
                    });
                }
            } else {
                if (t.items?.length) {
                    t.items.forEach(i => {
                        if (i.subcategory === selectedSubcategory)
                            pieMap[i.name || 'Itm'] = (pieMap[i.name || 'Itm'] || 0) + i.price;
                    });
                }
            }
            if (!selectedCategory || (!selectedGroup && !t.items?.length)) pieMap[key] = (pieMap[key] || 0) + t.total;

            const k = selectedMonth ? t.date.split('-')[2] : t.date.split('-')[1];
            const safeK = k || '00';
            if (!barMap[safeK]) barMap[safeK] = { total: 0, segments: {} };
            const addSeg = (l: string, v: number) => {
                barMap[safeK].segments[l] = (barMap[safeK].segments[l] || 0) + v;
                barMap[safeK].total += v;
            };

            if (!selectedCategory) {
                addSeg(t.category || 'Other', t.total);
            } else if (!selectedGroup) {
                if (t.items?.length) t.items.forEach(i => addSeg(i.category || 'G', i.price));
                else addSeg('G', t.total);
            } else if (!selectedSubcategory) {
                if (t.items?.length)
                    t.items.forEach(i => {
                        if (i.category === selectedGroup) addSeg(i.subcategory || 'I', i.price);
                    });
            } else {
                if (t.items?.length)
                    t.items.forEach(i => {
                        if (i.subcategory === selectedSubcategory) addSeg(i.name || 'N', i.price);
                    });
            }
        });

        const pieData = Object.entries(pieMap).map(([l, v]) => ({
            label: l,
            value: v,
            color: getColor(l)
        }));

        const barData = Object.keys(barMap)
            .sort()
            .map(k => {
                const label = selectedMonth
                    ? k
                    : new Date(selectedYear + '-' + k + '-02').toLocaleString(lang, {
                          month: 'short'
                      });
                const segments = Object.entries(barMap[k].segments).map(([l, v]) => ({
                    label: l,
                    value: v,
                    color: getColor(l)
                }));
                return { label, total: barMap[k].total, segments };
            });

        return {
            pieData,
            barData,
            total: filtered.reduce((a, b) => a + b.total, 0),
            filteredTrans: filtered
        };
    };

    // Theme classes
    const bg = theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';

    if (initError) {
        return <div className="p-10 text-center text-red-500 font-bold">Error: {initError}</div>;
    }

    if (!user) {
        return <LoginScreen onSignIn={signIn} onTestSignIn={() => signInWithTestCredentials()} t={t} />;
    }

    // Compute analytics data
    const { pieData, barData, total, filteredTrans } = getTrendsData();
    const years = Array.from(new Set(transactions.map(t => t.date.substring(0, 4))))
        .sort()
        .reverse();
    const totalHistoryPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
    const historyTrans = transactions.slice(
        (historyPage - 1) * ITEMS_PER_PAGE,
        historyPage * ITEMS_PER_PAGE
    );
    const yearMonths = Array.from(
        new Set(
            transactions
                .filter(t => t.date.startsWith(selectedYear))
                .map(t => t.date.slice(0, 7))
        )
    )
        .sort()
        .reverse();

    return (
        <div
            className={`min-h-screen max-w-md mx-auto shadow-xl border-x relative ${bg} ${
                theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
            }`}
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
                        transactions={transactions as any}
                        t={t}
                        currency={currency}
                        dateFormat={dateFormat}
                        theme={theme}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate as any}
                        getSafeDate={getSafeDate}
                        onCreateNew={() => {
                            setCurrentTransaction({
                                merchant: '',
                                date: getSafeDate(null),
                                total: 0,
                                category: 'Supermarket',
                                items: []
                            });
                            setView('edit');
                        }}
                        onViewTrends={(month: string | null) => {
                            setSelectedMonth(month);
                            setSelectedCategory(null);
                            setSelectedGroup(null);
                            setSelectedSubcategory(null);
                            setView('trends');
                        }}
                        onEditTransaction={(transaction: any) => {
                            setCurrentTransaction(transaction);
                            setView('edit');
                        }}
                        onTriggerScan={triggerScan}
                    />
                )}

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
                    />
                )}

                {view === 'trends' && (
                    <TrendsView
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                        selectedCategory={selectedCategory}
                        selectedGroup={selectedGroup}
                        selectedSubcategory={selectedSubcategory}
                        chartType={chartType}
                        pieData={pieData}
                        barData={barData}
                        total={total}
                        filteredTrans={filteredTrans as any}
                        yearMonths={yearMonths}
                        years={years}
                        theme={theme}
                        currency={currency}
                        lang={lang}
                        t={t}
                        formatCurrency={formatCurrency}
                        exportToCSV={exportToCSV}
                        onBack={() => {
                            if (selectedSubcategory) setSelectedSubcategory(null);
                            else if (selectedGroup) setSelectedGroup(null);
                            else if (selectedCategory) setSelectedCategory(null);
                            else if (selectedMonth) setSelectedMonth(null);
                            else setView('dashboard');
                        }}
                        onSetSelectedYear={setSelectedYear}
                        onSetSelectedMonth={setSelectedMonth}
                        onSetSelectedCategory={setSelectedCategory}
                        onSetSelectedGroup={setSelectedGroup}
                        onSetSelectedSubcategory={setSelectedSubcategory}
                        onSetChartType={(type: string) => setChartType(type as 'pie' | 'bar')}
                        onEditTransaction={(transaction: any) => {
                            setCurrentTransaction(transaction);
                            setView('edit');
                        }}
                    />
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
                    />
                )}

                {view === 'settings' && (
                    <SettingsView
                        lang={lang}
                        currency={currency}
                        theme={theme}
                        dateFormat={dateFormat}
                        wiping={wiping}
                        t={t}
                        onSetLang={(l: string) => setLang(l as Language)}
                        onSetCurrency={(c: string) => setCurrency(c as Currency)}
                        onSetTheme={(th: string) => setTheme(th as Theme)}
                        onSetDateFormat={(f: string) => setDateFormat(f as 'LatAm' | 'US')}
                        onExportAll={() => exportToCSV(transactions, 'full_backup.csv')}
                        onWipeDB={wipeDB}
                        onSignOut={signOut}
                    />
                )}
            </main>

            <Nav
                view={view}
                setView={(v: string) => setView(v as View)}
                onScanClick={triggerScan}
                onTrendsClick={() => {
                    setSelectedMonth(null);
                    setSelectedCategory(null);
                    setSelectedGroup(null);
                    setSelectedSubcategory(null);
                }}
                theme={theme}
                t={t}
            />
        </div>
    );
}

export default App;
