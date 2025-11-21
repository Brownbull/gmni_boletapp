import React, { useState, useEffect, useRef, Component } from 'react';
import {
    Camera, Plus, Trash2, Save, ShoppingBag, ArrowLeft, Loader2,
    AlertCircle, Receipt, Home, List as ListIcon, PieChart, Tag,
    BarChart3, Settings, X, ChevronRight, Globe, DollarSign, Edit2, Check,
    Store, Moon, Sun, Calendar, BarChart2, ArrowRightLeft, TrendingUp, TrendingDown, Minus,
    RefreshCw, AlertTriangle, Download, LogOut, LogIn
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc,
    serverTimestamp,
    updateDoc,
    getDocs
} from 'firebase/firestore';

// --- 1. CONFIGURATION (PASTE YOUR KEYS HERE) ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// --- API Key for Gemini ---
const GEMINI_API_KEY = ""; // Paste your Gemini API Key here
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

// --- Constants ---
const STORE_CATEGORIES = [
    'Supermarket', 'Restaurant', 'Bakery', 'Butcher', 'Bazaar',
    'Veterinary', 'PetShop', 'Medical', 'Pharmacy', 'Technology',
    'StreetVendor', 'Transport', 'Services', 'Other'
];

const ITEMS_PER_PAGE = 20;

// --- Error Boundary ---
class ErrorBoundary extends Component {
    constructor(props) { super(props); this.state = { hasError: false, error: "" }; }
    static getDerivedStateFromError(error) { return { hasError: true, error: error.toString() }; }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-red-50 text-center">
                    <AlertTriangle size={48} className="text-red-500 mb-4" />
                    <h1 className="text-xl font-bold text-red-900 mb-2">Critical Error</h1>
                    <p className="text-xs text-red-700 mb-6 font-mono bg-red-100 p-3 rounded">{this.state.error}</p>
                    <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold">Reload App</button>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- Utilities ---
const cleanJson = (text) => {
    if (!text) return "{}";
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    return (start !== -1 && end !== -1) ? text.substring(start, end + 1) : "{}";
};

const parseStrictNumber = (val) => {
    const clean = String(val).replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
};

const getSafeDate = (val) => {
    const today = new Date().toISOString().split('T')[0];
    if (val && typeof val.toDate === 'function') try { return val.toDate().toISOString().split('T')[0]; } catch (e) { }
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    return today;
};

const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat(currency === 'CLP' ? 'es-CL' : 'en-US', {
        style: 'currency', currency, maximumFractionDigits: 0
    }).format(isNaN(amount) ? 0 : amount);
};

const formatDate = (dateStr, format) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    if (format === 'US') return `${parts[1]}/${parts[2]}/${parts[0]}`;
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // LatAm default
};

const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) { alert("No data"); return; }
    const headers = ["Date", "Merchant", "Alias", "Category", "Total", "Items"];
    const rows = data.map(t => [t.date, `"${(t.merchant || "").replace(/"/g, '""')}"`, `"${(t.alias || "").replace(/"/g, '""')}"`, t.category, t.total, t.items?.length || 0]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

// --- Color Utilities ---
const stringToColor = (str) => {
    if (!str) return '#94a3b8';
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const getColor = (key) => {
    const PRESETS = {
        Supermarket: '#3b82f6', Restaurant: '#f97316', Bakery: '#eab308', Butcher: '#ef4444',
        Bazaar: '#8b5cf6', Veterinary: '#10b981', PetShop: '#14b8a6', Medical: '#06b6d4',
        Pharmacy: '#6366f1', Technology: '#64748b', StreetVendor: '#f43f5e', Transport: '#84cc16',
        Services: '#0ea5e9', Other: '#94a3b8', 'Fresh Food': '#10b981', 'Pantry': '#f59e0b',
        'Drinks': '#3b82f6', 'Household': '#6366f1', 'Personal Care': '#ec4899', 'Pets': '#14b8a6'
    };
    return PRESETS[key] || stringToColor(key || 'default');
};

// --- API Logic ---
async function analyzeWithGemini(images, currency) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const imageParts = images.map(b64 => {
        const match = b64.match(/^data:(.+);base64,(.+)$/);
        return {
            inlineData: {
                mimeType: match ? match[1] : 'image/jpeg',
                data: match ? match[2] : b64
            }
        };
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const prompt = `Analyze receipt. Context: ${currency}. Today: ${todayStr}. Strict JSON output. Return 'total' and 'price' as INTEGERS (no dots/commas). Extract: merchant (store name), date (YYYY-MM-DD), total, category (one of: Supermarket, Restaurant, Bakery, Butcher, Bazaar, Veterinary, PetShop, Medical, Pharmacy, Technology, StreetVendor, Transport, Services, Other). Items: name, price, category (Fresh Food, Pantry, Drinks, Household, Personal Care, Pets, Electronics, Apparel, Other), subcategory. If multiple dates, choose closest to today.`;

    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, ...imageParts] }] }) });
    const json = await res.json();
    if (!json.candidates) throw new Error("API Error");
    return JSON.parse(cleanJson(json.candidates[0].content.parts[0].text));
}

