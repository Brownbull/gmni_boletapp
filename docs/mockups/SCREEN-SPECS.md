# Gastify Screen Specifications

Detailed visual specifications for every screen and surface in the app. Referenced from [MOCKUP-PLAN.md](MOCKUP-PLAN.md).

**Status legend:** LIVE = in app, extract screenshots | IN-DEV = partially built | PLANNED = specified, not built | FUTURE = needs design from scratch

---

## A. Nav Tab Screens (bottom nav — always accessible)

### A.1 Dashboard (Home) — LIVE
**View:** `dashboard` | **Nav:** Home icon (leftmost)
**Sections:**
1. **Main Carousel Card** (3 slides, swipeable + keyboard):
   - **Slide 0 "Este Mes"** — Animated treemap grid (squarified algorithm). Up to 5 category cells with emoji, name, transaction count, amount, percentage. Footer: "Total del mes" + month progress bar + total amount. Click cell → filtered history.
   - **Slide 1 "Mes a Mes"** — Radar chart (SVG). N-sided polygon (3-6 sides). Current month (blue) vs previous (orange) overlays. Interactive category icons with dual progress rings.
   - **Slide 2 "Ultimos 4 Meses"** — Bump chart (SVG). 5-rank Y-axis, 4 months X-axis. Category ranking lines. Click data point → tooltip with category/month/amount.
   - **Header controls:** Month navigation carousel (swipe prev/current/next), View Mode selector (4 emoji toggles), Count mode toggle (Receipt vs Package icon)
   - **Indicator bar:** 3-segment, 6px height, slides to show active slide
2. **Recientes Carousel** (2 slides, swipeable):
   - **Slide 0 "Ultimos Escaneados"** — Sorted by scan date (createdAt)
   - **Slide 1 "Por Fecha"** — Sorted by transaction date, filtered by current month
   - TransactionCard components with staggered animation (80ms delay)
   - **Selection mode:** Long-press → checkboxes, "Select All" + "Delete" in header
   - Expandable "See More / Show Less" link
   - **Indicator bar:** 2-segment, d4a574 active color

**Variants:** empty (new user, onboarding), loading skeleton, pending scan indicator (pulsing violet dot on FAB), low credits banner, personal record celebration banner

### A.2 Trends (Analytics) — LIVE
**View:** `trends` | **Nav:** Lightbulb icon
**Header:** Back button + "Explora" title + IconFilterBar + Profile avatar + Time period pills (Week/Month/Quarter/Year with animated selector) + Period navigator (< Previous | Label | Next >)

**Visualizations (4 chart types + supporting components):**

1. **Donut Chart** — Spending distribution by category. 4-level drill-down hierarchy (Store Groups → Store Categories → Item Groups → Item Categories). Segment click → highlight + center display. Plus/Minus buttons to expand/collapse. Legend with percentage bars + transaction count badges.

2. **Sankey Diagram** — Money flow from store categories to item categories. 2, 3, or 4-level modes. Node/link click shows selection title (emoji + name, amount, percentage). 10% threshold filtering with "Mas" aggregation.

3. **Treemap Grid** — Proportional spending boxes (squarified). Animated entrance (50ms stagger). Same 4-level drill-down as donut. Dynamic height (320-640px). Cell layouts: expanded/compact/tiny based on area.

4. **Bump Chart** — Category ranking over time. (Same component as Dashboard slide 2.)

**Supporting components:**
- Drill-Down Cards Grid — Time periods or categories with totals, percentage bars, transaction count badges.
- Category Statistics Popup — Transaction stats (count, total, min, max, avg, median), item stats, top merchant.
- Trend List Items — Category list with sparklines (green=down/good, red=up/bad, blue "nuevo" badge).
- Chart Mode Toggle, Drill-Down Mode Toggle, Temporal/Category Breadcrumbs, Floating Download FAB.

**Variants:** empty (no data), filtered results, drill-down active, statistics popup open

### A.3 Reports — LIVE
**View:** `reports` | **Nav:** BarChart3 icon
**Header:** Back button + "Resumen" title + Year selector (prev/next arrows, swipe) + Profile avatar

**Content (4 collapsible accordion sections):**
- **Weekly** — ReportRow list (up to 52). Each: unread dot, logo circle, "Semana N", amount, trend indicator, transaction count badge.
- **Monthly** — Same structure, 12 max
- **Quarterly** — Same + persona hook text + highlights
- **Yearly** — Same + persona hook + highlights

