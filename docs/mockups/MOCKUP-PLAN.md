# Gastify Mockup Generation Plan

**Goal:** Create a complete visual design system for Gastify — from user flows through screen mockups to a living design system — ensuring every screen the user sees feels like it belongs to ONE coherent app.

**Value:** V7 — Visible Kitchen ("If you can see the dish before you cook, you won't burn it.")

**Date:** 2026-03-19
**Revised:** 2026-03-20 (style decision: use production theme, skip style candidates)

**Companion docs:**
- [SCREEN-SPECS.md](SCREEN-SPECS.md) — detailed visual specs for every screen
- [COMPONENT-LIBRARY.md](COMPONENT-LIBRARY.md) — modals, dialogs, prompts, cards, banners, filters, headers

---

## App Context

- **Name:** Gastify (project folder: boletapp)
- **Domain:** Smart expense tracker for the Chilean market with AI receipt scanning
- **Stack:** React 18, TypeScript 5.3, Vite 5.4, Firebase, Gemini AI
- **Locale:** Spanish primary (Chilean), English secondary
- **Theme:** 3 color variants — Normal (warm cream/forest green), Professional (blue), Mono (grayscale)
- **Light/Dark mode** for each theme

### Bottom Navigation (5 slots)
```
┌─────────────────────────────────────────┐
│  🏠 Home  │  💡 Trends  │  [FAB]  │  📊 Reports  │  🔔 Alerts  │
└─────────────────────────────────────────┘
```
- **Home** → Dashboard | **Trends** → Analytics | **FAB** → Scan (tap=single, long-press=mode selector) | **Reports** → Reports | **Alerts** → Notifications
- **Secondary nav** (Profile Dropdown): History, Items, Insights, Settings

### Design Tokens (extracted from `index.html` — CSS variables)

#### Normal Theme (Default — warm cream/forest green)
```
TOKEN                LIGHT                   DARK
--primary            #4a7c59                 #6b9e7a
--primary-hover      #3d6b4a                 #5a8a68
--secondary          #5b8fa8                 #7ba8be
--accent             #e8a87c                 #d4a574
--success            #7d9b5f                 #8fbf9c
--warning            #f59e0b                 #fbbf24
--error              #ef4444                 #f87171
--bg                 #f5f0e8                 #1a2420
--bg-secondary       #ffffff                 #243028
--bg-tertiary        #f1dbb6                 #2d3d32
--surface            #ffffff                 #243028
--text-primary       #2d3a4a                 #e8e4dc
--text-secondary     #4a5568                 #b8c4a8
--border-light       #e3bba1                 #3d4d42
--border-medium      #d4a574                 #4d5d52
```

#### Professional Theme (cool blue/slate)
```
--primary            #2563eb                 #3b82f6
--bg                 #f8fafc                 #0f172a
--surface            #ffffff                 #1e293b
--text-primary       #0f172a                 #f1f5f9
--accent             #0ea5e9                 —
--border-light       #e2e8f0                 #334155
```

#### Monochromatic Theme (grayscale zinc)
```
--primary            #18181b                 #3f3f46
--bg                 #fafafa                 #09090b
--surface            #ffffff                 #18181b
--text-primary       #18181b                 #fafafa
--border-light       #e4e4e7                 #27272a
```

#### Typography
- **UI Font:** `Outfit` (400-800) via `--font-family`
- **Wordmark:** `Baloo 2` (700) via `--font-family-wordmark`
- **Alt Font:** Space Grotesk (selectable via data-font)
- **Font sizes:** xs 0.75rem → 3xl 1.875rem (small mode); xs 0.875rem → 3xl 2.25rem (normal mode)

### Layout Constraints
- Max width: 448px, touch targets: min 44px, padding: 12-16px
- Font: Outfit. Icons: Lucide React. Rounding: cards lg/xl, modals 2xl, buttons xl, badges full
- Z-layers: Base 0 | Overlay z-40 | Modal z-50 | Scan z-90/95 | QuickSave z-100
- Amount: `$12.500` (CLP) | `US$45.99` (foreign) | Decimal qty: `2.5 x $2.000 = $5.000`

