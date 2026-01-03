export type Currency = 'CLP' | 'USD' | 'EUR';
export type Language = 'es' | 'en';
export type Theme = 'light' | 'dark';
// Story 7.12 AC#11: Color theme selector
// Story 7.17: Renamed themes - 'normal' (warm, was ghibli), 'professional' (cool)
// Story 14.12: Added 'mono' (monochrome) as new default
export type ColorTheme = 'normal' | 'professional' | 'mono';

export interface AppSettings {
    lang: Language;
    currency: Currency;
    theme: Theme;
    colorTheme?: ColorTheme; // Story 7.12 AC#11
}
