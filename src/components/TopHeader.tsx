/**
 * Story 14.10: Top Header Bar Component
 *
 * A consistent top header bar across all views with:
 * - Home variant: Logo (left) | Wordmark (center) | Profile Avatar (right)
 * - Detail variant: Back button (left) | Title (center) | Empty (right)
 * - Settings variant: Back button (left) | "Configuración" (center) | Empty (right)
 *
 * Features:
 * - Fixed at top of screen (below status bar area)
 * - Safe area inset support for notch devices
 * - 44-48px height matching iOS/Android conventions
 * - 44px minimum touch targets for accessibility
 * - CSS variables for theming
 * - Profile dropdown menu with user info and navigation
 */

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, CreditCard, FileText, Target, Settings } from 'lucide-react';

export type HeaderVariant = 'home' | 'detail' | 'settings';

// View-specific titles for the home variant (when showing logo + title)
// Story 14.11: Added 'alerts' for the new alerts view
export type ViewTitle = 'home' | 'analytics' | 'history' | 'insights' | 'alerts' | 'gastify';

export interface TopHeaderProps {
    /**
     * Header variant determines layout:
     * - 'home': Logo (left) + Wordmark (center) + Profile Avatar (right)
     * - 'detail': Back button (left) + Title (center) + (empty right)
     * - 'settings': Back button (left) + "Configuración" (center) + (empty right)
     */
    variant: HeaderVariant;

    /**
     * View-specific title for home variant
     * When set, replaces the wordmark with the view title
     */
    viewTitle?: ViewTitle;

    /**
     * Custom title for detail variant
     */
    title?: string;

    /**
     * Back button handler (required for detail/settings variants)
     */
    onBack?: () => void;

    /**
     * Menu button handler - navigates to settings (home variant)
     */
    onMenuClick?: () => void;

    /**
     * User display name for profile avatar (e.g., "Juan Díaz")
     */
    userName?: string;

    /**
     * User email for profile dropdown
     */
    userEmail?: string;

    /**
     * Theme for styling
     */
    theme: 'light' | 'dark' | string;

    /**
     * Translation function
     */
    t: (key: string) => string;
}

/**
 * Get initials from a name (e.g., "Juan Díaz" -> "JD")
 */
const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * App Logo Component
 * Renders the "G" logo in a circle with theme-aware colors
 * Uses CSS variables so theme switching works automatically
 * Per mockup: 28x28px circle
 */
const AppLogo: React.FC<{ theme: string }> = () => {
    // Logo uses --primary color which changes per theme:
    // - Professional: blue (#2563eb)
    // - Mono: black (#18181b)
    // - Ni No Kuni: green (#4a7c59)
    return (
        <div
            data-testid="app-logo"
            className="g-logo-circle rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300"
            style={{
                width: '28px',
                height: '28px',
                background: 'var(--primary, #2563eb)',
            }}
        >
            <span
                className="text-white font-bold"
                style={{
                    fontFamily: "var(--font-family-wordmark, 'Baloo 2', cursive)",
                    fontSize: '14px',
                }}
            >
                G
            </span>
        </div>
    );
};

/**
 * Profile Avatar Component
 * Circular avatar with user initials - matches mockup exactly
 * Per mockup: 32px circle with solid theme color (same as logo), 2px border
 * Uses CSS variables so theme switching works automatically
 */
const ProfileAvatar = React.forwardRef<
    HTMLButtonElement,
    { initials: string; onClick: () => void; theme: string }
