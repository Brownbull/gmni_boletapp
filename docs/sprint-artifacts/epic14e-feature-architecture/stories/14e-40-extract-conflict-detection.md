# Story 14e-40: Extract hasActiveTransactionConflict

## Story Info

| Field | Value |
|-------|-------|
| Epic | 14e - Feature Architecture |
| Story ID | 14e-40 |
| Story Name | Extract hasActiveTransactionConflict |
| Priority | High |
| Points | 3 |
| Status | done |
| Created | 2026-01-29 |
| Atlas Enhanced | 2026-01-29 |
| Source | Pre-dev epic review - business logic extraction |

---

## Background

### Problem Statement

`hasActiveTransactionConflict` is a ~75 line business logic function defined in App.tsx that determines if navigating to a transaction would conflict with an active scan.

**Current location:** App.tsx lines 1065-1139

**Purpose:**
- Detects if navigating to edit a transaction conflicts with active scan
- Returns conflict info for showing warning dialogs
- Used by `navigateToTransactionEditor` and `navigateToTransactionDetail`

### Impact

- Core business logic buried in App.tsx
- Could be reused by other features
- ~75 lines of App.tsx could be moved

---

## Acceptance Criteria

### AC1: Pure Utility Function

**Given** the conflict detection logic
**When** extracted
**Then:**
- [x] Pure function with no side effects
- [x] Takes scan state as parameter
- [x] Returns conflict info object
- [x] No dependencies on App.tsx state

### AC2: Correct Location

**Given** the function
**When** determining placement
**Then:**
- [x] Located in `src/features/scan/utils/conflictDetection.ts`
- [x] Exported from scan feature index
- [x] Well-documented with JSDoc

### AC3: App.tsx Updated

**Given** the extracted function
**When** App.tsx needs conflict detection
**Then:**
- [x] Imports from scan feature
- [x] No inline function definition
- [x] Same behavior maintained

### AC4: Comprehensive Tests

**Given** the utility
**When** testing
**Then:**
- [x] Unit tests for all conflict scenarios
- [x] Tests for edge cases
- [x] All existing tests pass

### AC5: Hook Props Interface Update (Atlas)

**Given** the extracted function
**When** `useTransactionEditorHandlers` imports it
**Then:**
- [x] Import from `@features/scan` not App.tsx
- [x] Type signature matches existing prop type
- [x] No breaking changes to consumers
- [x] `handleRequestEdit` works correctly with new import

### AC6: Error Boundary Protection (Atlas)

**Given** conflict detection during scan
**When** any error occurs in the utility
**Then:**
- [x] Return safe default `{ hasConflict: false }` on error
- [x] Log error for debugging (console.warn)
- [x] Never crash the app

---

## Tasks

### Task 1: Create Utility Module (AC: 1, 2, 6)

- [x] **1.1** Create `src/features/scan/utils/conflictDetection.ts`
- [x] **1.2** Define input/output types (ConflictResult, ConflictReason)
- [x] **1.3** Extract logic from App.tsx (lines 1107-1181)
- [x] **1.4** Add JSDoc documentation
- [x] **1.5** Add try-catch wrapper returning safe default on error (AC6)
- [x] **1.6** Export from `src/features/scan/utils/index.ts`
- [x] **1.7** Re-export from `src/features/scan/index.ts`

### Task 2: Write Tests (AC: 4, 6)

- [x] **2.1** Test: no conflict when scan idle
- [x] **2.2** Test: conflict during active single scan
- [x] **2.3** Test: conflict during batch scan
- [x] **2.4** Test: no conflict when editing same transaction
- [x] **2.5** Test: conflict info contains correct reason
- [x] **2.6** Test: returns safe default on malformed input (AC6)

### Task 3: Update App.tsx (AC: 3)

- [x] **3.1** Import from scan feature
- [x] **3.2** Remove inline function (~75 lines)
- [x] **3.3** Update `navigateToTransactionEditor` caller
- [x] **3.4** Update `navigateToTransactionDetail` caller

### Task 4: Update Hook Consumers (AC: 5)

- [x] **4.1** Update `useTransactionEditorHandlers` props interface
- [x] **4.2** Verify `handleRequestEdit` uses extracted function
- [x] **4.3** Update any tests mocking the function

### Task 5: Verification (AC: 4, 5, 6)

- [x] **5.1** Run full test suite
- [x] **5.2** Manual test: navigate during active scan (single mode)
- [x] **5.3** Manual test: navigate during active scan (batch mode)
- [x] **5.4** Manual test: edit same transaction being scanned
- [x] **5.5** Manual test: click Edit in read-only view during active scan

---

## Technical Notes

### Function Signature

