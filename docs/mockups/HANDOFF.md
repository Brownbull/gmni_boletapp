# Gastify Mockups — Session Handoff

**Date:** 2026-03-31
**Status:** Navigation restructured. 5 equal nav tabs (Inicio | Compras | Escanear | Gastos | Perfil). 4 screens merged. Perfil page added.

---

## What Exists

### Flows (13/13 complete)
`docs/mockups/flows/flow-{01..13}-*.html` — self-contained HTML flow diagrams with dark theme, interactive nodes, phase dividers, nav reference bars.

### Screen Mockups (17 LIVE screens at P1 + 2 extended)
`docs/mockups/screens/gastify-*.html` — production design with theme switcher (Normal/Professional/Mono) + light/dark toggle. Phone frame 360px wide (Samsung S23).

| Screen | File | Has Nav | Has Piggy Logo | Compared to App |
|--------|------|---------|----------------|-----------------|
| Dashboard | gastify-dashboard.html | Yes (Home active) | Yes | v3 — closely matches |
| Trends | gastify-trends.html | Yes | No (back-nav) | v2 — closely matches |
| Reports | gastify-reports.html | Yes | Yes (in rows) | v2 — closely matches |
| Alerts | gastify-alerts.html | Yes (Bell active) | No (back-nav) | Not compared |
| Login | gastify-login.html | No | Yes (hero) | Partially compared |
| History | gastify-history.html | Yes | No (back-nav) | v2 — closely matches |
| Items | gastify-items.html | Yes | No (back-nav) | Not compared |
| Insights | gastify-insights.html | Yes (Lightbulb active) | No (back-nav) | Not compared |
| Settings | gastify-settings.html | Yes | No (back-nav) | Not compared |
| Transaction Editor | gastify-transaction-editor.html | No (full-screen) | No | Not compared |
| QuickSave Card | gastify-quicksave-card.html | Yes (Home active) | Yes | Partially compared |
| Single Scan States | gastify-single-scan-states.html | Yes (Home active) | Yes | Not compared |
| Batch Capture | gastify-batch-capture.html | No (full-screen) | No | Not compared |
| Batch Review | gastify-batch-review.html | No (full-screen) | No | Not compared |
| Scan Mode Selector | gastify-scan-mode-selector.html | Yes (Home active) | Yes | Not compared |
| Statement Upload | gastify-statement-upload.html | No (full-screen) | No | Epic 18 — new |
| Statement Review | gastify-statement-review.html | No (full-screen) | No | Epic 18 — new |

### Design Hub
`docs/mockups/index.html` — central hub linking all flows, screens, explorations, with progress matrix and decision cards.

### Icon Exploration
`docs/mockups/explorations/exploration-icon-iterations.html` — interactive icon playground with:
- 60+ SVG icons across 10 concept categories (Monogram, Receipt, Scan, Growth, Abstract, Wallet, Chilean, AI, Currency, Letterform)
- 12 PixelLab pixel art icons (finance objects)
- 7 Piggy Bank variations
- 5 Snowshoe cat mascot icons (v3)
- Sticky preview panel with controls: text overlay, typography, color, X/Y position, size, opacity, shadow, stroke, logo scale, icon opacity, circle shape, background fill, color blindness simulation
- Files in `docs/mockups/explorations/pixellab-icons/`

### Reference Files
- `docs/mockups/screens/_nav-reference.html` — canonical bottom nav CSS + HTML
- `docs/mockups/screens/piggy-bank.png` — decided logo icon (copy for relative paths)
- `docs/mockups/MOCKUP-PLAN.md` — master plan with execution phases
- `docs/mockups/SCREEN-SPECS.md` — detailed visual specs for all screens
- `docs/mockups/COMPONENT-LIBRARY.md` — 8 component groups (modals, prompts, etc.)

### Style Explorations (archived, not used)
`docs/mockups/styles/output/` — 6 dashboard mockups in candidate styles (Organic, Playful Geometric, Sketch, Neobrutalism, Botanical, Bauhaus). Decision: use production theme instead.

---

## Key Decisions Made

1. **Style:** Use production design (3 themes from codebase), not style candidates. Decided 2026-03-20.
2. **Logo:** Piggy Bank pixel art (from PixelLab). Decided 2026-03-30. Icon at 80% of container circle.
3. **Phone frame:** 360px wide (Samsung S23 viewport), height extends as needed.
4. **Bottom nav (RESTRUCTURED 2026-03-31):** 5 equal items, no elevated FAB:
   - Inicio (🏠) | Compras (📋) | Escanear (📷) | Gastos (📊) | Perfil (👤)
   - All tabs equal height/style — standard mobile pattern
   - Escanear: tap → mode selector, icon changes to reflect selected mode, mode persists
   - Credit badges moved to scan mode selector screen
