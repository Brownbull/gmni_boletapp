# Tech Debt Story TD-18-5: ScanCompleteModal Save Transition Fix

Status: done

> **Source:** Production UX issue (2026-03-13)
> **Priority:** MEDIUM | **Estimated Effort:** 2 points

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Show the save, don't flash the editor"
**Value:** V5 — "Easier than the receipt drawer" — a confusing transition after pressing save adds friction and makes users think the button didn't work.

## Story
As a **user**, I want **the quick save modal to stay visible with a saving indicator until I'm taken to the home screen**, so that **I see clear feedback that my transaction is being saved and don't see a confusing flash of the editor**.

## Background

### Symptom
After pressing "Guardar ahora" on the ScanCompleteModal (quick save after scan):
1. Modal disappears immediately
2. The underlying transaction editor is briefly visible
3. Then navigates to dashboard

### Root Cause
In `TransactionEditorScanStatus.tsx:79-82`:
```typescript
const handleScanCompleteSave = async () => {
  setShowScanCompleteModal(false);  // ← CLOSES MODAL BEFORE SAVE
  await onSaveWithLearning();       // ← Save + navigation happens AFTER
};
```

The modal hides before the save even starts. The editor is exposed underneath for the entire async chain (learning modals check → Firestore write → navigation to dashboard).

### Why learning modals are NOT a concern here
From the ScanCompleteModal path, the user hasn't edited anything — no category changes, no subcategory changes, no merchant edits. The learning modal chain (`handleSaveWithLearning`) skips all modals and goes straight to `onFinalSave()`. So there's no z-index collision risk.

## Acceptance Criteria

### Functional
- **AC-1:** After pressing "Guardar ahora", the ScanCompleteModal stays visible with the saving spinner ("Guardando...") — uses existing `isSaving` prop support
- **AC-2:** Modal disappears naturally when the view changes to 'dashboard' (component unmounts with the editor)
- **AC-3:** No flash of the editor between modal close and dashboard navigation
- **AC-4:** The "Editar primero" flow (dismiss modal, show editor) is unaffected

### Technical
- **AC-5:** Remove `setShowScanCompleteModal(false)` from `handleScanCompleteSave` — let unmount handle cleanup
- **AC-6:** Set a local saving flag BEFORE calling `onSaveWithLearning` so the modal shows spinner immediately

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| ScanStatus wrapper | `src/features/transaction-editor/views/TransactionEditorScanStatus.tsx` | EDIT |
| Tests | `tests/unit/features/transaction-editor/` | NEW/EDIT |

## Tasks

### Task 1: Fix modal transition (2 subtasks)
- [x] 1.1: In `handleScanCompleteSave`: remove `setShowScanCompleteModal(false)`. Add local `isSavingFromModal` state, set to true before `await onSaveWithLearning()`.
- [x] 1.2: Pass `isSavingFromModal` as `isSaving` prop to ScanCompleteModal — triggers existing spinner UI

### Task 2: Tests (2 subtasks)
- [x] 2.1: Integration test: render TransactionEditorScanStatus, trigger save → verify modal visible with spinner
- [x] 2.2: Integration test: trigger edit → verify modal closes, editor visible

## Sizing
- **Points:** 2 (SMALL)
- **Tasks:** 2
- **Subtasks:** 4
- **Files:** ~2

## Dependencies
- None (standalone)

## Risk Flags
- None — focused, localized change with clear root cause

## Senior Developer Review (KDBP)

- **Date:** 2026-03-15
- **Classification:** TRIVIAL
- **Agents:** code-reviewer, ui-consistency
- **Outcome:** APPROVE 8.25/10 — 3 quick fixes applied, 1 deferred to backlog
- **Quick fixes:** (1) Add try/catch for error recovery on save failure, (2) Add error recovery test, (3) Merge duplicate imports
- **Deferred:** Dead `isSaving` prop cleanup → backlog (PROD)

<!-- CITED: L2-008 -->
