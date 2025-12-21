# Story 11.5: Scan Status Clarity

**Epic:** Epic 11 - Quick Save & Scan Flow Optimization
**Status:** Ready for Dev
**Story Points:** 3
**Dependencies:** None (Parallel with Story 11.1)
**Parallel With:** Story 11.1 (One Image One Transaction)
**Tech Context:** [tech-context-epic11.md](./tech-context-epic11.md)

---

## User Story

As a **user**,
I want **to see clear status updates during the scanning process**,
So that **I know exactly what's happening and when my receipt is ready**.

---

## Acceptance Criteria

- [ ] **AC #1:** Clear visual states: Uploading → Processing → Ready → Error
- [ ] **AC #2:** "Uploading" shows progress indicator and percentage
- [ ] **AC #3:** "Processing" shows skeleton loader with shimmer effect
- [ ] **AC #4:** "Ready" shows scan complete with checkmark before Quick Save Card
- [ ] **AC #5:** "Error" shows clear message with retry option
- [ ] **AC #6:** Status transitions are animated (fade)
- [ ] **AC #7:** User can cancel at any state before Ready
- [ ] **AC #8:** Estimated time shown during Processing (optional based on history)

---

## Tasks / Subtasks

### Task 1: Define Scan State Machine (0.5h)
- [ ] Create state enum:
  ```typescript
  type ScanState =
    | 'idle'       // Ready to scan
    | 'uploading'  // Image uploading to server
    | 'processing' // AI processing receipt
    | 'ready'      // Results ready
    | 'error';     // Something went wrong
  ```
- [ ] Define transitions and triggers
- [ ] Handle edge cases (timeout, network issues)

### Task 2: Create Upload Progress Component (0.5h)
- [ ] Create `src/components/ScanProgress.tsx`
- [ ] Upload state:
  ```
  ┌─────────────────────────────────────────┐
  │           📤 Subiendo...                │
  │                                         │
  │  ██████████████░░░░░░░░░  75%          │
  │                                         │
  │           [Cancelar]                    │
  └─────────────────────────────────────────┘
  ```
- [ ] Use actual upload progress from XHR/fetch
- [ ] Cancel button aborts upload

### Task 3: Create Processing Skeleton Loader (1h)
- [ ] Create shimmer effect skeleton:
  ```
  ┌─────────────────────────────────────────┐
  │  ░░░░░░░░░░░░░░  (Merchant placeholder) │
  │                                         │
  │  ░░░░░░░░░░░░░░░░░░░░░░░ (Total)        │
  │                                         │
  │  ░░░░░░░░░░░░░░░░░░  (Item 1)          │
  │  ░░░░░░░░░░░░░░░░░░  (Item 2)          │
  │  ░░░░░░░░░░░░░░░░░░  (Item 3)          │
  │                                         │
  │     🔄 Procesando recibo...             │
  │     ~3-5 segundos                       │
  └─────────────────────────────────────────┘
  ```
- [ ] Shimmer animation (gradient moving left to right)
- [ ] Show estimated time based on historical average

### Task 4: Create Ready State Indicator (0.25h)
- [ ] Brief "✓ Listo" indicator before showing results
- [ ] Duration: 500ms
- [ ] Checkmark animation (scale bounce)
- [ ] Transition to Quick Save Card or Edit View

### Task 5: Create Error State Component (0.5h)
- [ ] Design error display:
  ```
  ┌─────────────────────────────────────────┐
  │           ⚠️ Algo salió mal             │
  │                                         │
  │  No pudimos procesar la imagen.         │
  │  Intenta con otra foto.                 │
  │                                         │
  │  ┌─────────────┐  ┌─────────────┐      │
  │  │   Reintentar │  │   Cancelar  │      │
  │  └─────────────┘  └─────────────┘      │
  └─────────────────────────────────────────┘
  ```
- [ ] Different messages for different error types
- [ ] Retry preserves original image (if possible)

