# Story 14e.21: Create FeatureOrchestrator

Status: ready-for-dev

**Epic:** 14e - Feature-Based Architecture
**Points:** 3
**Created:** 2026-01-25
**Author:** Atlas Create-Story Workflow

---

## Story

As a **developer**,
I want **a FeatureOrchestrator component that composes all features into a single render tree**,
So that **App.tsx becomes a thin shell and feature visibility is managed centrally**.

---

## Context

### Epic 14e Progress

This story is part of **Part 5: App Shell Finalization** and represents the culmination of all feature extractions:

| Part | Feature | Story | Status |
|------|---------|-------|--------|
| Part 2 | Scan | 14e-10 | ready-for-dev |
| Part 3 | Batch Review | 14e-16 | ready-for-dev |
| Part 4 | Categories | 14e-17 | ready-for-dev |
| Part 4 | Credit | 14e-18c | ready-for-dev |
| Part 4 | Transactions Entity | 14e-19 | ready-for-dev |
| Part 4 | UI State | 14e-20a/b | ready-for-dev |
| Part 1 | ModalManager | 14e-3-5 | ready-for-dev |

### FeatureOrchestrator Role

FeatureOrchestrator is the **central composition component** that:

1. **Composes Features** - Renders ScanFeature, BatchReviewFeature, CategoriesFeature, CreditFeature
2. **Manages Visibility** - Determines which features render based on current app state
3. **Single ModalManager** - Renders ModalManager once for all features
4. **Clean Boundary** - Separates feature composition from view routing (App.tsx)

### Architecture Context

Per ADR-018 (Zustand-only state management):
- Features read state from their own Zustand stores
- ModalManager renders all modals via useModalStore
- FeatureOrchestrator does NOT manage feature state - only composition

---

## Acceptance Criteria

### AC1: FeatureOrchestrator Component Created

**Given** all features extracted in Parts 1-4
**When** this story is completed
**Then:**
- [ ] `src/app/FeatureOrchestrator.tsx` created
- [ ] Component imports from `@features/*` using path aliases
- [ ] Component exports as named export
- [ ] JSDoc documentation describes component role

### AC2: Feature Composition

**Given** FeatureOrchestrator is rendered
**When** the component mounts
**Then:**
- [ ] `<ScanFeature />` rendered from `@features/scan`
- [ ] `<BatchReviewFeature />` rendered from `@features/batch-review`
- [ ] `<CategoriesFeature />` rendered from `@features/categories`
- [ ] `<CreditFeature />` rendered from `@features/credit`
- [ ] `<ModalManager />` rendered from `@managers/ModalManager`
- [ ] All features rendered in correct order (see Dev Notes)

### AC3: Feature Visibility Logic

**Given** different app states (scan active, batch review active, idle, etc.)
**When** FeatureOrchestrator renders
**Then:**
- [ ] Features visibility determined by their internal Zustand store state
- [ ] ModalManager always renders (handles its own null state)
- [ ] No conflicting overlays (e.g., scan capturing + batch reviewing)
- [ ] Features can coexist when appropriate (e.g., CategoriesFeature + ScanFeature)

### AC4: App.tsx Integration

**Given** FeatureOrchestrator is complete
**When** integrated into App.tsx
**Then:**
- [ ] `<FeatureOrchestrator />` rendered in App.tsx main content area
- [ ] Feature-specific rendering code removed from App.tsx
- [ ] View routing remains in App.tsx (or AppLayout)
- [ ] Import works: `import { FeatureOrchestrator } from '@app/FeatureOrchestrator'`
- [ ] ~100-200 lines of feature composition removed from App.tsx

### AC5: Tests & Verification

**Given** FeatureOrchestrator is created
**When** tests are run
**Then:**
- [ ] Unit tests verify each feature is rendered
- [ ] Unit tests verify ModalManager is rendered once
- [ ] Build succeeds: `npm run build`
- [ ] All existing tests pass: `npm run test`
- [ ] No console errors during feature rendering

### AC6: Atlas Workflow Verification (ATLAS-ENHANCED)

