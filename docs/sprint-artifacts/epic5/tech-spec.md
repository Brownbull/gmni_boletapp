# Epic 5 Technical Specification: Data Download & Export

**Date:** 2025-12-02
**Epic:** 5 - Data Download & Export
**Author:** Gabe (with AI facilitation)
**Status:** Ready for Implementation

---

## Executive Summary

Epic 5 adds data export capabilities to Boletapp with two distinct features:
1. **Basic Data Export** (all users) - Download minimal transaction data from Settings for compliance/data portability
2. **Premium Analytics Export** (Pro/Max subscribers) - Context-aware download from TrendsView with full details or yearly statistics

This is a **client-side feature** - no Cloud Functions required. All CSV generation happens in the browser using existing patterns.

---

## Architecture Decisions

### ADR-010: Client-Side CSV Export Strategy

**Decision:** All export functionality runs client-side using browser APIs
**Context:** PRD requires exports complete in <3 seconds for up to 10,000 transactions
**Date:** 2025-12-02

**Rationale:**
- Existing `src/utils/csv.ts` already implements browser-based CSV export
- Client-side avoids Cloud Function latency and costs
- Transaction data already loaded in React state via `useTransactions` hook
- Browser Blob API handles UTF-8 encoding and file download natively

**Consequences:**
- ✅ Zero server costs for export feature
- ✅ Instant export (data already in memory)
- ✅ Works offline (if data cached)
- ⚠️ Large datasets (50K+ transactions) may cause browser slowdown
- ⚠️ No server-side audit trail of exports

**Status:** Accepted

---

### ADR-011: Subscription Gating Mock Strategy

**Decision:** Create mock subscription infrastructure designed for Epic 7 replacement
**Context:** Epic 7 (Subscriptions) not yet implemented, but premium features need gating
**Date:** 2025-12-02

**Rationale:**
- PRD explicitly requires mock returning `true` during testing phase
- Single point of change pattern minimizes future refactoring
- TypeScript types enforce consistent tier handling across codebase

**Implementation:**
```typescript
// src/utils/subscription.ts
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'max';

// TODO: Epic 7 - Replace with actual Firestore subscription check
export function getSubscriptionTier(): SubscriptionTier {
  return 'max'; // Mock: all users have max access during testing
}

export function canAccessPremiumExport(): boolean {
  const tier = getSubscriptionTier();
  return tier === 'pro' || tier === 'max';
}
```

**Consequences:**
- ✅ All users can test premium features now
- ✅ Single file to update when Epic 7 lands
- ✅ Type safety prevents tier string typos
- ⚠️ No actual paywall during testing (by design)

**Status:** Accepted

---

### ADR-012: Export Type Detection via View Granularity

**Decision:** Detect export type (transactions vs statistics) based on TrendsView granularity state
**Context:** PRD requires context-aware download behavior based on current analytics view
**Date:** 2025-12-02

**Detection Logic:**
| View State | Export Type | Data Scope |
|------------|-------------|------------|
| `selectedMonth` is set | Transactions | Current month's transactions |
| `selectedMonth` is null, year view | Statistics | Yearly aggregated data |

**Implementation:**
```typescript
// In TrendsView.tsx
const exportType = selectedMonth ? 'transactions' : 'statistics';
const downloadIcon = exportType === 'transactions' ? <FileText /> : <BarChart2 />;
```

**Consequences:**
- ✅ No additional state needed - uses existing `selectedMonth`
- ✅ Icon visually indicates what user will download
- ✅ Simple conditional logic
- ⚠️ Week/day views still export full month (by PRD design)

**Status:** Accepted

---

## Technology Decisions

### CSV Generation

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Library | Native Browser APIs | No dependencies, existing pattern in csv.ts |
| Encoding | UTF-8 with BOM | Excel compatibility for international characters |
| Date Format | YYYY-MM-DD | ISO 8601, Excel-compatible |
| Numbers | Raw (no symbols) | 1234.56 not $1,234.56 for spreadsheet formulas |
| Quoting | RFC 4180 | Quote strings with commas, escape internal quotes |

