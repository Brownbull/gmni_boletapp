# Category Taxonomy v2 — 4-Level Spanish Taxonomy

**Date:** 2026-03-07
**Epic:** 17 — "Name everything in the language the user thinks in"
**Status:** APPROVED — ready for implementation (Stories 17-2 through 17-5)
**Source:** Brainstorming session 2026-03-07, approved by product owner

---

## Overview

BoletApp uses a 4-level category taxonomy. Levels 1-2 classify **where** (the merchant/store). Levels 3-4 classify **what** (the items purchased). The two dimensions are independent — you can buy "Medicamentos" at a "Supermercado".

## Level Names

| Level | ES (Primary) | EN (Translation) | What It Answers |
|-------|-------------|------------------|----------------|
| **L1** | **Rubro** | Industry | "What sector is this place in?" |
| **L2** | **Giro** | Business Type | "What kind of place is this?" |
| **L3** | **Familia** | Family | "What family of products is this?" |
| **L4** | **Categoría** | Category | "What type of item/service is this?" |

### Core Principle

- Every **transaction** has a giro (L2) — where you bought
- Every **item** in that transaction has a categoría (L4) — what you bought
- No fixed mapping between L2 and L4 — they are independent dimensions
- L1 groups L2; L3 groups L4

---

## L1 — Rubros (12)

| # | Key | ES | EN | Emoji |
|---|-----|----|----|-------|
| 1 | supermercados | Supermercados | Supermarkets | 🛒 |
| 2 | restaurantes | Restaurantes | Restaurants | 🍽️ |
| 3 | comercio-barrio | Comercio de Barrio | Neighborhood Shops | 🏪 |
| 4 | vivienda | Vivienda | Housing | 🏠 |
| 5 | salud-bienestar | Salud y Bienestar | Health & Wellness | 💊 |
| 6 | tiendas-generales | Tiendas Generales | General Retail | 🏬 |
| 7 | tiendas-especializadas | Tiendas Especializadas | Specialty Retail | 🎁 |
| 8 | transporte-vehiculo | Transporte y Vehículo | Transport & Vehicle | 🚗 |
| 9 | educacion | Educación | Education | 🎓 |
| 10 | servicios-finanzas | Servicios y Finanzas | Services & Finance | 🏢 |
| 11 | entretenimiento-hospedaje | Entretenimiento y Hospedaje | Entertainment & Lodging | 🎭 |
| 12 | otros | Otros | Other | 📦 |

---

## L2 — Giros (44)

### Rubro: Supermercados (2)

| # | Key | ES | EN |
|---|-----|----|----|
| 1 | Supermarket | Supermercado | Supermarket |
| 2 | Wholesale | Mayorista | Wholesale |

### Rubro: Restaurantes (1)

| # | Key | ES | EN |
|---|-----|----|----|
| 3 | Restaurant | Restaurante | Restaurant |

### Rubro: Comercio de Barrio (7)

| # | Key | ES | EN |
|---|-----|----|----|
| 4 | Almacen | Almacén | Corner Store |
| 5 | Minimarket | Minimarket | Minimarket |
| 6 | OpenMarket | Feria | Open-Air Market |
| 7 | Kiosk | Kiosko | Kiosk |
| 8 | LiquorStore | Botillería | Liquor Store |
| 9 | Bakery | Panadería | Bakery |
| 10 | Butcher | Carnicería | Butcher |

### Rubro: Vivienda (2)

| # | Key | ES | EN |
|---|-----|----|----|
| 11 | UtilityCompany | Servicios Básicos | Utility Company |
| 12 | PropertyAdmin | Administración | Property Management |

### Rubro: Salud y Bienestar (4)

| # | Key | ES | EN |
|---|-----|----|----|
| 13 | Pharmacy | Farmacia | Pharmacy |
| 14 | Medical | Médico | Medical |
| 15 | Veterinary | Veterinario | Veterinary |
| 16 | HealthBeauty | Salud y Belleza | Health & Beauty |

### Rubro: Tiendas Generales (7)

| # | Key | ES | EN |
|---|-----|----|----|
| 17 | Bazaar | Bazar | Bazaar |
| 18 | ClothingStore | Tienda de Ropa | Clothing Store |
| 19 | ElectronicsStore | Tienda de Electrónica | Electronics Store |
| 20 | HomeGoods | Hogar | Home Goods |
| 21 | FurnitureStore | Mueblería | Furniture Store |
| 22 | Hardware | Ferretería | Hardware Store |
| 23 | GardenCenter | Jardinería | Garden Center |

