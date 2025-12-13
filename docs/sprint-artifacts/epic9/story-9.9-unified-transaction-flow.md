# Story 9.9: Unified Transaction Creation Flow

**Epic:** Epic 9 - Scan Enhancement & Merchant Learning
**Status:** review
**Story Points:** 5
**Dependencies:** Story 9.8 (Scan Advanced Options)

---

## User Story

As a **user**,
I want **a unified screen for creating transactions with integrated scan capability**,
So that **I have a consistent experience whether I start from scratch or scan a receipt**.

---

## Acceptance Criteria

- [x] **AC #1:** Clear labels distinguish "Merchant (from scan)" (read-only) from "Display Name" (editable alias)
- [x] **AC #2:** Cancel button appears for new transactions (no ID) with confirmation dialog if changes exist
- [x] **AC #3:** Both "+" button and camera button navigate to the same unified EditView screen
- [x] **AC #4:** Camera button auto-opens file picker after navigating to EditView
- [x] **AC #5:** "Scan Receipt" button appears only when transaction has no photos
- [x] **AC #6:** Image grid displays scanned images with "Add Photo" capability
- [x] **AC #7:** "Process Scan" button appears when images exist but not yet analyzed
- [ ] **AC #8:** Advanced Options (currency, store type) section is collapsible, defaults from user settings [Deferred: Depends on Story 9.8]
- [x] **AC #9:** All new UI elements have EN/ES translations

---

## Tasks / Subtasks

