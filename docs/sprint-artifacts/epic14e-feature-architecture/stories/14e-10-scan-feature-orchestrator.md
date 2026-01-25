# Story 14e.10: Scan Feature Orchestrator

Status: ready-for-dev

**Epic:** 14e - Feature-Based Architecture
**Points:** 3
**Created:** 2026-01-24
**Author:** Atlas Create-Story Workflow

---

## Story

As a **developer**,
I want **a ScanFeature component that orchestrates all scan rendering based on Zustand store phase**,
So that **App.tsx can render a single component for all scan functionality and scan-specific code is removed from App.tsx**.

---

## Context

### Epic 14e Progress

This story is the **culmination of Part 2 (Scan Feature Extraction)**. It brings together:
- **14e-6a/b/c/d**: Scan Zustand store (state, actions, selectors)
- **14e-8a/b/c**: processScan handler extraction
- **14e-9a/b/c**: Scan components moved and updated

### ScanFeature Role

ScanFeature is the **orchestrator component** that:
1. Reads current phase from `useScanStore`
2. Renders appropriate state-specific component (IdleState, ProcessingState, ReviewingState, ErrorState)
3. Coordinates scan modals (delegates to ModalManager or renders inline)
4. Provides single import point for App.tsx

### Dependencies

| Story | Provides | Status |
|-------|----------|--------|
| 14e-6d | Zustand store with verified tests | ready-for-dev |
| 14e-8c | processScan handler in feature module | ready-for-dev |
| 14e-9c | State components (IdleState, ProcessingState, etc.) | ready-for-dev |

---

## Acceptance Criteria

### AC1: ScanFeature Component Created

**Given** the scan store and state components from previous stories
**When** this story is completed
**Then:**
- [ ] `src/features/scan/ScanFeature.tsx` created
- [ ] Component reads phase from `useScanPhase()` hook
- [ ] Component reads mode from `useScanMode()` hook
- [ ] Component renders appropriate state component based on phase
- [ ] Clean, readable switch/mapping for phase → component

### AC2: Phase-Based Rendering

**Given** the scan store can be in phases: idle, capturing, scanning, reviewing, saving, error
**When** ScanFeature is rendered
**Then:**
- [ ] `idle` → Renders IdleState (or nothing if handled by FAB)
- [ ] `capturing` → Renders camera UI / BatchCaptureView
- [ ] `scanning` → Renders ProcessingState (ScanProgress wrapper)
- [ ] `reviewing` → Renders ReviewingState (result preview)
- [ ] `saving` → Renders saving indicator
- [ ] `error` → Renders ErrorState with retry action

### AC3: Mode-Aware Rendering

**Given** scan can be in modes: single, batch, statement
**When** ScanFeature renders for each mode
**Then:**
- [ ] `single` mode renders single-scan-specific UI
- [ ] `batch` mode renders batch-specific UI (BatchCaptureView, multi-image preview)
- [ ] `statement` mode renders placeholder ("Proximamente") per Epic 14d

### AC4: Scan Modal Handling

**Given** scan flow has modals (currency dialog, total dialog, quick save)
**When** these modals need to show
**Then:**
- [ ] ScanFeature integrates with ModalManager (from Part 1) OR
- [ ] ScanFeature renders scan-specific modals inline (document decision)
- [ ] Modal open/close coordinated via `useModalStore` or store dialogs

### AC5: Feature Module Exports

**Given** ScanFeature is the public API for scan functionality
**When** this story is completed
**Then:**
- [ ] `src/features/scan/index.ts` exports ScanFeature as default/named export
- [ ] Import works: `import { ScanFeature } from '@features/scan'`
- [ ] All necessary hooks/types re-exported for external use

### AC6: App.tsx Integration

**Given** App.tsx currently has scan-specific rendering logic
**When** ScanFeature is integrated
**Then:**
- [ ] App.tsx imports ScanFeature: `import { ScanFeature } from '@features/scan'`
- [ ] App.tsx renders `<ScanFeature />` in appropriate location
- [ ] Scan-specific rendering code removed from App.tsx
- [ ] App.tsx passes minimal props (or none if context-based)
- [ ] ~800-1000 lines of scan code removed from App.tsx

### AC7: All Scan Tests Pass

**Given** existing scan test suite (~74+ tests)
**When** this story is completed
**Then:**
- [ ] All existing scan tests continue to pass
- [ ] New ScanFeature component tests added
- [ ] Integration tests verify phase-based rendering
- [ ] No regressions in scan functionality

### AC8: Atlas Workflow Integration (ATLAS-ENHANCED)

