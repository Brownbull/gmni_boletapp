#!/usr/bin/env node

/**
 * Generate Yearly Transaction Data for Boletapp
 *
 * Creates realistic transaction data for a Chilean high-medium income household
 * spanning a full year. Outputs CSV files with transactions and items.
 *
 * Based on:
 * - INE Household Budget Survey (EPF) data
 * - SERNAC supermarket price studies
 * - COICOP spending categories
 *
 * Usage:
 *   npx ts-node scripts/generate-yearly-transactions.ts
 *   npx ts-node scripts/generate-yearly-transactions.ts --year=2024
 *   npx ts-node scripts/generate-yearly-transactions.ts --output=./data
 *
 * Output:
 *   - transactions.csv: One row per transaction
 *   - transaction_items.csv: One row per item (multiple rows per transaction)
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface GeneratorConfig {
  year: number;
  outputDir: string;
  // Monthly budget breakdown for high-medium income Chilean household
  // Based on INE EPF and Statista data - approximately $2.5M CLP/month total
  monthlyBudget: {
    supermarket: { min: 350000, max: 500000 };  // 14-20% of income
    restaurant: { min: 100000, max: 200000 };   // 4-8%
    transport: { min: 150000, max: 250000 };    // 6-10% (includes gas)
    pharmacy: { min: 30000, max: 80000 };       // 1-3%
    entertainment: { min: 50000, max: 120000 }; // 2-5%
    clothing: { min: 40000, max: 100000 };      // 2-4%
    services: { min: 80000, max: 150000 };      // 3-6% (utilities, subscriptions)
    electronics: { min: 0, max: 150000 };       // 0-6% (sporadic)
    other: { min: 20000, max: 60000 };          // 1-2%
  };
  transactionsPerWeek: { min: 8, max: 15 };
}

const DEFAULT_CONFIG: GeneratorConfig = {
  year: 2024,
  outputDir: './scripts/generated-data',
  monthlyBudget: {
    supermarket: { min: 350000, max: 500000 },
    restaurant: { min: 100000, max: 200000 },
    transport: { min: 150000, max: 250000 },
    pharmacy: { min: 30000, max: 80000 },
    entertainment: { min: 50000, max: 120000 },
    clothing: { min: 40000, max: 100000 },
    services: { min: 80000, max: 150000 },
    electronics: { min: 0, max: 150000 },
    other: { min: 20000, max: 60000 }
  },
  transactionsPerWeek: { min: 8, max: 15 }
};

// ============================================================================
// CHILEAN MERCHANTS DATABASE
// ============================================================================

interface MerchantData {
  name: string;
  category: string;
  avgTransaction: { min: number; max: number };
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'sporadic';
  items: ItemTemplate[];
}

interface ItemTemplate {
  name: string;
  category: string;
  priceRange: { min: number; max: number };
  qtyRange?: { min: number; max: number };
}

const CHILEAN_MERCHANTS: MerchantData[] = [
  // ============ SUPERMARKETS ============
  {
    name: 'Jumbo',
    category: 'Supermarket',
    avgTransaction: { min: 25000, max: 120000 },
    frequency: 'weekly',
    items: [
      { name: 'Leche Entera 1L', category: 'Dairy & Eggs', priceRange: { min: 1290, max: 1690 } },
      { name: 'Pan Molde Integral', category: 'Bakery', priceRange: { min: 1990, max: 2990 } },
      { name: 'Huevos Docena', category: 'Dairy & Eggs', priceRange: { min: 3490, max: 4990 } },
      { name: 'Pollo Entero Kg', category: 'Meat & Seafood', priceRange: { min: 3290, max: 4590 } },
      { name: 'Pechuga de Pollo Kg', category: 'Meat & Seafood', priceRange: { min: 5990, max: 7990 } },
      { name: 'Carne Molida Kg', category: 'Meat & Seafood', priceRange: { min: 6990, max: 9990 } },
      { name: 'Salmón Filete Kg', category: 'Meat & Seafood', priceRange: { min: 14990, max: 19990 } },
      { name: 'Arroz Grado 1 Kg', category: 'Pantry', priceRange: { min: 1490, max: 2290 } },
      { name: 'Fideos 400g', category: 'Pantry', priceRange: { min: 890, max: 1490 } },
      { name: 'Aceite Vegetal 1L', category: 'Pantry', priceRange: { min: 2490, max: 3490 } },
      { name: 'Tomate Kg', category: 'Produce', priceRange: { min: 1290, max: 2490 } },
      { name: 'Lechuga Unidad', category: 'Produce', priceRange: { min: 890, max: 1490 } },
      { name: 'Palta Hass Kg', category: 'Produce', priceRange: { min: 4990, max: 8990 } },
      { name: 'Manzana Royal Kg', category: 'Produce', priceRange: { min: 1990, max: 2990 } },
      { name: 'Plátano Kg', category: 'Produce', priceRange: { min: 990, max: 1690 } },
      { name: 'Yogurt Pack 4', category: 'Dairy & Eggs', priceRange: { min: 2490, max: 3990 } },
      { name: 'Queso Mantecoso Kg', category: 'Dairy & Eggs', priceRange: { min: 8990, max: 12990 } },
      { name: 'Detergente Líquido 3L', category: 'Cleaning Supplies', priceRange: { min: 5990, max: 8990 } },
      { name: 'Papel Higiénico 12u', category: 'Household', priceRange: { min: 4990, max: 7990 } },
      { name: 'Café Molido 250g', category: 'Beverages', priceRange: { min: 3990, max: 6990 } },
      { name: 'Coca Cola 3L', category: 'Beverages', priceRange: { min: 2990, max: 3990 } },
      { name: 'Cerveza Pack 6', category: 'Alcohol', priceRange: { min: 5990, max: 8990 } },
      { name: 'Vino Tinto 750ml', category: 'Alcohol', priceRange: { min: 3990, max: 12990 } },
      { name: 'Helado 1L', category: 'Frozen Foods', priceRange: { min: 4990, max: 7990 } },
      { name: 'Pizza Congelada', category: 'Frozen Foods', priceRange: { min: 3990, max: 5990 } }
    ]
  },
  {
    name: 'Líder',
    category: 'Supermarket',
    avgTransaction: { min: 20000, max: 100000 },
    frequency: 'weekly',
    items: [
      { name: 'Leche Descremada 1L', category: 'Dairy & Eggs', priceRange: { min: 1190, max: 1590 } },
      { name: 'Pan de Molde Blanco', category: 'Bakery', priceRange: { min: 1690, max: 2490 } },
      { name: 'Huevos 30u', category: 'Dairy & Eggs', priceRange: { min: 6990, max: 8990 } },
      { name: 'Pollo Trutro Kg', category: 'Meat & Seafood', priceRange: { min: 2990, max: 3990 } },
      { name: 'Asado Carnicero Kg', category: 'Meat & Seafood', priceRange: { min: 7990, max: 11990 } },
      { name: 'Reineta Filete Kg', category: 'Meat & Seafood', priceRange: { min: 8990, max: 12990 } },
      { name: 'Arroz Grado 2 Kg', category: 'Pantry', priceRange: { min: 1090, max: 1690 } },
      { name: 'Tallarines 500g', category: 'Pantry', priceRange: { min: 790, max: 1290 } },
      { name: 'Aceite Maravilla 1L', category: 'Pantry', priceRange: { min: 2290, max: 3190 } },
      { name: 'Cebolla Kg', category: 'Produce', priceRange: { min: 890, max: 1490 } },
      { name: 'Zanahoria Kg', category: 'Produce', priceRange: { min: 790, max: 1290 } },
      { name: 'Naranja Kg', category: 'Produce', priceRange: { min: 1490, max: 2490 } },
      { name: 'Limón Kg', category: 'Produce', priceRange: { min: 1990, max: 3490 } },
      { name: 'Mantequilla 250g', category: 'Dairy & Eggs', priceRange: { min: 2990, max: 3990 } },
      { name: 'Jamón Cocido 200g', category: 'Meat & Seafood', priceRange: { min: 2490, max: 3990 } },
      { name: 'Lavaloza 750ml', category: 'Cleaning Supplies', priceRange: { min: 1490, max: 2490 } },
      { name: 'Servilletas 100u', category: 'Household', priceRange: { min: 1290, max: 1990 } },
      { name: 'Té Caja 100u', category: 'Beverages', priceRange: { min: 2490, max: 3990 } },
      { name: 'Jugo en Polvo Pack 8', category: 'Beverages', priceRange: { min: 2990, max: 4490 } }
    ]
  },
  {
    name: 'Unimarc',
    category: 'Supermarket',
    avgTransaction: { min: 15000, max: 80000 },
    frequency: 'weekly',
    items: [
      { name: 'Leche Semidescremada 1L', category: 'Dairy & Eggs', priceRange: { min: 1290, max: 1690 } },
      { name: 'Hallulla Pack 6', category: 'Bakery', priceRange: { min: 1290, max: 1890 } },
      { name: 'Huevos 15u', category: 'Dairy & Eggs', priceRange: { min: 3990, max: 4990 } },
      { name: 'Chuleta de Cerdo Kg', category: 'Meat & Seafood', priceRange: { min: 4990, max: 6990 } },
      { name: 'Longaniza Kg', category: 'Meat & Seafood', priceRange: { min: 5990, max: 7990 } },
      { name: 'Merluza Filete Kg', category: 'Meat & Seafood', priceRange: { min: 6990, max: 9990 } },
      { name: 'Azúcar 1Kg', category: 'Pantry', priceRange: { min: 1290, max: 1690 } },
      { name: 'Harina 1Kg', category: 'Pantry', priceRange: { min: 890, max: 1290 } },
      { name: 'Sal 1Kg', category: 'Pantry', priceRange: { min: 490, max: 790 } },
      { name: 'Papa Kg', category: 'Produce', priceRange: { min: 890, max: 1490 } },
      { name: 'Choclo Unidad', category: 'Produce', priceRange: { min: 590, max: 990 } },
      { name: 'Pepino Unidad', category: 'Produce', priceRange: { min: 490, max: 890 } },
      { name: 'Queso Chanco 200g', category: 'Dairy & Eggs', priceRange: { min: 2490, max: 3490 } },
      { name: 'Crema 200ml', category: 'Dairy & Eggs', priceRange: { min: 1490, max: 2290 } },
      { name: 'Cloro 1L', category: 'Cleaning Supplies', priceRange: { min: 990, max: 1490 } },
      { name: 'Esponja Pack 3', category: 'Cleaning Supplies', priceRange: { min: 990, max: 1690 } }
    ]
  },
  {
    name: 'Santa Isabel',
    category: 'Supermarket',
    avgTransaction: { min: 12000, max: 60000 },
    frequency: 'weekly',
    items: [
      { name: 'Leche Cultivada 1L', category: 'Dairy & Eggs', priceRange: { min: 1190, max: 1590 } },
      { name: 'Marraqueta Kg', category: 'Bakery', priceRange: { min: 1490, max: 1990 } },
      { name: 'Huevos 6u', category: 'Dairy & Eggs', priceRange: { min: 1990, max: 2490 } },
      { name: 'Costillar Cerdo Kg', category: 'Meat & Seafood', priceRange: { min: 4490, max: 5990 } },
      { name: 'Chorizo Parrillero Kg', category: 'Meat & Seafood', priceRange: { min: 5490, max: 7490 } },
      { name: 'Atún Lata 170g', category: 'Pantry', priceRange: { min: 1990, max: 2990 } },
      { name: 'Legumbres 1Kg', category: 'Pantry', priceRange: { min: 1890, max: 2890 } },
      { name: 'Mayonesa 500g', category: 'Pantry', priceRange: { min: 2490, max: 3490 } },
      { name: 'Ketchup 500g', category: 'Pantry', priceRange: { min: 1990, max: 2990 } },
      { name: 'Ajo Cabeza', category: 'Produce', priceRange: { min: 390, max: 690 } },
      { name: 'Cilantro Atado', category: 'Produce', priceRange: { min: 490, max: 890 } },
      { name: 'Pimentón Kg', category: 'Produce', priceRange: { min: 1990, max: 3490 } }
    ]
  },
  {
    name: 'Tottus',
    category: 'Supermarket',
    avgTransaction: { min: 18000, max: 90000 },
    frequency: 'weekly',
    items: [
      { name: 'Leche Entera 6 Pack', category: 'Dairy & Eggs', priceRange: { min: 6990, max: 8990 } },
      { name: 'Pan Pita Pack 8', category: 'Bakery', priceRange: { min: 1990, max: 2990 } },
      { name: 'Pavo Pechuga Kg', category: 'Meat & Seafood', priceRange: { min: 8990, max: 11990 } },
      { name: 'Camarones Kg', category: 'Meat & Seafood', priceRange: { min: 12990, max: 18990 } },
      { name: 'Aceite Oliva 500ml', category: 'Pantry', priceRange: { min: 5990, max: 8990 } },
      { name: 'Quinoa 500g', category: 'Pantry', priceRange: { min: 2990, max: 4490 } },
      { name: 'Espárragos Atado', category: 'Produce', priceRange: { min: 2990, max: 4990 } },
      { name: 'Champiñones 200g', category: 'Produce', priceRange: { min: 1990, max: 2990 } },
      { name: 'Queso Parmesano 200g', category: 'Dairy & Eggs', priceRange: { min: 4990, max: 6990 } },
      { name: 'Yogurt Griego Pack 4', category: 'Dairy & Eggs', priceRange: { min: 3490, max: 4990 } }
    ]
  },

  // ============ RESTAURANTS ============
  {
    name: 'Starbucks',
    category: 'Restaurant',
    avgTransaction: { min: 4500, max: 12000 },
    frequency: 'weekly',
    items: [
      { name: 'Café Latte Grande', category: 'Beverages', priceRange: { min: 3990, max: 4590 } },
      { name: 'Cappuccino Grande', category: 'Beverages', priceRange: { min: 3790, max: 4390 } },
      { name: 'Frappuccino', category: 'Beverages', priceRange: { min: 4990, max: 5990 } },
      { name: 'Muffin Arándanos', category: 'Bakery', priceRange: { min: 2990, max: 3490 } },
      { name: 'Croissant', category: 'Bakery', priceRange: { min: 2490, max: 2990 } },
      { name: 'Sándwich Pollo', category: 'Pantry', priceRange: { min: 5490, max: 6490 } }
    ]
  },
  {
    name: 'Juan Maestro',
    category: 'Restaurant',
    avgTransaction: { min: 8000, max: 25000 },
    frequency: 'biweekly',
    items: [
      { name: 'Completo Italiano', category: 'Pantry', priceRange: { min: 3490, max: 4290 } },
      { name: 'Hamburguesa Clásica', category: 'Pantry', priceRange: { min: 5990, max: 7990 } },
      { name: 'Papas Fritas Grande', category: 'Pantry', priceRange: { min: 2990, max: 3990 } },
      { name: 'Bebida 500ml', category: 'Beverages', priceRange: { min: 1490, max: 1990 } },
      { name: 'Churrasquería Completa', category: 'Pantry', priceRange: { min: 8990, max: 11990 } }
    ]
  },
  {
    name: 'Dominos Pizza',
    category: 'Restaurant',
    avgTransaction: { min: 12000, max: 35000 },
    frequency: 'biweekly',
    items: [
      { name: 'Pizza Mediana Pepperoni', category: 'Pantry', priceRange: { min: 9990, max: 12990 } },
      { name: 'Pizza Grande Hawaiana', category: 'Pantry', priceRange: { min: 14990, max: 18990 } },
      { name: 'Palitos de Ajo', category: 'Pantry', priceRange: { min: 4990, max: 5990 } },
      { name: 'Bebida 1.5L', category: 'Beverages', priceRange: { min: 2490, max: 2990 } }
    ]
  },
  {
    name: 'Sushi Express',
    category: 'Restaurant',
    avgTransaction: { min: 15000, max: 45000 },
    frequency: 'monthly',
    items: [
      { name: 'Combo Roll 40 Piezas', category: 'Pantry', priceRange: { min: 18990, max: 24990 } },
      { name: 'Handroll Salmón', category: 'Pantry', priceRange: { min: 3990, max: 5490 } },
      { name: 'Gyozas 6u', category: 'Pantry', priceRange: { min: 4990, max: 6990 } },
      { name: 'Edamame', category: 'Pantry', priceRange: { min: 3990, max: 4990 } },
      { name: 'Sake 300ml', category: 'Alcohol', priceRange: { min: 8990, max: 12990 } }
    ]
  },
  {
    name: 'McDonalds',
    category: 'Restaurant',
    avgTransaction: { min: 5000, max: 18000 },
    frequency: 'biweekly',
    items: [
      { name: 'Big Mac Combo', category: 'Pantry', priceRange: { min: 6990, max: 8490 } },
      { name: 'McPollo', category: 'Pantry', priceRange: { min: 4990, max: 5990 } },
      { name: 'McNuggets 10', category: 'Pantry', priceRange: { min: 4990, max: 5990 } },
      { name: 'Papas Medianas', category: 'Pantry', priceRange: { min: 2490, max: 2990 } },
      { name: 'McFlurry', category: 'Snacks', priceRange: { min: 2490, max: 2990 } },
      { name: 'Helado Cono', category: 'Snacks', priceRange: { min: 590, max: 990 } }
    ]
  },
  {
    name: 'Restaurant La Fuente',
    category: 'Restaurant',
    avgTransaction: { min: 25000, max: 80000 },
    frequency: 'monthly',
    items: [
      { name: 'Pastel de Choclo', category: 'Pantry', priceRange: { min: 12990, max: 16990 } },
      { name: 'Cazuela de Ave', category: 'Pantry', priceRange: { min: 10990, max: 14990 } },
      { name: 'Lomo a lo Pobre', category: 'Pantry', priceRange: { min: 16990, max: 22990 } },
      { name: 'Empanadas Pino 2u', category: 'Pantry', priceRange: { min: 5990, max: 7990 } },
      { name: 'Pisco Sour', category: 'Alcohol', priceRange: { min: 5990, max: 7990 } },
      { name: 'Vino Copa', category: 'Alcohol', priceRange: { min: 4990, max: 6990 } },
      { name: 'Postre del Día', category: 'Snacks', priceRange: { min: 4990, max: 6990 } }
    ]
  },
  {
    name: 'Telepizza',
    category: 'Restaurant',
    avgTransaction: { min: 10000, max: 30000 },
    frequency: 'biweekly',
    items: [
      { name: 'Pizza Familiar 4 Quesos', category: 'Pantry', priceRange: { min: 12990, max: 15990 } },
      { name: 'Pizza Mediana BBQ', category: 'Pantry', priceRange: { min: 8990, max: 10990 } },
      { name: 'Calzone Jamón Queso', category: 'Pantry', priceRange: { min: 6990, max: 8990 } },
      { name: 'Bebida 2L', category: 'Beverages', priceRange: { min: 2990, max: 3490 } }
    ]
  },

  // ============ TRANSPORT ============
  {
    name: 'Copec',
    category: 'GasStation',
    avgTransaction: { min: 25000, max: 70000 },
    frequency: 'weekly',
    items: [
      { name: 'Bencina 93 Litros', category: 'Automotive', priceRange: { min: 1090, max: 1250 }, qtyRange: { min: 20, max: 50 } },
      { name: 'Bencina 95 Litros', category: 'Automotive', priceRange: { min: 1190, max: 1350 }, qtyRange: { min: 20, max: 50 } },
      { name: 'Lavado Auto', category: 'Service', priceRange: { min: 5990, max: 9990 } },
      { name: 'Agua Botella', category: 'Beverages', priceRange: { min: 990, max: 1490 } },
      { name: 'Snack Tienda', category: 'Snacks', priceRange: { min: 1490, max: 2990 } }
    ]
  },
  {
    name: 'Shell',
    category: 'GasStation',
    avgTransaction: { min: 25000, max: 70000 },
    frequency: 'weekly',
    items: [
      { name: 'Bencina 93 Litros', category: 'Automotive', priceRange: { min: 1100, max: 1260 }, qtyRange: { min: 20, max: 50 } },
      { name: 'Bencina 97 Litros', category: 'Automotive', priceRange: { min: 1290, max: 1450 }, qtyRange: { min: 20, max: 50 } },
      { name: 'Diesel Litros', category: 'Automotive', priceRange: { min: 990, max: 1150 }, qtyRange: { min: 20, max: 50 } },
      { name: 'Aceite Motor', category: 'Automotive', priceRange: { min: 8990, max: 15990 } }
    ]
  },
  {
    name: 'Petrobras',
    category: 'GasStation',
    avgTransaction: { min: 20000, max: 60000 },
    frequency: 'biweekly',
    items: [
      { name: 'Bencina 93 Litros', category: 'Automotive', priceRange: { min: 1080, max: 1240 }, qtyRange: { min: 20, max: 45 } },
      { name: 'Bencina 95 Litros', category: 'Automotive', priceRange: { min: 1180, max: 1340 }, qtyRange: { min: 20, max: 45 } }
    ]
  },
  {
    name: 'Uber',
    category: 'Transport',
    avgTransaction: { min: 3000, max: 25000 },
    frequency: 'weekly',
    items: [
      { name: 'Viaje UberX', category: 'Service', priceRange: { min: 3000, max: 15000 } },
      { name: 'Viaje Uber Comfort', category: 'Service', priceRange: { min: 5000, max: 25000 } }
    ]
  },
  {
    name: 'Cabify',
    category: 'Transport',
    avgTransaction: { min: 3500, max: 20000 },
    frequency: 'biweekly',
    items: [
      { name: 'Viaje Cabify Lite', category: 'Service', priceRange: { min: 3500, max: 12000 } },
      { name: 'Viaje Cabify', category: 'Service', priceRange: { min: 5000, max: 20000 } }
    ]
  },
  {
    name: 'Metro de Santiago',
    category: 'Transport',
    avgTransaction: { min: 800, max: 3200 },
    frequency: 'daily',
    items: [
      { name: 'Carga Bip!', category: 'Service', priceRange: { min: 2000, max: 10000 } }
    ]
  },
  {
    name: 'Estacionamiento',
    category: 'Transport',
    avgTransaction: { min: 1500, max: 8000 },
    frequency: 'weekly',
    items: [
      { name: 'Estacionamiento Horas', category: 'Service', priceRange: { min: 1500, max: 8000 } }
    ]
  },

  // ============ PHARMACY ============
  {
    name: 'Farmacias Ahumada',
    category: 'Pharmacy',
    avgTransaction: { min: 8000, max: 45000 },
    frequency: 'monthly',
    items: [
      { name: 'Ibuprofeno 400mg 20u', category: 'Pharmacy', priceRange: { min: 2990, max: 4990 } },
      { name: 'Paracetamol 500mg 20u', category: 'Pharmacy', priceRange: { min: 1990, max: 3490 } },
      { name: 'Vitamina C 1000mg 30u', category: 'Supplements', priceRange: { min: 5990, max: 9990 } },
      { name: 'Protector Solar FPS50', category: 'Personal Care', priceRange: { min: 12990, max: 18990 } },
      { name: 'Shampoo 400ml', category: 'Personal Care', priceRange: { min: 4990, max: 8990 } },
      { name: 'Crema Hidratante', category: 'Personal Care', priceRange: { min: 6990, max: 12990 } },
      { name: 'Pasta Dental', category: 'Personal Care', priceRange: { min: 2990, max: 4990 } },
      { name: 'Desodorante', category: 'Personal Care', priceRange: { min: 3990, max: 6990 } }
    ]
  },
  {
    name: 'Cruz Verde',
    category: 'Pharmacy',
    avgTransaction: { min: 10000, max: 50000 },
    frequency: 'monthly',
    items: [
      { name: 'Omeprazol 20mg 28u', category: 'Pharmacy', priceRange: { min: 4990, max: 8990 } },
      { name: 'Loratadina 10mg 30u', category: 'Pharmacy', priceRange: { min: 3990, max: 6990 } },
      { name: 'Multivitamínico 60u', category: 'Supplements', priceRange: { min: 9990, max: 15990 } },
      { name: 'Omega 3 90u', category: 'Supplements', priceRange: { min: 12990, max: 19990 } },
      { name: 'Jabón Líquido', category: 'Personal Care', priceRange: { min: 2990, max: 4990 } },
      { name: 'Preservativos 12u', category: 'Personal Care', priceRange: { min: 5990, max: 9990 } },
      { name: 'Pañales Pack', category: 'Baby Products', priceRange: { min: 12990, max: 22990 } }
    ]
  },
  {
    name: 'Salcobrand',
    category: 'Pharmacy',
    avgTransaction: { min: 6000, max: 35000 },
    frequency: 'monthly',
    items: [
      { name: 'Antigripal 10u', category: 'Pharmacy', priceRange: { min: 4990, max: 7990 } },
      { name: 'Colirio 15ml', category: 'Pharmacy', priceRange: { min: 5990, max: 9990 } },
      { name: 'Magnesio 60u', category: 'Supplements', priceRange: { min: 7990, max: 12990 } },
      { name: 'Crema Antiarrugas', category: 'Health & Beauty', priceRange: { min: 15990, max: 29990 } },
      { name: 'Maquillaje Base', category: 'Health & Beauty', priceRange: { min: 9990, max: 19990 } }
    ]
  },

  // ============ ENTERTAINMENT ============
  {
    name: 'Cinemark',
    category: 'Entertainment',
    avgTransaction: { min: 8000, max: 25000 },
    frequency: 'monthly',
    items: [
      { name: 'Entrada General', category: 'Service', priceRange: { min: 5990, max: 7990 }, qtyRange: { min: 1, max: 4 } },
      { name: 'Entrada 3D', category: 'Service', priceRange: { min: 7990, max: 9990 }, qtyRange: { min: 1, max: 4 } },
      { name: 'Combo Popcorn Grande', category: 'Snacks', priceRange: { min: 7990, max: 9990 } },
      { name: 'Nachos', category: 'Snacks', priceRange: { min: 4990, max: 5990 } },
      { name: 'Bebida Grande', category: 'Beverages', priceRange: { min: 2990, max: 3990 } }
    ]
  },
  {
    name: 'Cineplanet',
    category: 'Entertainment',
    avgTransaction: { min: 7000, max: 22000 },
    frequency: 'monthly',
    items: [
      { name: 'Entrada Adulto', category: 'Service', priceRange: { min: 5490, max: 7490 }, qtyRange: { min: 1, max: 4 } },
      { name: 'Combo Familiar', category: 'Snacks', priceRange: { min: 9990, max: 12990 } },
      { name: 'Hot Dog', category: 'Snacks', priceRange: { min: 3990, max: 4990 } }
    ]
  },
  {
    name: 'Spotify',
    category: 'Entertainment',
    avgTransaction: { min: 5490, max: 8990 },
    frequency: 'monthly',
    items: [
      { name: 'Suscripción Premium', category: 'Service', priceRange: { min: 5490, max: 5490 } },
      { name: 'Suscripción Familiar', category: 'Service', priceRange: { min: 8490, max: 8490 } }
    ]
  },
  {
    name: 'Netflix',
    category: 'Entertainment',
    avgTransaction: { min: 6990, max: 12990 },
    frequency: 'monthly',
    items: [
      { name: 'Plan Estándar', category: 'Service', priceRange: { min: 9990, max: 9990 } },
      { name: 'Plan Premium', category: 'Service', priceRange: { min: 12990, max: 12990 } }
    ]
  },
  {
    name: 'PlayStation Store',
    category: 'Entertainment',
    avgTransaction: { min: 15000, max: 60000 },
    frequency: 'quarterly',
    items: [
      { name: 'Juego Digital', category: 'Service', priceRange: { min: 29990, max: 59990 } },
      { name: 'PS Plus 3 Meses', category: 'Service', priceRange: { min: 17990, max: 17990 } },
      { name: 'DLC Pack', category: 'Service', priceRange: { min: 9990, max: 24990 } }
    ]
  },

  // ============ CLOTHING ============
  {
    name: 'Falabella',
    category: 'Clothing',
    avgTransaction: { min: 25000, max: 150000 },
    frequency: 'monthly',
    items: [
      { name: 'Polera Algodón', category: 'Clothing', priceRange: { min: 9990, max: 19990 } },
      { name: 'Jeans', category: 'Clothing', priceRange: { min: 29990, max: 49990 } },
      { name: 'Camisa', category: 'Clothing', priceRange: { min: 19990, max: 39990 } },
      { name: 'Zapatillas', category: 'Clothing', priceRange: { min: 39990, max: 89990 } },
      { name: 'Chaqueta', category: 'Clothing', priceRange: { min: 49990, max: 99990 } },
      { name: 'Vestido', category: 'Clothing', priceRange: { min: 29990, max: 69990 } }
    ]
  },
  {
    name: 'Paris',
    category: 'Clothing',
    avgTransaction: { min: 20000, max: 120000 },
    frequency: 'monthly',
    items: [
      { name: 'Polera Básica', category: 'Clothing', priceRange: { min: 7990, max: 14990 } },
      { name: 'Pantalón Casual', category: 'Clothing', priceRange: { min: 24990, max: 44990 } },
      { name: 'Sweater', category: 'Clothing', priceRange: { min: 24990, max: 49990 } },
      { name: 'Zapatos Cuero', category: 'Clothing', priceRange: { min: 49990, max: 99990 } },
      { name: 'Bufanda', category: 'Clothing', priceRange: { min: 9990, max: 19990 } }
    ]
  },
  {
    name: 'H&M',
    category: 'Clothing',
    avgTransaction: { min: 15000, max: 80000 },
    frequency: 'monthly',
    items: [
      { name: 'Camiseta Básica', category: 'Clothing', priceRange: { min: 5990, max: 9990 } },
      { name: 'Short', category: 'Clothing', priceRange: { min: 12990, max: 19990 } },
      { name: 'Vestido Verano', category: 'Clothing', priceRange: { min: 19990, max: 34990 } },
      { name: 'Parka', category: 'Clothing', priceRange: { min: 39990, max: 69990 } }
    ]
  },
  {
    name: 'Zara',
    category: 'Clothing',
    avgTransaction: { min: 30000, max: 180000 },
    frequency: 'quarterly',
    items: [
      { name: 'Blazer', category: 'Clothing', priceRange: { min: 59990, max: 99990 } },
      { name: 'Pantalón Vestir', category: 'Clothing', priceRange: { min: 39990, max: 59990 } },
      { name: 'Camisa Premium', category: 'Clothing', priceRange: { min: 29990, max: 49990 } },
      { name: 'Abrigo', category: 'Clothing', priceRange: { min: 89990, max: 149990 } }
    ]
  },

  // ============ ELECTRONICS ============
  {
    name: 'PCFactory',
    category: 'Electronics',
    avgTransaction: { min: 30000, max: 500000 },
    frequency: 'quarterly',
    items: [
      { name: 'Mouse Gamer', category: 'Electronics', priceRange: { min: 19990, max: 59990 } },
      { name: 'Teclado Mecánico', category: 'Electronics', priceRange: { min: 49990, max: 129990 } },
      { name: 'Audífonos Bluetooth', category: 'Electronics', priceRange: { min: 29990, max: 89990 } },
      { name: 'Pendrive 64GB', category: 'Electronics', priceRange: { min: 9990, max: 14990 } },
      { name: 'Cable USB-C', category: 'Electronics', priceRange: { min: 4990, max: 12990 } },
      { name: 'Cargador Rápido', category: 'Electronics', priceRange: { min: 14990, max: 34990 } }
    ]
  },
  {
    name: 'Ripley',
    category: 'Electronics',
    avgTransaction: { min: 40000, max: 400000 },
    frequency: 'quarterly',
    items: [
      { name: 'Smart TV 50"', category: 'Electronics', priceRange: { min: 299990, max: 449990 } },
      { name: 'Aspiradora Robot', category: 'Electronics', priceRange: { min: 149990, max: 299990 } },
      { name: 'Licuadora', category: 'Electronics', priceRange: { min: 29990, max: 79990 } },
      { name: 'Plancha Vapor', category: 'Electronics', priceRange: { min: 24990, max: 49990 } }
    ]
  },
  {
    name: 'Entel',
    category: 'Electronics',
    avgTransaction: { min: 20000, max: 50000 },
    frequency: 'monthly',
    items: [
      { name: 'Plan Móvil Mensual', category: 'Service', priceRange: { min: 19990, max: 39990 } },
      { name: 'Datos Adicionales', category: 'Service', priceRange: { min: 5990, max: 9990 } }
    ]
  },
  {
    name: 'WOM',
    category: 'Electronics',
    avgTransaction: { min: 15000, max: 35000 },
    frequency: 'monthly',
    items: [
      { name: 'Plan Móvil', category: 'Service', priceRange: { min: 14990, max: 29990 } },
      { name: 'Recarga Prepago', category: 'Service', priceRange: { min: 5000, max: 20000 } }
    ]
  },

  // ============ SERVICES ============
  {
    name: 'Enel',
    category: 'Services',
    avgTransaction: { min: 30000, max: 120000 },
    frequency: 'monthly',
    items: [
      { name: 'Electricidad Mes', category: 'Service', priceRange: { min: 30000, max: 120000 } }
    ]
  },
  {
    name: 'Aguas Andinas',
    category: 'Services',
    avgTransaction: { min: 15000, max: 45000 },
    frequency: 'monthly',
    items: [
      { name: 'Agua Potable Mes', category: 'Service', priceRange: { min: 15000, max: 45000 } }
    ]
  },
  {
    name: 'Metrogas',
    category: 'Services',
    avgTransaction: { min: 20000, max: 80000 },
    frequency: 'monthly',
    items: [
      { name: 'Gas Natural Mes', category: 'Service', priceRange: { min: 20000, max: 80000 } }
    ]
  },
  {
    name: 'VTR',
    category: 'Services',
    avgTransaction: { min: 35000, max: 65000 },
    frequency: 'monthly',
    items: [
      { name: 'Internet Hogar', category: 'Service', priceRange: { min: 25990, max: 39990 } },
      { name: 'TV Cable', category: 'Service', priceRange: { min: 15990, max: 25990 } }
    ]
  },
  {
    name: 'Movistar Hogar',
    category: 'Services',
    avgTransaction: { min: 30000, max: 55000 },
    frequency: 'monthly',
    items: [
      { name: 'Fibra Óptica', category: 'Service', priceRange: { min: 24990, max: 44990 } },
      { name: 'Telefonía Fija', category: 'Service', priceRange: { min: 9990, max: 14990 } }
    ]
  },
  {
    name: 'Isapre Consalud',
    category: 'Medical',
    avgTransaction: { min: 80000, max: 200000 },
    frequency: 'monthly',
    items: [
      { name: 'Plan Salud Mensual', category: 'Service', priceRange: { min: 80000, max: 200000 } }
    ]
  },

  // ============ OTHER ============
  {
    name: 'Sodimac',
    category: 'Hardware',
    avgTransaction: { min: 15000, max: 200000 },
    frequency: 'quarterly',
    items: [
      { name: 'Pintura Galón', category: 'Hardware', priceRange: { min: 24990, max: 44990 } },
      { name: 'Herramientas Set', category: 'Hardware', priceRange: { min: 19990, max: 59990 } },
      { name: 'Ampolleta LED Pack', category: 'Hardware', priceRange: { min: 9990, max: 19990 } },
      { name: 'Extensión Eléctrica', category: 'Hardware', priceRange: { min: 7990, max: 14990 } },
      { name: 'Cerradura', category: 'Hardware', priceRange: { min: 14990, max: 49990 } }
    ]
  },
  {
    name: 'Easy',
    category: 'Hardware',
    avgTransaction: { min: 20000, max: 150000 },
    frequency: 'quarterly',
    items: [
      { name: 'Taladro Eléctrico', category: 'Hardware', priceRange: { min: 29990, max: 89990 } },
      { name: 'Estante Metálico', category: 'Furniture', priceRange: { min: 39990, max: 79990 } },
      { name: 'Macetero Grande', category: 'Garden', priceRange: { min: 14990, max: 34990 } },
      { name: 'Tierra de Hoja', category: 'Garden', priceRange: { min: 4990, max: 9990 } }
    ]
  },
  {
    name: 'Pet Happy',
    category: 'PetShop',
    avgTransaction: { min: 15000, max: 80000 },
    frequency: 'monthly',
    items: [
      { name: 'Alimento Perro 15Kg', category: 'Pet Supplies', priceRange: { min: 39990, max: 69990 } },
      { name: 'Alimento Gato 7Kg', category: 'Pet Supplies', priceRange: { min: 29990, max: 49990 } },
      { name: 'Arena Gato 10L', category: 'Pet Supplies', priceRange: { min: 9990, max: 14990 } },
      { name: 'Juguete Mascota', category: 'Pet Supplies', priceRange: { min: 4990, max: 14990 } },
      { name: 'Antipulgas', category: 'Pet Supplies', priceRange: { min: 12990, max: 24990 } }
    ]
  },
  {
    name: 'Veterinaria',
    category: 'Veterinary',
    avgTransaction: { min: 25000, max: 100000 },
    frequency: 'quarterly',
    items: [
      { name: 'Consulta General', category: 'Service', priceRange: { min: 20000, max: 35000 } },
      { name: 'Vacuna', category: 'Service', priceRange: { min: 15000, max: 25000 } },
      { name: 'Desparasitación', category: 'Service', priceRange: { min: 10000, max: 20000 } }
    ]
  },
  {
    name: 'Feria Libre',
    category: 'StreetVendor',
    avgTransaction: { min: 8000, max: 35000 },
    frequency: 'weekly',
    items: [
      { name: 'Frutas Surtidas Kg', category: 'Produce', priceRange: { min: 1500, max: 3500 } },
      { name: 'Verduras Surtidas Kg', category: 'Produce', priceRange: { min: 1000, max: 2500 } },
      { name: 'Huevos Campo 30u', category: 'Dairy & Eggs', priceRange: { min: 5990, max: 7990 } },
      { name: 'Queso Fresco Kg', category: 'Dairy & Eggs', priceRange: { min: 6990, max: 9990 } },
      { name: 'Pescado Fresco Kg', category: 'Meat & Seafood', priceRange: { min: 5990, max: 12990 } },
      { name: 'Flores Ramo', category: 'Other', priceRange: { min: 3990, max: 8990 } }
    ]
  },
  {
    name: 'Panadería Local',
    category: 'Bakery',
    avgTransaction: { min: 2000, max: 8000 },
    frequency: 'daily',
    items: [
      { name: 'Pan Fresco Kg', category: 'Bakery', priceRange: { min: 1490, max: 2290 } },
      { name: 'Empanada', category: 'Bakery', priceRange: { min: 1990, max: 2990 } },
      { name: 'Torta Porción', category: 'Bakery', priceRange: { min: 2490, max: 3990 } },
      { name: 'Kuchen', category: 'Bakery', priceRange: { min: 1990, max: 2990 } }
    ]
  }
];

// ============================================================================
// TRANSACTION GENERATOR
// ============================================================================

interface GeneratedTransaction {
  transactionId: string;
  date: string;
  time: string;
  merchant: string;
  category: string;
  total: number;
  itemCount: number;
  country: string;
  city: string;
  currency: string;
}

interface GeneratedItem {
  transactionId: string;
  itemIndex: number;
  name: string;
  category: string;
  qty: number;
  price: number;
  lineTotal: number;
}

// Utility functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function pickRandomWeighted<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

function generateId(): string {
  return 'txn_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateTime(): string {
  // Most transactions happen between 8am-10pm, with peaks at lunch and evening
  const hour = pickRandomWeighted(
    [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
    [2, 4, 5, 6, 10, 12, 8, 6, 5, 6, 10, 12, 8, 4]
  );
  const minute = randomInt(0, 59);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// Seasonal adjustments
function getSeasonalMultiplier(month: number, category: string): number {
  // December: Higher spending overall (Christmas)
  if (month === 12) {
    if (['Clothing', 'Electronics', 'Entertainment'].includes(category)) return 1.8;
    if (category === 'Restaurant') return 1.4;
    return 1.2;
  }
  // September: Fiestas Patrias
  if (month === 9) {
    if (category === 'Supermarket') return 1.5;
    if (category === 'Restaurant') return 1.3;
    return 1.1;
  }
  // February: Summer vacation
  if (month === 2) {
    if (category === 'Entertainment') return 1.4;
    if (category === 'Restaurant') return 1.3;
    return 1.0;
  }
  // March: Back to school
  if (month === 3) {
    if (['Clothing', 'Electronics'].includes(category)) return 1.3;
    return 1.0;
  }
  return 1.0;
}

// Generate transactions for a specific week
function generateWeekTransactions(
  weekStart: Date,
  config: GeneratorConfig
): { transactions: GeneratedTransaction[]; items: GeneratedItem[] } {
  const transactions: GeneratedTransaction[] = [];
  const items: GeneratedItem[] = [];

  const transactionCount = randomInt(
    config.transactionsPerWeek.min,
    config.transactionsPerWeek.max
  );

  // Get month for seasonal adjustments
  const month = weekStart.getMonth() + 1;

  // Distribute transactions across the week
  const dayOffsets = Array.from({ length: transactionCount }, () => randomInt(0, 6));

  for (const dayOffset of dayOffsets) {
    const txDate = new Date(weekStart);
    txDate.setDate(txDate.getDate() + dayOffset);

    // Skip future dates
    if (txDate > new Date()) continue;

    // Pick a merchant based on frequency weights
    const frequencyWeights: Record<string, number> = {
      'daily': 7,
      'weekly': 5,
      'biweekly': 2.5,
      'monthly': 1,
      'quarterly': 0.3,
      'sporadic': 0.2
    };

    const merchantWeights = CHILEAN_MERCHANTS.map(m => frequencyWeights[m.frequency] || 1);
    const merchant = pickRandomWeighted(CHILEAN_MERCHANTS, merchantWeights);

    // Apply seasonal multiplier
    const seasonalMultiplier = getSeasonalMultiplier(month, merchant.category);

    // Generate transaction amount
    const baseAmount = randomInt(merchant.avgTransaction.min, merchant.avgTransaction.max);
    const adjustedAmount = Math.round(baseAmount * seasonalMultiplier);

    // Generate items
    const transactionId = generateId();
    const txItems = generateTransactionItems(transactionId, merchant, adjustedAmount);

    // Calculate actual total from items
    const actualTotal = txItems.reduce((sum, item) => sum + item.lineTotal, 0);

    transactions.push({
      transactionId,
      date: formatDate(txDate),
      time: generateTime(),
      merchant: merchant.name,
      category: merchant.category,
      total: actualTotal,
      itemCount: txItems.length,
      country: 'Chile',
      city: pickRandom(['Santiago', 'Santiago', 'Santiago', 'Providencia', 'Las Condes', 'Ñuñoa', 'Vitacura']),
      currency: 'CLP'
    });

    items.push(...txItems);
  }

  return { transactions, items };
}

function generateTransactionItems(
  transactionId: string,
  merchant: MerchantData,
  targetTotal: number
): GeneratedItem[] {
  const items: GeneratedItem[] = [];
  let currentTotal = 0;
  let itemIndex = 0;

  // Shuffle items to get variety
  const availableItems = [...merchant.items].sort(() => Math.random() - 0.5);

  // Add items until we approach the target
  while (currentTotal < targetTotal * 0.8 && availableItems.length > 0) {
    const itemTemplate = availableItems.pop()!;

    // Determine quantity
    const qty = itemTemplate.qtyRange
      ? randomInt(itemTemplate.qtyRange.min, itemTemplate.qtyRange.max)
      : randomInt(1, 3);

    // Generate price (round to nearest 10 for CLP realism)
    const unitPrice = Math.round(
      randomInt(itemTemplate.priceRange.min, itemTemplate.priceRange.max) / 10
    ) * 10;

    const lineTotal = unitPrice * qty;

    // Skip if this would overshoot significantly
    if (currentTotal + lineTotal > targetTotal * 1.3) continue;

    items.push({
      transactionId,
      itemIndex: itemIndex++,
      name: itemTemplate.name,
      category: itemTemplate.category,
      qty,
      price: unitPrice,
      lineTotal
    });

    currentTotal += lineTotal;
  }

  // Ensure at least one item
  if (items.length === 0 && merchant.items.length > 0) {
    const itemTemplate = pickRandom(merchant.items);
    const unitPrice = Math.round(
      randomInt(itemTemplate.priceRange.min, itemTemplate.priceRange.max) / 10
    ) * 10;

    items.push({
      transactionId,
      itemIndex: 0,
      name: itemTemplate.name,
      category: itemTemplate.category,
      qty: 1,
      price: unitPrice,
      lineTotal: unitPrice
    });
  }

  return items;
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

function generateYearlyData(config: GeneratorConfig): {
  transactions: GeneratedTransaction[];
  items: GeneratedItem[];
} {
  const allTransactions: GeneratedTransaction[] = [];
  const allItems: GeneratedItem[] = [];

  // Generate data week by week
  const startDate = new Date(config.year, 0, 1); // January 1
  const endDate = new Date(config.year, 11, 31); // December 31

  let currentWeekStart = new Date(startDate);
  // Adjust to start of week (Monday)
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1);

  const today = new Date();

  while (currentWeekStart <= endDate) {
    // Don't generate future data
    if (currentWeekStart > today) break;

    const { transactions, items } = generateWeekTransactions(currentWeekStart, config);
    allTransactions.push(...transactions);
    allItems.push(...items);

    // Move to next week
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  // Sort by date
  allTransactions.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return { transactions: allTransactions, items: allItems };
}

// CSV generation
function toCSV(data: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(',');
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col];
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  return [header, ...rows].join('\n');
}

// Main execution
function main() {
  // Parse CLI arguments
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  for (const arg of args) {
    if (arg.startsWith('--year=')) {
      config.year = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--output=')) {
      config.outputDir = arg.split('=')[1];
    }
  }

  console.log('🇨🇱 Generating Chilean Transaction Data');
  console.log('=====================================');
  console.log(`Year: ${config.year}`);
  console.log(`Output: ${config.outputDir}`);
  console.log('');

  // Generate data
  console.log('Generating transactions...');
  const { transactions, items } = generateYearlyData(config);

  console.log(`Generated ${transactions.length} transactions`);
  console.log(`Generated ${items.length} line items`);

  // Calculate statistics
  const totalSpent = transactions.reduce((sum, t) => sum + t.total, 0);
  const avgTransaction = Math.round(totalSpent / transactions.length);
  const monthlyAvg = Math.round(totalSpent / 12);

  console.log('');
  console.log('📊 Statistics:');
  console.log(`   Total Spent: $${totalSpent.toLocaleString('es-CL')} CLP`);
  console.log(`   Avg Transaction: $${avgTransaction.toLocaleString('es-CL')} CLP`);
  console.log(`   Monthly Average: $${monthlyAvg.toLocaleString('es-CL')} CLP`);

  // Category breakdown
  const byCategory: Record<string, number> = {};
  transactions.forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.total;
  });

  console.log('');
  console.log('📈 By Category:');
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, amount]) => {
      const pct = ((amount / totalSpent) * 100).toFixed(1);
      console.log(`   ${cat}: $${amount.toLocaleString('es-CL')} CLP (${pct}%)`);
    });

  // Create output directory
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  // Write transactions CSV
  const transactionColumns = [
    'transactionId', 'date', 'time', 'merchant', 'category',
    'total', 'itemCount', 'country', 'city', 'currency'
  ];
  const transactionsCSV = toCSV(transactions as unknown as Record<string, unknown>[], transactionColumns);
  const transactionsPath = path.join(config.outputDir, 'transactions.csv');
  fs.writeFileSync(transactionsPath, transactionsCSV);
  console.log('');
  console.log(`✅ Wrote ${transactionsPath}`);

  // Write items CSV
  const itemColumns = [
    'transactionId', 'itemIndex', 'name', 'category', 'qty', 'price', 'lineTotal'
  ];
  const itemsCSV = toCSV(items as unknown as Record<string, unknown>[], itemColumns);
  const itemsPath = path.join(config.outputDir, 'transaction_items.csv');
  fs.writeFileSync(itemsPath, itemsCSV);
  console.log(`✅ Wrote ${itemsPath}`);

  // Also write as JSON for easy import
  const jsonData = { transactions, items };
  const jsonPath = path.join(config.outputDir, 'transactions_full.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
  console.log(`✅ Wrote ${jsonPath}`);

  console.log('');
  console.log('🎉 Done!');
}

main();
