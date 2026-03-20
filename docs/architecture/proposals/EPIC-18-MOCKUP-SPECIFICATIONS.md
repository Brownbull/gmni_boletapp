# Epic 18: Credit Card Statement Scanning — Mockup Specifications

**Purpose:** Design reference for creating all UI mockups needed for Epic 18.
**Architecture:** `docs/architecture/proposals/implemented/EPIC-18-CREDIT-CARD-STATEMENT-SCANNING.md` (V5)
**Dark mode rule:** Every screen MUST be mockup'd in BOTH light and dark variants.

---

## 1. Design System Quick Reference

### Color Tokens
```
TOKEN                LIGHT                   DARK
--primary            #4a7c59                 (inverted)
--secondary          #5b8fa8                 (inverted)
--accent             #e8a87c                 (inverted)
--success            #22c55e                 #22c55e
--warning            #f59e0b                 #f59e0b
--error              #ef4444                 #ef4444
--bg                 #f5f0e8                 #0f172a
--surface            #ffffff                 #1e293b
--bg-tertiary        #f1dbb1                 #334155
--text-primary       #2d3a4a                 #e2e8f0
--text-secondary     #4a5568                 #94a3b8
--border-light       peach tones             #475569
```

**Dark mode patterns for NEW elements:**
- Banners: light `-50` shade, dark `-900/30` (e.g., `blue-50` / `blue-900/30`)
- ChargeType badges: light `-100` shade, dark `-900/30`
- Locked/disabled fields: light `opacity-60`, dark `opacity-40`

### Layout Constraints
- Max width: 448px (`max-w-md`), touch targets: min 44px, padding: 12-16px
- Safe areas: notch top + home indicator bottom, fixed bottom nav: 80px + safe
- Font: Outfit. Icons: Lucide React only.
- Rounding: cards `rounded-lg/xl`, modals `rounded-2xl`, buttons `rounded-xl`, badges `rounded-full`
- Z-layers: Base 0 | Overlay z-40 | Modal z-50 | Scan menu z-90/95 | QuickSave z-100

### Amount Formatting Rule
Always use Chilean peso locale (`es-CL`): `$12.500` (dot thousands, no decimals). Never abbreviate (no "$12.5K"). Apply consistently in all wireframes and implementations.

### Screen Transitions
- Forward navigation (upload→processing→review→matching): **slide-in from right** (300ms, ease-out)
- Back navigation: **slide-out to right** (300ms, ease-in)
- Modal open/close: **fade + scale** (200ms)
- Processing overlay: **fade-in** (300ms), ready→review: **crossfade** (500ms)

---

## 2. User Flows

### Flow A: Statement Upload (Happy Path)
```
[Home] → Long-press scan FAB
→ [Scan Mode Selector] → Tap "Credit Card Statement"
→ [Statement Upload View] → Select PDF file
  → IF first time: [Consent Dialog] → Accept
  → IF PDF hash exists: [Re-import Prompt] → "Import Again" or Cancel
→ Upload PDF to Storage → Call queueStatementScan
→ [Processing Overlay] (async, Firestore listener)
  → IF encryption error: [Password Dialog] → Enter → Re-queue
→ [Statement Review List] → Review extracted transactions
  → IF 0 transactions: [Empty State] → "No transactions found. Try a different PDF."
→ Tap "Continue to Matching"
  → IF user has 0 existing transactions: Skip matching → go straight to "Save All as New"
→ [Matching Review View] → Approve/Reject/Create per transaction
  → IF amount differs: [Amount Conflict Dialog] → Pick amount
  → IF no match: [Transaction Search Dialog] → Pick or Create New
→ Tap "Save All" → [Success Toast] → Return to Home
```

### Flow B: Async Resilience + Pending Indicator
```
[Processing Overlay] → User navigates away
→ [Any Screen] → Small pulsing dot on scan FAB (violet, 8px) indicates pending scan
→ User taps FAB → [Resume Processing Overlay or Review]
→ OR: App restart → detect pending_statement_scans doc → show resume banner at top:
  "Statement scan in progress — tap to view" (dismissible, tapping opens overlay/review)
```