### Rubro: Tiendas Especializadas (7)

| # | Key | ES | EN |
|---|-----|----|----|
| 24 | PetShop | Tienda de Mascotas | Pet Shop |
| 25 | BooksMedia | Libros y Medios | Books & Media |
| 26 | OfficeSupplies | Artículos de Oficina | Office Supplies |
| 27 | SportsOutdoors | Deportes y Exterior | Sports & Outdoors |
| 28 | ToysGames | Juguetes y Juegos | Toys & Games |
| 29 | AccessoriesOptical | Accesorios y Óptica | Accessories & Optical |
| 30 | OnlineStore | Tienda Online | Online Store |

### Rubro: Transporte y Vehículo (3)

| # | Key | ES | EN |
|---|-----|----|----|
| 31 | AutoShop | Taller Automotriz | Auto Shop |
| 32 | GasStation | Bencinera | Gas Station |
| 33 | Transport | Transporte | Transport |

### Rubro: Educación (1)

| # | Key | ES | EN |
|---|-----|----|----|
| 34 | Education | Educación | Education |

### Rubro: Servicios y Finanzas (5)

| # | Key | ES | EN |
|---|-----|----|----|
| 35 | GeneralServices | Servicios Generales | General Services |
| 36 | BankingFinance | Banca y Finanzas | Banking & Finance |
| 37 | TravelAgency | Agencia de Viajes | Travel Agency |
| 38 | Subscription | Suscripción | Subscription |
| 39 | Government | Gobierno | Government |

### Rubro: Entretenimiento y Hospedaje (3)

| # | Key | ES | EN |
|---|-----|----|----|
| 40 | Lodging | Hospedaje | Lodging |
| 41 | Entertainment | Entretenimiento | Entertainment |
| 42 | Casino | Casino / Apuestas | Casino / Gambling |

### Rubro: Otros (2)

| # | Key | ES | EN |
|---|-----|----|----|
| 43 | CharityDonation | Caridad y Donación | Charity & Donation |
| 44 | Other | Otro | Other |

---

## L3 — Familias (9)

| # | Key | ES | EN | Emoji |
|---|-----|----|----|-------|
| 1 | food-fresh | Alimentos Frescos | Fresh Food | 🥬 |
| 2 | food-packaged | Alimentos Envasados | Packaged Food | 🥫 |
| 3 | food-prepared | Comida Preparada | Prepared Food | 🍱 |
| 4 | salud-cuidado | Salud y Cuidado Personal | Health & Personal Care | 💊 |
| 5 | hogar | Hogar | Household | 🏠 |
| 6 | productos-generales | Productos Generales | General Products | 🛍️ |
| 7 | servicios-cargos | Servicios y Cargos | Services & Fees | 📋 |
| 8 | vicios | Vicios | Vices | 🚬 |
| 9 | otros-item | Otros | Other | 📦 |

---

## L4 — Categorías (42)

### Familia: Alimentos Frescos (4)

| # | Key | ES | EN |
|---|-----|----|----|
| 1 | Produce | Frutas y Verduras | Produce |
| 2 | MeatSeafood | Carnes y Mariscos | Meat & Seafood |
| 3 | BreadPastry | Pan y Repostería | Bread & Pastries |
| 4 | DairyEggs | Lácteos y Huevos | Dairy & Eggs |

### Familia: Alimentos Envasados (4)

| # | Key | ES | EN |
|---|-----|----|----|
| 5 | Pantry | Despensa | Pantry |
| 6 | FrozenFoods | Congelados | Frozen Foods |
| 7 | Snacks | Snacks y Golosinas | Snacks & Candy |
| 8 | Beverages | Bebidas | Beverages |

### Familia: Comida Preparada (1)

| # | Key | ES | EN |
|---|-----|----|----|
| 9 | PreparedFood | Comida Preparada | Prepared Food |

### Familia: Salud y Cuidado Personal (5)

| # | Key | ES | EN |
|---|-----|----|----|
| 10 | BeautyCosmetics | Belleza y Cosmética | Beauty & Cosmetics |
| 11 | PersonalCare | Cuidado Personal | Personal Care |
| 12 | Medications | Medicamentos | Medications |
| 13 | Supplements | Suplementos | Supplements |
| 14 | BabyProducts | Productos para Bebé | Baby Products |

### Familia: Hogar (5)

