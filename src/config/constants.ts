/**
 * Application ID used for Firestore collection paths.
 * This should match the Firebase project ID.
 */
export const APP_ID = 'boletapp';

/**
 * Store categories (V4) for the app UI.
 * IMPORTANT: Keep in sync with shared/schema/categories.ts STORE_CATEGORIES
 */
export const STORE_CATEGORIES = [
    // Supermercados
    'Supermarket', 'Wholesale',
    // Restaurantes
    'Restaurant',
    // Comercio de Barrio
    'Almacen', 'Minimarket', 'OpenMarket', 'Kiosk', 'LiquorStore', 'Bakery', 'Butcher',
    // Vivienda
    'UtilityCompany', 'PropertyAdmin',
    // Salud y Bienestar
    'Pharmacy', 'Medical', 'Veterinary', 'HealthBeauty',
    // Tiendas Generales
    'Bazaar', 'ClothingStore', 'ElectronicsStore', 'HomeGoods', 'FurnitureStore', 'Hardware', 'GardenCenter',
    // Tiendas Especializadas
    'PetShop', 'BookStore', 'OfficeSupplies', 'SportsStore', 'ToyStore', 'AccessoriesOptical', 'OnlineStore',
    // Transporte y Vehiculo
    'AutoShop', 'GasStation', 'Transport',
    // Servicios y Finanzas
    'GeneralServices', 'BankingFinance', 'TravelAgency', 'SubscriptionService', 'Government',
    // Educacion
    'Education',
    // Entretenimiento y Hospedaje
    'Lodging', 'Entertainment', 'Casino',
    // Otros
    'CharityDonation', 'Other',
] as const;

export const ITEMS_PER_PAGE = 20;