```typescript
// src/features/scan/utils/conflictDetection.ts
import type { ScanState } from '@/types/scanStateMachine';
import type { View } from '@app/types';
import type { ConflictingTransaction, ConflictReason } from '@/components/dialogs/TransactionConflictDialog';

export interface ConflictResult {
  hasConflict: boolean;
  conflictInfo?: {
    transaction: ConflictingTransaction;
    reason: ConflictReason;
  };
}

// ConflictReason type is imported from TransactionConflictDialog:
// 'has_unsaved_changes' | 'scan_in_progress' | 'credit_used'

/**
 * Detects if navigating to a transaction would conflict with active scan state.
 *
 * @param scanState - Current scan state from Zustand store
 * @param currentView - Current active view
 * @returns Conflict detection result
 */
export function hasActiveTransactionConflict(
  scanState: ScanState,
  currentView: View
): ConflictResult;
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/features/scan/utils/conflictDetection.ts` | Utility function |
| `tests/unit/features/scan/utils/conflictDetection.test.ts` | Tests |

### Files to Modify

| File | Change |
|------|--------|
| `src/features/scan/utils/index.ts` | Export utility |
| `src/features/scan/index.ts` | Re-export |
| `src/App.tsx` | Import and use utility, remove inline function |
| `src/views/TransactionEditorView/useTransactionEditorHandlers.ts` | Verify import/usage (AC5) |

---

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-29)

### Affected Workflows

| Workflow | Impact | Notes |
|----------|--------|-------|
| **#1 Scan Receipt Flow** | DIRECT | Conflict detection used during scan initiation |
| **#9 Scan Request Lifecycle** | DIRECT | Core conflict detection for REQUEST PRECEDENCE rule |
| **#3 Batch Processing Flow** | DIRECT | Batch mode conflict detection |
| **#6 History Filter Flow** | INDIRECT | Navigating to editor from history |
| **#8 Trust Merchant Flow** | INDIRECT | Trust prompt after save may trigger conflict check |

### Downstream Effects to Consider

1. **useTransactionEditorHandlers hook** - Receives `hasActiveTransactionConflict` as prop
2. **navigateToTransactionEditor** - Primary caller for editor navigation
3. **navigateToTransactionDetail** - Read-only navigation with conflict check
4. **handleRequestEdit** - Edit mode conversion uses conflict check

### Testing Implications

- **Existing tests to verify:** `useTransactionEditorHandlers.test.ts`, App.tsx integration tests
- **New scenarios to add:** Error boundary protection, malformed input handling

### Workflow Chain Visualization

```
[User clicks History item] → navigateToTransactionDetail() → hasActiveTransactionConflict() →
  ✓ No conflict: Show detail view
  ✗ Conflict: Auto-navigate to active scan view
```

---

## Definition of Done

- [x] AC1: Pure utility function created
- [x] AC2: Correct location and exports
- [x] AC3: App.tsx updated to use utility
- [x] AC4: Comprehensive tests pass
- [x] AC5: Hook consumers updated (Atlas)
- [x] AC6: Error boundary protection implemented (Atlas)
- [x] Code reviewed and approved
- [x] Manual smoke test passed

---

## File List

| File | Status |
|------|--------|
| `src/features/scan/utils/conflictDetection.ts` | Created |
| `src/features/scan/utils/index.ts` | Created |
| `src/features/scan/index.ts` | Modified |
| `src/App.tsx` | Modified |
| `src/views/TransactionEditorView/useTransactionEditorHandlers.ts` | Modified |
| `tests/unit/features/scan/utils/conflictDetection.test.ts` | Created |

---

## Change Log

| Date | Change |
|------|--------|
| 2026-01-30 | Story implemented: extracted hasActiveTransactionConflict to scan utils, added 23 unit tests, updated App.tsx wrapper, updated hook props interface |
| 2026-01-30 | Code Review: Removed 14 lines of dead code (unreachable reviewing phase check). Fixed Technical Notes to match actual function signature. All 23 tests pass. |

---

## Dev Agent Record

### Implementation Plan

1. Created `src/features/scan/utils/conflictDetection.ts` with pure utility function
2. Used TDD approach: wrote failing tests first, then implemented to make them pass
3. Updated App.tsx to use wrapper that calls utility with current state
4. Updated `useTransactionEditorHandlers` props interface to use `ConflictResult` type

### Completion Notes

**Implementation Summary:**
- Extracted ~75 lines of business logic from App.tsx to a pure utility function
- Created `ConflictResult` interface that properly types the return value
- Implemented error boundary protection (AC6) with try-catch returning safe default
- 23 unit tests covering all conflict scenarios, edge cases, and malformed input
- App.tsx now uses a 3-line wrapper instead of the 75-line inline function
- Updated `useTransactionEditorHandlers` to import `ConflictResult` type from `@features/scan`

**Lines Removed from App.tsx:** ~72 lines (inline function body replaced with 3-line wrapper)

**Test Results:** All 7037 tests pass
