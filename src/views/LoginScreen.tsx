import React from 'react';
import { Receipt, Globe } from 'lucide-react';

interface LoginScreenProps {
    onSignIn: () => Promise<void>;
    t: (key: string) => string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSignIn, t }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
            <Receipt size={64} className="mb-6 text-blue-500" />
            <h1 className="text-3xl font-bold mb-2">Expense Tracker</h1>
            <p className="text-slate-400 mb-8">Smart Receipt Scanning & Analytics</p>
            <button
                onClick={onSignIn}
                className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors"
            >
                <Globe size={20} /> {t('signin')}
            </button>
        </div>
    );
};
