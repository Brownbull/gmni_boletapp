# Epic 14e: Feature-Based Architecture - Architecture Decision

**Date:** 2026-01-24
**Updated:** 2026-01-24 (ADR-018: Zustand-only state management)
**Status:** Approved
**Author:** Archie (React Opinionated Architect)
**Stakeholder:** Gabe

---

## Context

After completing Epic 14c-refactor, App.tsx is at ~3,387 lines despite extracting 6,033 lines to composition hooks. Analysis revealed structural constraints that prevent further reduction without architectural changes:

| Section | Lines | Extractable? |
|---------|-------|--------------|
| Imports | ~150 | No |
| State Declarations | ~200 | Partially |
| Hook Calls | ~350 | No (Rules of Hooks) |
| Handler Hooks Setup | ~250 | Already extracted |
| `processScan` Function | ~600 | **Yes - Target** |
| Other Handlers | ~700 | Partially |
| Composition Hooks | ~400 | Already optimized |
| Early Returns | ~200 | No |
| Render Section | ~1,000 | Partially (modals) |

The original 1,500-2,000 line target was unrealistic. A more fundamental architectural approach is needed.

### Existing State Management Landscape

Epic 14d already implemented a scan state machine using `useReducer`:
- `src/hooks/useScanStateMachine.ts` - useReducer-based state machine
- `src/contexts/ScanContext.tsx` - React context wrapper
- `src/hooks/useScanStateBridge.ts` - **DEAD CODE** (exists but not imported anywhere)

The bridge layer was created for incremental migration and is no longer needed.

---

## Decision

Implement a **Zustand-Unified Architecture**:

1. **Feature-Based Directory Structure** - Organize code by feature domain
2. **Zustand for ALL Client State** - Single paradigm for modal, scan, batch, and feature state
3. **TanStack Query for Server State** - Unchanged from current architecture

### ADR-018: Zustand-Only State Management

**Decision:** Use Zustand exclusively for client state management. Do NOT introduce XState.

**Context:** The original epic proposed XState for complex flows (scan, batch). Pre-dev review identified:
1. A useReducer-based state machine already exists (`useScanStateMachine`)
2. XState would introduce a THIRD paradigm (TanStack Query + Zustand + XState)
3. XState adds ~18kb gzipped to bundle
4. Learning curve for team with no XState experience

**Options Considered:**

| Option | Paradigms | Bundle | Verdict |
|--------|-----------|--------|---------|
| XState + Zustand | 3 (Query + Zustand + XState) | +18kb | ❌ Rejected |
| Zustand only | 2 (Query + Zustand) | +1kb | ✅ Selected |
| Keep useReducer | 2.5 (Query + Zustand + useReducer) | +0kb | ❌ Rejected (inconsistent) |

**Rationale:**
- **One paradigm**: "Client state = Zustand, Server state = TanStack Query"
- **Bundle size**: +1kb (Zustand) vs +18kb (XState)
- **Simpler migration**: Migrate existing useReducer logic to Zustand store
- **No learning curve**: Zustand is simpler than XState
- **DevTools support**: Zustand has Redux DevTools integration

**Consequences:**
- No visual state chart debugging (XState Inspector)
- State machine logic must be manually enforced in Zustand actions
- Consistent developer experience across all features

---

## Architecture Overview

### Target Structure

