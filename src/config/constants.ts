/**
 * Store categories for the app UI.
 * IMPORTANT: Keep in sync with prompt-testing/prompts/output-schema.ts STORE_CATEGORIES
 */
export const STORE_CATEGORIES = [
    // Food & Dining
    'Supermarket', 'Restaurant', 'Bakery', 'Butcher', 'StreetVendor',
    // Health & Wellness
    'Pharmacy', 'Medical', 'Veterinary', 'HealthBeauty',
    // Retail - General
    'Bazaar', 'Clothing', 'Electronics', 'HomeGoods', 'Furniture', 'Hardware', 'GardenCenter',
    // Retail - Specialty
    'PetShop', 'BooksMedia', 'OfficeSupplies', 'SportsOutdoors', 'ToysGames', 'Jewelry', 'Optical',
    // Automotive & Transport
    'Automotive', 'GasStation', 'Transport',
    // Services & Finance
    'Services', 'BankingFinance', 'Education', 'TravelAgency',
    // Hospitality & Entertainment
    'HotelLodging', 'Entertainment',
    // Other
    'CharityDonation', 'Other',
] as const;

export const ITEMS_PER_PAGE = 20;