### File Naming Convention

| Export Type | Filename Pattern | Example |
|-------------|------------------|---------|
| Basic (Settings) | `boletapp-data-export-{date}.csv` | `boletapp-data-export-2025-12-02.csv` |
| Transactions | `boletapp-transactions-{year}-{month}.csv` | `boletapp-transactions-2025-12.csv` |
| Statistics | `boletapp-statistics-{year}.csv` | `boletapp-statistics-2025.csv` |

---

## Data Architecture

### Basic Export Schema (Settings - All Users)

**Purpose:** Data portability compliance - minimal fields only

| Column | Type | Source | Example |
|--------|------|--------|---------|
| Date | string | `transaction.date` | 2025-12-02 |
| Total | number | `transaction.total` | 45.99 |
| Merchant | string | `transaction.merchant` | Walmart |

**Query:** All user transactions (no date filter)

### Transaction Export Schema (Premium - Month/Week/Day)

**Purpose:** Rich data for external analysis tools

| Column | Type | Source | Example |
|--------|------|--------|---------|
| Date | string | `transaction.date` | 2025-12-02 |
| Merchant | string | `transaction.merchant` | Walmart |
| Alias | string | `transaction.alias` | Weekly Groceries |
| Category | string | `transaction.category` | Supermarket |
| Total | number | `transaction.total` | 45.99 |
| Item Count | number | `transaction.items.length` | 12 |
| Receipt ID | string | `transaction.id` | abc123xyz |
| Has Image | boolean | `hasTransactionImages()` | true |

**Query:** Transactions where `date` starts with current `selectedYear-selectedMonth`

### Statistics Export Schema (Premium - Quarter/Year)

**Purpose:** Aggregated spending insights

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| Month | string | YYYY-MM format | 2025-01 |
| Category | string | Store category | Supermarket |
| Total | number | Sum for category in month | 523.45 |
| Transaction Count | number | Number of transactions | 8 |
| Percentage | number | % of monthly total | 34.2 |

**Aggregation Logic:**
```typescript
// Group by month, then by category
const stats = transactions.reduce((acc, t) => {
  const month = t.date.substring(0, 7); // YYYY-MM
  const key = `${month}-${t.category}`;
  // ... aggregate totals
}, {});
```

---

## Component Architecture

### New Files to Create

```
src/
├── utils/
│   ├── csvExport.ts          # NEW: Enhanced CSV generation (extends csv.ts)
│   └── subscription.ts       # NEW: Subscription tier utilities
├── hooks/
│   └── useSubscriptionTier.ts  # NEW: React hook for tier access
└── components/
    └── UpgradePromptModal.tsx  # NEW: Premium upgrade prompt
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/views/SettingsView.tsx` | Update existing export button to use new basic export logic |
| `src/views/TrendsView.tsx` | Add download icon with context-aware behavior |
| `src/utils/translations.ts` | Add export-related strings |

### Component Hierarchy (Epic 5 additions)

```
App.tsx
├── SettingsView.tsx
│   └── [Basic Export Button] → csvExport.downloadBasicData()
│
├── TrendsView.tsx
│   ├── [Download Icon] → context-aware export
│   │   ├── if selectedMonth → downloadTransactions()
│   │   └── if yearView → downloadStatistics()
│   │
│   └── UpgradePromptModal (if !canAccessPremiumExport())
│
└── (No changes to other views)
```

---

## API Contracts

### csvExport.ts Functions

```typescript
/**
 * Generate CSV content from data array
 */
export function generateCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string }[]
): string;

/**
 * Trigger browser file download
 */
export function downloadCSV(content: string, filename: string): void;

/**
 * Basic export: all transactions with minimal fields
 */
export function downloadBasicData(transactions: Transaction[]): void;

/**
 * Premium transaction export: current month with full details
 */
export function downloadTransactions(
  transactions: Transaction[],
  year: string,
  month: string
): void;

/**
 * Premium statistics export: yearly aggregated data
 */
export function downloadStatistics(
  transactions: Transaction[],
  year: string
): void;
```

