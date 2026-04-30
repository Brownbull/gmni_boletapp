# Tech Debt Story TD-18-23: Differentiate Scan Overlay Save vs Edit Button Behavior

Status: done

> **Source:** ECC Code Review (2026-04-06) on story TD-18-19-scan-ux-immediate-overlay
> **Priority:** MEDIUM | **Estimated Effort:** 2 points
> **Stage:** MVP

## Story
As a **user**, I want **"Guardar ahora" to save directly and "Editar primero" to open the editor**, so that **the button labels match their actual behavior and I don't see redundant save/edit options**.

## Background

TD-18-19 added save/edit buttons to the scan result overlay. Currently, both `onSave` and `onEdit` are wired to the same handler (`onScanOverlayDismiss`) in `ScanFeature.tsx:478-479`. Both buttons dismiss the overlay and proceed to QuickSaveCard, which presents its own save/edit buttons — making the overlay buttons redundant and misleading.

**Options:**
- **Option A:** Wire `onSave` to trigger QuickSaveCard's save flow directly (skip the card UI), wire `onEdit` to navigate to transaction editor
- **Option B:** Replace the two buttons with a single "Continuar" button that dismisses to QuickSaveCard (simpler, fewer states)
- **Option C:** Remove buttons entirely, keep auto-dismiss to QuickSaveCard (revert to pre-TD-18-19 flow for the ready state)

## Acceptance Criteria

### Task 1: Differentiate or simplify button behavior
- [x] AC-1: "Guardar ahora" and "Editar primero" perform distinct actions, OR buttons are replaced with a single unambiguous action
- [x] AC-2: No duplicate save/edit choice presented to the user in the same flow
- [x] AC-3: Auto-dismiss behavior preserved when no action buttons are present (backward compat)

### Task 2: Update tests
- [x] AC-4: Tests verify the chosen button behavior(s)
- [x] AC-5: Test for no-auto-dismiss when action buttons present still passes

## Dev Notes
- Source story: [TD-18-19-scan-ux-immediate-overlay](./TD-18-19-scan-ux-immediate-overlay.md)
- Review findings: #1
- Files affected: `src/features/scan/ScanFeature.tsx`, `src/features/scan/hooks/useScanInitiation.ts`, tests

## Senior Developer Review (ECC)
- **Date:** 2026-04-06
- **Agents:** code-reviewer, tdd-guide (SIMPLE classification)
- **Outcome:** APPROVE 7.3/10 — 7 quick fixes applied, 2 deferred to backlog
- **Action items:** 0 remaining (all quick fixes applied)
<!-- CITED: L2-008 -->

## Deferred Items (from code review 2026-04-06)

| # | Finding | Stage | Destination | Tracking |
|---|---------|-------|-------------|----------|
| 3 | Duplicate store reads (results/activeResultIndex) in ScanFeature + ScanOverlay | PROD | Backlog | deferred-findings.md |
| 10 | Unhandled promise rejection in overlay save handler (onQuickSave async) | PROD | Backlog | deferred-findings.md |
