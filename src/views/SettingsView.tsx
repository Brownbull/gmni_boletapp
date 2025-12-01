import React from 'react';
import { Globe, DollarSign, Calendar, Moon, Download, Trash2, ArrowRightLeft } from 'lucide-react';

interface SettingsViewProps {
    lang: string;
    currency: string;
    dateFormat: string;
    theme: string;
    wiping: boolean;
    t: (key: string) => string;
    onSetLang: (lang: string) => void;
    onSetCurrency: (currency: string) => void;
    onSetDateFormat: (format: string) => void;
    onSetTheme: (theme: string) => void;
    onExportAll: () => void;
    onWipeDB: () => Promise<void>;
    onSignOut: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
    lang,
    currency,
    dateFormat,
    theme,
    wiping,
    t,
    onSetLang,
    onSetCurrency,
    onSetDateFormat,
    onSetTheme,
    onExportAll,
    onWipeDB,
    onSignOut,
}) => {
    const card = theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';
    const toggleBg = theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100';
    const toggleActive = theme === 'dark' ? 'bg-slate-600 shadow text-white' : 'bg-white shadow';

    return (
        <div className="pb-24 space-y-4">
            <h1 className="text-2xl font-bold mb-6">{t('settings')}</h1>

            <div className={`p-4 rounded-xl border flex justify-between items-center ${card}`}>
                <div className="flex gap-2">
                    <Globe /> {t('language')}
                </div>
                <div className={`flex rounded p-1 ${toggleBg}`}>
                    <button
                        onClick={() => onSetLang('en')}
                        className={`px-3 rounded ${lang === 'en' ? toggleActive : ''}`}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => onSetLang('es')}
                        className={`px-3 rounded ${lang === 'es' ? toggleActive : ''}`}
                    >
                        ES
                    </button>
                </div>
            </div>

            <div className={`p-4 rounded-xl border flex justify-between items-center ${card}`}>
                <div className="flex gap-2">
                    <DollarSign /> {t('currency')}
                </div>
                <div className={`flex rounded p-1 ${toggleBg}`}>
                    <button
                        onClick={() => onSetCurrency('CLP')}
                        className={`px-3 rounded ${currency === 'CLP' ? toggleActive : ''}`}
                    >
                        CLP
                    </button>
                    <button
                        onClick={() => onSetCurrency('USD')}
                        className={`px-3 rounded ${currency === 'USD' ? toggleActive : ''}`}
                    >
                        USD
                    </button>
                </div>
            </div>

            <div className={`p-4 rounded-xl border flex justify-between items-center ${card}`}>
                <div className="flex gap-2">
                    <Calendar /> {t('dateFormat')}
                </div>
                <div className={`flex rounded p-1 ${toggleBg}`}>
                    <button
                        onClick={() => onSetDateFormat('LatAm')}
                        className={`px-3 rounded ${dateFormat === 'LatAm' ? toggleActive : ''}`}
                    >
                        31/12
                    </button>
                    <button
                        onClick={() => onSetDateFormat('US')}
                        className={`px-3 rounded ${dateFormat === 'US' ? toggleActive : ''}`}
                    >
                        12/31
                    </button>
                </div>
            </div>

            <div className={`p-4 rounded-xl border flex justify-between items-center ${card}`}>
                <div className="flex gap-2">
                    <Moon /> {t('theme')}
                </div>
                <div className={`flex rounded p-1 ${toggleBg}`}>
                    <button
                        onClick={() => onSetTheme('light')}
                        className={`px-3 rounded ${theme === 'light' ? toggleActive : ''}`}
                    >
                        Light
                    </button>
                    <button
                        onClick={() => onSetTheme('dark')}
                        className={`px-3 rounded ${theme === 'dark' ? toggleActive : ''}`}
                    >
                        Dark
                    </button>
                </div>
            </div>

            <div className={`p-4 rounded-xl border flex justify-between items-center ${card}`}>
                <div className="flex gap-2">
                    <Download /> {t('exportAll')}
                </div>
                <button
                    onClick={onExportAll}
                    className="bg-blue-200 text-blue-800 px-3 py-1 rounded font-bold text-sm"
                >
                    CSV
                </button>
            </div>

            <div className={`p-4 rounded-xl border flex justify-between items-center ${card}`}>
                <div className="flex gap-2 text-red-700">
                    <Trash2 /> {t('wipe')}
                </div>
                <button
                    onClick={onWipeDB}
                    className="bg-red-200 text-red-800 px-3 py-1 rounded font-bold text-sm"
                >
                    {wiping ? '...' : t('wipe')}
                </button>
            </div>

            <div className={`p-4 rounded-xl border flex justify-between items-center ${card}`}>
                <div className="flex gap-2 text-slate-500">
                    <ArrowRightLeft /> {t('signout')}
                </div>
                <button
                    onClick={onSignOut}
                    className="bg-slate-200 text-slate-700 px-3 py-1 rounded font-bold text-sm"
                >
                    {t('signout')}
                </button>
            </div>
        </div>
    );
};