### subscription.ts Functions

```typescript
/**
 * Get current user's subscription tier
 * TODO: Epic 7 - Replace with Firestore check
 */
export function getSubscriptionTier(): SubscriptionTier;

/**
 * Check if user can access premium export features
 */
export function canAccessPremiumExport(): boolean;
```

### useSubscriptionTier.ts Hook

```typescript
/**
 * React hook for subscription tier access
 * Returns tier and permission flags
 */
export function useSubscriptionTier(): {
  tier: SubscriptionTier;
  canAccessPremiumExport: boolean;
  isPro: boolean;
  isMax: boolean;
};
```

---

## Implementation Patterns

### CSV Generation Pattern

```typescript
// Pattern: RFC 4180 compliant CSV
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Quote if contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCSV<T>(data: T[], columns: Column[]): string {
  const header = columns.map(c => c.header).join(',');
  const rows = data.map(row =>
    columns.map(c => escapeCSVValue(row[c.key])).join(',')
  );
  // UTF-8 BOM for Excel compatibility
  return '\ufeff' + [header, ...rows].join('\n');
}
```

### Download Trigger Pattern

```typescript
// Pattern: Browser download API
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url); // Clean up
}
```

### Loading State Pattern

```typescript
// Pattern: Non-blocking export with loading indicator
const [exporting, setExporting] = useState(false);

const handleExport = async () => {
  setExporting(true);
  try {
    // Use requestAnimationFrame to allow UI update before heavy work
    await new Promise(resolve => requestAnimationFrame(resolve));
    downloadTransactions(transactions, year, month);
    // Show success toast
  } finally {
    setExporting(false);
  }
};
```

---

## Error Handling

| Scenario | Handling | User Message |
|----------|----------|--------------|
| No transactions | Prevent download | "No transactions to export" |
| Empty month | Prevent download | "No transactions for selected period" |
| Browser blocks download | Catch error | "Download blocked. Check browser settings." |
| Large dataset (>10K) | Warning before proceed | "Exporting {n} transactions may take a moment" |

---

## Testing Strategy

### Unit Tests (csvExport.ts)

| Test | Description |
|------|-------------|
| `escapeCSVValue` handles nulls | Returns empty string for null/undefined |
| `escapeCSVValue` quotes commas | `"hello, world"` → `"\"hello, world\""` |
| `escapeCSVValue` escapes quotes | `say "hi"` → `"say ""hi"""` |
| `generateCSV` includes header | First row is column headers |
| `generateCSV` includes BOM | Content starts with UTF-8 BOM |
| `downloadBasicData` filters fields | Only date, total, merchant |

### Unit Tests (subscription.ts)

| Test | Description |
|------|-------------|
| `getSubscriptionTier` returns tier | Returns 'max' during mock phase |
| `canAccessPremiumExport` returns boolean | Returns true for pro/max |

### Integration Tests

| Test | Description |
|------|-------------|
| Basic export from Settings | Click button → CSV downloads |
| Transaction export from TrendsView | Month view → click icon → CSV downloads |
| Statistics export from TrendsView | Year view → click icon → CSV downloads |
| Upgrade prompt for non-subscribers | Mock free tier → click → modal shows |

### E2E Tests (Playwright)

| Test | Description |
|------|-------------|
| Full basic export flow | Login → Settings → Export → Verify file |
| Full premium export flow | Login → Trends → Month → Export → Verify file |
| Upgrade prompt dismissal | Show prompt → click X → modal closes |

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Download button label | `aria-label="Download all your data as CSV"` |
| Loading state announcement | `aria-busy="true"` during export |
| Icon-only button | `aria-label="Download transactions"` or `"Download statistics"` |
| Modal focus trap | Focus stays in UpgradePromptModal when open |
| Keyboard accessible | All buttons reachable via Tab, activated via Enter/Space |

---

## Performance Considerations