```
src/
├── features/                        # Feature-based modules
│   ├── scan/                        # Complex flow - Zustand store
│   │   ├── index.ts                 # Public API exports
│   │   ├── ScanFeature.tsx          # Feature orchestrator
│   │   ├── store/
│   │   │   └── useScanStore.ts      # Zustand store (migrated from useReducer)
│   │   ├── handlers/
│   │   │   └── processScan.ts       # Extracted from App.tsx
│   │   ├── components/
│   │   │   ├── ScanOverlay.tsx
│   │   │   ├── ScanResultModal.tsx
│   │   │   └── states/              # State-based UI
│   │   │       ├── IdleState.tsx
│   │   │       ├── ProcessingState.tsx
│   │   │       └── ReviewingState.tsx
│   │   └── types.ts
│   │
│   ├── batch-review/                # Complex flow - Zustand store
│   │   ├── index.ts
│   │   ├── BatchReviewFeature.tsx
│   │   ├── store/
│   │   │   └── useBatchReviewStore.ts
│   │   ├── handlers/
│   │   └── components/
│   │
│   ├── categories/                  # Simple feature
│   │   ├── index.ts
│   │   ├── CategoriesFeature.tsx
│   │   ├── store/
│   │   │   └── useCategoriesStore.ts
│   │   ├── handlers/
│   │   └── components/
│   │
│   ├── credit/                      # Simple feature
│   │   ├── index.ts
│   │   ├── CreditFeature.tsx
│   │   ├── store/
│   │   └── components/
│   │
│   └── transactions/                # Core data feature
│       ├── index.ts
│       └── ...
│
├── shared/                          # Cross-feature utilities
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
│
├── managers/                        # Global managers
│   └── ModalManager/
│       ├── index.ts
│       ├── ModalManager.tsx
│       ├── useModalStore.ts         # Zustand store
│       └── types.ts
│
├── app/                             # App shell
│   ├── App.tsx                      # ~500-800 lines target
│   ├── AppProviders.tsx
│   └── FeatureOrchestrator.tsx
│
└── views/                           # Keep existing views (gradual migration)
```

### Zustand Store Pattern (for complex flows)

```typescript
// src/features/scan/store/useScanStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Transaction } from '@/types/transaction';

// Type-safe phases (replaces XState states)
type ScanPhase = 'idle' | 'capturing' | 'processing' | 'reviewing' | 'editing' | 'saving' | 'success' | 'error';
type ScanMode = 'single' | 'batch' | 'statement';

interface ScanState {
  // Core state (migrated from useScanStateMachine)
  phase: ScanPhase;
  mode: ScanMode;
  requestId: string | null;
  userId: string | null;
  startedAt: number | null;

  // Image data
  images: string[];

  // Results
  results: Transaction[];
  activeResultIndex: number;

  // Error state
  error: string | null;

  // Batch mode
  batchProgress: { current: number; total: number; completed: string[]; failed: string[] } | null;
}

interface ScanActions {
  // Start actions (with phase guards)
  startSingle: (userId: string) => void;
  startBatch: (userId: string) => void;
  startStatement: (userId: string) => void;

  // Image actions
  addImage: (base64: string) => void;
  removeImage: (index: number) => void;
  setImages: (images: string[]) => void;

  // Processing actions
  processStart: () => void;
  processSuccess: (results: Transaction[]) => void;
  processError: (error: string) => void;

  // Save actions
  saveStart: () => void;
  saveSuccess: () => void;
  saveError: (error: string) => void;

  // Control actions
  cancel: () => void;
  reset: () => void;
}

const initialState: ScanState = {
  phase: 'idle',
  mode: 'single',
  requestId: null,
  userId: null,
  startedAt: null,
  images: [],
  results: [],
  activeResultIndex: 0,
  error: null,
  batchProgress: null,
};

export const useScanStore = create<ScanState & ScanActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Start actions with phase guards (same logic as current useReducer)
      startSingle: (userId) => {
        if (get().phase !== 'idle') {
          console.warn('[ScanStore] Cannot start - request in progress');
          return;
        }
        set({
          ...initialState,
          phase: 'capturing',
          mode: 'single',
          requestId: crypto.randomUUID(),
          userId,
          startedAt: Date.now(),
        });
      },

      startBatch: (userId) => {
        if (get().phase !== 'idle') return;
        set({
          ...initialState,
          phase: 'capturing',
          mode: 'batch',
          requestId: crypto.randomUUID(),
          userId,
          startedAt: Date.now(),
          batchProgress: { current: 0, total: 0, completed: [], failed: [] },
        });
      },

      startStatement: (userId) => {
        if (get().phase !== 'idle') return;
        set({
          ...initialState,
          phase: 'capturing',
          mode: 'statement',
          requestId: crypto.randomUUID(),
          userId,
          startedAt: Date.now(),
        });
      },

      // Image actions
      addImage: (base64) => set((state) => ({ images: [...state.images, base64] })),
      removeImage: (index) => set((state) => ({
        images: state.images.filter((_, i) => i !== index)
      })),
      setImages: (images) => set({ images }),

      // Processing actions
      processStart: () => set({ phase: 'processing', error: null }),
      processSuccess: (results) => set({ phase: 'reviewing', results, error: null }),
      processError: (error) => set({ phase: 'error', error }),

      // Save actions
      saveStart: () => set({ phase: 'saving' }),
      saveSuccess: () => {
        const { mode } = get();
        if (mode === 'batch') {
          // In batch mode, return to capturing for next receipt
          set({ phase: 'capturing', results: [], images: [] });
        } else {
          set({ phase: 'success' });
          // Auto-reset after success
          setTimeout(() => get().reset(), 2000);
        }
      },
      saveError: (error) => set({ phase: 'error', error }),

      // Control actions
      cancel: () => set(initialState),
      reset: () => set(initialState),
    }),
    { name: 'scan-store' }
  )
);

// Computed selectors (for compatibility with existing ScanContext API)
export const useScanPhase = () => useScanStore((s) => s.phase);
export const useScanMode = () => useScanStore((s) => s.mode);
export const useIsScanning = () => useScanStore((s) => s.phase !== 'idle');
export const useCanNavigateFreely = () => useScanStore((s) => s.phase === 'idle' || s.phase === 'success');
```

