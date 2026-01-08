# App Purpose & Core Principles

> Section 1 of Atlas Memory
> Last Sync: 2025-12-18
> Sources: ux-design-specification.md, pricing-model.md, business/README.md

## Mission Statement

<!-- Synced from: ux-design-specification.md:12 -->

> "Help Chilean families answer 'Where did my money go?' without the pain of manual data entry. Scan receipts, get insights immediately."

**App Type:** Smart Expense Tracker PWA for Chilean families

## Core Principles

<!-- Synced from: ux-design-specification.md, PRD -->

1. **Privacy First** - User data isolated by userId, strict Firestore security rules
2. **Mobile-First** - PWA optimized for phone camera scanning workflows
3. **Simplicity Over Features** - Focus on core scan→save→analyze flow
4. **Learn from Users** - Category and merchant learning improves accuracy over time
5. **No Shame Mechanics** - Insights celebrate progress, never criticize spending
6. **Proactive Not Reactive** - Scan and go, not sit down and type

## Target Market

<!-- CRITICAL: DIRECT QUOTE from ux-design-specification.md:10,22 -->

> "Chilean families who reach end of month wondering where their money went - people who want spending insights without manual data entry."

**Geographic Focus:** Chile (primary), with legal jurisdiction in Santiago de Chile

## Primary Currency

<!-- CRITICAL: DIRECT QUOTE from pricing-model.md:164, business/README.md:34 -->

> "Chilean Pesos (CLP) primary, USD for reference"
> "CLP pricing (Chilean Pesos) - Target market is Chile via Mercado Pago"

**Supported Currencies:** CLP (primary), USD, EUR

## Value Proposition

<!-- Synced from: ux-design-specification.md:14 -->

> "No competitor combines receipt scanning + item extraction + category learning + analytics in one flow. Boletapp is **proactive** (scan and go) instead of **reactive** (sit down and type)."

### Core Breakthrough
- **Scan receipts → Instant transaction records** - Photo to structured data in seconds
- **Smart Learning** - Learns user preferences for merchants, categories, and subcategories
- **Financial Awareness** - Analytics with temporal and category drill-down
- **Offline-first PWA** - Works without connectivity, syncs when online
- **Chilean Market Expertise** - Deep understanding of local receipt formats (RUT, boleta electrónica, specific store chains)

---

## Sync Notes

| Field | Source | Quote | Verified |
|-------|--------|-------|----------|
| Target Market | ux-design-specification.md:22 | "Chilean families who reach end of month..." | [x] |
| Currency | pricing-model.md:164 | "Chilean Pesos (CLP) primary, USD for reference" | [x] |
| Mission | ux-design-specification.md:12 | "Help Chilean families answer..." | [x] |
| Value Proposition | ux-design-specification.md:14 | "No competitor combines..." | [x] |
