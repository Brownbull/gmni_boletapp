/**
 * EscaneoView Sub-View
 * Story 14.22 AC #6: Default scan currency and location settings
 *
 * Migrates scan defaults from flat SettingsView into dedicated sub-view
 */

import React from 'react';
import { Receipt, MapPin } from 'lucide-react';
import { LocationSelect } from '../../LocationSelect';
import { SupportedCurrency, SUPPORTED_CURRENCIES } from '../../../services/userPreferencesService';

interface EscaneoViewProps {
    t: (key: string) => string;
    theme: string;
    defaultScanCurrency?: SupportedCurrency;
    defaultCountry?: string;
    defaultCity?: string;
    onSetDefaultScanCurrency?: (currency: SupportedCurrency) => void;
    onSetDefaultCountry?: (country: string) => void;
    onSetDefaultCity?: (city: string) => void;
}

export const EscaneoView: React.FC<EscaneoViewProps> = ({
    t,
    theme,
    defaultScanCurrency = 'CLP',
    defaultCountry = '',
    defaultCity = '',
    onSetDefaultScanCurrency,
    onSetDefaultCountry,
    onSetDefaultCity,
}) => {
    const isDark = theme === 'dark';

    const cardStyle: React.CSSProperties = {
        backgroundColor: 'var(--bg-secondary)',
        borderColor: isDark ? '#334155' : '#e2e8f0',
    };

    const inputStyle: React.CSSProperties = {
        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
        borderColor: isDark ? '#475569' : '#e2e8f0',
        color: 'var(--text-primary)',
    };

    return (
        <div className="space-y-4">
            {/* Default Scan Currency */}
            {onSetDefaultScanCurrency && (
                <div className="p-4 rounded-xl border" style={cardStyle}>
                    <div className="flex gap-2 items-center mb-2" style={{ color: 'var(--text-primary)' }}>
                        <Receipt size={24} strokeWidth={2} /> {t('defaultScanCurrency')}
                    </div>
                    <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {t('defaultScanCurrencyHint')}
                    </p>
                    <select
                        value={defaultScanCurrency}
                        onChange={(e) => onSetDefaultScanCurrency(e.target.value as SupportedCurrency)}
                        className="w-full p-3 border rounded-lg text-sm"
                        style={inputStyle}
                        aria-label={t('defaultScanCurrency')}
                    >
                        {SUPPORTED_CURRENCIES.map((curr) => (
                            <option key={curr} value={curr}>
                                {t(`currency${curr.charAt(0) + curr.slice(1).toLowerCase()}`)}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Default Location */}
            {onSetDefaultCountry && onSetDefaultCity && (
                <div className="p-4 rounded-xl border" style={cardStyle}>
                    <div className="flex gap-2 items-center mb-2" style={{ color: 'var(--text-primary)' }}>
                        <MapPin size={24} strokeWidth={2} /> {t('defaultLocation')}
                    </div>
                    <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {t('defaultLocationHint')}
                    </p>
                    <LocationSelect
                        country={defaultCountry}
                        city={defaultCity}
                        onCountryChange={onSetDefaultCountry}
                        onCityChange={onSetDefaultCity}
                        inputStyle={inputStyle}
                    />
                </div>
            )}
        </div>
    );
};
