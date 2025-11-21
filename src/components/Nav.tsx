import React from 'react';
import { Camera, Home, ListIcon, BarChart3, Settings } from 'lucide-react';

interface NavProps {
    view: string;
    setView: (view: string) => void;
    onScanClick: () => void;
    onTrendsClick?: () => void;
    theme: string;
    t: (key: string) => string;
}

export const Nav: React.FC<NavProps> = ({ view, setView, onScanClick, onTrendsClick, theme, t }) => {
    const active = (v: string) =>
        view === v ? 'text-blue-600' : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500');
    const bg = theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';

    return (
        <div className={`fixed bottom-0 left-0 right-0 border-t px-6 py-3 flex justify-between items-center z-50 ${bg}`}>
            <button
                onClick={() => setView('dashboard')}
                className={`flex flex-col items-center gap-1 ${active('dashboard')}`}
            >
                <Home size={24} />
                <span className="text-[10px]">{t('home')}</span>
            </button>
            <button
                onClick={() => {
                    if (onTrendsClick) onTrendsClick();
                    setView('trends');
                }}
                className={`flex flex-col items-center gap-1 ${active('trends')}`}
            >
                <BarChart3 size={24} />
                <span className="text-[10px]">{t('trends')}</span>
            </button>
            <div className="relative -top-6">
                <button
                    onClick={onScanClick}
                    className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform"
                >
                    <Camera size={24} />
                </button>
            </div>
            <button
                onClick={() => setView('list')}
                className={`flex flex-col items-center gap-1 ${active('list')}`}
            >
                <ListIcon size={24} />
                <span className="text-[10px]">{t('history')}</span>
            </button>
            <button
                onClick={() => setView('settings')}
                className={`flex flex-col items-center gap-1 ${active('settings')}`}
            >
                <Settings size={24} />
                <span className="text-[10px]">{t('settings')}</span>
            </button>
        </div>
    );
};
