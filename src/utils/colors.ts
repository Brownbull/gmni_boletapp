const stringToColor = (str: string): string => {
    if (!str) return '#94a3b8';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

export const getColor = (key: string): string => {
    const PRESETS: Record<string, string> = {
        Supermarket: '#3b82f6',
        Restaurant: '#f97316',
        Bakery: '#eab308',
        Butcher: '#ef4444',
        Bazaar: '#8b5cf6',
        Veterinary: '#10b981',
        PetShop: '#14b8a6',
        Medical: '#06b6d4',
        Pharmacy: '#6366f1',
        Technology: '#64748b',
        StreetVendor: '#f43f5e',
        Transport: '#84cc16',
        Services: '#0ea5e9',
        Other: '#94a3b8',
        'Fresh Food': '#10b981',
        'Pantry': '#f59e0b',
        'Drinks': '#3b82f6',
        'Household': '#6366f1',
        'Personal Care': '#ec4899',
        'Pets': '#14b8a6'
    };
    return PRESETS[key] || stringToColor(key || 'default');
};