// --- Components ---
const CategoryBadge = ({ category, subcategory, mini }) => (
    <div className="flex flex-wrap gap-1">
        <span className={`rounded-md font-bold uppercase text-white ${mini ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[10px]'}`} style={{ backgroundColor: getColor(category) }}>{category}</span>
        {subcategory && <span className={`rounded-md bg-slate-100 text-slate-600 border border-slate-200 truncate ${mini ? 'px-1.5 py-0.5 text-[8px] max-w-[60px]' : 'px-2 py-0.5 text-[10px] max-w-[120px]'}`}>{subcategory}</span>}
    </div>
);

const Nav = ({ view, setView, onScanClick, theme }) => {
    const active = (v) => view === v ? 'text-blue-600' : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500');
    const bg = theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';
    return (
        <div className={`fixed bottom-0 left-0 right-0 border-t px-6 py-3 flex justify-between items-center z-50 ${bg}`}>
            <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${active('dashboard')}`}><Home size={24} /><span className="text-[10px]">Home</span></button>
            <button onClick={() => setView('trends')} className={`flex flex-col items-center gap-1 ${active('trends')}`}><BarChart3 size={24} /><span className="text-[10px]">Trends</span></button>
            <div className="relative -top-6"><button onClick={onScanClick} className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform"><Camera size={24} /></button></div>
            <button onClick={() => setView('list')} className={`flex flex-col items-center gap-1 ${active('list')}`}><ListIcon size={24} /><span className="text-[10px]">History</span></button>
            <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 ${active('settings')}`}><Settings size={24} /><span className="text-[10px]">Settings</span></button>
        </div>
    );
};

const SimplePieChart = ({ data, onSliceClick, theme }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    if (total === 0) return <div className="h-40 flex items-center justify-center opacity-50">No Data</div>;

    let currentAngle = 0;
    const slices = data.map(d => {
        const angle = (d.value / total) * 360;
        const start = currentAngle;
        currentAngle += angle;
        return { ...d, start, angle };
    });

    return (
        <div className="flex items-center justify-center py-4 animate-in fade-in">
            <svg viewBox="0 0 100 100" className="w-48 h-48 transform -rotate-90">
                {slices.map((slice, i) => {
                    const large = slice.angle > 180 ? 1 : 0;
                    const x1 = 50 + 50 * Math.cos(Math.PI * slice.start / 180);
                    const y1 = 50 + 50 * Math.sin(Math.PI * slice.start / 180);
                    const x2 = 50 + 50 * Math.cos(Math.PI * (slice.start + slice.angle) / 180);
                    const y2 = 50 + 50 * Math.sin(Math.PI * (slice.start + slice.angle) / 180);
                    // Safe handling for full circle
                    const d = slice.angle > 359 ? `M 50 50 m -50 0 a 50 50 0 1 0 100 0 a 50 50 0 1 0 -100 0` : `M 50 50 L ${x1} ${y1} A 50 50 0 ${large} 1 ${x2} ${y2} Z`;
                    return <path key={i} d={d} fill={slice.color} stroke={theme === 'dark' ? '#1e293b' : '#ffffff'} strokeWidth="2" onClick={() => onSliceClick && onSliceClick(slice.label)} className="hover:opacity-80 cursor-pointer" />;
                })}
                <circle cx="50" cy="50" r="30" fill={theme === 'dark' ? '#1e293b' : '#ffffff'} />
            </svg>
        </div>
    );
};

