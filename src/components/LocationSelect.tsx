import React from 'react';
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
}

/**
 * Location selection component with country and city dropdowns
 * Story 9.3: Editable location fields
 *
 * - Country dropdown shows all supported countries
 * - City dropdown shows cities for the selected country
 * - Changing country resets city if current city isn't in new country
 */
export const LocationSelect: React.FC<LocationSelectProps> = ({
    country,
    city,
    onCountryChange,
    onCityChange,
    inputStyle,
    countryPlaceholder = 'Country',
    cityPlaceholder = 'City',
}) => {
    const cities = getCitiesForCountry(country);

    const handleCountryChange = (newCountry: string) => {
        onCountryChange(newCountry);
        // Reset city if it's not valid for the new country
        const newCities = getCitiesForCountry(newCountry);
        if (city && !newCities.includes(city)) {
            onCityChange('');
        }
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-base flex-shrink-0">📍</span>
            <select
                className="flex-1 p-2 border rounded-lg text-sm min-w-0"
                style={inputStyle}
                value={city}
                onChange={e => onCityChange(e.target.value)}
                disabled={!country}
                aria-label={cityPlaceholder}
            >
                <option value="">{cityPlaceholder}</option>
                {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>
            <select
                className="flex-1 p-2 border rounded-lg text-sm min-w-0"
                style={inputStyle}
                value={country}
                onChange={e => handleCountryChange(e.target.value)}
                aria-label={countryPlaceholder}
            >
                <option value="">{countryPlaceholder}</option>
                {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>
        </div>
    );
};