| # | Key | ES | EN |
|---|-----|----|----|
| 15 | CleaningSupplies | Productos de Limpieza | Cleaning Supplies |
| 16 | HomeEssentials | Artículos del Hogar | Home Essentials |
| 17 | PetSupplies | Productos para Mascotas | Pet Supplies |
| 18 | PetFood | Comida para Mascotas | Pet Food |
| 19 | Furnishings | Mobiliario y Hogar | Furnishings |

### Familia: Productos Generales (9)

| # | Key | ES | EN |
|---|-----|----|----|
| 20 | Apparel | Vestuario | Apparel |
| 21 | Technology | Tecnología | Technology |
| 22 | Tools | Herramientas | Tools & Supplies |
| 23 | Garden | Jardín | Garden |
| 24 | CarAccessories | Accesorios de Auto | Car Accessories |
| 25 | SportsOutdoors | Deportes y Exterior | Sports & Outdoors |
| 26 | ToysGames | Juguetes y Juegos | Toys & Games |
| 27 | BooksMedia | Libros y Medios | Books & Media |
| 28 | OfficeStationery | Oficina y Papelería | Office & Stationery |
| 29 | Crafts | Manualidades | Crafts |

### Familia: Servicios y Cargos (8)

| # | Key | ES | EN |
|---|-----|----|----|
| 30 | ServiceCharge | Cargo por Servicio | Service Charge |
| 31 | TaxFees | Impuestos y Cargos | Tax & Fees |
| 32 | Subscription | Suscripción | Subscription |
| 33 | Insurance | Seguros | Insurance |
| 34 | LoanPayment | Pago de Préstamo | Loan Payment |
| 35 | TicketsEvents | Entradas y Eventos | Tickets & Events |
| 36 | HouseholdBills | Cuentas del Hogar | Household Bills |
| 37 | CondoFees | Gastos Comunes | Condo Fees |
| 38 | Education | Educación | Education |

### Familia: Vicios (3)

| # | Key | ES | EN |
|---|-----|----|----|
| 39 | Alcohol | Alcohol | Alcohol |
| 40 | Tobacco | Tabaco | Tobacco |
| 41 | GamesOfChance | Juegos de Azar | Games of Chance |

### Familia: Otros (1)

| # | Key | ES | EN |
|---|-----|----|----|
| 42 | Other | Otro | Other |

---

## Migration Map (Old to New)

### Removed L2 Giros

| Old Key | Disposition |
|---------|------------|
| StreetVendor | Replaced by OpenMarket (Feria) |
| MusicStore | Eliminated — merged into Entertainment |
| Jewelry | Combined with Optical → AccessoriesOptical |
| Optical | Combined with Jewelry → AccessoriesOptical |

### Renamed L2 Giros (key changed)

| Old Key | New Key | Reason |
|---------|---------|--------|
| Clothing | ClothingStore | De-overlap with L4 Apparel |
| Electronics | ElectronicsStore | De-overlap with L4 Technology |
| Furniture | FurnitureStore | De-overlap with L4 Furnishings |
| Automotive | AutoShop | De-overlap with L4 CarAccessories |
| HotelLodging | Lodging | Simplified |
| Gambling | Casino | De-overlap with L4 GamesOfChance |
| Services | GeneralServices | Clarified |

### New L2 Giros

| New Key | ES | Rubro |
|---------|-----|-------|
| Wholesale | Mayorista | Supermercados |
| Minimarket | Minimarket | Comercio de Barrio |
| OpenMarket | Feria | Comercio de Barrio |
| Kiosk | Kiosko | Comercio de Barrio |
| LiquorStore | Botillería | Comercio de Barrio |
| UtilityCompany | Servicios Básicos | Vivienda |
| PropertyAdmin | Administración | Vivienda |
| OnlineStore | Tienda Online | Tiendas Especializadas |

### Rubro Membership Changes

| Giro | Old Rubro | New Rubro |
|------|-----------|-----------|
| UtilityCompany | (new) | Vivienda |
| PropertyAdmin | (new) | Vivienda |
| Education | services (Servicios y Finanzas) | Educación (own rubro) |

### Removed L4 Categorías

| Old Key | Disposition |
|---------|------------|
| Musical Instruments | Eliminated — merged into Technology or Entertainment |
| Furniture (item) | Merged into HomeEssentials → Furnishings |

### Renamed L4 Categorías (key changed)

