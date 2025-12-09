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

    // Story 7.12: LoginScreen uses gradient accent pattern (AC #5)
    // Always uses dark theme for login screen for visual impact
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6"
            style={{
                background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                color: '#f8fafc',
            }}
        >
            {/* App icon with accent color */}
            <div
                className="mb-6 p-4 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, var(--accent), #6366f1)' }}
            >
                <Receipt size={48} className="text-white" strokeWidth={2} />
            </div>

            {/* App title and tagline */}
            <h1 className="text-3xl font-bold mb-2">Expense Tracker</h1>
            <p className="mb-8" style={{ color: '#94a3b8' }}>Smart Receipt Scanning & Analytics</p>

            {/* Primary sign-in button with consistent styling */}
            <button
                onClick={onSignIn}
                className="min-h-11 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                    backgroundColor: '#f8fafc',
                    color: '#0f172a',
                }}
            >
                <Globe size={20} strokeWidth={2} /> {t('signin')}
            </button>

            {/* Test Login Button - Only visible in dev/test environments */}
            {isDev && onTestSignIn && (
                <button
                    onClick={onTestSignIn}
                    data-testid="test-login-button"
                    className="mt-4 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    style={{
                        backgroundColor: 'rgba(251, 191, 36, 0.2)',
                        color: '#fbbf24',
                    }}
                    title="Test authentication for E2E testing (dev only)"
                >
                    🧪 Test Login
                </button>
            )}
        </div>
    );
};