---

## Style Decision

**Decision:** Use the existing production design (extracted from codebase). No style candidates evaluated.
**Date:** 2026-03-20
**Rationale:** The app already has a mature, coherent design system with 3 theme variants. Mockups should reflect what users actually see, not an aspirational redesign.
**Style candidates** (Organic, Playful Geometric, Sketch, Neobrutalism, Botanical, Bauhaus) were generated as Phase 1 explorations and remain in `styles/output/` for future reference.

**Design characteristics (from production code):**
- Rounded-lg cards, rounded-full badges/pills
- Subtle shadows (no hard offset shadows)
- Outfit font (geometric sans), Baloo 2 wordmark
- Lucide React 24px icons, default stroke
- Touch targets min 44px, safe area padding
- Animation: 100-400ms, spring/ease-out curves
- Category colors: 44 store types × 3 themes × 2 modes

---

## Screen Inventory Summary

Full specs in [SCREEN-SPECS.md](SCREEN-SPECS.md). Component library in [COMPONENT-LIBRARY.md](COMPONENT-LIBRARY.md).

### A. Nav Tab Screens (4 — LIVE)

| # | Screen | Nav | Key visuals |
|---|--------|-----|-------------|
| A.1 | Dashboard | Home | 3-slide carousel (treemap, radar, bump chart) + 2-slide recientes carousel |
| A.2 | Trends | Lightbulb | 4 chart types (donut, sankey, treemap, bump) + drill-down + statistics popup |
| A.3 | Reports | BarChart3 | 4 accordion sections + ReportDetailOverlay with inline donut charts + PDF export |
| A.4 | Alerts | Bell | Notification list with unread badge |

### B. Secondary Screens (4 — 3 LIVE + 1 IN-DEV)

| # | Screen | Access | Key visuals |
|---|--------|--------|-------------|
| B.1 | History | Dashboard/Profile | 5 filter types + selection mode + date groups + pagination |
| B.2 | Items | Profile | Dual view (aggregated/duplicate) + 3 sort keys + CSV export |
| B.3 | Insights | Profile | 3-tab switcher (Lista/Airlock/Logro) + carousel + selection mode |
| B.4 | Settings | Profile | 9 subviews (Limites, Perfil, Preferencias, Escaneo, Suscripcion, Datos, Grupos, App, Cuenta) |

### C. Transaction & Scan Screens (6 — LIVE + IN-DEV)

| # | Screen | Key visuals |
|---|--------|-------------|
| C.1 | Transaction Editor | Items section (grouped/original) + Advanced (18-6) + Hard Lock mode |
| C.2 | QuickSave Card | Post-scan overlay: merchant, items, total, confidence %, Edit/Save |
| C.3 | Single Scan | 5-state machine: Idle → Processing → Reviewing → Saving → Error |
| C.4 | Batch Scan | Capture (gallery, X/50) → CreditWarning → Review → Complete |
| C.5 | Statement Scan | IN-DEV placeholder + PLANNED (7 screens in Epic 18) |
| C.6 | Scan Mode Selector | 3 mode cards: Recibo/Lote/Estado de Cuenta |

### D. Shared Groups (16 — PLANNED, Epic 19)

Group Switcher, Group Home/Transactions/Analytics, Create Group, Transaction Card, Batch Add, Admin Panel, Settings Form, Invite Link, Redeem Invite, Leave/Delete confirmations, Read-Only Detail, Settings Subview

### Component Library (8 groups — see [COMPONENT-LIBRARY.md](COMPONENT-LIBRARY.md))

12 modals/dialogs | 4 learning prompts | 4 celebrations | 4 overlays | 5 cards | 4 headers | 5 filters | 7 error/empty states

**Total: 48 screen mockups + 8 component sheets**

---

## User Flows (13)

### Flow 1: First Open → First Receipt Scan
```
Login → Dashboard (empty) → FAB → Camera → ScanOverlay → QuickSaveCard → Save
  → Dashboard (first transaction) → PersonalRecordBanner: "Tu primera boleta!"
```