| Metric | Target | Implementation |
|--------|--------|----------------|
| Basic export (10K txns) | <2 seconds | Single pass array map |
| Transaction export (1 month) | <3 seconds | Filter + map (typically <500 txns) |
| Statistics export (1 year) | <2 seconds | Reduce aggregation (12 months) |
| Memory usage | No spike | Stream-like processing, immediate download |

**Large Dataset Handling:**
```typescript
// For future: chunk processing for very large datasets
const CHUNK_SIZE = 1000;
if (transactions.length > CHUNK_SIZE * 10) {
  // Show warning and process in chunks
}
```

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Data exposure | Users can only export their own data (Firestore rules) |
| Sensitive fields | No passwords/tokens in export (not stored anyway) |
| File injection | Proper CSV escaping prevents formula injection |
| Rate limiting | Client-side only, no server to rate limit |

**CSV Injection Prevention:**
```typescript
// Prevent Excel formula injection
function sanitizeCSVValue(value: string): string {
  // Escape leading characters that Excel interprets as formulas
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`; // Prefix with single quote
  }
  return value;
}
```

---

## Story-to-File Mapping

| Story | Primary Files | Test Files |
|-------|---------------|------------|
| 5.1 CSV Utilities | `src/utils/csvExport.ts` | `tests/unit/csvExport.test.ts` |
| 5.2 Basic Export | `src/views/SettingsView.tsx` | `tests/integration/settings-export.test.tsx` |
| 5.3 Subscription | `src/utils/subscription.ts`, `src/hooks/useSubscriptionTier.ts` | `tests/unit/subscription.test.ts` |
| 5.4 Transaction Export | `src/views/TrendsView.tsx` | `tests/integration/trends-export.test.tsx` |
| 5.5 Statistics + Upgrade | `src/views/TrendsView.tsx`, `src/components/UpgradePromptModal.tsx` | `tests/e2e/export.spec.ts` |

---

## Rollout Plan

1. **Story 5.1** - CSV utilities foundation (no user-facing changes)
2. **Story 5.3** - Subscription infrastructure (no user-facing changes, can parallel)
3. **Story 5.2** - Basic export in Settings (first user-facing feature)
4. **Story 5.4** - Transaction export in TrendsView (premium feature)
5. **Story 5.5** - Statistics export + upgrade prompt (complete feature)

**Feature Flag (Optional):**
```typescript
// If needed for staged rollout
const FEATURE_FLAGS = {
  PREMIUM_EXPORT_ENABLED: true, // Can disable in production if issues
};
```

---

## Documentation Updates

After Epic 5 completion, update:
- [ ] `docs/index.md` - Add Epic 5 section
- [ ] `docs/architecture/architecture.md` - Add ADR-010, ADR-011, ADR-012
- [ ] `docs/development/component-inventory.md` - Add new components
- [ ] `src/utils/translations.ts` - Add i18n strings

---

## Appendix: Translation Keys

```typescript
// Add to translations.ts
export const EXPORT_TRANSLATIONS = {
  en: {
    downloadAllData: 'Download All Your Data',
    exportTransactions: 'Export Transactions',
    exportStatistics: 'Export Statistics',
    noTransactions: 'No transactions to export',
    exportSuccess: 'Export complete',
    upgradeRequired: 'Upgrade Required',
    upgradeMessage: 'Transaction and statistics exports are available for Pro and Max subscribers.',
    upgradeCta: 'Upgrade Now',
    maybeLater: 'Maybe Later',
  },
  es: {
    downloadAllData: 'Descargar Todos Tus Datos',
    exportTransactions: 'Exportar Transacciones',
    exportStatistics: 'Exportar Estadísticas',
    noTransactions: 'No hay transacciones para exportar',
    exportSuccess: 'Exportación completa',
    upgradeRequired: 'Actualización Requerida',
    upgradeMessage: 'Las exportaciones de transacciones y estadísticas están disponibles para suscriptores Pro y Max.',
    upgradeCta: 'Actualizar Ahora',
    maybeLater: 'Quizás Después',
  },
};
```

---

**Tech Spec Version:** 1.0
**Created:** 2025-12-02
**Ready for:** Story 5.1 implementation