### Flow C: Re-import Detection
```
[Upload View] → Select same PDF → PDF hash matches Storage
→ [Re-import Prompt] — shows "This statement was previously imported" (no date — see note)
  → "Cancel" → No credit deducted, return to upload
  → "Import Again" → Proceed (matching finds already-verified txns)
→ [Matching Review] → Banner: "X transactions already verified"
  → All verified → [Empty Match State]: "All transactions already imported. Nothing new to match."
```
**Note:** Re-import prompt does NOT show import date (Storage hash check has no timestamp metadata). Text says "previously imported" without a date.

### Flow D: Verified Transaction in Editor
```
[Transaction List] → Tap verified transaction (shows small ✓ badge on card)
→ [Editor] → ALL fields disabled + Lock Banner
→ "Unlock and Break Verification" → [Confirmation Dialog]
  → Confirm → Fields re-enabled, statementVerified=false
  → Cancel → Remain locked
```

### Flow E: Back Navigation (Decision Tree)
```
Review List ← Back → [Confirm Abandon Dialog]:
  "Abandon this import? You can re-scan later (no additional credit)."
  → "Abandon" → Delete pending doc, return to Home (credit already used, no refund)
  → "Stay" → Remain on Review List

Matching Review ← Back → Return to Review List (decisions PRESERVED in store)
  → User can tap "Continue to Matching" again to resume where they left off
```

---

## 3. Screen Specifications

### 3.1 Scan Mode Selector (MODIFY existing)

**Component:** `src/features/scan/components/ScanModeSelector.tsx`
**Change:** Remove "Coming Soon" badge from statement option. Replace with amber super credit badge (same as batch: lightning bolt + "1").
**testids:** `scan-mode-selector`, `scan-mode-statement`

Statement mode: violet gradient (`violet-400 to violet-600`), CreditCard icon, label "Estado de Cuenta" / "Statement", description "Importar estado de cuenta" / "Import credit card statement"

### 3.2 Statement Upload View (NEW)

**Entry:** After selecting statement from scan mode selector.
**Layout:** Full-screen, centered content, below header, above nav.

```
┌───────────────────────────┐
│ ← Back        "Statement" │
├───────────────────────────┤
│      [CreditCard icon]    │  64x64, violet gradient circle
│   "Upload Credit Card     │  text-lg font-semibold
│    Statement"             │
│   "Select a PDF file"    │  text-sm text-secondary
│                           │
│  [ 📄 Select PDF File ]  │  Primary button, var(--primary)
│   Max 7MB, single month  │  text-xs text-secondary
│                           │
│  ┌ ℹ Statements >150   ┐ │  Info box: bg-tertiary, rounded-xl
│  │ txns may have lower  │ │  text-xs, p-3
│  │ accuracy             │ │
│  └──────────────────────┘ │
│  ⚡ 1 Super Credit        │  Amber text (intentional: reinforces
│                           │  ScanModeSelector badge for clarity)
└───────────────────────────┘
```

**States:** idle | file-selected (show filename+size, button→"Upload & Analyze") | uploading (spinner) | error (red toast)
**testids:** `statement-upload-view`, `statement-select-pdf-button`, `statement-upload-button`, `statement-file-info`

### 3.3 Consent Dialog (NEW)

**Trigger:** First-time statement upload, after file selection, before upload.
**Pattern:** ConfirmationDialog (shared). NOT shown after first acceptance.

Content: Shield icon (blue circle) + "Your statement PDF will be sent to Google AI (Gemini) for processing." Two bullets: (1) "Google does not use your data for model training (paid API)" (2) "Data may be retained briefly for abuse detection only". Link: "Terms" → `https://ai.google.dev/gemini-api/terms` (underline, var(--secondary)).
Buttons: Cancel (secondary) | "I Accept" (primary, var(--primary)).
**testids:** `statement-consent-dialog`, `statement-consent-accept`, `statement-consent-cancel`

### 3.4 Password Dialog (NEW)

**Trigger:** processStatementScan returns encryption error.
**Pattern:** ConfirmationDialog + form input.

Content: Lock icon (amber circle) + "This PDF is password-protected" + password input (type="password", autoFocus, **inputMode="text"** — bank passwords may be alphanumeric, not just numeric).
**States:** default | submitting (input disabled, spinner) | wrong-password (red error below input, input cleared, re-focused)
Buttons: Cancel | "Decrypt" (primary).
**testids:** `statement-password-dialog`, `statement-password-input`, `statement-password-submit`, `statement-password-error`