### Flow 2: Daily Use → QuickSave
```
Dashboard → FAB → Camera → ScanOverlay → QuickSaveCard
  → IF confidence >70%: Save (spring animation) → "¡Guardado!"
  → IF <70%: Edit → Transaction Editor → Save
```

### Flow 3: Batch Capture → Review
```
Long-press FAB → "Lote" → BatchCapture (photos, X/50) → CreditWarningDialog
  → BatchProcessing → BatchReview (per-receipt cards) → "Guardar todo" → BatchCompleteModal
```

### Flow 4: Statement → Match & Save
```
Long-press FAB → "Estado de Cuenta" → [Consent if first] → Upload PDF
  → [Hash dedup check] → [Password if encrypted] → queueStatementScan (1 super credit)
  → Async processing (can navigate, pulsing violet dot) → StatementReviewList
  → MatchingReview (approve/reject/create, conflict resolution) → Save All
```

### Flow 5: Group Expense Sharing
```
Tap logo → Group Switcher → Select group → Group View → Browse/Filter
  → OR: Editor Save → auto-copy to group
  → OR: History → Select → "Add to Group" → Pick group
```

### Flow 6: QuickSave → Learning → Trust
```
Scan → Save → CategoryLearningPrompt → Yes → next scan auto-categorized
  → After 3+ scans: TrustMerchantPrompt → Accept → future scans auto-save
```

### Flow 7: Credit Depletion & Recovery
```
FAB → "Insufficient credits" → CreditInfoModal → purchase or wait for reset
```

### Flow 8: Error Recovery (Scan)
```
Scan → ScanOverlay (error: WifiOff) → Retry → Success | Cancel (credit refund)
```

### Flow 9: Offline → Reconnect
```
Scan offline → pending queued → network reconnects → auto-sync → success toast
```

### Flow 10: Analytics Deep Dive
```
Trends → Donut → segment click → drill-down L1 → L2 → StatisticsPopup
  → transaction count badge → History (with pre-applied filters)
  → OR: Sankey/Treemap modes → FloatingDownloadFab → CSV/PDF
```

### Flow 11: Reports & PDF Export
```
Reports → expand accordion → tap row → ReportDetailOverlay
  → inline donut charts → tap transaction pill → History | tap PDF → print dialog
```

### Flow 12: Data Export
```
Settings/Cuenta → Export All | History → Export CSV | Trends → Download FAB | Items → CSV
```

### Flow 13: Settings Configuration
```
Settings → Preferencias → Theme/Dark/Language/Currency/Date/FontSize (live preview)
  → Datos → 3-tab learned mappings (view/delete) → Suscripcion → plan/credits/reset
```

---

## Mobile UX Patterns

- **Tab switching:** Tap only (no swipe — conflicts with carousels)
- **Long-press:** FAB → mode selector; TransactionCard → selection; InsightCard → selection
- **Scroll:** Header collapses at >80px, expands on scroll-up
- **Reduced motion:** All animations have `prefers-reduced-motion` alternatives
- **Transitions:** Tab→Tab instant | Forward slide-right 300ms | Modal fade+scale 200ms | Carousel live transform

---

## Execution Plan

### Phase 0: User Flows (13) — DONE
`docs/mockups/flows/flow-{01..13}-{name}.html`

### ~~Phase 1: Style Stress Test~~ — SKIPPED
Style decided: use production theme. Explorations in `styles/output/` for reference.

### Phase 2: LIVE Screen Mockups (production style, 3 themes)
Each mockup: production design + theme switcher (Normal/Professional/Mono) + light/dark toggle.
Output: `screens/gastify-{screen}.html`

**Round 2a (5):** Login, Dashboard, Trends, Reports, Alerts
**Round 2b (4):** History, Items, Insights, Settings (main + 9 subviews)
**Round 2c (6):** Transaction Editor, QuickSave, Single Scan States, Batch Capture, Batch Review, Scan Mode Selector
**CHECKPOINT:** Component Library Extraction → `screens/gastify-components.html`

### Phase 3a: Epic 18 Statement Scanning (5 — PLANNED)
Upload+Consent+Password, Processing+Pending, Review List (one-by-one with match/save/skip), Editor Advanced, Editor Hard Lock