5. **Header patterns (RESTRUCTURED 2026-03-31):** Two types:
   - Dashboard-style: piggy logo circle + "Gastify" wordmark + 🔔 bell with badge (3)
   - Back-nav style: ChevronLeft + title (no avatar — Perfil is in nav bar)
   - Avatar dropdown REMOVED — replaced by Perfil nav tab
6. **Screen merges (2026-03-31):**
   - History + Items → **Compras** (Fecha | Producto toggle)
   - Trends + Reports + Insights → **Gastos** (Graficos | Resumen segmented control)
   - Alerts → notification sheet from bell icon (not a standalone view)
   - New: **Perfil** page (groups, goals, export, settings, plan)
6. **Login:** Google sign-in only (no email option).
7. **QuickSave:** Shows category summaries (max 3 categories with emoji + name + count + subtotal), not individual items. Overflow note: "+N categorias, M items en total".
8. **Statement scan (Flow 4):** After step 11, no existing transactions → batch-review-like one-by-one flow. Match criteria: date + amount only. Actions: Match (if found) / Save / Skip.

---

## Design Conventions

### Production Theme Colors (Normal Light — default)
```
--primary: #4a7c59     --bg: #f5f0e8          --surface: #fff
--accent: #e8a87c      --secondary: #5b8fa8   --text: #2d3a4a
--border-light: #e3bba1  --bg-tertiary: #f1dbb6  --error: #ef4444
```

### Typography
- UI: Outfit (400-800)
- Wordmark: Baloo 2 (700) — "Gastify"
- Amount: Chilean peso `$12.500` (dot thousands, no decimals)

### Screen Mockup Structure
Each HTML file is self-contained with:
1. Theme switcher + light/dark toggle (outside phone frame)
2. Variant switcher (Hero/Empty/Loading/etc.)
3. Phone frame (360px, dark bezel, notch, status bar 9:41, home indicator)
4. Multiple variant states as switchable sections

### Elements from Real App (learned from comparisons)
- Dashboard: treemap with squarified proportions, abbreviated amounts ($110k), category names at TOP of cells, indicator bars INSIDE cards, recientes in container card
- History title: "Compras" (not "Transacciones"), temporal breadcrumb `2026 > T1 > Mar > Sem > Dia`
- Trends: "Explora" title, donut chart with legend INSIDE card, "CATEGORIAS DE PRODUCTOS" subtitle
- Reports: header all on ONE line (back + "Resumen" + year selector + avatar)

---

## What's NOT Done (Next Steps)

### Phase 3a: Epic 18 Statement Scanning (7 screens → 4 consolidated — DONE)
- ~~Statement Upload + Consent + Password dialogs~~ → `gastify-statement-upload.html` (5 variants: Upload, Consent, Password, Processing, Error)
- ~~Statement Processing + Pending indicator~~ → Added "Pending Scan" variant to `gastify-dashboard.html` (violet pulsing dot + resume banner)
- ~~Statement Review List + Matching Review~~ → `gastify-statement-review.html` (4 variants: Match Found, No Match, Summary, Low Confidence)
- ~~Editor Advanced fields + Hard Lock~~ → Added "Statement" + "Hard Lock" variants to `gastify-transaction-editor.html`

### Phase 3b: Epic 19 Shared Groups (16 screens → 6 consolidated — DONE)
- ~~Group Switcher~~ → `gastify-group-switcher.html` (3 variants: Dropdown Open, Group Selected, Empty)
- ~~Group Home/Transactions/Analytics + Transaction Card + Delete~~ → `gastify-group-home.html` (5 variants: Home, Transactions, Analytics, Txn Detail, Delete Confirm)
- ~~Create Group + Invite Link~~ → `gastify-group-create.html` (4 variants: Create Form, Invite Link, Limit Reached, Loading)
- ~~Admin Panel + Group Settings + Delete Group + Kick/Role~~ → `gastify-group-admin.html` (5 variants: Members, Settings, Delete Group, Kick Member, Role Change)
- ~~Redeem Invite~~ → `gastify-group-invite.html` (5 variants: Preview, Expired, Already Member, Limit Reached, Joining)
- ~~Leave Group + Settings Subview~~ → Added "Grupos" + "Salir de Grupo" variants to `gastify-settings.html`

### Phase 3c: Component Library (8 sheets → 2 consolidated — DONE)
- ~~Modals (12), Learning Prompts (4), Celebrations (4), Overlays (4)~~ → `gastify-components-modals.html` (18 components: 6 modals, 4 prompts, 4 celebrations, 4 overlays)
- ~~Cards (5), Headers (4), Filters (5), Error/Empty States (7)~~ → `gastify-components-cards.html` (19 components: 5 cards, 4 headers, 5 filters, 5 error/empty states)