### 3.5 Processing Overlay (NEW)

**Pattern:** Reuse ScanOverlay visual. Connected via Firestore listener (async).

**Phase 1 — "Uploading":** Circular progress ring (determinate), Upload icon pulsing, "Subiendo estado de cuenta..."
**Phase 2 — "Analyzing":** Indeterminate spinner (25% arc, 1.5s rotate), Loader2 spinning, "Analizando estado de cuenta...", subtitle "Esto puede tomar hasta 90 segundos", tip below: "Puedes navegar mientras se procesa" with Info icon
**Phase 3 — "Ready":** Green checkmark bounce, "87 transacciones extraidas", auto-transition to review (1.5s)
**Error:** Red AlertCircle, error message, buttons: "Reintentar" (re-queue) | "Cancelar" (delete pending, refund credit)

**testids:** `statement-processing-overlay`, `statement-processing-status`, `statement-processing-retry`, `statement-processing-cancel`

### 3.6 Review List (NEW)

**Entry:** After processing completes. Shows pre-transformed transactions.
**Layout:** Full-screen scrollable (virtualized via react-window for 80+ items).

```
┌───────────────────────────┐
│ ← Back  "Review Statement"│
├───────────────────────────┤
│ ┌─ Summary ─────────────┐ │  rounded-xl, var(--surface)
│ │ CMR Falabella Mar 2026 │ │
│ │ 87 txns  $1.234.567   │ │  Count + amount (es-CL format)
│ │ ⚠ Confidence: 85%     │ │  Amber if <70%
│ │ ✓ Total verified (2.1%)│ │  Green if ≤5%, red if >5%
│ └────────────────────────┘ │
│                           │  Warning banners (conditional):
│ [Low confidence banner]   │  amber bg if confidence <0.7
│ [Total mismatch banner]   │  red bg if deviation >5%
│ [Large statement banner]  │  info bg if count >150
│                           │
│ ┌ TITULAR ──────────────┐ │  Section divider: ONLY if >1
│ └────────────────────────┘ │  cardholder. Hidden if titular only.
│ [StatementTransactionCard] │  (see 3.7, repeated)
│ [StatementTransactionCard] │
│ ...                       │
│ ┌ ADICIONAL: M.GONZALEZ ┐ │  Shows cardHolderName
│ └────────────────────────┘ │
│ [StatementTransactionCard] │
├───────────────────────────┤
│ [ Continue to Matching ]  │  Primary, sticky bottom
└───────────────────────────┘
```

**Empty state (0 transactions extracted):**
```
┌───────────────────────────┐
│ [FileX icon, 64px, gray]  │
│ "No transactions found"   │  text-lg font-semibold
│ "The statement could not  │  text-sm text-secondary
│  be processed. Try a      │
│  different PDF or retry." │
│ [ Retry ] [ Back ]        │  Primary | Secondary
└───────────────────────────┘
```

**testids:** `statement-review-list`, `statement-review-summary`, `statement-review-confidence-warning`, `statement-review-total-warning`, `statement-review-continue-button`, `statement-review-empty`

### 3.7 Statement Transaction Card (NEW)

Simplified TransactionCard (no thumbnail, no expand). Used in Review List and Match Cards.

```
┌──────────────────────────────────┐
│ UBER EATS                $12.500 │  Merchant (category-colored) + Amount
│ 15 Mar  [Compra] Santiago, CL   │  Date + ChargeType badge + Location
│ Cuota 3 de 12                    │  Installment pill (if present)
└──────────────────────────────────┘
```

**ChargeType badge colors (light / dark):**
| Type | ES Label | Light bg | Dark bg |
|------|----------|----------|---------|
| purchase | Compra | emerald-100 | emerald-900/30 |
| interest | Interes | red-100 | red-900/30 |
| fee | Comision | amber-100 | amber-900/30 |
| insurance | Seguro | blue-100 | blue-900/30 |
| transfer | Transferencia | violet-100 | violet-900/30 |
| adjustment | Ajuste | gray-100 | gray-800 |
| other | Otro | gray-100 | gray-800 |

