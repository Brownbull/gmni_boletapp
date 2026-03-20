# Gastify Component Library

Surfaces that appear on top of or within views — modals, dialogs, prompts, cards, banners, filters, headers. Referenced from [MOCKUP-PLAN.md](MOCKUP-PLAN.md).

---

## CL.1 Modals & Dialogs (12)

| # | Component | What it shows | Trigger |
|---|-----------|---------------|---------|
| 1 | **ScanCompleteModal** | Post-scan summary. Save/Edit buttons. | Scan complete (non-QuickSave path) |
| 2 | **BatchCompleteModal** | Batch save summary. Credits used. View History/Go Home. | Batch save complete |
| 3 | **CreditInfoModal** | Credit balance (normal + super). Optional purchase. | Tap credit badge |
| 4 | **CreditWarningDialog** | Pre-batch credit check. Sufficient (green) / insufficient (red). | Before batch processing |
| 5 | **BatchDiscardDialog** | "Discard batch?" destructive confirmation. | Discard in batch review |
| 6 | **DeleteTransactionsModal** | Batch delete preview (first 3 + "and X more"). "No se puede deshacer." | Delete in selection mode |
| 7 | **TransactionConflictDialog** | Side-by-side conflict comparison. View/Discard/Cancel. | Statement duplicate detection |
| 8 | **LearnMerchantDialog** | Merchant name correction. Original vs corrected. | User corrects merchant |
| 9 | **ItemNameSuggestionDialog** | Item name suggestion. Original → suggested. Apply/Not Now. | Cross-store item match |
| 10 | **InsightDetailModal** | Insight info + View Transaction + Delete buttons. | Tap insight card |
| 11 | **SignOutDialog** | Logout confirmation with warning. Confirm/Cancel. | Settings → Sign Out |
| 12 | **ConfirmationDialog** | Generic reusable: title, message, confirm/cancel. Destructive variant (red). | Various |

---

## CL.2 Learning Prompts (4)

These form the **core learning system** — why the app gets smarter over time.

| # | Component | What it teaches | Trigger |
|---|-----------|----------------|---------|
| 1 | **CategoryLearningPrompt** | "Save category for future items?" Multi-item selector. Yes/No. | User changes category |
| 2 | **SubcategoryLearningPrompt** | "Save subcategory?" Yes/No. | User changes subcategory |
| 3 | **TrustMerchantPrompt** | "Trust this merchant for QuickSave?" After 3+ successful scans. | Repeat merchant threshold |
| 4 | **IntentionalPrompt** | "Was this spending intentional?" Slide-up card. Two buttons + dismiss. | Unusual spending detected |

---

## CL.3 Banners & Celebrations (4)

| # | Component | What it shows | Behavior |
|---|-----------|---------------|----------|
| 1 | **PersonalRecordBanner** | Trophy icon + record description. | Auto-dismiss 8s. Spending record. |
| 2 | **BadgeUnlock** | Badge emoji in gradient circle + name & description. | Achievement unlocked. |
| 3 | **CelebrationCard** | Bouncing emoji + title + stats + share button. | Milestone reached. |
| 4 | **PWAUpdatePrompt** | Refresh + "New version available" + Update/Dismiss. | Service worker detects new version. |

---

## CL.4 Overlays (4)

| # | Component | Blocking? | States |
|---|-----------|-----------|--------|
| 1 | **ScanOverlay** | No | uploading (progress %), processing (spinner + ETA + nav tip), ready (checkmark, auto-dismiss), error (Retry/Cancel) |
| 2 | **ProcessingOverlay** | Yes | Spinner + "Processing receipt" + optional ETA |
| 3 | **BatchProcessingOverlay** | Yes | Progress bar + cancel |
| 4 | **StatementProcessingOverlay** | No (async) | Progress + resume on restart (PLANNED) |

---

## CL.5 Cards & Inline Components (5)

| # | Component | Where used | Key details |
|---|-----------|-----------|-------------|
| 1 | **TransactionCard** | Dashboard, History, Batch Review | Merchant, date/time, total, category emoji, city. Click → edit. Long-press → select. |
| 2 | **AggregatedItemCard** | Items (aggregated mode) | Grouped by name+merchant. Total spent, purchase count, avg price, transaction count badge. |
| 3 | **ItemCard** | Items (duplicate mode) | Single item. Price, merchant, date, qty, city+flag, subcategory. |
| 4 | **InsightCard** | Insights | Icon (36x36), title, message, date, ChevronRight. Long-press → selection. |
| 5 | **ReportRow** | Reports | Unread dot, logo circle, "Semana N", amount, trend (ChevronUp/Down + %), transaction count badge. |

---

## CL.6 Headers & Navigation (4 variants)

| # | Variant | Layout | When |
|---|---------|--------|------|
| 1 | **Home** | Logo wordmark + Profile avatar + credit badges | Dashboard |
| 2 | **Detail** | Back + Title + Profile avatar | History, Items, Trends, Insights, Reports |
| 3 | **Settings** | Back + "Configuracion" breadcrumb | Settings + subviews |
| 4 | **Group** (Epic 19) | Back + Group icon + Name + ⋮ options + Avatar | Group views |

**Profile Dropdown (from avatar click):**
- User name + email
- Menu: Transactions → history | Productos → items | Reports → reports | Goals → DISABLED "Coming Soon"
- Footer: Settings → settings

---

## CL.7 Filter Components (5)

| # | Component | Where used | Description |
|---|-----------|-----------|-------------|
| 1 | **TemporalFilterDropdown** | History, Items | Date range picker with swipe (months/years) |
| 2 | **CategoryFilterDropdown** | History | Multi-select category chips |
| 3 | **LocationFilterDropdown** | History | Country/city selector |
| 4 | **IconFilterBar** | History, Trends | Quick icon-based category filter row |
| 5 | **FilterChips** | History, Items | Removable active filter pills + "Clear all" |

---

## CL.8 Error & Empty States (7)

| # | Component | View | Description |
|---|-----------|------|-------------|
| 1 | **ScanError** | Scan | Error type icon (WifiOff/Clock/AlertCircle/AlertTriangle) + "Algo salio mal" + Retry/Cancel |
| 2 | **ErrorState (batch)** | Batch Review | Batch processing error |
| 3 | **EmptyState (batch)** | Batch Review | No receipts message |
| 4 | **HistoryEmptyStates** | History | Two variants: no transactions (+ scan CTA) / no matching filters |
| 5 | **ItemsViewEmptyState** | Items | Lightbulb icon + "Agrega gastos..." |
| 6 | **AppErrorBoundary** | Any | Full-page fallback: error icon + message + Reload button |
| 7 | **Insights empty** | Insights | "No insights yet" + "Scan more receipts" / "Try different filter" |