**Key Differences from XState:**
- Phase guards are manual (`if (get().phase !== 'idle') return`)
- No visual state chart (trade-off for simplicity)
- Actions can have async side effects directly
- DevTools integration via `devtools` middleware
- Same state machine semantics, different container

### Feature Slicing Pattern (for simple features)

```typescript
// src/features/categories/index.ts
export { CategoriesFeature } from './CategoriesFeature';
export { useCategoriesState } from './state/useCategoriesState';
export type { Category, CategoryMapping } from './types';

// src/features/categories/CategoriesFeature.tsx
export const CategoriesFeature = () => {
  const { mappings, loading, saveMapping, deleteMapping } = useCategoriesState();
  const { openModal } = useModalManager();

  return (
    <>
      {/* Feature renders its own modals or uses ModalManager */}
      <CategoryEditorModal
        open={/* local state */}
        onSave={saveMapping}
      />
    </>
  );
};
```

### Modal Manager Pattern

```typescript
// src/managers/ModalManager/useModalStore.ts
import { create } from 'zustand';

type ModalType =
  | 'categoryEditor'
  | 'creditInfo'
  | 'confirmDelete'
  | 'exportData'
  // ... all modal types

interface ModalState {
  activeModal: ModalType | null;
  modalProps: Record<string, unknown>;
  openModal: (type: ModalType, props?: Record<string, unknown>) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  activeModal: null,
  modalProps: {},
  openModal: (type, props = {}) => set({ activeModal: type, modalProps: props }),
  closeModal: () => set({ activeModal: null, modalProps: {} }),
}));

// src/managers/ModalManager/ModalManager.tsx
const MODALS: Record<ModalType, React.ComponentType<any>> = {
  categoryEditor: CategoryEditorModal,
  creditInfo: CreditInfoModal,
  confirmDelete: ConfirmDeleteModal,
  exportData: ExportDataModal,
  // ... register all modals
};

export const ModalManager = () => {
  const { activeModal, modalProps, closeModal } = useModalStore();

  if (!activeModal) return null;

  const Modal = MODALS[activeModal];
  return <Modal {...modalProps} onClose={closeModal} />;
};
```

---

## Migration Strategy

### Phase 0: Cleanup (Pre-requisite)
- **Delete dead code:** `src/hooks/useScanStateBridge.ts` (17KB, unused)
- Verify no regressions from cleanup

### Phase 1: Foundation (Part 1)
- Create `src/features/` and `src/managers/` directories
- Install Zustand (only new dependency)
- Implement Modal Manager with Zustand store
- Migrate 3-5 simplest modals to Modal Manager
- **No changes to App.tsx logic yet**

### Phase 2: Scan Feature Extraction (Part 2)
- Create `src/features/scan/` structure
- **Migrate** existing `useScanStateMachine` (useReducer) → `useScanStore` (Zustand)
- Extract `processScan` handler (600 lines)
- Migrate existing ScanContext to use Zustand store
- Delete old `useScanStateMachine.ts` after migration verified
- Remove scan-related code from App.tsx