Badge: `rounded-full px-2 py-0.5 text-xs`. Location: MapPin icon (size-12), only if present. Installment pill: `bg-tertiary`. CardHolder: small Person icon if additional (tooltip with name).
Card: `rounded-lg border p-3 gap-1`, bg `var(--surface)`, border `var(--border-light)`.
**testids:** `statement-transaction-card`, `statement-card-merchant`, `statement-card-amount`, `statement-card-chargetype`, `statement-card-installment`

### 3.8 Matching Review View (NEW)

**Entry:** After "Continue to Matching". Skipped entirely if user has 0 existing transactions (go straight to Save All as New).

```
┌───────────────────────────┐
│ ← Back     "Match Results"│
├───────────────────────────┤
│ ┌─ Pre-decision Summary ─┐│  Counts BEFORE user decisions:
│ │ 🔗 45 proposed matches  ││  Green
│ │ ❓ 12 no match found    ││  Amber
│ │ ✓ 5 already verified   ││  Gray (skipped)
│ └────────────────────────┘│
│                           │
│ [Re-import banner]        │  "5 txns already verified, skipped"
│                           │
│ ═ HIGH CONFIDENCE ════════│  Green accent line
│ [MatchCard]               │  (see 3.9)
│ [MatchCard]               │
│ ═ MEDIUM CONFIDENCE ═════ │  Amber accent line
│ [MatchCard]               │
│ ═ LOW CONFIDENCE ═════════│  Red accent line
│ [MatchCard]               │
│ ═ NO MATCH ═══════════════│  Gray accent line
│ [MatchCard (no-match)]    │
│ ...                       │  Virtualized (react-window)
├───────────────────────────┤
│ [ Save: 40 merges +      │  Sticky bottom, primary button
│   12 new transactions ]   │  Shows breakdown, not just total
└───────────────────────────┘
```

**Section 0 — Already Verified:** Gray, collapsed by default, "X already imported, skipped."

**Loading state:** Centered spinner with "Matching transactions..." text while algorithm runs.
**Saving state:** Button shows spinner + "Saving..." (disabled), all cards locked.
**All-verified empty state:** "All transactions from this statement are already imported. Nothing new to match." with checkmark icon + "Done" button → return to Home.

**testids:** `matching-review-view`, `matching-summary`, `matching-reimport-banner`, `matching-section-high/medium/low/none`, `matching-save-all-button`, `matching-empty-state`

### 3.9 Match Card (NEW)

**Matched variant:**
```
┌──────────────────────────────┐
│ STATEMENT TRANSACTION        │  text-xs uppercase, text-secondary
│ [StatementTransactionCard]   │  Compact (see 3.7)
│ ── 🔗 MATCHED TO ──         │  Divider
│ EXISTING TRANSACTION         │
│ [TransactionCard compact]    │  With thumbnail + item count
│ Confidence: ●●●○ HIGH       │  Dots: filled=green, empty=gray
│                              │
│ [✓ Merge] [✗ New] [🔍 Pick] │  3 equal-width buttons
│         [↩ Undo]             │  Small link below, shown AFTER decision
└──────────────────────────────┘
```

**Button behavior:**
- Merge (✓): green outline → if amounts differ, opens AmountConflictDialog first
- New (✗): amber outline → reject match, create new transaction
- Pick (🔍): blue outline → open TransactionSearchDialog
- **After decision:** selected button fills, others fade to opacity-30, **"Undo" link appears** below buttons (resets card to pending-decision state)

**No-match variant:**
```
┌──────────────────────────────┐
│ STATEMENT TRANSACTION        │
│ [StatementTransactionCard]   │
│ ⓘ No matching transaction   │  Gray text with info icon
│ [🔍 Search] [+ Create New]  │  2 buttons
│         [↩ Undo]             │  After decision
└──────────────────────────────┘
```

**testids:** `match-card`, `match-card-approve`, `match-card-reject`, `match-card-pick`, `match-card-search`, `match-card-create-new`, `match-card-undo`, `match-card-confidence`

### 3.10 Transaction Search Dialog (NEW)

**Trigger:** "Pick" or "Search" on a MatchCard. Full-screen modal.

Search input (autoFocus) + date range subtitle (from statement period) + filtered TransactionCard list. Cards with matching amount highlighted (border: var(--success)). Empty state: "No results. Refine search or create new."
Buttons: "Select & Match" (primary, disabled until selected) | "Create New Instead" (secondary).
**testids:** `transaction-search-dialog`, `transaction-search-input`, `transaction-search-select`, `transaction-search-create-new`

