# Story 14e.20a: Toast Hook Extraction

Status: ready-for-dev

> **Part 1/2** of UI State Extraction split. See also: [14e-20b-settings-store-extraction.md](./14e-20b-settings-store-extraction.md)

## Story

As a **developer**,
I want **toast state extracted from App.tsx to a shared hook**,
So that **toast notifications are centralized and can be accessed from any component**.

## Acceptance Criteria

1. **Given** toast state (`toastMessage`, `setToastMessage`) in App.tsx
   **When** this story is completed
   **Then** toast state is managed by `src/shared/hooks/useToast.ts`

2. **Given** auto-dismiss logic in App.tsx (3-second timeout)
   **When** toast is shown
   **Then** it auto-dismisses after the configured timeout

3. **Given** the new useToast hook
   **When** used by App.tsx and ViewHandlersContext
   **Then** all existing toast functionality works without regressions

4. **Given** toast notifications across workflows
   **When** any workflow shows a toast
   **Then** the toast appears correctly with proper styling

## Tasks / Subtasks

- [ ] **Task 1: Create useToast hook** (AC: #1, #2)
  - [ ] Create `src/shared/hooks/useToast.ts`
  - [ ] Implement toast state and auto-dismiss effect
  - [ ] Export `{ toastMessage, showToast, dismissToast }`
  - [ ] Write unit tests for auto-dismiss behavior

- [ ] **Task 2: Update App.tsx** (AC: #3, #4)
  - [ ] Remove `toastMessage` useState and auto-dismiss useEffect
  - [ ] Import and use `useToast()` hook
  - [ ] Update `dialogHandlers` useMemo to use hook's `showToast`
  - [ ] Verify toast works in all views

- [ ] **Task 3: Verification** (AC: #3, #4)
  - [ ] Run all tests
  - [ ] Build succeeds
  - [ ] Manual smoke test: trigger toasts from scan, save, settings

## Dev Notes

### Implementation

```typescript
// src/shared/hooks/useToast.ts
import { useState, useCallback, useEffect } from 'react';

export interface ToastMessage {
  text: string;
  type: 'success' | 'info';
}

export const useToast = (autoDissmissMs = 3000) => {
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' = 'info') => {
    setToastMessage({ text, type });
  }, []);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(dismissToast, autoDissmissMs);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, autoDissmissMs, dismissToast]);

  return { toastMessage, showToast, dismissToast };
};
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/shared/hooks/useToast.ts` | Toast state and auto-dismiss logic |
| `src/shared/hooks/useToast.test.ts` | Unit tests |

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Remove toast state, use hook |
| `src/shared/hooks/index.ts` | Export useToast (if barrel exists) |

### Testing Strategy

1. Auto-dismiss after 3000ms (default)
2. Multiple toasts replace previous (no queue)
3. Manual dismiss clears immediately
4. Hook re-renders only when toast changes

## Atlas Workflow Analysis

### Affected Workflows

- **#1 Scan Receipt:** Uses toast for success/error notifications
- **#2 Quick Save:** Uses toast for auto-save confirmation
- **#3 Batch Processing:** Uses toast for batch completion
- **#5 Learning Flow:** Uses toast for mapping saved

### Risk Level: LOW

Toast extraction is a pure refactor with no behavior change.

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#Story-14e.20]
- [Source: src/App.tsx:578] - toastMessage state
- [Source: src/App.tsx:753-758] - auto-dismiss effect

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Completion Notes List

(To be filled on completion)

### File List

(To be filled on completion)
