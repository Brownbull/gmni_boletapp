/**
 * SettingsMenuItem Component
 * Story 14.22: Reusable menu item for the hierarchical settings view
 *
 * Displays an icon, title, subtitle, and chevron for navigation
 * Matches the design from settings.html mockup
 */

import React from 'react';
import {
    ChevronRight,
    CircleAlert,
    User,
    Settings,
    Camera,
    CreditCard,
    BookOpen,
    Smartphone,
    Database,
} from 'lucide-react';

export interface SettingsMenuItemProps {
    /** Translation key for the title */
    title: string;
    /** Translation key for the subtitle */
    subtitle: string;
    /** Lucide icon name - matches mockup settings.html */
    icon: 'circle-alert' | 'user' | 'settings' | 'camera' | 'credit-card' | 'book-open' | 'smartphone' | 'database';
    /** Background color for the icon container */
    iconBgColor: string;
    /** Icon stroke color */
    iconColor?: string;
    /** Click handler for navigation */
    onClick: () => void;
    /** Optional test ID */
    testId?: string;
}

// Map icon names to Lucide components (matching mockup settings.html)
const iconMap = {
    'circle-alert': CircleAlert,
    'user': User,
    'settings': Settings,
    'camera': Camera,
    'credit-card': CreditCard,
    'book-open': BookOpen,
    'smartphone': Smartphone,
    'database': Database,
};

export const SettingsMenuItem: React.FC<SettingsMenuItemProps> = ({
    title,
    subtitle,
    icon,
    iconBgColor,
    iconColor = '#ffffff',
    onClick,
    testId,
}) => {
    const IconComponent = iconMap[icon];

    return (
        <button
            onClick={onClick}
            data-testid={testId}
            className="w-full flex items-center gap-3 p-4 rounded-xl border transition-colors cursor-pointer"
            style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-light)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
            }}
        >
            {/* Icon container */}
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: iconBgColor }}
            >
                <IconComponent size={20} color={iconColor} strokeWidth={2} />
            </div>

            {/* Title and subtitle */}
            <div className="flex-1 text-left">
                <div
                    className="text-sm font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {title}
                </div>
                <div
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {subtitle}
                </div>
            </div>

            {/* Chevron */}
            <ChevronRight
                size={20}
                className="flex-shrink-0"
                style={{ color: 'var(--text-tertiary)' }}
            />
        </button>
    );
};