### 3.11 Amount Conflict Dialog (NEW)

**Trigger:** Approve match with differing amounts. ConfirmationDialog pattern.

AlertTriangle icon (amber) + "The receipt total differs from the statement amount." Two side-by-side cards: Receipt ($X, "3 items") | Statement ($Y, "Bank"). Radio: "Receipt ($X)" / "Statement ($Y)" — **statement pre-selected** (V2: bank number is authoritative). Buttons: Cancel | Confirm.
**testids:** `amount-conflict-dialog`, `amount-conflict-receipt-option`, `amount-conflict-statement-option`, `amount-conflict-confirm`

### 3.12 Re-import Prompt (NEW)

**Trigger:** PDF hash exists in Storage. ConfirmationDialog.

FileCheck icon (blue) + "This statement was previously imported." (NO date — Storage hash has no timestamp). "Import again? (1 super credit)". Buttons: Cancel (no credit) | "Import Again" (primary).
**testids:** `reimport-prompt-dialog`, `reimport-cancel`, `reimport-confirm`

### 3.13 Pending Scan Indicator (NEW)

**While navigating away during async processing:**
- Small pulsing dot on scan FAB: 8px circle, `bg-violet-500`, CSS `animate-pulse` (1s infinite)
- Position: top-right of FAB button

**On app restart with pending scan:**
- Sticky banner at top of screen (below header): "Statement scan in progress — tap to view"
- bg: `violet-50` / dark: `violet-900/30`, text-sm, dismissible (X button), tap opens overlay/review
**testids:** `pending-scan-indicator`, `pending-scan-banner`, `pending-scan-banner-dismiss`

### 3.14 TransactionCard — Verified Indicator (MODIFY existing)

**Component:** `src/components/transactions/TransactionCard.tsx`
**Change:** When `statementVerified=true`, show small verified badge on the card in list views (Home, History).

Position: Next to the amount (right-aligned), small green checkmark circle (16x16, `bg-success/20`, Check icon size-10).
Also: When `source='statement_scan'` and no thumbnail, show CreditCard icon placeholder (violet gradient) instead of generic gradient placeholder. This visually distinguishes statement-sourced transactions from receipt-scanned ones.
**testids:** `transaction-card-verified-badge`, `transaction-card-statement-placeholder`

### 3.15 Transaction Editor — New Fields + Lock Mode (MODIFY existing)

**Component:** `src/features/transaction-editor/views/TransactionEditorViewInternal.tsx`

#### A) Source + Verified Badges (always visible, below merchant name)

Source pill: `receipt_scan` → "🧾 Receipt" gray bg | `statement_scan` → "💳 Statement" violet bg | `manual` → "✏ Manual" gray bg | undefined → hidden.
Verified pill: `statementVerified=true` → "✓ Verified" green bg, white text | else hidden.

#### B) Advanced Section (collapsed by default, below items, above save button)

```
▶ Advanced Fields  (tap to expand)
├ Charge Type:    [Compra         ▼]  CategoryCombobox pattern
├ Installments:   [3] de [12]         Two number inputs, hidden if empty
├ Recurrence:     [Monthly        ▼]  Dropdown (6 options)
├ Card Holder:    ○ Titular ● Adicional
│                 [Maria Gonzalez]     Name input, shown if "additional"
```

#### C) Hard Lock Mode (statementVerified=true)

```
┌───────────────────────────┐
│ 🔒 Verified against       │  Lock banner: blue-50/blue-900/30
│ credit card statement     │  rounded-xl, p-3
│ on March 15, 2026         │
│ [Unlock and Break         │  Destructive: text-sm, red, underline
│  Verification]            │
├───────────────────────────┤
│ 💳 Statement ✓ Verified   │  Badges visible
│ UBER EATS      ░░░░░░░░  │  ALL fields: disabled + opacity-60/40
│ $12.500        ░░░░░░░░  │  Save button: hidden
│ ...                       │
└───────────────────────────┘
```

**Unlock Confirmation:** Unlock icon (red circle) + "This will break the statement verification. You'll need to re-match from a future import." Buttons: Cancel | "Unlock" (destructive red bg).