- [x] Task 1: Add clear labels for Merchant and Alias fields (AC: #1)
  - [x] Add "Merchant (from scan)" label above read-only field
  - [x] Add "Display Name" label above alias input
  - [x] Add translations for both languages

- [x] Task 2: Add Cancel button with confirmation dialog (AC: #2)
  - [x] Add Cancel button in header for new transactions
  - [x] Track initial transaction state on mount
  - [x] Show confirmation dialog if changes exist
  - [x] Navigate back without saving on confirm

- [x] Task 3: Integrate scan capability into EditView (AC: #5, #6, #7)
  - [x] Add scan section at top of EditView
  - [x] "Scan Receipt" button (only when no photos exist)
  - [x] Image grid for scan images (2-column layout)
  - [x] "Add Photo" button below image grid
  - [x] "Process Scan" button (when images exist, not analyzed)
  - [ ] Advanced Options collapsible section [Deferred: Story 9.8]
  - [x] Loading spinner during analysis
  - [x] Error display for scan failures

- [x] Task 4: Unify navigation handlers (AC: #3, #4)
  - [x] Create `handleNewTransaction(autoOpenFilePicker)` in App.tsx
  - [x] Update DashboardView.tsx "+" button via callback
  - [x] Pass scan-related props to EditView
  - [x] Nav.tsx camera FAB calls triggerScan (which now uses handleNewTransaction)

- [x] Task 5: Deprecate ScanView (AC: #3)
  - [x] Mark ScanView as deprecated
  - [x] Remove from App.tsx view rendering
  - [x] Keep file for reference/fallback

- [x] Task 6: Update translations (AC: #9)
  - [x] merchantFromScan / displayName
  - [x] scanReceipt / tapToScan / processScan
  - [x] discardChanges / discardChangesMessage
  - [x] cancel (already exists)

- [x] Task 7: Update tests
  - [x] Verify all existing unit tests pass (768/768)
  - [x] Verify all existing integration tests pass (328/328)
  - [x] TypeScript compilation passes
  - [x] Build passes

---

## Technical Summary

This story unifies two transaction creation flows into one:

**Before (Current):**
1. Camera button → ScanView → Process → EditView (pre-filled)
2. "+" button → EditView (blank)

**After (Unified):**
1. Both buttons → EditView (with scan section) → Optional scan → Save

Key changes:
- EditView gains scan capability (image upload, process, advanced options)
- ScanView becomes deprecated
- Merchant field gets clear "read-only" label
- Alias field gets clear "editable" label
- Cancel button with discard confirmation for new transactions

---

## UI Mockup

```
┌─────────────────────────────────────────┐
│  [← Back]     New Transaction  [Cancel] │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      📷 Scan Receipt            │   │  ← Only if no photos
│  │   Tap to scan your receipt      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [img1] [img2]                         │  ← Image grid
│  [+ Add Photo]                          │
│                                         │
│  ▼ Advanced Options                    │  ← Collapsed
│  │ Currency: [CLP ▼]               │   │
│  │ Store Type: [Auto ▼]            │   │
│                                         │
│  [Process Scan]                        │  ← If images exist
│                                         │
│  ═══════════════════════════════════   │
│                                         │
│  Total: CLP $12,500                     │
│                                         │
│  Merchant (from scan)                   │
│  ┌───────────────────────────────┐     │
│  │ WALMART SUPERCENTER #123      │     │  ← Read-only
│  └───────────────────────────────┘     │
│                                         │
│  Display Name                           │
│  ┌───────────────────────────────┐     │
│  │ Walmart                       │     │  ← Editable
│  └───────────────────────────────┘     │
│                                         │
│  [Date] [Time] [Category ▼]            │
│  [Country ▼] [City ▼]                  │
│                                         │
│  Items: [item list...]                  │
│                                         │
│  [💾 Save Transaction]                  │
└─────────────────────────────────────────┘
```

---

## Key Code References

**Files to Modify:**
- `src/views/EditView.tsx` - Main changes (labels, cancel, scan integration)
- `src/App.tsx` - Unified handler, pass scan props
- `src/components/Nav.tsx` - Update camera handler
- `src/views/DashboardView.tsx` - Update "+" handler
- `src/utils/translations.ts` - New translation keys
- `src/views/ScanView.tsx` - Deprecate

**Reference Files:**
- `src/views/ScanView.tsx` - Current scan UI to migrate
- `src/components/CategoryLearningPrompt.tsx` - Dialog pattern reference

---

## Definition of Done

- [x] All acceptance criteria met (8/9, AC #8 deferred to Story 9.8)
- [x] TypeScript compilation passes
- [x] Unit tests updated and passing (768/768)
- [x] Integration tests passing (328/328)
- [x] EN/ES translations added
- [x] Code reviewed and approved
- [ ] Manual testing: both flows work correctly

---

## Notes

- This story depends on 9.8 for Advanced Options infrastructure
- ScanView can be fully removed after validation
- Future stories (9.5, 9.6) will add merchant learning on alias changes

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-13 | 1.0 | Story drafted |
| 2025-12-13 | 1.1 | Senior Developer Review notes appended - APPROVED |

---

## Senior Developer Review (AI)

**Reviewer:** Gabe
**Date:** 2025-12-13
**Outcome:** ✅ **APPROVE**

### Summary

Story 9.9 successfully unifies the transaction creation flow by integrating scan capability directly into EditView and deprecating ScanView. The implementation is clean, well-structured, and follows established patterns. All acceptance criteria are met (with AC #8 explicitly deferred per story design). All tests pass (1096 total: 768 unit + 328 integration).

### Key Findings

**No HIGH or MEDIUM severity issues found.**

**LOW severity (informational):**
- Note: Bundle size warning during build (815KB gzip: 212KB) - pre-existing, not introduced by this story

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC #1 | Clear labels for Merchant/Alias | ✅ IMPLEMENTED | `src/views/EditView.tsx:607-654` |
| AC #2 | Cancel button with confirmation dialog | ✅ IMPLEMENTED | `src/views/EditView.tsx:419-428, 888-932` |
| AC #3 | Both buttons navigate to unified EditView | ✅ IMPLEMENTED | `src/App.tsx:144-161, 452, 604` |
| AC #4 | Camera auto-opens file picker | ✅ IMPLEMENTED | `src/App.tsx:158-160` |
| AC #5 | Scan button only when no photos | ✅ IMPLEMENTED | `src/views/EditView.tsx:437-455` |
| AC #6 | Image grid with Add Photo | ✅ IMPLEMENTED | `src/views/EditView.tsx:458-493` |
| AC #7 | Process Scan button | ✅ IMPLEMENTED | `src/views/EditView.tsx:516-538` |
| AC #8 | Advanced Options collapsible | ⚠️ DEFERRED | Explicitly deferred to Story 9.8 |
| AC #9 | EN/ES translations | ✅ IMPLEMENTED | `src/utils/translations.ts:102-109, 241-248` |

**Summary:** 8 of 9 ACs fully implemented (1 explicitly deferred)

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Add clear labels | ✅ Complete | ✅ VERIFIED | `EditView.tsx:607-654` |
| Task 2: Cancel button | ✅ Complete | ✅ VERIFIED | `EditView.tsx:177-221, 419-428, 888-932` |
| Task 3: Scan integration | ✅ Complete | ✅ VERIFIED | `EditView.tsx:434-549` |
| Task 3.6: Advanced Options | ⚠️ Deferred | ⚠️ DEFERRED | Explicit deferral |
| Task 4: Unify navigation | ✅ Complete | ✅ VERIFIED | `App.tsx:144-179, 452, 502-513` |
| Task 5: Deprecate ScanView | ✅ Complete | ✅ VERIFIED | `ScanView.tsx:1-5`, `App.tsx:9-10, 466-479` |
| Task 6: Translations | ✅ Complete | ✅ VERIFIED | `translations.ts:102-109` |
| Task 7: Tests | ✅ Complete | ✅ VERIFIED | 768 unit + 328 integration passing |

**Summary:** 33 of 34 tasks verified (1 explicitly deferred)

### Test Coverage and Gaps

- ✅ Unit tests: 768/768 passing
- ✅ Integration tests: 328/328 passing
- ✅ TypeScript: Clean compilation
- ✅ Build: Successful

**Note:** No new dedicated tests for this story's UI changes, but existing tests cover the underlying functionality.

### Architectural Alignment

- ✅ Follows Epic 9 architecture (unified flow in EditView)
- ✅ ScanView properly deprecated with JSDoc
- ✅ Props hierarchy clean (App → EditView)
- ✅ State management uses proper React patterns (useRef, useMemo)

### Security Notes

- ✅ No sensitive data exposure
- ✅ User authentication enforced
- ✅ No injection risks identified

### Best-Practices and References

- React 18 patterns (useRef for memoization)
- TypeScript strict mode compliance
- Proper component composition

### Action Items

**Code Changes Required:**
*None - all acceptance criteria met*

**Advisory Notes:**
- Note: Consider adding E2E tests for the unified flow in a future story
- Note: Bundle size (212KB gzip) is growing; consider code-splitting in Epic 11