### Phase 3: Batch Review Feature (Part 3)
- Create `src/features/batch-review/` structure
- Implement `useBatchReviewStore` with Zustand
- Extract batch-related handlers
- Remove batch-related code from App.tsx

### Phase 4: Simple Features (Part 4)
- Extract categories feature (Zustand store if needed)
- Extract credit feature (Zustand store if needed)
- Extract remaining modal state to features

### Phase 5: App Shell Finalization (Part 5)
- Refactor App.tsx to thin orchestrator
- Create FeatureOrchestrator component
- Final cleanup and verification

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| App.tsx Lines | 3,387 | 500-800 | `wc -l src/App.tsx` |
| Max Feature Size | N/A | <1,000 lines | Largest feature module |
| Zustand Store Coverage | 0% | Scan + Batch + Modal | All complex client state |
| Modal Manager Coverage | 0% | 100% | All modals registered |
| Test Coverage | ~60% | >70% | Feature-level tests |
| State Paradigms | 2.5 | 2 | TanStack Query + Zustand only |

---

## Dependencies

### New Dependencies

| Package | Version | Purpose | Size |
|---------|---------|---------|------|
| `zustand` | ^5.x | Client state management | ~1kb gzipped |

### Dependencies NOT Added (per ADR-018)

| Package | Reason Not Added |
|---------|------------------|
| `xstate` | Three paradigms too complex, +18kb bundle, learning curve |
| `@xstate/react` | Not needed without XState |

### Existing Dependencies Utilized

- `@tanstack/react-query` - Server state (unchanged)
- React `useReducer` - Will be migrated to Zustand (then deleted)

---

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Zustand migration breaks scan flow | High | Low | Comprehensive tests, incremental migration |
| Feature boundary disputes | Low | Medium | Clear ownership rules in architecture doc |
| Manual phase guards error-prone | Medium | Low | Type-safe phases, unit tests for transitions |
| Migration takes longer than XState rewrite | Medium | Medium | Reuse existing reducer logic, don't redesign |

### Risks Eliminated (by choosing Zustand over XState)

| Risk | Why Eliminated |
|------|----------------|
| XState learning curve | Team knows Zustand patterns |
| Three paradigm confusion | Single client state paradigm |
| Bundle size impact | +1kb vs +18kb |

---

## Decision Rationale

### Why Feature Slicing?

1. **Clear Ownership**: "Where is scan code?" → `src/features/scan/`
2. **Team Scalability**: Different devs can work on different features
3. **Testability**: Features can be tested in isolation
4. **Lazy Loading**: Features can be code-split

### Why Zustand for Complex Flows?

1. **Consistency**: Same paradigm as Modal Manager and future features
2. **Simplicity**: No new library to learn (vs XState)
3. **Bundle Size**: +1kb vs +18kb
4. **Migration Path**: Existing useReducer logic ports directly to Zustand
5. **DevTools**: Redux DevTools integration via middleware
6. **Global Access**: Can access state outside React (`getState()`, `subscribe()`)

### Why NOT XState?

1. **Existing State Machine**: `useScanStateMachine` already implements the logic
2. **Three Paradigms**: TanStack Query + Zustand + XState = cognitive overload
3. **Learning Curve**: Team has no XState experience
4. **Visual Debugging Trade-off**: Nice to have, not essential for this codebase
5. **Bundle Size**: Chilean mobile users on limited data plans

### Why Not Pure Route-Based?

1. **PWA Concerns**: URL-based navigation complicates offline behavior
2. **Paradigm Shift**: Too large a change for current stage
3. **Can Add Later**: Feature slicing doesn't preclude routes

---

## State Management Philosophy

After this epic, the state management philosophy is:

| State Type | Library | Example |
|------------|---------|---------|
| **Server State** | TanStack Query | Transactions, categories, user data |
| **Client State** | Zustand | Scan flow, batch review, modals, UI state |
| **Local Component State** | useState | Form inputs, toggle states |

**One rule**: If it's fetched from Firebase → TanStack Query. Everything else → Zustand (or useState for truly local state).

---

## References

- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Epic 14c-refactor App Architecture Final](../epic14c-refactor/app-architecture-final.md)
- [Epic 14c Retrospective](../epic-14c-retro-2026-01-20.md)
- [Epic 14d Scan Architecture](../epic14d/scan-architecture-refactor-plan.md)