**ReportDetailOverlay (modal on row click):**
- Hero card: large amount, trend badge (red up / green down)
- Persona Insight card, Highlights card (Q/Y only)
- Transaction Groups card with inline donut chart + category cards
- Item Groups card with inline donut chart + product cards
- Transaction count pill (click → History), download PDF button

**Variants:** empty, year change, section collapsed, overlay open, print mode

### A.4 Alerts (Notifications) — LIVE
**View:** `alerts` | **Nav:** Bell icon (with unread badge count)
**Variants:** with notifications, empty (no alerts), loading

---

## B. Secondary Screens (accessed via navigation, not bottom nav)

### B.1 History — LIVE
**Access:** Dashboard "Ver todo" link, Profile Dropdown, transaction count badges

**Header (collapsible on scroll >80px):**
- Back button + Profile dropdown + Search (debounced) + Sort control + Export button + Duplicate filter toggle

**Filter System (5 components):** TemporalFilterDropdown, CategoryFilterDropdown, LocationFilterDropdown, IconFilterBar, FilterChips (removable + "Clear all")

**Content:**
- Date group headers (sticky, daily total)
- TransactionCard list (staggered animation, grouped by date)
- **Selection mode:** Long-press → checkboxes, SelectionBar (count + "Select All" + "Group" + "Delete")
- Image viewer modal, Pagination (15/30/60 + Next/Previous)

**Variants:** empty (scan CTA), empty filtered (clear filters), search active, filters with chips, selection mode, duplicate filter on

### B.2 Items — LIVE
**Access:** Profile Dropdown

**Header (collapsible on scroll >80px):**
- Search bar (debounced), Temporal breadcrumb, Sort control (3 keys), Duplicate filter toggle, Filter chips, CSV export (monthly only), Item count

**Two view modes:**
1. **Aggregated (default):** AggregatedItemCard — Groups by name + merchant. Total spent, purchase count, avg price, transaction count badge, category emoji, pills (merchant/date/count/qty/city).
2. **Duplicate:** ItemCard — Flat list. Price, merchant, date, qty, city+flag, subcategory.

**Pagination:** 10/25/50/100 + Next/Previous + "Page X of Y"

**Variants:** empty ("Agrega gastos..."), empty filtered, search active, duplicate mode, aggregated mode

### B.3 Insights — IN-DEV
**Access:** Profile Dropdown, Dashboard

**View Switcher (3 pills):**
1. **"Lista":** Highlighted Insights + InsightsCarousel + Grouped History ("This Week" / "Last Week" / "Earlier"). Long-press (500ms) → selection mode with sticky toolbar.
2. **"Airlock" (placeholder):** 🔮 + "Insights con IA" + "Proximamente"
3. **"Logro" (placeholder):** 🏆 + "Logros y Records" + "Proximamente"

**Variants:** empty, temporal filter active, selection mode, view switch, loading

### B.4 Settings — LIVE (9 subviews)
**Access:** Profile Dropdown

| # | Subview | Icon Color | Content |
|---|---------|-----------|---------|
| 1 | Limites | Red | Spending limits |
| 2 | Perfil | Primary | Name, phone, birth date |
| 3 | Preferencias | Indigo | Language, currency, date format, theme, font size, dark mode |
| 4 | Escaneo | Blue | Default scan currency, location, format |
| 5 | Suscripcion | Green | Plan, credits, reset countdown |
| 6 | Datos | Amber | Learned mappings (3-tab: categories, merchants, subcategories) |
| 7 | Grupos | Blue | PLANNED (coming soon) |
| 8 | App | Purple | Version, debug info |
| 9 | Cuenta | Pink | Export all data, wipe database |

Footer: Sign Out button → SignOutDialog confirmation

---

## C. Transaction & Scan Screens (full-screen workflows)

### C.1 Transaction Editor — LIVE
**Access:** Scan result, History tap, QuickSave "Edit"

**Header:** Back, "My Purchase", batch context, credit badges, delete/close

**Main Card:**
- Metadata row: Merchant (editable), category badge, learned badge, location, date/time/currency tags
- Thumbnail / Add Photo + Re-scan button
- **Items Section:** Grouped (categories, emoji, count, total) or Original order. Item row: name, total/unit price, qty (decimal — TD-18-14), category combobox, subcategory, delete/confirm. Add Item button.
- Total row + Save button

