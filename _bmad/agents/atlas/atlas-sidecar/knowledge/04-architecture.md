# Architectural Decisions & Patterns

> Section 4 of Atlas Memory
> Last Optimized: 2026-02-01 (Generation 6)
> Sources: architecture.md, ADRs, tech-spec documents

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 18 + TypeScript + Vite | PWA with mobile-first design |
| Styling | Tailwind CSS + CSS Custom Properties | Runtime theme switching |
| State | Zustand + React Query | Feature stores + Firestore caching |
| Backend | Firebase (Auth, Firestore, Storage, Functions) | Serverless |
| AI/ML | Google Gemini 2.0 Flash | Receipt OCR |
| Testing | Vitest + Playwright | 84%+ coverage, 5,800+ tests |
| CI/CD | GitHub Actions → Firebase Hosting | Auto-deploy on main merge |

## Data Model

```
users/{userId}/
  transactions/{transactionId}
  categoryMappings/{mappingId}
  merchantMappings/{mappingId}
  trustedMerchants/{merchantId}
  groups/{groupId}
```

## Architectural Decisions (ADRs)

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-010 | React Context for Analytics State | Active |
| ADR-015 | Client-Side Insight Engine | Active |
| ADR-018 | Quick Save Confidence Scoring (85%) | Active |
| ADR-019 | Trust Merchant Auto-Save | Active |
| ADR-020 | Scan State Machine | Active |

## Code Organization

```
src/
├── app/           # AppProviders, types
├── features/      # Feature modules (scan, batch-review, credit, categories)
├── shared/        # Stores (navigation, settings), hooks, utils
├── components/    # Reusable UI components
├── views/         # Page-level components
├── services/      # Firebase, Gemini API
├── hooks/app/     # App-level handler hooks
├── contexts/      # React contexts (Auth, HistoryFilters)
├── types/         # TypeScript interfaces
└── entities/      # FSD entities (transaction)
```

---

## Zustand State Management (Epic 14e)

### Store Pattern

```typescript
export const useFeatureStore = create<State & Actions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      _guardPhase: (expected, actionName) => {
        if (get().phase !== expected) {
          if (import.meta.env.DEV) console.warn(`[Store] ${actionName} blocked`);
          return false;
        }
        return true;
      },

      action: () => {
        if (!get()._guardPhase('idle', 'action')) return;
        set({ ...newState }, false, 'feature/action');
      },
    }),
    { name: 'feature-store', enabled: import.meta.env.DEV }
  )
);
```

### Stores Implemented

| Store | Location | Purpose |
|-------|----------|---------|
| useScanStore | `@features/scan/store` | Scan phases, images, results, dialogs |
| useBatchReviewStore | `@features/batch-review/store` | Batch review state, save progress |
| useNavigationStore | `@shared/stores` | View, previousView, scroll positions |
| useTransactionEditorStore | `@features/transaction-editor/store` | Current transaction, mode, navigation |
| useSettingsStore | `@shared/stores` | Language, currency, theme |
| useInsightStore | `@shared/stores` | Insight state management |
| useModalStore | `@managers/modal-manager` | Modal state |

### Key Patterns

| Pattern | Implementation |
|---------|----------------|
| Phase guards | `_guardPhase()` helper, DEV-only warnings |
| Action naming | `{feature}/{action}` for DevTools |
| Selector hooks | `useShallow` for object stability |
| Direct access | `getState()` + action objects for non-React code |
| Store extension | Add state/actions/selectors incrementally |

---

## Handler Extraction Pattern (Epic 14e)

### Structure

```typescript
// src/features/scan/handlers/processScan/processScan.ts
export async function processScan(params: ProcessScanParams): Promise<Result> {
  const { scan, user, mapping, ui, services, t, lang } = params;
  // 13-step orchestration
}

// App.tsx thin wrapper
const handleProcessScan = useCallback(async () => {
  await processScan({
    scan: { images, currency, storeType },
    user: { userId, creditsRemaining },
    // ... collect from hooks/state
  });
}, [deps]);
```

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| Dependency injection | Testable without mocking hooks |
| Thin wrappers | App.tsx collects deps, handler has logic |
| Context interfaces | Type-safe parameter grouping |
| Factory pattern | For handlers needing closure state |

---

## Feature Module Structure

```
src/features/{name}/
├── index.ts              # Barrel exports
├── {Name}Feature.tsx     # Orchestrator component
├── store/
│   ├── index.ts          # Store + selectors
│   ├── types.ts          # State/action types
│   └── use{Name}Store.ts # Zustand store
├── handlers/
│   └── index.ts          # Handler functions
└── components/
    └── *.tsx             # Feature-specific components
```

---

## React Query Integration

```typescript
// Global defaults (queryClient.ts)
staleTime: 5 * 60 * 1000,    // 5 minutes
gcTime: 30 * 60 * 1000,      // 30 minutes
refetchOnMount: false,
refetchOnWindowFocus: true,
```

**Critical Pattern**: Use refs for subscribeFn to avoid infinite loops.

---

## Firestore Cost Optimization

```typescript
export const LISTENER_LIMITS = {
  TRANSACTIONS: 100,
  GROUPS: 50,
  TRUSTED_MERCHANTS: 200,
  MAPPINGS: 500,
} as const;
```

**Result**: ~$19/week → ~$1/week (95% reduction)

---

## Scan State Machine (Epic 14d)

```typescript
type ScanPhase = 'idle' | 'capturing' | 'scanning' | 'reviewing' | 'saving' | 'error';
type ScanMode = 'single' | 'batch' | 'statement';
```

| Decision | Choice |
|----------|--------|
| Request Precedence | Active blocks new |
| Persistence | No expiration |
| Credits | Reserve→Confirm/Refund |

---

## AI Prompt System (V3)

- **Single Source**: `shared/schema/categories.ts` (36 store + 39 item categories)
- **Production Prompt**: `prompt-testing/prompts/v3-category-standard.ts`
- **Currency**: AI auto-detects from receipt

---

## Quick Save & Trust Merchant

| Confidence Factor | Weight |
|-------------------|--------|
| merchant | 20% |
| total | 25% |
| date | 15% |
| category | 15% |
| items | 25% |

**Threshold**: >= 85% shows QuickSaveCard

**Trust Flow**: First Save → TrustMerchantPrompt → User confirms → Auto-categorize on future scans

---

## Input Sanitization

**File**: `src/utils/sanitize.ts`

Patterns blocked: Script tags, event handlers, protocol attacks, control characters

---

## Firebase Cloud Functions

| Function | Purpose |
|----------|---------|
| `analyzeReceipt` | Receipt OCR (rate limit: 10/min/user) |
| `onTransactionDeleted` | Cascade delete images |

---

## Sync Notes

### Generation 6 (2026-02-01)
- Consolidated 50+ story-specific pattern entries into domain sections
- Removed verbose per-story additions (now in story files)
- Reduced file from 44KB to ~8KB
- Zustand stores now in single table

### Generation 5 (2026-01-24)
- Added Epic 14c-refactor patterns
- Added Zustand store pattern

**Detailed patterns**: Story files in `docs/sprint-artifacts/`