### Phase 3b: Epic 19 Shared Groups (16 — PLANNED)
All D.1–D.16 screens

### Phase 3c: Component Library Mockups (8 sheets)
Modals, Learning Prompts, Celebrations, Overlays, Error/Empty States, Headers, Filters, Cards

**CHECKPOINT:** Cross-Screen Consistency

### Phase 4: Design Tokens & Validation
`design/tokens.json` | `design/a11y-report.md` | `design/stress-test.md`

### Phase 5: Brand & Identity (if needed)
Logo | Typography | Production assets (favicon, PWA)

### Phase 6: Design Hub — STARTED
`index.html` created, linking flows + screen progress matrix

---

## Content Stress Test Strings

```
Long user name: "Maria Alejandra Fernandez-Gutierrez"
Long merchant: "Supermercado Lider Express Avenida Providencia Santiago Centro"
Long item: "Aceite de oliva extra virgen primera presion en frio 500ml"
Large amount: "$1.234.567"   Small amount: "$50"   Foreign: "US$45.99"
Decimal qty: "0.633 x $3.490 = $2.209"
Many items: 25+ in receipt   Many transactions: 50+ in statement
Many groups: 5 (max) with long names   Many categories: 8+ in treemap/donut
```

---

## Parallelization Strategy

Max 6 parallel agents.

| Phase | Rounds | ~Time |
|-------|--------|-------|
| 0: Flows (13) | 3 | 9 min |
| 1: Style test | 2 + gates | 11 min |
| 2: Existing (15) | 3 | 15 min |
| 3a-d: New (33) | 6 | 31 min |
| 4-6: Polish | 3 | 23 min |
| **Total** | | **~89 min** + gates |

---

## Mockup HTML Convention

Single self-contained HTML file per screen:
1. Phone frame (420px, dark bg, notch)
2. Hero state first, variant states below with dividers
3. Light AND Dark mode
4. Interaction notes (HTML comment — gestures, transitions, keyboard, states, accessibility)
5. Flow context
6. Reduced motion variants

Naming: `gastify-{screen}.html` (single style — production theme with 3-theme switcher)

---

## Interaction Notes Template

```html
<!-- INTERACTION NOTES
Screen: [name]
Flow Context: Serves Flow [#] step [description]
Gestures: [element]: [gesture] → [result]
Transitions: Enter/Exit/Reduced motion
Keyboard: [input behavior]
States: Loading/Error/Empty
Micro-interactions: [element]: [feedback, duration]
Accessibility: [ARIA, focus, screen reader]
-->
```

---

## Dependencies

- Style prompts: `styles/*.prompt`
- Source code for LIVE screens
- Epic 18: `docs/architecture/proposals/implemented/EPIC-18-CREDIT-CARD-STATEMENT-SCANNING.md`
- Epic 18 stories: `docs/sprint-artifacts/epic18/stories/` (18-4, 18-6, TD-18-14)
- Epic 19: `docs/architecture/proposals/EPIC-19-MOCKUP-SCREENS.md` + `EPIC-19-MOCKUP-SPECS.md`
- Design playbook: `docs/design/DESIGN-SYSTEM-PLAYBOOK.md`

---

## Style Decision

**Date:** TBD | **Winner:** ___ | **Cherry-pick:** ___ | **Rationale:** ___

---

## Context for Agents

Each mockup agent receives:
1. Style `.prompt` file
2. Screen spec (source code for LIVE, epic spec for PLANNED)
3. User flows (which flows this screen serves)
4. Mobile UX patterns (gestures, transitions, reduced motion)
5. Interaction notes template (must fill, including accessibility)
6. Stress test strings (must try)
7. Nav: `Home | Trends | [FAB] | Reports | Alerts` + Profile Dropdown secondary
8. Spanish-first, mobile-first PWA (375px+)
9. Hero + variant states as in-page sections
10. Content display rules (currency, decimal qty, dates)
11. Design tokens from App Context
12. Light AND dark mode required
13. Shared components ref (Phase 2+ only, after checkpoint)
