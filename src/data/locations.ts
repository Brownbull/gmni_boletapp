/**
 * Location data for country and city dropdowns
 * Story 9.3: Editable location fields with dropdown selection
 *
 * To add more countries/cities:
 * 1. Add the country to the appropriate region array
 * 2. Add the cities array for that country in CITIES_BY_COUNTRY
 */

// South America
const SOUTH_AMERICA = [
    'Argentina',
    'Bolivia',
    'Brazil',
    'Chile',
    'Colombia',
    'Ecuador',
    'Guyana',
    'Paraguay',
    'Peru',
    'Suriname',
    'Uruguay',
    'Venezuela',
] as const;

// North America (including Central America and Caribbean)
const NORTH_AMERICA = [
    'Canada',
    'Costa Rica',
    'Cuba',
    'Dominican Republic',
    'El Salvador',
    'Guatemala',
    'Haiti',
    'Honduras',
    'Jamaica',
    'Mexico',
    'Nicaragua',
    'Panama',
    'Puerto Rico',
    'United States',
] as const;

// Europe
const EUROPE = [
    'Austria',
    'Belgium',
    'Croatia',
    'Czech Republic',
    'Denmark',
    'Finland',
    'France',
    'Germany',
    'Greece',
    'Hungary',
    'Ireland',
    'Italy',
    'Netherlands',
    'Norway',
    'Poland',
    'Portugal',
    'Romania',
    'Spain',
    'Sweden',
    'Switzerland',
    'United Kingdom',
] as const;

// Asia
const ASIA = [
    'China',
    'Hong Kong',
    'India',
    'Indonesia',
    'Japan',
    'Malaysia',
    'Philippines',
    'Singapore',
    'South Korea',
    'Taiwan',
    'Thailand',
    'Vietnam',
] as const;

// Oceania
const OCEANIA = [
    'Australia',
    'New Zealand',
] as const;

/**
 * All supported countries, sorted alphabetically
 */
export const COUNTRIES = [
    ...SOUTH_AMERICA,
    ...NORTH_AMERICA,
    ...EUROPE,
    ...ASIA,
    ...OCEANIA,
].sort() as string[];

/**
 * Cities by country
 * Add cities here as needed - most common/major cities per country
 */