>(({ initials, onClick }, ref) => {
    // Avatar uses same --primary color as logo:
    // - Professional: blue (#2563eb)
    // - Mono: black (#18181b)
    // - Ni No Kuni: green (#4a7c59)
    return (
        <button
            ref={ref}
            data-testid="profile-avatar"
            onClick={onClick}
            className="flex items-center justify-center cursor-pointer p-0 bg-transparent border-none rounded-full transition-transform duration-200 hover:scale-105"
            style={{ width: '32px', height: '32px' }}
            aria-label="Open profile menu"
            aria-haspopup="true"
        >
            {/* Inner circle with solid theme color and border */}
            <div
                className="flex items-center justify-center rounded-full"
                style={{
                    width: '32px',
                    height: '32px',
                    background: 'var(--primary, #2563eb)',
                    border: '2px solid var(--border-light, #e2e8f0)',
                }}
            >
                <span
                    className="text-white"
                    style={{ fontSize: '12px', fontWeight: 600 }}
                >
                    {initials}
                </span>
            </div>
        </button>
    );
});
ProfileAvatar.displayName = 'ProfileAvatar';

/**
 * Profile Dropdown Menu Component
 */
const ProfileDropdown: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    userEmail: string;
    onNavigate: (view: string) => void;
    theme: string;
    t: (key: string) => string;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
}> = ({ isOpen, onClose, userName, userEmail, onNavigate, theme, t, triggerRef }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isDark = theme === 'dark';

    // Close on click outside (excluding the trigger button)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            // Don't close if clicking the trigger button (toggle handles that)
            if (triggerRef.current && triggerRef.current.contains(target)) {
                return;
            }
            if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, onClose, triggerRef]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const menuItems = [
        { key: 'transactions', icon: CreditCard, label: t('transactions'), action: () => onNavigate('history') },
        { key: 'reports', icon: FileText, label: t('reports'), action: () => onNavigate('reports'), disabled: true, badge: t('comingSoon') },
        { key: 'goals', icon: Target, label: t('goals'), action: () => onNavigate('goals'), disabled: true, badge: t('comingSoon') },
    ];

    return (
        <div
            ref={dropdownRef}
            data-testid="profile-dropdown"
            className="absolute top-11 right-0 z-[100] min-w-[160px] rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
                backgroundColor: 'var(--bg-secondary, #ffffff)',
                border: `1px solid ${isDark ? 'var(--border-light, #334155)' : 'var(--border-light, #e2e8f0)'}`,
            }}
            role="menu"
            aria-orientation="vertical"
        >
            {/* User info header */}
            <div
                className="px-3.5 py-2.5 border-b mb-1"
                style={{ borderColor: isDark ? 'var(--border-light, #334155)' : 'var(--border-light, #e2e8f0)' }}
            >
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary, #0f172a)' }}>
                    {userName || 'Usuario'}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary, #94a3b8)' }}>
                    {userEmail || ''}
                </div>
            </div>

            {/* Menu items */}
            {menuItems.map((item) => (
                <button
                    key={item.key}
                    onClick={() => {
                        if (!item.disabled) {
                            item.action();
                            onClose();
                        }
                    }}
                    disabled={item.disabled}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                        item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                    role="menuitem"
                    style={{ color: item.disabled ? 'var(--text-tertiary, #94a3b8)' : 'var(--text-primary, #0f172a)' }}
                >
                    <item.icon
                        size={18}
                        strokeWidth={2}
                        style={{ color: item.disabled ? 'var(--text-tertiary, #94a3b8)' : 'var(--text-secondary, #475569)' }}
                    />
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {item.badge && (
                        <span className="text-[10px]" style={{ color: 'var(--text-tertiary, #94a3b8)' }}>
                            {item.badge}
                        </span>
                    )}
                </button>
            ))}

            {/* Divider */}
            <div
                className="border-t mt-1 pt-1"
                style={{ borderColor: isDark ? 'var(--border-light, #334155)' : 'var(--border-light, #e2e8f0)' }}
            >
                {/* Settings */}
                <button
                    onClick={() => {
                        onNavigate('settings');
                        onClose();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    role="menuitem"
                    style={{ color: 'var(--text-primary, #0f172a)' }}
                >
                    <Settings size={18} strokeWidth={2} style={{ color: 'var(--text-secondary, #475569)' }} />
                    <span className="text-sm font-medium">{t('settings')}</span>
                </button>
            </div>
        </div>
    );
};