### Screens Not Yet Compared to Real App
- Alerts, Items, Insights, Settings, Transaction Editor, Single Scan States, Batch Capture, Batch Review, Scan Mode Selector — these may need refinements similar to what Dashboard/Trends/Reports/History received

### Consistency Fixes Applied (2026-03-30)
- 7 screen mockups: bottom nav replaced with canonical version
- 10 flow diagrams: nav reference bars fixed
- Design hub: Epic 18 count corrected (9→7), progress bar updated

### Consistency Fixes Applied (2026-03-30, session 2)
- **Nav bar unification**: 3 divergent nav families (Legacy, Variant-64, Dashboard) unified to dashboard canonical CSS
  - alerts, settings: replaced legacy CSS (position:relative, no FAB, backdrop-filter) with canonical (position:absolute, 56px height, FAB+badges)
  - insights, quicksave-card, single-scan-states, scan-mode-selector: fixed height 64→56px, radius 34→30px, width 56→48px, hardcoded rgba→var(--secondary), fab-wrapper 56→52px
  - items: var(--text-secondary) → var(--secondary) in nav labels
  - trends: added `active` class to BarChart3 nav item
- **Font imports**: Added Baloo+2 to items and transaction-editor (were missing wordmark font)
- **Category color taxonomy unified** (option B): 136 renames across 3 files
  - history: construccion→hogar, vet→mascotas
  - items: construction→hogar, pharmacy→farmacia, pet→mascotas, grocery→alimentos, cleaning→limpieza
  - trends: medicamento→farmacia, cargo→transporte, mas→otros
  - Canonical names: --cat-hogar, --cat-farmacia, --cat-mascotas, --cat-alimentos, --cat-limpieza, --cat-transporte, --cat-otros, --cat-carnes, --cat-congelados, --cat-lacteos, --cat-supermercado
- **index.html fixes**: Style badge TBD→Production, screen count 48→46, Insights DEV→LIVE, reference docs now clickable links, added HANDOFF.md link
- **Phone frame widths**: verified all 360px (initial audit was wrong — 340/380/460 were dialog/card/responsive values)

### Flow Modernization (2026-03-30, session 3)
- **Flows 1-5 migrated to CSS variables**: Added `:root` variable blocks matching flow-06+ pattern, 286 color replacements across 5 files
- **Nav reference bar modernized**: All 5 legacy flows now use modern nav-ref CSS (surface background, border, centered, max-width 420px) matching flows 6-13
- **Remaining hex colors**: Per-node accent colors intentionally kept as hex (unique decorative colors per flow step, don't map to variables)

### Loading Variant States Added (2026-03-30, session 3)
- **history**: 5 skeleton transaction row placeholders with shimmer animation
- **items**: 6 skeleton product card placeholders with shimmer
- **reports**: 3 skeleton report section placeholders with shimmer
- **trends**: Skeleton donut chart area + 3 legend row placeholders with shimmer
- All use theme-aware skeleton variables (--skeleton-base, --skeleton-shine) across Normal/Professional/Mono x Light/Dark

### Variant State Coverage (complete audit)
14 of 15 screens now have variant states:
- Dashboard: Hero, Empty, Loading
- History: Hero, Empty, Filtered, Selection, **Loading** (new)
- Items: Aggregated, Duplicates, Empty, Search, **Loading** (new)
- Trends: Hero, Empty, Drill-down, **Loading** (new)
- Reports: Hero, Report Detail, Empty, **Loading** (new)
- Alerts: Hero, Empty, Loading (with separate frames)
- Insights: Hero, Airlock, Achievement, Selection, Empty
- Login: Hero, Loading, Error, First Sign-in (with separate frames)
- Settings: Preferences subview, Sign-out dialog (with separate frames)
- QuickSave: Hero, Saving, Success, Cancel, Many Items, Foreign $
- Single Scan: All states as primary content (pending, scanning, success, error)
- Batch Capture: Hero, Empty, Max Reached, Credit OK, Credit Low
- Batch Review: Hero, All Success, Complete Modal, Processing
- Transaction Editor: Editing, New Scan, Errors, Decimal Qty
- Scan Mode Selector: Popup Open, Closed, Mode Selected

---

## PixelLab Configuration
MCP configured in `.mcp.json` with secret key. Pixflux model works well for 64x64 icons. Bitforge style-reference doesn't work well with non-64x64 source images. Character consistency via web app, not API.

Prompt template for good results:
```
{description}, pixel art RPG item icon
width: 64, height: 64, detail: highly detailed
outline: single color black outline, shading: detailed shading
no_background: true
negative: blurry, ugly, distorted
```