export const CITIES_BY_COUNTRY: Record<string, string[]> = {
    // South America
    'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Miguel de Tucumán', 'Mar del Plata', 'Salta'],
    'Bolivia': ['La Paz', 'Santa Cruz', 'Cochabamba', 'Sucre', 'Oruro', 'Tarija', 'Potosí'],
    'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre'],
    'Chile': [
        // Región Metropolitana
        'Santiago', 'Puente Alto', 'Maipú', 'La Florida', 'Las Condes', 'San Bernardo', 'Peñalolén', 'Providencia', 'Ñuñoa', 'Vitacura', 'Lo Barnechea',
        // Región de Valparaíso
        'Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'San Antonio', 'Quillota', 'Los Andes', 'San Felipe',
        // Región del Biobío
        'Concepción', 'Talcahuano', 'Chillán', 'Los Ángeles', 'Coronel', 'San Pedro de la Paz', 'Hualpén', 'Chiguayante',
        // Región de La Araucanía
        'Temuco', 'Villarrica', 'Pucón', 'Angol', 'Victoria', 'Lautaro', 'Padre Las Casas', 'Pitrufquén', 'Freire',
        // Región de Los Lagos
        'Puerto Montt', 'Osorno', 'Puerto Varas', 'Castro', 'Ancud', 'Frutillar', 'Llanquihue', 'Calbuco',
        // Región de Los Ríos
        'Valdivia', 'La Unión', 'Panguipulli', 'Río Bueno', 'Futrono',
        // Región del Maule
        'Talca', 'Curicó', 'Linares', 'Cauquenes', 'Constitución', 'Molina', 'San Javier',
        // Región de O'Higgins
        'Rancagua', 'San Fernando', 'Rengo', 'Machalí', 'Pichilemu', 'Graneros', 'Santa Cruz',
        // Región de Coquimbo
        'La Serena', 'Coquimbo', 'Ovalle', 'Illapel', 'Vicuña', 'Andacollo',
        // Región de Atacama
        'Copiapó', 'Vallenar', 'Caldera', 'Chañaral', 'Diego de Almagro',
        // Región de Antofagasta
        'Antofagasta', 'Calama', 'Tocopilla', 'Mejillones', 'San Pedro de Atacama', 'Taltal',
        // Región de Tarapacá
        'Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Pica',
        // Región de Arica y Parinacota
        'Arica', 'Putre',
        // Región de Aysén
        'Coyhaique', 'Puerto Aysén', 'Chile Chico', 'Cochrane',
        // Región de Magallanes
        'Punta Arenas', 'Puerto Natales', 'Porvenir', 'Puerto Williams',
        // Región de Ñuble
        'Chillán Viejo', 'San Carlos', 'Bulnes', 'Yungay', 'Quirihue'
    ],
    'Colombia': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Bucaramanga', 'Pereira'],
    'Ecuador': ['Quito', 'Guayaquil', 'Cuenca', 'Santo Domingo', 'Machala', 'Manta'],
    'Guyana': ['Georgetown', 'Linden', 'New Amsterdam'],
    'Paraguay': ['Asunción', 'Ciudad del Este', 'San Lorenzo', 'Luque', 'Capiatá'],
    'Peru': ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Cusco', 'Iquitos', 'Huancayo'],
    'Suriname': ['Paramaribo', 'Lelydorp', 'Nieuw Nickerie'],
    'Uruguay': ['Montevideo', 'Salto', 'Paysandú', 'Las Piedras', 'Rivera', 'Maldonado', 'Punta del Este'],
    'Venezuela': ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Ciudad Guayana'],

    // North America
    'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Halifax'],
    'Costa Rica': ['San José', 'Limón', 'Alajuela', 'Heredia', 'Cartago'],
    'Cuba': ['Havana', 'Santiago de Cuba', 'Camagüey', 'Holguín', 'Santa Clara'],
    'Dominican Republic': ['Santo Domingo', 'Santiago', 'San Pedro de Macorís', 'La Romana', 'Puerto Plata'],
    'El Salvador': ['San Salvador', 'Santa Ana', 'San Miguel', 'Soyapango'],
    'Guatemala': ['Guatemala City', 'Mixco', 'Villa Nueva', 'Quetzaltenango', 'Petapa'],
    'Haiti': ['Port-au-Prince', 'Cap-Haïtien', 'Gonaïves', 'Delmas'],
    'Honduras': ['Tegucigalpa', 'San Pedro Sula', 'La Ceiba', 'Choloma', 'El Progreso'],
    'Jamaica': ['Kingston', 'Montego Bay', 'Spanish Town', 'Portmore'],
    'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Cancún', 'Mérida', 'Querétaro', 'Oaxaca'],
    'Nicaragua': ['Managua', 'León', 'Masaya', 'Matagalpa', 'Chinandega'],
    'Panama': ['Panama City', 'San Miguelito', 'Tocumen', 'David', 'Colón'],
    'Puerto Rico': ['San Juan', 'Bayamón', 'Carolina', 'Ponce', 'Caguas'],
    'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'San Francisco', 'Seattle', 'Denver', 'Boston', 'Miami', 'Atlanta', 'Las Vegas', 'Portland', 'Washington D.C.'],

    // Europe
    'Austria': ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck'],
    'Belgium': ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges'],
    'Croatia': ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Dubrovnik'],
    'Czech Republic': ['Prague', 'Brno', 'Ostrava', 'Plzeň', 'Liberec'],
    'Denmark': ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg'],
    'Finland': ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku'],
    'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
    'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Dresden'],
    'Greece': ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa'],
    'Hungary': ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs'],
    'Ireland': ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford'],
    'Italy': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Venice', 'Verona'],
    'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
    'Norway': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Drammen'],
    'Poland': ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk'],
    'Portugal': ['Lisbon', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga', 'Funchal'],
    'Romania': ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța'],
    'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Bilbao', 'Granada'],
    'Sweden': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås'],
    'Switzerland': ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern', 'Lucerne'],
    'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Cardiff'],

    // Asia
    'China': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Wuhan', 'Xian', 'Nanjing', 'Tianjin'],
    'Hong Kong': ['Hong Kong', 'Kowloon', 'Tsuen Wan', 'Sha Tin'],
    'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Pune', 'Jaipur', 'Surat'],
    'Indonesia': ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Bali'],
    'Japan': ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kyoto', 'Kawasaki', 'Hiroshima'],
    'Malaysia': ['Kuala Lumpur', 'George Town', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Johor Bahru'],
    'Philippines': ['Manila', 'Quezon City', 'Davao', 'Cebu City', 'Zamboanga', 'Taguig'],
    'Singapore': ['Singapore'],
    'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon'],
    'Taiwan': ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan', 'Hsinchu'],
    'Thailand': ['Bangkok', 'Chiang Mai', 'Pattaya', 'Nonthaburi', 'Hat Yai', 'Phuket'],
    'Vietnam': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Haiphong', 'Can Tho', 'Nha Trang'],

    // Oceania
    'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle', 'Hobart'],
    'New Zealand': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Dunedin', 'Queenstown'],
};

/**
 * Get cities for a given country, sorted alphabetically
 * Returns empty array if country not found
 * Story 9.17: Ensures cities are always displayed in alphabetical order
 */
export function getCitiesForCountry(country: string): string[] {
    const cities = CITIES_BY_COUNTRY[country] || [];
    return [...cities].sort((a, b) => a.localeCompare(b));
}

/**
 * Check if a city exists in a country
 */
export function isCityInCountry(city: string, country: string): boolean {
    const cities = CITIES_BY_COUNTRY[country] || [];
    return cities.includes(city);
}

/**
 * Find a city with normalized case (case-insensitive matching)
 * Useful for AI-scanned locations where OCR might return "VILLARRICA" instead of "Villarrica"
 * Story 9.17: AC #8 - Case-insensitive city matching
 *
 * @param country - The country to search in
 * @param cityInput - The city name to find (case-insensitive)
 * @returns The properly-cased city name if found, or null if not found
 */
export function findCityWithNormalizedCase(country: string, cityInput: string): string | null {
    const cities = CITIES_BY_COUNTRY[country];
    if (!cities) return null;
    const normalized = cityInput.toLowerCase().trim();
    return cities.find(c => c.toLowerCase() === normalized) || null;
}