/**
 * TopHeader Component
 */
export const TopHeader: React.FC<TopHeaderProps> = ({
    variant,
    viewTitle,
    title,
    onBack,
    onMenuClick,
    userName = '',
    userEmail = '',
    theme,
    t,
}) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileButtonRef = useRef<HTMLButtonElement>(null);

    // Determine the display title based on variant and viewTitle
    const getDisplayTitle = (): string => {
        if (variant === 'settings') {
            return t('settings');
        }
        if (variant === 'detail' && title) {
            return title;
        }
        if (variant === 'home' && viewTitle) {
            switch (viewTitle) {
                case 'analytics':
                    return t('analytics');
                case 'history':
                    return t('history');
                case 'insights':
                    return t('insights');
                case 'home':
                case 'gastify':
                default:
                    return 'Gastify';
            }
        }
        return 'Gastify';
    };

    // Should show the logo?
    const showLogo = variant === 'home';

    // Should show the back button?
    const showBackButton = variant === 'detail' || variant === 'settings';

    // Should show the profile avatar?
    const showProfileAvatar = variant === 'home';

    // Get title style based on whether it's the wordmark or a regular title
    const isWordmark = variant === 'home' && (!viewTitle || viewTitle === 'home' || viewTitle === 'gastify');

    // Handle profile navigation
    const handleProfileNavigate = (view: string) => {
        if (view === 'settings' && onMenuClick) {
            onMenuClick();
        }
        // Other navigation would be handled by parent via callback if needed
    };

    const initials = getInitials(userName);

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center"
            style={{
                paddingTop: 'env(safe-area-inset-top, 0px)',
                paddingLeft: '16px',
                paddingRight: '16px',
                backgroundColor: 'var(--bg-primary, #f8fafc)',
                // Story 14.12: No border per mockup - header blends with content background
            }}
        >
            {/* 3-column layout: Left | Center | Right */}
            <div className="w-full flex items-center justify-between">
                {/* Left side: Logo OR Back button */}
                <div className="flex items-center min-w-[44px]">
                    {showBackButton && onBack && (
                        <button
                            onClick={onBack}
                            className="min-w-11 min-h-11 flex items-center justify-center -ml-2"
                            aria-label="Go back"
                            style={{ color: 'var(--text-secondary, #475569)' }}
                        >
                            <ArrowLeft size={24} strokeWidth={2} />
                        </button>
                    )}

                    {showLogo && <AppLogo theme={theme} />}
                </div>

                {/* Center: Title/Wordmark - absolutely centered */}
                <div className="absolute left-1/2 transform -translate-x-1/2">
                    <span
                        className={`font-semibold ${isWordmark ? 'text-2xl' : 'text-lg'}`}
                        style={{
                            fontFamily: isWordmark ? "var(--font-family-wordmark, 'Baloo 2', cursive)" : 'var(--font-family)',
                            color: 'var(--text-primary, #0f172a)',
                            fontWeight: 700,
                        }}
                    >
                        {getDisplayTitle()}
                    </span>
                </div>

                {/* Right side: Profile Avatar OR empty placeholder */}
                <div className="flex items-center justify-end min-w-[44px] relative">
                    {showProfileAvatar && (
                        <>
                            <ProfileAvatar
                                ref={profileButtonRef}
                                initials={initials}
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                theme={theme}
                            />
                            <ProfileDropdown
                                isOpen={isProfileOpen}
                                onClose={() => setIsProfileOpen(false)}
                                userName={userName}
                                userEmail={userEmail}
                                onNavigate={handleProfileNavigate}
                                theme={theme}
                                t={t}
                                triggerRef={profileButtonRef}
                            />
                        </>
                    )}

                    {/* Empty placeholder for detail/settings to maintain layout */}
                    {!showProfileAvatar && <div className="w-9" />}
                </div>
            </div>
        </header>
    );
};

export default TopHeader;