### Task 6: Implement State Transitions (0.5h)
- [ ] Wire up state machine to scan flow
- [ ] Smooth fade transitions between states
- [ ] Handle rapid state changes gracefully
- [ ] Timeout handling (if processing takes >30s)

### Task 7: Add Translations (0.25h)
- [ ] Add all status strings to translations.ts
- [ ] Support EN/ES
- [ ] Error messages are helpful, not technical

### Task 8: Testing (0.5h)
- [ ] Unit tests for state machine
- [ ] Unit tests for each status component
- [ ] Integration test for full upload → process → ready flow
- [ ] Test error states and retry
- [ ] Test cancel at each state

---

## Technical Summary

Clear status communication reduces user anxiety during the scan process. The progression from uploading to processing to ready gives users confidence that something is happening.

**State Flow:**
```
Idle → [Capture/Upload] → Uploading (with progress) →
Processing (skeleton + shimmer) → Ready (brief checkmark) →
Quick Save Card / Edit View

Error at any point → Error state with retry
```

**Visual Feedback:**
- Upload: Progress bar with percentage
- Processing: Skeleton placeholders with shimmer animation
- Ready: Checkmark with brief celebration
- Error: Clear message with actionable options

---

## Project Structure Notes

- **Files to create:**
  - `src/components/ScanProgress.tsx`
  - `src/components/ScanSkeleton.tsx`
  - `src/components/ScanError.tsx`
  - `src/hooks/useScanState.ts`

- **Files to modify:**
  - `src/views/ScanView.tsx` - Integrate status components
  - `src/utils/translations.ts` - Add status strings

- **Estimated effort:** 3 story points (~5 hours)
- **Prerequisites:** Story 11.1 (single image flow)

---

## Key Code References

**Scan State Hook:**
```typescript
// src/hooks/useScanState.ts
type ScanState = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

interface ScanStateHook {
  state: ScanState;
  progress: number; // 0-100 for uploading
  error: Error | null;
  startUpload: (file: File) => void;
  cancel: () => void;
  retry: () => void;
}

export function useScanState(): ScanStateHook {
  const [state, setState] = useState<ScanState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const startUpload = async (file: File) => {
    setState('uploading');
    setProgress(0);

    try {
      await uploadWithProgress(file, (percent) => setProgress(percent));
      setState('processing');

      const result = await processReceipt();
      setState('ready');
      // Transition to Quick Save Card
    } catch (err) {
      setState('error');
      setError(err);
    }
  };

  const cancel = () => {
    abortUpload();
    setState('idle');
  };

  const retry = () => {
    startUpload(lastFile);
  };

  return { state, progress, error, startUpload, cancel, retry };
}
```

**Skeleton Shimmer CSS:**
```css
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    #e0e0e0 25%,
    #f0f0f0 50%,
    #e0e0e0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## UI Specifications

**Upload Progress:**
- Progress bar: Full width, 8px height
- Color: Brand teal
- Percentage: Right-aligned above bar

**Skeleton:**
- Rectangle placeholders with rounded corners
- Height varies by content type (title=24px, text=16px)
- Shimmer effect animates continuously
- Background: Gray 200 (light) / Gray 700 (dark)

**Error State:**
- Icon: Warning triangle (amber)
- Message: Clear, actionable
- Buttons: Primary (Retry), Secondary (Cancel)

---

## Context References

**PRD:** [epics.md](../../planning/epics.md) - Epic 11 Scan Status Clarity

---

## Definition of Done

- [ ] All 8 acceptance criteria verified
- [ ] All states render correctly
- [ ] Upload progress shows real percentage
- [ ] Skeleton has shimmer animation
- [ ] Error state with retry works
- [ ] Cancel works at each state
- [ ] Tests passing
- [ ] Code review approved

---

## Dev Agent Record

### Agent Model Used
<!-- Will be populated during dev-story execution -->

### Completion Notes
<!-- Will be populated during dev-story execution -->

### Files Modified
<!-- Will be populated during dev-story execution -->

### Test Results
<!-- Will be populated during dev-story execution -->

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 11 definition |