const GroupedBarChart = ({ data, theme, currency }) => {
    const allValues = data.flatMap(d => d.segments.map(s => s.value));
    const max = Math.max(...allValues, 1);
    if (data.length === 0) return <div className="h-40 flex items-center justify-center opacity-50">No Data</div>;
    return (
        <div className="h-60 pt-6 pb-8 px-2 overflow-x-auto w-full">
            <div className="h-full flex items-end gap-4 min-w-max px-2">
                {data.map((d, i) => (
                    <div key={i} className="flex flex-col items-center group h-full justify-end">
                        <div className="flex items-end gap-1 h-full">
                            {d.segments.map((seg, j) => (
                                <div
                                    key={j}
                                    className="w-3 sm:w-4 rounded-t transition-all duration-300 relative hover:opacity-80"
                                    style={{
                                        height: `${(seg.value / max) * 100}%`,
                                        backgroundColor: seg.color,
                                        minHeight: seg.value > 0 ? '4px' : '0'
                                    }}
                                >
                                    <div className={`hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[8px] p-1 rounded whitespace-nowrap z-50 shadow-sm border pointer-events-none ${theme === 'dark' ? 'bg-black text-white border-gray-700' : 'bg-white text-black border-gray-200'}`}>
                                        {seg.label}: {formatCurrency(seg.value, currency)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={`text-[10px] mt-2 font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{d.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Localization ---
const TRANSLATIONS = {
    en: { overview: "Overview", welcome: "Smart Tracking", totalSpent: "Total Spent", thisMonth: "This Month", scanTitle: "AI Scanner", scanDesc: "Scan receipts.", scanBtn: "Scan", recent: "Recent", seeAll: "See All", history: "History", trends: "Trends", settings: "Settings", home: "Home", language: "Language", currency: "Currency", theme: "Theme", save: "Save", update: "Update", delete: "Delete", items: "Items", merchant: "Merchant", total: "Total", date: "Date", category: "Category", breakdown: "Breakdown", monthView: "Monthly", yearView: "Yearly", compareView: "Compare", compare: "Compare", vs: "vs", diff: "Diff", dailySpending: "Daily", monthlySpending: "Monthly", noData: "No Data", addPhoto: "Add Photo", confirmDup: "Duplicate?", unknown: "Unknown", newTrans: "New", editTrans: "Edit", tryAgain: "Retry", noItems: "No items.", filterHint: "Drill down", filterHintBack: "Back", addItem: "Add", itemName: "Name", itemPrice: "Price", itemSub: "Type", itemCat: "Group", backToCat: "Back", transactions: "Transactions", alias: "Alias", dateFormat: "Date Format", wipe: "Factory Reset", wipeConfirm: "Delete ALL data?", cleaning: "Cleaning...", cleaned: "Cleaned!", export: "Export CSV", exportAll: "Export All", prev: "Prev", next: "Next", page: "Page", monthsBreakdown: "Monthly Breakdown", allTime: "All Time", login: "Login", signin: "Sign in with Google", signout: "Sign Out" },
    es: { overview: "Resumen", welcome: "Rastreo Inteligente", totalSpent: "Total Gastado", thisMonth: "Este Mes", scanTitle: "Escáner IA", scanDesc: "Escanea boletas.", scanBtn: "Escanear", recent: "Reciente", seeAll: "Ver Todo", history: "Historial", trends: "Tendencias", settings: "Ajustes", home: "Inicio", language: "Idioma", currency: "Moneda", theme: "Tema", save: "Guardar", update: "Actualizar", delete: "Eliminar", items: "Ítems", merchant: "Comercio", total: "Total", date: "Fecha", category: "Categoría", breakdown: "Desglose", monthView: "Mensual", yearView: "Anual", compareView: "Comparar", compare: "Comparar", vs: "vs", diff: "Diferencia", dailySpending: "Diario", monthlySpending: "Mensual", noData: "Sin Datos", addPhoto: "Agregar Foto", confirmDup: "¿Duplicado?", unknown: "Desconocido", newTrans: "Nueva", editTrans: "Editar", tryAgain: "Reintentar", noItems: "Sin ítems.", filterHint: "Profundizar", filterHintBack: "Volver", addItem: "Agregar", itemName: "Nombre", itemPrice: "Precio", itemSub: "Tipo", itemCat: "Grupo", backToCat: "Volver", transactions: "Transacciones", alias: "Alias", dateFormat: "Formato Fecha", wipe: "Restablecer", wipeConfirm: "¿Borrar TODOS los datos?", cleaning: "Limpiando...", cleaned: "¡Listo!", export: "Exportar CSV", exportAll: "Exportar Todo", prev: "Ant", next: "Sig", page: "Pág", monthsBreakdown: "Desglose Mensual", allTime: "Histórico", login: "Ingresar", signin: "Entrar con Google", signout: "Cerrar Sesión" }
};

// --- Main Logic ---
function MainApp() {
    const [user, setUser] = useState(null);
    const [services, setServices] = useState(null);
    const [initError, setInitError] = useState(null);

    // UI State
    const [view, setView] = useState('dashboard');
    const [transactions, setTransactions] = useState([]);
    const [scanImages, setScanImages] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scanError, setScanError] = useState(null);
    const [currentTransaction, setCurrentTransaction] = useState(null);
    const [editingItemIndex, setEditingItemIndex] = useState(null);

    // Settings
    const [lang, setLang] = useState('es');
    const [currency, setCurrency] = useState('CLP');
    const [theme, setTheme] = useState('light');
    const [dateFormat, setDateFormat] = useState('LatAm');
    const [wiping, setWiping] = useState(false);

    // Analytics State
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [chartType, setChartType] = useState('pie');
    const [breakdownTransId, setBreakdownTransId] = useState(null);
    const [distinctAliases, setDistinctAliases] = useState([]);
    const [historyPage, setHistoryPage] = useState(1);

    const fileInputRef = useRef(null);
    const t = (k) => TRANSLATIONS[lang][k] || k;

    // Init Firebase
    useEffect(() => {
        try {
            // Use the hardcoded config variable that user must fill
            const config = typeof firebaseConfig !== 'undefined' ? firebaseConfig : {};
            // Fallback to injected variable if available (for preview)
            // @ts-ignore
            const finalConfig = Object.keys(config).length > 0 ? config : (typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {});

            if (Object.keys(finalConfig).length === 0) throw new Error("Config Missing");

            const app = initializeApp(finalConfig);
            const auth = getAuth(app);
            const db = getFirestore(app);
            // @ts-ignore
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

            setServices({ auth, db, appId });

            // Standard Firebase Auth Listener
            onAuthStateChanged(auth, setUser);
        } catch (e) {
            console.error(e);
            setInitError(e.message);
        }
    }, []);

    // Sync DB
    useEffect(() => {
        if (!user || !services) return;
        const q = collection(services.db, 'artifacts', services.appId, 'users', user.uid, 'transactions');
        return onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id, ...data,
                    date: getSafeDate(data.date),
                    total: parseStrictNumber(data.total),
                    items: Array.isArray(data.items) ? data.items.map(i => ({ ...i, price: parseStrictNumber(i.price) })) : []
                };
            });
            docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTransactions(docs);
            const aliases = new Set();
            docs.forEach(d => { if (d.alias) aliases.add(d.alias); });
            setDistinctAliases(Array.from(aliases).sort());
        });
    }, [user, services]);

    const handleGoogleLogin = async () => {
        if (!services) return;
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(services.auth, provider);
        } catch (e) {
            alert("Login Failed: " + e.message);
        }
    };

    const handleLogout = async () => {
        if (!services) return;
        await signOut(services.auth);
    };

    const triggerScan = () => { setScanImages([]); setView('scan'); setTimeout(() => fileInputRef.current?.click(), 200); };

    const handleFileSelect = async (e) => {
        if (!e.target.files?.length) return;
        const files = Array.from(e.target.files);
        const newImages = await Promise.all(files.map(f => new Promise(r => {
            const reader = new FileReader();
            reader.onload = () => r(reader.result);
            reader.readAsDataURL(f);
        })));
        setScanImages(p => [...p, ...newImages]);
        setView('scan');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const processScan = async () => {
        setIsAnalyzing(true);
        setScanError(null);
        try {
            const result = await analyzeWithGemini(scanImages, currency);
            let d = getSafeDate(result.date);
            if (new Date(d).getFullYear() > new Date().getFullYear()) d = new Date().toISOString().split('T')[0];
            const merchant = result.merchant || 'Unknown';
            const finalTotal = parseStrictNumber(result.total);

            setCurrentTransaction({
                merchant: merchant,
                date: d,
                total: finalTotal,
                category: result.category || 'Other',
                alias: merchant,
                items: (result.items || []).map(i => ({ ...i, price: parseStrictNumber(i.price) }))
            });
            setScanImages([]);
            setView('edit');
        } catch (e) {
            alert("Scan failed: " + e.message);
            setScanError("Failed: " + e.message);
        } finally { setIsAnalyzing(false); }
    };

    const saveTransaction = async () => {
        if (!services || !user) return;
        const { db, appId } = services;
        const tDoc = { ...currentTransaction, total: parseStrictNumber(currentTransaction.total), updatedAt: serverTimestamp() };
        if (!tDoc.id) tDoc.createdAt = serverTimestamp();
        const ref = tDoc.id ? doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', tDoc.id) : collection(db, 'artifacts', appId, 'users', user.uid, 'transactions');
        if (tDoc.id) await updateDoc(ref, tDoc); else await addDoc(ref, tDoc);
        setView('dashboard');
        setCurrentTransaction(null);
    };

    const deleteTransaction = async (id) => {
        if (!services || !user) return;
        if (!window.confirm("Delete?")) return;
        await deleteDoc(doc(services.db, 'artifacts', services.appId, 'users', user.uid, 'transactions', id));
        if (view === 'breakdown') setView('dashboard'); else if (view === 'edit') setView('dashboard');
    };

    const wipeDB = async () => {
        if (!window.confirm(t('wipeConfirm'))) return;
        setWiping(true);
        try {
            const q = collection(services.db, 'artifacts', services.appId, 'users', user.uid, 'transactions');
            const snap = await getDocs(q);
            await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
            alert(t('cleaned'));
            setTransactions([]);
        } catch (e) { alert("Failed to wipe"); }
        setWiping(false);
    };

    const getTrendsData = () => {
        const filtered = transactions.filter(t => {
            if (selectedMonth && !t.date.startsWith(selectedMonth)) return false;
            if (!selectedMonth && !t.date.startsWith(selectedYear)) return false;
            if (selectedCategory && t.category !== selectedCategory) return false;
            if (selectedGroup && !t.items.some(i => i.category === selectedGroup)) return false;
            if (selectedSubcategory && !t.items.some(i => i.subcategory === selectedSubcategory)) return false;
            return true;
        });

        const pieMap = {};
        const barMap = {};

        filtered.forEach(t => {
            let key = 'Other';
            if (!selectedCategory) key = t.category || 'Other';
            else if (!selectedGroup) {
                if (t.items?.length) t.items.forEach(i => { pieMap[i.category || 'Grp'] = (pieMap[i.category || 'Grp'] || 0) + i.price; });
                else pieMap['General'] = (pieMap['General'] || 0) + t.total;
            } else if (!selectedSubcategory) {
                if (t.items?.length) t.items.forEach(i => { if (i.category === selectedGroup) pieMap[i.subcategory || 'Itm'] = (pieMap[i.subcategory || 'Itm'] || 0) + i.price; });
            } else {
                if (t.items?.length) t.items.forEach(i => { if (i.subcategory === selectedSubcategory) pieMap[i.name || 'Itm'] = (pieMap[i.name || 'Itm'] || 0) + i.price; });
            }
            if (!selectedGroup || !t.items?.length) pieMap[key] = (pieMap[key] || 0) + t.total;

            const k = selectedMonth ? t.date.split('-')[2] : t.date.split('-')[1];
            const safeK = k || '00';
            if (!barMap[safeK]) barMap[safeK] = { total: 0, segments: {} };
            const addSeg = (l, v) => { barMap[safeK].segments[l] = (barMap[safeK].segments[l] || 0) + v; barMap[safeK].total += v; };

            if (!selectedCategory) addSeg(t.category || 'Other', t.total);
            else if (!selectedGroup) { if (t.items?.length) t.items.forEach(i => addSeg(i.category || 'G', i.price)); else addSeg('G', t.total); }
            else if (!selectedSubcategory) { if (t.items?.length) t.items.forEach(i => { if (i.category === selectedGroup) addSeg(i.subcategory || 'I', i.price); }); }
            else { if (t.items?.length) t.items.forEach(i => { if (i.subcategory === selectedSubcategory) addSeg(i.name || 'N', i.price); }); }
        });

        const pieData = Object.entries(pieMap).map(([l, v]) => ({ label: l, value: v, color: getColor(l) }));
        const barData = Object.keys(barMap).sort().map(k => {
            const label = selectedMonth ? k : new Date(selectedYear + '-' + k + '-02').toLocaleString(lang, { month: 'short' });
            const segments = Object.entries(barMap[k].segments).map(([l, v]) => ({ label: l, value: v, color: getColor(l) }));
            return { label, total: barMap[k].total, segments };
        });

        return { pieData, barData, total: filtered.reduce((a, b) => a + b.total, 0), filteredTrans: filtered };
    };

    const bg = theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';
    const card = theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';
    const input = theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200';
    const subText = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

    if (initError) return <div className="p-10 text-center text-red-500 font-bold">Error: {initError}</div>;

    // LOGIN SCREEN
    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
                <Receipt size={64} className="mb-6 text-blue-500" />
                <h1 className="text-3xl font-bold mb-2">Expense Tracker</h1>
                <p className="text-slate-400 mb-8">Smart Receipt Scanning & Analytics</p>
                <button onClick={handleGoogleLogin} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors">
                    <Globe size={20} /> {t('signin')}
                </button>
            </div>
        );
    }

    const { pieData, barData, total, filteredTrans } = getTrendsData();
    const years = Array.from(new Set(transactions.map(t => t.date.substring(0, 4)))).sort().reverse();
    const totalHistoryPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
    const historyTrans = transactions.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);
    const yearMonths = Array.from(new Set(transactions.filter(t => t.date.startsWith(selectedYear)).map(t => t.date.slice(0, 7)))).sort().reverse();

    return (
        <div className={`min-h-screen max-w-md mx-auto shadow-xl border-x relative ${bg} ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />

            <main className="p-6 pb-24 h-full overflow-y-auto">
                {/* DASHBOARD */}
                {view === 'dashboard' && (
                    <div className="space-y-6">
                        <header className="flex justify-between items-center">
                            <div><h1 className="text-2xl font-bold">{t('overview')}</h1><p className="text-sm opacity-60">{t('welcome')}</p></div>
                            <button onClick={() => { setCurrentTransaction({ merchant: '', date: getSafeDate(null), total: 0, category: 'Supermarket', items: [] }); setView('edit') }} className="bg-blue-600 text-white p-2 rounded-full shadow"><Plus /></button>
                        </header>
                        <div className="grid grid-cols-2 gap-4">
                            <div onClick={() => { setSelectedMonth(null); setView('trends') }} className="bg-blue-600 text-white p-5 rounded-2xl shadow cursor-pointer"><div className="text-sm opacity-80 mb-1">{t('totalSpent')}</div><div className="text-2xl font-bold">{formatCurrency(transactions.reduce((a, b) => a + b.total, 0), currency)}</div></div>
                            <div onClick={() => { setSelectedMonth(new Date().toISOString().slice(0, 7)); setView('trends') }} className={`p-5 rounded-2xl border shadow cursor-pointer ${card}`}><div className="text-sm opacity-60 mb-1">{t('thisMonth')}</div><div className="text-2xl font-bold">{formatCurrency(transactions.filter(t => t.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((a, b) => a + b.total, 0), currency)}</div></div>
                        </div>
                        <div className="bg-indigo-600 text-white p-6 rounded-2xl relative overflow-hidden"><h3 className="font-bold z-10 relative">{t('scanTitle')}</h3><button onClick={triggerScan} className="mt-3 bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2 z-10 relative"><Camera size={18} /> {t('scanBtn')}</button><Receipt className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 rotate-12" /></div>
                        <div className="space-y-2">
                            {transactions.slice(0, 5).map(t => (
                                <div key={t.id} onClick={() => { setCurrentTransaction(t); setView('edit') }} className={`p-4 rounded-xl border flex justify-between items-center cursor-pointer ${card}`}>
                                    <div className="flex gap-3 items-center">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Store size={18} /></div>
                                        <div>
                                            <div className="font-bold">{t.alias || t.merchant}</div>
                                            <div className="text-xs opacity-60">{t.merchant}</div>
                                            <div className="flex items-center gap-2 mt-1"><CategoryBadge category={t.category} mini /><span className="text-xs opacity-60">{formatDate(t.date, dateFormat)}</span></div>
                                        </div>
                                    </div>
                                    <div className="font-bold">{formatCurrency(t.total, currency)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SCAN */}
                {view === 'scan' && (
                    <div className="h-full flex flex-col">
                        <button onClick={() => setView('dashboard')} className="self-start mb-4"><ArrowLeft /></button>
                        <div className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center mb-4 overflow-hidden ${card}`}>{scanImages.length === 0 ? <div className="text-center opacity-50"><p>{t('addPhoto')}</p></div> : <div className="grid grid-cols-2 gap-2 w-full h-full p-2 overflow-auto">{scanImages.map((s, i) => <img key={i} src={s} className="w-full h-24 object-cover rounded" />)}</div>}</div>
                        <div className="space-y-3"><button onClick={() => fileInputRef.current?.click()} className={`w-full py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-bold flex justify-center gap-2 ${card}`}>{t('addPhoto')}</button>{scanImages.length > 0 && <button onClick={processScan} disabled={isAnalyzing} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex justify-center gap-2">{isAnalyzing ? <Loader2 className="animate-spin" /> : <Tag />} {isAnalyzing ? 'Processing...' : t('scanBtn')}</button>}</div>
                        {scanError && <div className="mt-4 text-red-500 text-center text-sm">{scanError}</div>}
                    </div>
                )}

                {/* EDIT */}
                {view === 'edit' && currentTransaction && (
                    <div className="pb-24">
                        <div className="flex justify-between mb-6"><button onClick={() => setView('dashboard')}><ArrowLeft /></button><h1 className="font-bold">{currentTransaction.id ? t('editTrans') : t('newTrans')}</h1>{currentTransaction.id && <button onClick={() => deleteTransaction(currentTransaction.id)} className="text-red-500"><Trash2 /></button>}</div>
                        <div className={`p-6 rounded-2xl mb-4 text-center bg-slate-800 text-white`}><div className="text-sm opacity-60">{t('total')}</div><input type="number" value={currentTransaction.total} onChange={e => setCurrentTransaction({ ...currentTransaction, total: parseStrictNumber(e.target.value) })} className="bg-transparent text-3xl font-bold text-center w-full outline-none" /></div>
                        <div className={`p-4 rounded-xl border space-y-3 mb-4 ${card}`}><input className={`w-full p-2 border rounded ${input}`} value={currentTransaction.merchant} onChange={e => setCurrentTransaction({ ...currentTransaction, merchant: e.target.value })} placeholder={t('merchant')} /><input className={`w-full p-2 border rounded ${input}`} placeholder={t('alias')} list="alias-list" value={currentTransaction.alias || ''} onChange={e => setCurrentTransaction({ ...currentTransaction, alias: e.target.value })} /><datalist id="alias-list">{distinctAliases.map((a, i) => <option key={i} value={a} />)}</datalist><input type="date" className={`w-full p-2 border rounded ${input}`} value={currentTransaction.date} onChange={e => setCurrentTransaction({ ...currentTransaction, date: e.target.value })} /><select className={`w-full p-2 border rounded ${input}`} value={currentTransaction.category} onChange={e => setCurrentTransaction({ ...currentTransaction, category: e.target.value })}>{STORE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div className={`p-4 rounded-xl border mb-4 ${card}`}><div className="flex justify-between mb-2"><h3 className="font-bold">{t('items')}</h3><button onClick={() => { setCurrentTransaction({ ...currentTransaction, items: [...currentTransaction.items, { name: '', price: 0, category: 'Other', subcategory: '' }] }); setEditingItemIndex(currentTransaction.items.length) }} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded"><Plus size={12} /></button></div><div className="space-y-3">{currentTransaction.items.map((item, i) => (<div key={i} className="border-b pb-2 last:border-0">{editingItemIndex === i ? (<div className="space-y-2"><input className={`w-full p-1 border rounded text-sm ${input}`} value={item.name} onChange={e => { const n = [...currentTransaction.items]; n[i].name = e.target.value; setCurrentTransaction({ ...currentTransaction, items: n }) }} placeholder={t('itemName')} /><div className="flex gap-2"><input type="number" className={`w-20 p-1 border rounded text-sm ${input}`} value={item.price} onChange={e => { const n = [...currentTransaction.items]; n[i].price = parseStrictNumber(e.target.value); setCurrentTransaction({ ...currentTransaction, items: n }) }} /><input className={`flex-1 p-1 border rounded text-sm ${input}`} value={item.category} onChange={e => { const n = [...currentTransaction.items]; n[i].category = e.target.value; setCurrentTransaction({ ...currentTransaction, items: n }) }} placeholder={t('itemCat')} /></div><div className="flex justify-end gap-2"><button onClick={() => { const n = currentTransaction.items.filter((_, x) => x !== i); setCurrentTransaction({ ...currentTransaction, items: n }); setEditingItemIndex(null) }} className="text-red-500"><Trash2 size={16} /></button><button onClick={() => setEditingItemIndex(null)} className="text-blue-600"><Check size={16} /></button></div></div>) : (<div onClick={() => setEditingItemIndex(i)} className="flex justify-between items-start"><div><div className="font-medium text-sm">{item.name}</div><CategoryBadge category={item.category} subcategory={item.subcategory} /></div><div className="font-mono text-sm">{formatCurrency(item.price, currency)}</div></div>)}</div>))}</div></div>
                        <button onClick={saveTransaction} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg">{t('save')}</button>
                    </div>
                )}

                {/* TRENDS */}
                {view === 'trends' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                                <button onClick={() => { if (selectedSubcategory) setSelectedSubcategory(null); else if (selectedGroup) setSelectedGroup(null); else if (selectedCategory) setSelectedCategory(null); else if (selectedMonth) setSelectedMonth(null); else setView('dashboard'); }}><ArrowLeft /></button>
                                <div className="flex flex-col justify-center">
                                    {selectedMonth && !selectedCategory && (
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-bold text-lg uppercase">{new Date(selectedMonth + '-02').toLocaleString(lang, { month: 'long' })}</span>
                                            <span className="text-sm opacity-60">{selectedMonth.split('-')[0]}</span>
                                            <select className="ml-2 bg-transparent text-xs opacity-0 absolute w-20 h-8 cursor-pointer" value={selectedMonth.split('-')[1]} onChange={(e) => setSelectedMonth(`${selectedMonth.split('-')[0]}-${e.target.value}`)}>{Array.from({ length: 12 }, (_, i) => { const m = String(i + 1).padStart(2, '0'); return <option key={m} value={m}>{new Date(`2000-${m}-01`).toLocaleString(lang, { month: 'long' })}</option> })}</select>
                                        </div>
                                    )}
                                    {(!selectedMonth || selectedCategory) && <h1 className="font-bold text-lg capitalize">{selectedSubcategory || selectedGroup || selectedCategory || t('allTime')}</h1>}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => exportToCSV(filteredTrans, `export_${selectedMonth || 'year'}.csv`)} className="text-blue-600"><Download /></button>
                                <button onClick={() => setChartType(t => t === 'pie' ? 'bar' : 'pie')}>{chartType === 'pie' ? <BarChart2 /> : <PieChart />}</button>
                                {!selectedMonth && <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={`text-sm p-1 rounded border ${input}`}>{years.map(y => <option key={y} value={y}>{y}</option>)}{!years.includes(selectedYear) && <option value={selectedYear}>{selectedYear}</option>}</select>}
                            </div>
                        </div>
                        <div className={`p-6 rounded-2xl border text-center ${card}`}><div className="text-3xl font-bold mb-4">{formatCurrency(total, currency)}</div><div className="h-60 flex items-center justify-center">{chartType === 'pie' ? (pieData.length > 0 ? <SimplePieChart data={pieData} theme={theme} onSliceClick={(l) => { if (!selectedCategory) setSelectedCategory(l); else if (!selectedGroup) setSelectedGroup(l); else if (!selectedSubcategory) setSelectedSubcategory(l); }} /> : <p>{t('noData')}</p>) : (<GroupedBarChart data={barData} theme={theme} currency={currency} />)}</div></div>

                        <div className="space-y-2">
                            {!selectedMonth && !selectedCategory && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2"><h3 className="text-xs font-bold opacity-60 uppercase mb-1">Breakdown</h3>{pieData.map((d, i) => (<div key={i} onClick={() => { if (!selectedCategory) setSelectedCategory(d.label); }} className={`p-2 border rounded flex justify-between items-center cursor-pointer text-xs ${card}`}><div className="truncate w-20">{d.label}</div><div className="font-bold">{formatCurrency(d.value, currency)}</div></div>))}</div>
                                    <div className="space-y-2"><h3 className="text-xs font-bold opacity-60 uppercase mb-1">{t('monthsBreakdown')}</h3>{yearMonths.map(m => (<div key={m} onClick={() => setSelectedMonth(m)} className={`p-2 border rounded flex justify-between items-center cursor-pointer text-xs ${card}`}><div>{new Date(m + '-02').toLocaleString(lang, { month: 'short' })}</div><div className="font-bold">{formatCurrency(transactions.filter(t => t.date.startsWith(m)).reduce((a, b) => a + b.total, 0), currency)}</div></div>))}</div>
                                </div>
                            )}
                            {(selectedMonth || selectedCategory) && !selectedSubcategory && pieData.map((d, i) => (
                                <div key={i} onClick={() => { if (!selectedCategory) setSelectedCategory(d.label); else if (!selectedGroup) setSelectedGroup(d.label); else if (!selectedSubcategory) setSelectedSubcategory(d.label); }} className={`p-3 border rounded flex justify-between items-center cursor-pointer ${card}`}><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>{d.label}</div><div className="font-bold">{formatCurrency(d.value, currency)}</div></div>
                            ))}
                            {selectedSubcategory && filteredTrans.map(t => (<div key={t.id} onClick={() => { setCurrentTransaction(t); setView('edit') }} className={`p-3 border rounded flex justify-between items-center cursor-pointer ${card}`}><div>{t.alias || t.merchant}</div><div className="font-bold">{formatCurrency(t.total, currency)}</div></div>))}
                        </div>
                    </div>
                )}

                {view === 'settings' && (
                    <div className="pb-24 space-y-4">
                        <h1 className="text-2xl font-bold mb-6">{t('settings')}</h1>
                        <div className={`p-4 rounded-xl border flex justify-between items-center ${card}`}><div className="flex gap-2"><Globe /> {t('language')}</div><div className={`flex rounded bg-slate-100 p-1`}><button onClick={() => setLang('en')} className={`px-3 rounded ${lang === 'en' ? 'bg-white shadow' : ''}`}>EN</button><button onClick={() => setLang('es')} className={`px-3 rounded ${lang === 'es' ? 'bg-white shadow' : ''}`}>ES</button></div></div>
                        <div className={`p-4 rounded-xl border flex justify-between items-center ${card}`}><div className="flex gap-2"><DollarSign /> {t('currency')}</div><div className={`flex rounded bg-slate-100 p-1`}><button onClick={() => setCurrency('CLP')} className={`px-3 rounded ${currency === 'CLP' ? 'bg-white shadow' : ''}`}>CLP</button><button onClick={() => setCurrency('USD')} className={`px-3 rounded ${currency === 'USD' ? 'bg-white shadow' : ''}`}>USD</button></div></div>
                        <div className={`p-4 rounded-xl border flex justify-between items-center ${card}`}><div className="flex gap-2"><Calendar /> {t('dateFormat')}</div><div className={`flex rounded bg-slate-100 p-1`}><button onClick={() => setDateFormat('LatAm')} className={`px-3 rounded ${dateFormat === 'LatAm' ? 'bg-white shadow' : ''}`}>31/12</button><button onClick={() => setDateFormat('US')} className={`px-3 rounded ${dateFormat === 'US' ? 'bg-white shadow' : ''}`}>12/31</button></div></div>
                        <div className={`p-4 rounded-xl border flex justify-between items-center ${card}`}><div className="flex gap-2"><Moon /> {t('theme')}</div><div className={`flex rounded bg-slate-100 p-1`}><button onClick={() => setTheme('light')} className={`px-3 rounded ${theme === 'light' ? 'bg-white shadow' : ''}`}>Light</button><button onClick={() => setTheme('dark')} className={`px-3 rounded ${theme === 'dark' ? 'bg-white shadow' : ''}`}>Dark</button></div></div>
                        <div className={`p-4 rounded-xl border flex justify-between items-center ${card}`}><div className="flex gap-2"><Download /> {t('exportAll')}</div><button onClick={() => exportToCSV(transactions, 'full_backup.csv')} className="bg-blue-100 text-blue-600 px-3 py-1 rounded font-bold text-sm">CSV</button></div>
                        <div className={`p-4 rounded-xl border flex justify-between items-center ${card}`}><div className="flex gap-2 text-red-500"><Trash2 /> {t('wipe')}</div><button onClick={wipeDB} className="bg-red-100 text-red-600 px-3 py-1 rounded font-bold text-sm">{wiping ? '...' : t('wipe')}</button></div>
                        <div className={`p-4 rounded-xl border flex justify-between items-center ${card}`}><div className="flex gap-2 text-slate-500"><ArrowRightLeft /> {t('signout')}</div><button onClick={() => services?.auth.signOut()} className="bg-slate-200 text-slate-700 px-3 py-1 rounded font-bold text-sm">{t('signout')}</button></div>
                    </div>
                )}

                {view === 'list' && (
                    <div className="pb-24">
                        <button onClick={() => setView('dashboard')} className="mb-4"><ArrowLeft /></button>
                        <h1 className="text-2xl font-bold mb-4">{t('history')}</h1>
                        <div className="space-y-3">{historyTrans.map(t => (<div key={t.id} onClick={() => { setCurrentTransaction(t); setView('edit') }} className={`p-4 rounded-xl border flex justify-between cursor-pointer ${card}`}><div><div className="font-bold">{t.alias || t.merchant}</div><div className="text-xs opacity-60">{t.merchant}</div><CategoryBadge category={t.category} mini /><div className="text-xs opacity-60 mt-1">{formatDate(t.date, dateFormat)}</div></div><div className="font-bold">{formatCurrency(t.total, currency)}</div></div>))}</div>
                        <div className="flex justify-center gap-4 mt-6"><button disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)} className={`px-4 py-2 border rounded disabled:opacity-50 ${card}`}>{t('prev')}</button><span className="py-2">{t('page')} {historyPage}</span><button disabled={historyPage * ITEMS_PER_PAGE >= transactions.length} onClick={() => setHistoryPage(p => p + 1)} className={`px-4 py-2 border rounded disabled:opacity-50 ${card}`}>{t('next')}</button></div>
                    </div>
                )}
            </main>
            <Nav view={view} setView={setView} onScanClick={triggerScan} theme={theme} />
        </div>
    );
}

export default function App() { return <ErrorBoundary><MainApp /></ErrorBoundary>; }