**testids:** `editor-advanced-section`, `editor-advanced-toggle`, `editor-chargetype-select`, `editor-installment-current`, `editor-installment-total`, `editor-recurrence-select`, `editor-cardholder-type-titular`, `editor-cardholder-type-additional`, `editor-cardholder-name`, `editor-source-badge`, `editor-verified-badge`, `editor-lock-banner`, `editor-unlock-button`, `editor-unlock-confirm-dialog`, `editor-unlock-confirm`

---

## 4. Component Inventory

### New Components (16)
| Component | Story | Pattern |
|-----------|-------|---------|
| StatementUploadView | 18-4 | Custom view |
| StatementConsentDialog | 18-4 | ConfirmationDialog |
| StatementPasswordDialog | 18-4 | ConfirmationDialog + input |
| StatementProcessingOverlay | 18-4 | ScanOverlay |
| StatementReviewList | 18-4 | Virtualized list (react-window) |
| StatementTransactionCard | 18-4 | Simplified TransactionCard |
| MatchingReviewView | 18-10b | Virtualized list + sections |
| MatchCard | 18-10b | Custom card |
| TransactionSearchDialog | 18-10b | Full-screen modal + list |
| AmountConflictDialog | 18-10b | ConfirmationDialog + comparison |
| ReimportPrompt | 18-4 | ConfirmationDialog |
| PendingScanIndicator | 18-4 | FAB dot + resume banner |
| ChargeTypeSelector | 18-6 | CategoryCombobox pattern |
| InstallmentFields | 18-6 | Two number inputs |
| RecurrenceSelector | 18-6 | Dropdown |
| CardHolderSection | 18-6 | Radio + conditional input |

### Modified Components (5)
| Component | Story | Change |
|-----------|-------|--------|
| ScanModeSelector | 18-4 | Remove "Coming Soon", add credit badge |
| TransactionCard | 18-6 | Add verified badge + statement placeholder icon |
| TransactionEditorView | 18-6 | Add Advanced section, badges, lock mode |
| ModalManager | 18-4, 18-10b | Register new modals |
| translations.ts | All | Add ES/EN strings for all new elements |

---

## 5. Interaction States

| Screen | States |
|--------|--------|
| Upload View | idle, file-selected, uploading, error |
| Consent Dialog | shown (first-time only), hidden |
| Password Dialog | default, submitting, wrong-password |
| Processing Overlay | uploading, analyzing, ready, error |
| Review List | loading, populated, empty (0 txns), warnings |
| Matching Review | loading, populated, all-verified, saving |
| Match Card | pending-decision, approved, rejected, picked, undone |
| Search Dialog | idle, searching, results, no-results, selected |
| Amount Conflict | default (statement pre-selected), confirmed |
| Editor Lock | locked, unlocking (confirmation), unlocked |
| Re-import Prompt | shown (hash match) |
| Pending Indicator | dot-on-FAB, resume-banner |

---

## 6. Accessibility

- All modals: focus trap, ESC close, ARIA labels
- All buttons: minimum 44px touch target
- All inputs: associated labels, errors via aria-describedby
- Virtualized lists: ARIA roles (list/listitem)
- Confidence: NOT color-only (dots + text labels alongside color)
- Lock banner: `role="alert"`
- Toasts: `aria-live="polite"` (success) / `aria-live="assertive"` (error)

---

## 7. Translation Keys

All strings ES (primary) + EN (secondary):
- **Upload:** title, subtitle, buttons, file info, credit cost, disclaimer
- **Consent:** disclosure title, bullets, terms link text, buttons
- **Password:** title, message, placeholder, error, buttons
- **Processing:** phase labels (3), timing hint, error messages, nav tip
- **Review:** summary labels, confidence/deviation/count warnings, section headers, buttons, empty state
- **Matching:** section headers (5), action buttons (merge/reject/pick/search/create/undo), summary counts (proposed/unmatched/verified), re-import banner, save button (with breakdown), empty state, loading, saving
- **Amount Conflict:** title, message, option labels, buttons
- **Editor fields:** chargeType (7 values), recurrence (6 values), installment label, cardholder labels (2), source labels (3), verified label
- **Lock mode:** banner text, unlock button, confirmation text
- **Re-import:** title, message (no date), buttons
- **Pending indicator:** banner text, dismiss label
