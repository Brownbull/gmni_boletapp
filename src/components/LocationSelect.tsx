import React, { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { COUNTRIES, getCitiesForCountry } from '../data/locations';

interface LocationSelectProps {
    country: string;
    city: string;
    onCountryChange: (country: string) => void;
    onCityChange: (city: string) => void;
    inputStyle: React.CSSProperties;
    /** Optional placeholder for country select */
    countryPlaceholder?: string;
    /** Optional placeholder for city select */
    cityPlaceholder?: string;
    /** Theme for styling */
    theme?: 'light' | 'dark';
    /** Translation function */
    t?: (key: string) => string;
}

/**
 * Location selection component with dropdown panel
 * Story 14.14b Session 4: Updated to match scan-overlay mockup with floating labels
 *
 * - Shows clickable tag with city + country (e.g., "Las Condes, Chile")
 * - Opens dropdown panel with floating label selects for País and Ciudad
 * - Changing country resets city if current city isn't in new country
 */
export const LocationSelect: React.FC<LocationSelectProps> = ({
    country,
    city,
    onCountryChange,
    onCityChange,
    inputStyle,
    countryPlaceholder = 'País',
    cityPlaceholder = 'Ciudad / Comuna',
    // theme kept for API compatibility but not used (colors now use CSS variables)
    theme: _theme = 'light',
    t,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const cities = getCitiesForCountry(country);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleCountryChange = (newCountry: string) => {
        onCountryChange(newCountry);
        // Reset city if it's not valid for the new country
        const newCities = getCitiesForCountry(newCountry);
        if (city && !newCities.includes(city)) {
            onCityChange('');
        }
    };

    const handleConfirm = () => {
        setIsOpen(false);
    };

    // Display text: "City, Country" or just one if only one is set
    const displayText = city && country
        ? `${city}, ${country}`
        : city || country || (t ? t('selectLocation') : 'Seleccionar ubicación');

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Clickable tag - matches other pill styling */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-colors"
                style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-secondary)',
                }}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <MapPin size={12} />
                <span className="max-w-[150px] truncate">{displayText}</span>
            </button>

            {/* Dropdown panel */}
            {isOpen && (
                <div
                    className="absolute top-full left-0 mt-2 min-w-[240px] rounded-xl overflow-hidden z-50"
                    style={{
                        backgroundColor: 'var(--bg-secondary, #ffffff)',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
                        border: '1px solid var(--border-light, #e2e8f0)',
                    }}
                >
                    <div className="p-3 space-y-3">
                        {/* Country select with floating label */}
                        <div className="relative">
                            <label
                                className="absolute -top-2 left-2.5 px-1 text-[10px] font-medium z-10"
                                style={{
                                    backgroundColor: 'var(--bg-secondary, #ffffff)',
                                    color: 'var(--primary, #2563eb)',
                                }}
                            >
                                {countryPlaceholder}
                            </label>
                            <select
                                className="w-full h-10 px-3 pr-8 border rounded-lg text-sm cursor-pointer appearance-none"
                                style={{
                                    ...inputStyle,
                                    backgroundColor: 'var(--bg-secondary, #ffffff)',
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 10px center',
                                }}
                                value={country}
                                onChange={e => handleCountryChange(e.target.value)}
                                aria-label={countryPlaceholder}
                            >
                                <option value="">—</option>
                                {COUNTRIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* City select with floating label */}
                        <div className="relative">
                            <label
                                className="absolute -top-2 left-2.5 px-1 text-[10px] font-medium z-10"
                                style={{
                                    backgroundColor: 'var(--bg-secondary, #ffffff)',
                                    color: 'var(--primary, #2563eb)',
                                }}
                            >
                                {cityPlaceholder}
                            </label>
                            <select
                                className="w-full h-10 px-3 pr-8 border rounded-lg text-sm cursor-pointer appearance-none"
                                style={{
                                    ...inputStyle,
                                    backgroundColor: 'var(--bg-secondary, #ffffff)',
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 10px center',
                                }}
                                value={city}
                                onChange={e => onCityChange(e.target.value)}
                                disabled={!country}
                                aria-label={cityPlaceholder}
                            >
                                <option value="">—</option>
                                {cities.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Confirm button */}
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{
                                backgroundColor: 'var(--primary-light, #dbeafe)',
                                color: 'var(--primary, #2563eb)',
                            }}
                        >
                            {t ? t('confirm') : 'Confirmar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
