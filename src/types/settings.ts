export type Currency = 'CLP' | 'USD' | 'EUR';
export type Language = 'es' | 'en';
export type Theme = 'light' | 'dark';

export interface AppSettings {
    lang: Language;
    currency: Currency;
    theme: Theme;
}