**Given** scan feature is critical to multiple workflow chains
**When** this story is completed
**Then:**
- [ ] **Workflow #1 (Scan Receipt)**: Full flow works - capture → process → review → save
- [ ] **Workflow #2 (Quick Save)**: High-confidence receipts route to QuickSaveCard
- [ ] **Workflow #3 (Batch Processing)**: Batch capture → parallel process → batch review
- [ ] **Workflow #9 (Scan Lifecycle)**: FAB mode selector integrates with ScanFeature
- [ ] Navigation blocking during active scan preserved (Epic 14d pattern)
- [ ] Credit reserve/confirm/refund pattern works through orchestrator

---

## Tasks / Subtasks

### Task 1: Create ScanFeature Component (AC: 1, 2)

- [ ] **1.1** Create `src/features/scan/ScanFeature.tsx`
- [ ] **1.2** Import state components from `./components/states`
- [ ] **1.3** Import phase/mode selectors from `./store`
- [ ] **1.4** Implement phase-to-component mapping:
  ```typescript
  const PHASE_COMPONENTS: Record<ScanPhase, ComponentType | null> = {
    idle: IdleState,
    capturing: CapturingState,
    scanning: ProcessingState,
    reviewing: ReviewingState,
    saving: SavingState,
    error: ErrorState,
  };
  ```
- [ ] **1.5** Implement main render logic with phase switch
- [ ] **1.6** Add JSDoc documentation

### Task 2: Implement Mode-Aware Logic (AC: 3)

- [ ] **2.1** Add mode selector: `const mode = useScanMode()`
- [ ] **2.2** Create CapturingState that handles single vs batch:
  - Single: ScanView/camera UI
  - Batch: BatchCaptureView
  - Statement: Placeholder
- [ ] **2.3** Ensure ReviewingState respects mode for result display
- [ ] **2.4** Add mode prop to state components if needed

### Task 3: Modal Integration Decision & Implementation (AC: 4)

- [ ] **3.1** Audit current scan modals in App.tsx:
  - CurrencyInfoModal
  - TotalAmountDialog
  - QuickSaveModal
  - ScanResultModal (if applicable)
- [ ] **3.2** Decision: Use ModalManager OR inline rendering
- [ ] **3.3** If ModalManager: Configure modal types in registry
- [ ] **3.4** If inline: Add modal rendering to ScanFeature
- [ ] **3.5** Document decision in Dev Notes

### Task 4: Feature Module Exports (AC: 5)

- [ ] **4.1** Update `src/features/scan/index.ts`:
  ```typescript
  export { ScanFeature } from './ScanFeature';
  export * from './store';
  export * from './handlers';
  export * from './components';
  ```
- [ ] **4.2** Verify `@features/scan` import works
- [ ] **4.3** Export any types needed by App.tsx

### Task 5: App.tsx Integration (AC: 6, 8)

- [ ] **5.1** Add import: `import { ScanFeature } from '@features/scan'`
- [ ] **5.2** Identify scan-specific rendering code in App.tsx
- [ ] **5.3** Add `<ScanFeature />` to App.tsx render tree
- [ ] **5.4** Remove inline scan rendering code from App.tsx
- [ ] **5.5** Remove scan state variables made redundant by Zustand store
- [ ] **5.6** Verify FAB mode selector still integrates properly
- [ ] **5.7** Verify navigation blocking preserved
- [ ] **5.8** Document lines removed (target: ~800-1000)

### Task 6: Testing & Verification (AC: 7, 8)

- [ ] **6.1** Create `tests/unit/features/scan/ScanFeature.test.tsx`
- [ ] **6.2** Add tests for each phase rendering
- [ ] **6.3** Add tests for each mode variation
- [ ] **6.4** Run full test suite: `npm run test`
- [ ] **6.5** Execute smoke test checklist (see Dev Notes)
- [ ] **6.6** Verify build: `npm run build`

---

## Dev Notes

### ScanFeature Component Pattern

```typescript
// src/features/scan/ScanFeature.tsx

import { useScanPhase, useScanMode } from './store';
import {
  IdleState,
  ProcessingState,
  ReviewingState,
  ErrorState,
} from './components/states';
import { BatchCaptureView } from './components/BatchCaptureView';
import { SavingIndicator } from './components/SavingIndicator';

/**
 * Orchestrator component for the scan feature.
 * Renders phase-appropriate UI based on Zustand store state.
 */
export function ScanFeature() {
  const phase = useScanPhase();
  const mode = useScanMode();

  switch (phase) {
    case 'idle':
      return <IdleState />;

    case 'capturing':
      // Mode determines which capture UI
      if (mode === 'batch') {
        return <BatchCaptureView />;
      }
      if (mode === 'statement') {
        return <StatementPlaceholder />;
      }
      return <ScanView />;

    case 'scanning':
      return <ProcessingState />;

    case 'reviewing':
      return <ReviewingState />;

    case 'saving':
      return <SavingIndicator />;

    case 'error':
      return <ErrorState />;

    default:
      return null;
  }
}
```

