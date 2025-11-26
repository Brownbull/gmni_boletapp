import React from 'react';
import { Receipt, Globe } from 'lucide-react';

interface LoginScreenProps {
    onSignIn: () => Promise<void>;
    onTestSignIn?: () => Promise<void>;
    t: (key: string) => string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSignIn, onTestSignIn, t }) => {
    // Check if we're in development/test environment
    const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';

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

            {/* Test Login Button - Only visible in dev/test environments */}
            {isDev && onTestSignIn && (
                <button
                    onClick={onTestSignIn}
                    data-testid="test-login-button"
                    className="mt-4 bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-yellow-800 transition-colors"
                    title="Test authentication for E2E testing (dev only)"
                >
                    🧪 Test Login
                </button>
            )}
        </div>
    );
};