**Given** FeatureOrchestrator composes all features
**When** this story is completed
**Then:**
- [ ] **Workflow #1 (Scan Receipt)**: Full capture→save flow works via ScanFeature
- [ ] **Workflow #2 (Quick Save)**: High-confidence routing works via ScanFeature
- [ ] **Workflow #3 (Batch Processing)**: Batch review works via BatchReviewFeature
- [ ] **Workflow #9 (Scan Lifecycle)**: FAB → mode selector → feature works
- [ ] Modal interactions work for all workflows via ModalManager

---

## Tasks / Subtasks

### Task 1: Create FeatureOrchestrator Component (AC: 1, 2)

- [ ] **1.1** Create `src/app/FeatureOrchestrator.tsx`
- [ ] **1.2** Add imports for all features:
  ```typescript
  import { ScanFeature } from '@features/scan';
  import { BatchReviewFeature } from '@features/batch-review';
  import { CategoriesFeature } from '@features/categories';
  import { CreditFeature } from '@features/credit';
  import { ModalManager } from '@managers/ModalManager';
  ```
- [ ] **1.3** Implement component that renders all features
- [ ] **1.4** Add JSDoc documentation explaining role and architecture
- [ ] **1.5** Export component from index.ts or directly

### Task 2: Feature Visibility & Order (AC: 3)

- [ ] **2.1** Determine render order (see Dev Notes for rationale):
  1. CategoriesFeature (headless)
  2. CreditFeature (warning dialog only)
  3. ScanFeature (overlay during scan)
  4. BatchReviewFeature (overlay during batch)
  5. ModalManager (all modals)
- [ ] **2.2** Document visibility rules for each feature
- [ ] **2.3** Verify features handle their own visibility via internal store state
- [ ] **2.4** Add conditional rendering ONLY if feature doesn't handle visibility internally

### Task 3: App.tsx Integration (AC: 4)

- [ ] **3.1** Add import: `import { FeatureOrchestrator } from '@app/FeatureOrchestrator'`
- [ ] **3.2** Identify current feature rendering code in App.tsx
- [ ] **3.3** Add `<FeatureOrchestrator />` to appropriate location (after AppLayout, before/after views)
- [ ] **3.4** Remove redundant feature-specific rendering code
- [ ] **3.5** Verify view routing still works after integration
- [ ] **3.6** Document lines removed (target: ~100-200)

### Task 4: Testing & Verification (AC: 5, 6)

- [ ] **4.1** Create `tests/unit/app/FeatureOrchestrator.test.tsx`
- [ ] **4.2** Add tests:
  - Renders without error
  - ScanFeature is rendered
  - BatchReviewFeature is rendered
  - CategoriesFeature is rendered
  - CreditFeature is rendered
  - ModalManager is rendered
  - No duplicate ModalManager renders
- [ ] **4.3** Run full test suite: `npm run test`
- [ ] **4.4** Run build: `npm run build`
- [ ] **4.5** Execute smoke test checklist (see Dev Notes)

---

## Dev Notes

### FeatureOrchestrator Component Pattern

```typescript
// src/app/FeatureOrchestrator.tsx

import { ScanFeature } from '@features/scan';
import { BatchReviewFeature } from '@features/batch-review';
import { CategoriesFeature } from '@features/categories';
import { CreditFeature } from '@features/credit';
import { ModalManager } from '@managers/ModalManager';

/**
 * FeatureOrchestrator composes all feature modules into a single render tree.
 *
 * Architecture Notes:
 * - Each feature is self-contained with its own Zustand store
 * - Features handle their own visibility (render null when inactive)
 * - ModalManager renders all modals from any feature
 * - This component does NOT manage feature state
 *
 * Render Order Rationale:
 * 1. CategoriesFeature - Headless, provides category context
 * 2. CreditFeature - Renders credit warning dialog only
 * 3. ScanFeature - Overlay UI during scan flow
 * 4. BatchReviewFeature - Overlay UI during batch review
 * 5. ModalManager - All modal rendering (must be last for z-index)
 *
 * @see docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md
 */
export function FeatureOrchestrator() {
  return (
    <>
      {/* Headless features (provide context, no visible UI) */}
      <CategoriesFeature />

      {/* Features with conditional UI */}
      <CreditFeature />

      {/* Overlay features (render based on phase) */}
      <ScanFeature />
      <BatchReviewFeature />

      {/* Modal rendering (must be last for z-index) */}
      <ModalManager />
    </>
  );
}
```

### Feature Visibility Patterns

Each feature handles its own visibility internally:

| Feature | Visibility Logic | Renders |
|---------|------------------|---------|
| CategoriesFeature | Always renders | Headless (no UI) or CategoryEditorModal via ModalManager |
| CreditFeature | Always renders | CreditWarningDialog only when triggered |
| ScanFeature | `phase !== 'idle'` | Phase-appropriate scan UI |
| BatchReviewFeature | `phase !== 'idle'` | Phase-appropriate batch review UI |
| ModalManager | Always renders | Active modal or null |

### App.tsx Integration Pattern

```typescript
// App.tsx - BEFORE (simplified)
return (
  <AppProviders>
    <AppLayout>
      {/* Feature-specific rendering scattered here */}
      {isScanActive && <ScanUI />}
      {isBatchActive && <BatchUI />}
      {creditWarning && <CreditDialog />}
      {/* Modal rendering scattered here */}
      {showCategoryModal && <CategoryModal />}

      {/* View routing */}
      {currentView === 'dashboard' && <DashboardView />}
      {/* ... */}
    </AppLayout>
  </AppProviders>
);

// App.tsx - AFTER
import { FeatureOrchestrator } from '@app/FeatureOrchestrator';

return (
  <AppProviders>
    <AppLayout>
      <FeatureOrchestrator />

      {/* View routing - clean and focused */}
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'history' && <HistoryView />}
      {/* ... */}
    </AppLayout>
  </AppProviders>
);
```

### Smoke Test Checklist

Execute after integration:

**1. Scan Flow (Workflow #1)**
- [ ] Tap FAB → Camera opens (ScanFeature active)
- [ ] Take photo → Processing shows
- [ ] Success → EditView shows
- [ ] Save → Transaction saved

**2. Batch Flow (Workflow #3)**
- [ ] Long-press FAB → Mode selector
- [ ] Select batch → BatchCaptureView
- [ ] Process → BatchReviewView via BatchReviewFeature
- [ ] Save all → Transactions saved

**3. Credit Flow**
- [ ] Insufficient credits → CreditWarningDialog shows
- [ ] Dialog actions work (buy credits, cancel)

**4. Modal Flow**
- [ ] Open any modal → Shows via ModalManager
- [ ] Close modal → Dismisses correctly
- [ ] Multiple modals don't stack incorrectly

**5. View Routing**
- [ ] Navigate Dashboard → History → Settings
- [ ] View routing works independently of features

### Directory Structure After Completion

```
src/
├── app/
│   ├── FeatureOrchestrator.tsx     # NEW - This story
│   ├── App.tsx                      # Simplified
│   └── AppProviders.tsx             # Story 14e-22
├── features/
│   ├── scan/                        # Part 2
│   ├── batch-review/                # Part 3
│   ├── categories/                  # Part 4
│   └── credit/                      # Part 4
├── managers/
│   └── ModalManager/                # Part 1
└── views/                           # Unchanged

tests/unit/app/
└── FeatureOrchestrator.test.tsx     # NEW
```

### Atlas Workflow Analysis Summary

| Workflow | Risk | FeatureOrchestrator Responsibility |
|----------|------|-----------------------------------|
| #1 Scan Receipt | LOW | Renders ScanFeature |
| #2 Quick Save | LOW | ScanFeature handles internally |
| #3 Batch Processing | LOW | Renders BatchReviewFeature |
| #9 Scan Lifecycle | LOW | Both ScanFeature + BatchReviewFeature |

**No workflow impacts detected** - FeatureOrchestrator is a composition layer that delegates all logic to features.

### Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 4 | ≤4 | OK |
| Subtasks | 18 | ≤15 | LARGE |
| Files | 3-4 | ≤8 | OK |

**Note:** Slightly over subtask guideline due to comprehensive verification tasks. This is acceptable for an orchestrator story.

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#Story-14e21]
- [Source: docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md#ADR-018]
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md]
- [Depends on: 14e-10] - ScanFeature
- [Depends on: 14e-16] - BatchReviewFeature
- [Depends on: 14e-17] - CategoriesFeature
- [Depends on: 14e-18c] - CreditFeature
- [Depends on: 14e-3] - ModalManager
- [Blocks: 14e-22] - AppProviders Refactor
- [Blocks: 14e-23] - App.tsx Final Cleanup

---

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during development_

### Completion Notes List

_To be filled during development_

### File List

_To be filled during development_