| Old Key | New Key | New ES | Reason |
|---------|---------|--------|--------|
| Bakery | BreadPastry | Pan y Repostería | De-overlap with L2 Bakery |
| Pharmacy | Medications | Medicamentos | De-overlap with L2 Pharmacy |
| Clothing | Apparel | Vestuario | De-overlap with L2 ClothingStore |
| Electronics | Technology | Tecnología | De-overlap with L2 ElectronicsStore |
| Hardware | Tools | Herramientas | De-overlap with L2 Hardware |
| Automotive | CarAccessories | Accesorios de Auto | De-overlap with L2 AutoShop |
| Gambling | GamesOfChance | Juegos de Azar | De-overlap with L2 Casino |
| Meat & Seafood | MeatSeafood | Carnes y Mariscos | Key normalization |
| Dairy & Eggs | DairyEggs | Lácteos y Huevos | Key normalization |
| Frozen Foods | FrozenFoods | Congelados | Key normalization |
| Health & Beauty | BeautyCosmetics | Belleza y Cosmética | Clarified + de-overlap |
| Personal Care | PersonalCare | Cuidado Personal | Key normalization |
| Baby Products | BabyProducts | Productos para Bebé | Key normalization |
| Cleaning Supplies | CleaningSupplies | Productos de Limpieza | Key normalization |
| Household | HomeEssentials | Artículos del Hogar | Clarified (+ Furnishings split) |
| Pet Supplies | PetSupplies | Productos para Mascotas | Key normalization |
| Sports & Outdoors | SportsOutdoors | Deportes y Exterior | Key normalization |
| Toys & Games | ToysGames | Juguetes y Juegos | Key normalization |
| Books & Media | BooksMedia | Libros y Medios | Key normalization |
| Office & Stationery | OfficeStationery | Oficina y Papelería | Key normalization |
| Crafts & Hobbies | Crafts | Manualidades | Simplified |
| Prepared Food | PreparedFood | Comida Preparada | Key normalization |
| Service | ServiceCharge | Cargo por Servicio | Clarified |
| Tax & Fees | TaxFees | Impuestos y Cargos | Key normalization |
| Loan Payment | LoanPayment | Pago de Préstamo | Key normalization |
| Tickets & Events | TicketsEvents | Entradas y Eventos | Key normalization |

### New L4 Categorías

| New Key | ES | Familia |
|---------|-----|---------|
| PetFood | Comida para Mascotas | Hogar |
| HouseholdBills | Cuentas del Hogar | Servicios y Cargos |
| CondoFees | Gastos Comunes | Servicios y Cargos |
| Education | Educación | Servicios y Cargos |
| Furnishings | Mobiliario y Hogar | Hogar |

### Familia Membership Changes

| Categoría | Old Familia | New Familia |
|-----------|-------------|-------------|
| Alcohol | food-packaged (Alimentos Envasados) | vicios (Vicios) |

### L1 Group Renames

| Old Key | Old ES | New Key | New ES |
|---------|--------|---------|--------|
| food-dining | Alimentación | (split into 3) | Supermercados, Restaurantes, Comercio de Barrio |
| retail-general | Tiendas General | tiendas-generales | Tiendas Generales |
| automotive | Automotriz | transporte-vehiculo | Transporte y Vehículo |
| services | Servicios | servicios-finanzas | Servicios y Finanzas |
| hospitality | Hospitalidad | entretenimiento-hospedaje | Entretenimiento y Hospedaje |

### L3 Group Renames

| Old Key | Old ES | New Key | New ES |
|---------|--------|---------|--------|
| health-personal | Salud y Personal | salud-cuidado | Salud y Cuidado Personal |
| nonfood-retail | Retail No Alimentario | productos-generales | Productos Generales |
| (new) | — | food-prepared | Comida Preparada |
| (new) | — | vicios | Vicios |

---

## Gemini Prompt Guidance

This section guides Story 17-3 (AI prompt update) on how to use the new taxonomy in the Gemini receipt scanning prompt.

### Current Prompt Structure

The V3 prompt (`functions/src/prompts/v3-category-standardization.ts`) injects two flat lists:
- `STORE_CATEGORY_LIST` — comma-separated L2 giro keys
- `ITEM_CATEGORY_LIST` — comma-separated L4 categoría keys

### Required Changes for V4 Prompt

1. **Replace flat lists with grouped lists.** Instead of a single comma-separated string, present categories grouped by their parent (L1 for giros, L3 for categorías). This helps Gemini understand the taxonomy hierarchy:

```
STORE CATEGORIES (pick exactly one):
Supermercados: Supermercado, Mayorista
Restaurantes: Restaurante
Comercio de Barrio: Almacén, Minimarket, Feria, Kiosko, Botillería, Panadería, Carnicería
...

ITEM CATEGORIES (pick exactly one per item):
Alimentos Frescos: Frutas y Verduras, Carnes y Mariscos, Pan y Repostería, Lácteos y Huevos
Alimentos Envasados: Despensa, Congelados, Snacks y Golosinas, Bebidas
...
```

2. **Use Spanish display names in the prompt, return English keys.** The prompt should present Spanish names (the user's language) but instruct Gemini to return the English key values for parsing:

```
Return the KEY (e.g., "MeatSeafood"), not the Spanish label (e.g., "Carnes y Mariscos").
```

3. **Add Chilean-specific disambiguation rules:**

```
CHILEAN MARKET RULES:
- "Feria" = open-air market selling produce/seafood (NOT a fair/exhibition)
- "Almacén" = neighborhood corner store (NOT a warehouse)
- "Botillería" = liquor store
- "Bencinera" = gas station (NOT "gasolinera")
- "Kiosko" = small street-level shop selling snacks, newspapers, phone cards
- "Panadería" and "Carnicería" are specialty shops (L2 giros), NOT item categories
```

4. **Explain the L2/L4 independence:**

```
IMPORTANT: Store category and item categories are INDEPENDENT dimensions.
- Store category = the TYPE of establishment on the receipt
- Item category = what each LINE ITEM is, regardless of store type
- A "Supermercado" can sell items from any item category
- A "Farmacia" primarily sells "Medicamentos" but may also sell "Cuidado Personal"
```

5. **Handle removed/renamed categories in transition period:**

```
LEGACY MAPPING (for receipts with old category names):
- If you would have said "Clothing" (store), say "ClothingStore"
- If you would have said "Bakery" (item), say "BreadPastry"
- If you would have said "Pharmacy" (item), say "Medications"
- "StreetVendor" → use "OpenMarket"
- "MusicStore" → use "Entertainment"
```

### Key Files to Update (Story 17-3)

| File | Change |
|------|--------|
| `functions/src/shared/schema/categories.ts` | Update arrays + add grouped format export |
| `functions/src/prompts/v3-category-standardization.ts` | Create V4 prompt with grouped categories |
| `functions/src/prompts/index.ts` | Register V4 prompt, keep V3 as fallback |

---

## Summary

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| L1 Rubros | 8 | 12 | +4 |
| L2 Giros | 39 | 44 | +5 |
| L3 Familias | 7 | 9 | +2 |
| L4 Categorías | 39 | 42 | +3 |
| Cross-level name overlaps | 9 | 0 | -9 |
| Chilean-specific giros | 2 | 9 | +7 |

## Design Decisions

1. **Delivery removed** — it's a channel, not a giro. Classify by origin (Restaurante, Supermercado).
2. **Alimentación split into 3 rubros** — Supermercados (big stores), Restaurantes (eating out), Comercio de Barrio (neighborhood shops) for distinct spending pattern visibility.
3. **Vivienda promoted to L1** — housing is #1 lifetime expense, was invisible.
4. **Educación promoted to L1** — critical for Chilean families (private schools = 20%+ budget).
5. **Alcohol moved to Vicios** — supports V4 "detect the black holes" value.
6. **9 de-overlaps applied** — zero cross-level name conflicts.
7. **Option A for financial granularity** — simple L4 categories + subcategories for detail (e.g., LoanPayment with subcategory "Crédito Hipotecario").

## Implementation Roadmap

| Story | What Changes | Key Files |
|-------|-------------|-----------|
| 17-2 | Update constants, types, translations, normalizer | `shared/schema/categories.ts`, `src/config/categoryColors.ts`, `src/utils/categoryTranslations.ts`, `src/utils/categoryNormalizer.ts` |
| 17-3 | Update Gemini Cloud Function prompt | `functions/src/prompts/v3-category-standardization.ts` → V4, `functions/src/shared/schema/categories.ts` |
| 17-4 | Update all UI components showing categories | Components using `STORE_CATEGORY_GROUPS`, `ITEM_CATEGORY_GROUPS`, emoji maps |
| 17-5 | Batch migration of existing Firestore data | Cloud Function: read all transactions, remap old keys → new keys using Migration Map |