### App.tsx Integration Pattern

```typescript
// In App.tsx - BEFORE (simplified)
return (
  <div>
    {/* ... lots of scan-specific conditional rendering ... */}
    {isScanMode && <ScanView />}
    {isBatchCapture && <BatchCaptureView />}
    {isProcessing && <ScanProgress />}
    {scanError && <ScanError />}
    {/* ... more conditions ... */}
  </div>
);

// In App.tsx - AFTER
import { ScanFeature } from '@features/scan';

return (
  <div>
    <ScanFeature />
    {/* ... other app content ... */}
  </div>
);
```

### Modal Integration Decision

**Option A: Use ModalManager (Recommended)**
- Register scan modals in ModalManager registry (Story 14e.3)
- ScanFeature calls `openModal('currency-info', props)` via store
- Keeps ScanFeature focused on state rendering

**Option B: Inline Rendering**
- ScanFeature renders its own modals based on `activeDialog` from scan store
- More self-contained but duplicates modal rendering logic

**Decision:** Document chosen approach during implementation.

### Smoke Test Checklist

Execute these manual tests after integration:

**1. Single Scan Flow (Workflow #1)**
- [ ] Tap FAB → Camera opens
- [ ] Take photo → Processing animation shows
- [ ] Success → EditView shows with transaction data
- [ ] Save → Transaction saved, credit deducted
- [ ] Cancel → Returns to previous view

**2. Quick Save Flow (Workflow #2)**
- [ ] Scan high-confidence receipt
- [ ] QuickSaveCard appears (≥85% confidence)
- [ ] Accept → Transaction auto-saved
- [ ] Decline → EditView opens

**3. Batch Processing Flow (Workflow #3)**
- [ ] Long-press FAB → Select batch mode
- [ ] Capture 3 receipts
- [ ] Process → Parallel processing with progress
- [ ] Review → BatchReviewView shows all results
- [ ] Save all → Transactions saved

**4. FAB Integration (Workflow #9)**
- [ ] Short tap → Single mode scan
- [ ] Long-press → Mode selector popup
- [ ] Select batch → Batch capture starts
- [ ] Select statement → Placeholder shows

**5. Error Handling**
- [ ] Network error → ErrorState shows with retry
- [ ] Invalid image → Error toast, credits refunded
- [ ] Cancel mid-scan → Warning dialog, then IDLE

**6. Navigation Blocking (Epic 14d)**
- [ ] During scanning → Back button blocked with warning
- [ ] With unsaved results → Confirm dialog on navigate away

### Directory Structure After Completion

```
src/features/scan/
├── index.ts                    # Public API exports
├── ScanFeature.tsx             # NEW - Orchestrator component
├── store/
│   ├── index.ts
│   ├── useScanStore.ts
│   └── selectors.ts
├── handlers/
│   ├── index.ts
│   └── processScan/
│       ├── index.ts
│       ├── processScan.ts
│       ├── subhandlers.ts
│       ├── utils.ts
│       └── types.ts
└── components/
    ├── index.ts
    ├── ScanOverlay.tsx
    ├── ScanStatusIndicator.tsx
    ├── BatchCaptureView.tsx
    └── states/
        ├── index.ts
        ├── IdleState.tsx
        ├── ProcessingState.tsx
        ├── ReviewingState.tsx
        └── ErrorState.tsx

tests/unit/features/scan/
├── ScanFeature.test.tsx        # NEW
├── store/
│   └── useScanStore.test.tsx
└── components/
    └── states/
        └── *.test.tsx
```

### Atlas Workflow Analysis Summary

| Workflow | Risk | Key Verification |
|----------|------|------------------|
| #1 Scan Receipt | HIGH | Full capture→save flow |
| #2 Quick Save | HIGH | Confidence routing |
| #3 Batch Processing | MEDIUM | Parallel processing, batch review |
| #9 Scan Lifecycle | HIGH | FAB integration, phase transitions |

### Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 6 | <= 4 | ⚠️ LARGE (justifiable - orchestrator story) |
| Subtasks | 27 | <= 15 | ⚠️ LARGE (justifiable - orchestrator story) |
| Files | 5-7 | <= 8 | ✅ OK |

**Note:** This story is intentionally larger as it's the orchestrator that ties together all previous Part 2 stories. The subtasks are verification-heavy to ensure no regressions.

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#Story-14e10]
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md]
- [Depends on: 14e-6d] - Scan Zustand store with tests
- [Depends on: 14e-8c] - processScan handler extraction
- [Depends on: 14e-9c] - State components
- [Blocks: 14e-11] - ScanContext Migration & Cleanup

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