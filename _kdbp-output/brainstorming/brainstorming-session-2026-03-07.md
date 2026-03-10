---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: ['shared/schema/categories.ts', '_kdbp-output/epics.md']
session_topic: 'Epic 17 — 4-level Spanish category taxonomy design for BoletApp'
session_goals: 'Concrete naming decisions for all 4 levels, de-overlapping plan, Chilean market-fit review'
selected_approach: 'Progressive Flow (4 phases)'
techniques_used: ['Role Playing', 'Morphological Analysis', 'SCAMPER', 'Decision Tree Mapping']
ideas_generated: []
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Gabe
**Date:** 2026-03-07
**Topic:** Epic 17 — Category Taxonomy Design
**Behavior:** boletapp-dev v1.0.0 (V1: item visibility, V5: easier than drawer)

## Session Overview

**Problem:** BoletApp has a 4-level category system (Store Group → Store Category → Item Group → Item Category) with 36 store + 39 item categories. The levels have no formal Spanish user-facing names, 9 categories overlap across levels, and some names don't match Chilean usage patterns.

**Goal:** Design a clean 4-level Spanish taxonomy (with English translations) that Chilean users naturally understand, with zero cross-level overlaps.

**Constraint:** All names need Spanish primary + English translation. Must work for AI receipt scanning (Gemini prompt) AND human UI display.

## Research: Chilean Market Context

### Fintonic (most popular finance app in Chile) Categories
- **Ocio y Transporte** (Leisure & Transport): restaurantes, hotel, transporte, gasolina, parking, espectáculos
- **Salud, Saber y Deporte** (Health, Knowledge & Sports): farmacia, belleza, óptica, médico, deportivo, estudios
- **Servicios Típicos** (Typical Services): Internet, teléfono, electricidad, gas, agua, alarma
- **Vivienda y Vehículo** (Housing & Vehicle): mortgage, repairs, maintenance
- **Compras** (Shopping): hogar, electrónica, supermercado, ropa, deportivo, librería, niños, regalos
- **Bancos y Organismos** (Banks & Government): hipoteca, préstamos, impuestos, multas
- **Seguros** (Insurance): auto, hogar, salud, vida, viaje

### SII (Chilean Tax Authority) — "Giro" Terminology
- Chile officially uses "**giro**" (business activity/trade) to classify businesses
- SII codes follow CIIU4.CL 2012 (UN international standard)
- Commercial activities: "Venta al por menor" (retail sales) with subcategories
- The word "giro" is universally understood in Chile for "what a business does"

### Chilean Retail Formats (locally understood)
- **Supermercado** — Grocery chain (Jumbo, Líder, Unimarc)
- **Almacén** — Corner store, neighborhood shop
- **Minimarket** — Modern small format store
- **Feria** — Open-air market (vegetables, fruits, fish)
- **Botillería** — Liquor store
- **Panadería** — Bakery
- **Carnicería** — Butcher
- **Verdulería** — Greengrocer
- **Farmacia** — Pharmacy (Cruz Verde, Salcobrand, Ahumada)
- **Ferretería** — Hardware store (Sodimac, Easy, local)
- **Bencinera** — Gas station (Copec, Shell, Petrobras)

### MCC (Visa/Mastercard) Reference
- Payment networks use 4-digit Merchant Category Codes
- Grocery: 5411, Restaurant: 5812, Pharmacy: 5912
- These map to categories similar to BoletApp's store categories

## Technique Selection: Progressive Flow

| Phase | Technique | Focus |
|-------|-----------|-------|
| 1 | Role Playing | How different Chilean users naturally name spending |
| 2 | Morphological Analysis | Map all 4 levels × categories, find overlaps |
| 3 | SCAMPER | Substitute/Combine/Eliminate to refine |
| 4 | Decision Tree | Lock in final names in ES + EN |

## Decisions Made

### Phase 1: Role Playing — Chilean Personas
- Chilean users think in "dónde" (where) and "qué" (what)
- Group by life domain: comida, casa, salud, transporte
- Missing local formats: feria, botillería, minimarket, kiosko, mayorista
- "StreetVendor" → "Feria", "GasStation" → "Bencinera", "Hardware" → "Ferretería"

### Phase 2: Morphological Analysis
- **Level names confirmed:** Rubro / Giro / Familia / Categoría
- **9 de-overlaps confirmed** (Bakery→Pan y Repostería, Pharmacy→Medicamentos, etc.)
- **Group renames confirmed** (Tiendas General→Tiendas Generales, Hospitalidad→Entretenimiento y Hospedaje, etc.)
- **Gaps identified:** Feria, Minimarket, Botillería, Mayorista, Kiosko, Vicios group, Comida Preparada group

### Phase 3: SCAMPER
- **Substitute:** 8 better Spanish names
- **Combine:** Jewelry+Optical → Accesorios y Óptica; Mobiliario merged into Hogar
- **Eliminate:** MusicStore (L2), Musical Instruments (L4)
- **Adapt:** 8 new L2 giros, 4 new L4 categorías
- **Modify:** Alcohol → Vicios group
- **Delivery removed** — it's a channel, not a giro
- **Alimentación split into 3 rubros** (Supermercados, Restaurantes, Comercio de Barrio)

### Phase 4: Decision Tree — Gravity Well Analysis
- **Vivienda added as L1** — #1 lifetime expense, was invisible (utility companies, property admin)
- **Educación promoted to L1** — critical for Chilean families with private school costs
- **L3 Hogar confirmed** as the item-side equivalent for housing
- **Government → Servicios y Finanzas**
- **Credit card statement categories covered** via Servicios Básicos (L2), Cuentas del Hogar (L4), Gastos Comunes (L4), LoanPayment with subcategories

## Output

Full taxonomy spec saved to: `_kdbp-output/brainstorming/taxonomy-spec-2026-03-07.md`

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| L1 Rubros | 8 | 12 | +4 |
| L2 Giros | 39 | 44 | +5 |
| L3 Familias | 7 | 9 | +2 |
| L4 Categorías | 39 | 42 | +3 |
| Cross-level overlaps | 9 | 0 | -9 |
| Chilean-specific giros | 2 | 9 | +7 |