**Advanced Section (18-6, collapsed):** ChargeType, Installments, Recurrence, CardHolder, Source badge
**Hard Lock Mode:** statementVerified=true → ALL fields disabled + "Unlock" button

**Variants:** new, editing existing, with items, validation errors, hard lock, advanced expanded, grouped vs original, decimal qty

### C.2 QuickSave Card — LIVE
**Trigger:** Post-scan, high-confidence (>70%)

Merchant, category badge, location+flag, date/time/currency. Thumbnail with confidence %. Total highlight. Items (staggered reveal, "+X items mas..."). Edit/Save buttons. Cancel link with credit warning. Success state (bounce + "¡Guardado!").

**Variants:** default, saving, success, cancel confirmation, foreign currency, no items, many items (>3)

### C.3 Single Scan Flow — LIVE
5 states: Idle → Processing (ScanOverlay: uploading/processing/ready/error) → Reviewing (QuickSave or Editor) → Saving → Error. Non-blocking overlay. Pulsing dot on FAB during processing.

### C.4 Batch Scan Flow — LIVE
BatchCaptureView: gallery, X/50 counter, credit section. CreditWarningDialog (sufficient/insufficient). BatchReviewView: summary, card list, per-receipt errors. BatchCompleteModal: summary + credits.

### C.5 Statement Scan Flow — IN-DEV / PLANNED (Epic 18)
**Current:** Placeholder ("Proximamente").

**Planned screens:**

1. **StatementUploadView (18-4):** File picker + 7MB size check + PDF hash dedup + password dialog if encrypted
2. **StatementConsentDialog (18-4):** First-time Google AI disclosure. Stored in Firestore.
3. **StatementProcessingOverlay (18-3):** Async, non-blocking. Pulsing violet dot on FAB. Resume banner on restart.
4. **StatementReviewList (18-10a):** One-by-one review flow (similar to BatchReview UX):
   - Transactions listed in order (by date or original statement order)
   - User resolves each transaction sequentially
   - **Per-transaction card (StatementTransactionCard):** merchant, amount, date, chargeType badge, installments, cardHolder
   - **If match found:** Matched existing transaction shown ON TOP of extracted card. Match display shows: merchant/place, date, total, category (for context). **Match criteria: date + amount ONLY** (not category).
     - Actions: **"Match"** (links extracted → existing) | **"Skip"**
   - **If no match:** Extracted transaction shown alone.
     - Actions: **"Save"** (create as new transaction) | **"Edit"** (open editor, then save) | **"Skip"**
   - Confidence warning on low-confidence items (<70%)
   - Total deviation warning if extracted total differs >5% from sum
   - Transaction limit disclaimer (150+)
   - Progress indicator: "12 de 47 transacciones resueltas"
5. **Pending Indicator (18-3):** Pulsing violet dot (8px) on FAB + resume banner

### C.6 Scan Mode Selector — LIVE
Floating popup: Recibo (green, 1 credit) | Lote (amber, 1/receipt) | Estado de Cuenta (violet, 1 super credit)

---

## D. Shared Groups — PLANNED (Epic 19)

### D.1 Group Switcher Dropdown
Logo icon trigger. Personal row + Group rows (emoji + name + auto-copy toggle) + Activity badges + Create/Join buttons. 5-group limit.

### D.2–D.16 Group Screens

| # | Screen | Story | Priority |
|---|--------|-------|----------|
| D.2 | Group View Home | 19-5, 19-6 | High |
| D.3 | Group View Transactions | 19-5, 19-6 | High |
| D.4 | Group View Analytics | 19-5, 19-8 | Medium |
| D.5 | Create Group Form | 19-5 | High |
| D.6 | Group Transaction Card | 19-6 | High |
| D.7 | Batch "Add to Group" | 19-6 | High |
| D.8 | Admin Panel | 19-9 | High |
| D.9 | Group Settings Form | 19-9 | High |
| D.10 | Invite Link Generator | 19-7 | Medium |
| D.11 | Redeem Invite | 19-7 | Medium |
| D.12 | Leave Group (3 variants) | 19-5 | Medium |
| D.13 | Delete Group | 19-9 | Medium |
| D.14 | Delete Transaction | 19-6 | Medium |
| D.15 | Read-Only Transaction Detail | 19-6 | Medium |
| D.16 | Settings Grupos Subview | 19-7 | Medium |

See specs: `docs/architecture/proposals/EPIC-19-MOCKUP-SCREENS.md` + `EPIC-19-MOCKUP-SPECS.md`
