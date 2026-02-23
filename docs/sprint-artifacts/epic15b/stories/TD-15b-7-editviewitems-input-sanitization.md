# Tech Debt Story TD-15b-7: EditViewItemsSection Input Sanitization

**Status:** ready-for-dev

> **Source:** ECC Code Review (2026-02-23) on story TD-15b-5
> **Priority:** LOW | **Estimated Effort:** 1 pt

## Story

As a **developer**, I want **user-supplied item name and subcategory inputs sanitized before they reach `handleUpdateItem`**, so that **XSS-style injection via item text fields is prevented per project security rules**.

## Background

`EditViewItemsSection.tsx` renders inline edit inputs for item `name` and `subcategory` fields. Both pass `e.target.value` directly to `handleUpdateItem` without going through `sanitizeInput()`. Per project rules, all user-facing strings must be sanitized with `maxLength`.

This is a pre-existing pattern inherited from `EditView.tsx` before the TD-15b-2a extraction. Both the grouped view and original-order view inputs are affected.

## Acceptance Criteria

- [ ] **AC1:** Item `name` inputs in both views call `sanitizeInput(e.target.value, { maxLength: 100 })` before invoking `handleUpdateItem`
- [ ] **AC2:** Item `subcategory` inputs in both views call `sanitizeInput(e.target.value, { maxLength: 50 })` before invoking `handleUpdateItem`
- [ ] **AC3:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Add sanitization to item name inputs
- [ ] 1.1 Import `sanitizeInput` from `@/utils/sanitize` in `EditViewItemsSection.tsx`
- [ ] 1.2 Grouped view name input (line ~178): wrap with `sanitizeInput(e.target.value, { maxLength: 100 })`
- [ ] 1.3 Original-order view name input (line ~230): same

### Task 2: Add sanitization to subcategory inputs
- [ ] 2.1 Grouped view subcategory input (line ~181): wrap with `sanitizeInput(e.target.value, { maxLength: 50 })`
- [ ] 2.2 Original-order view does not render a subcategory input — confirm and document

### Task 3: Verify
- [ ] 3.1 Run `npm run test:quick` — confirm all pass
- [ ] 3.2 Run `npx tsc --noEmit` — confirm clean

## Dev Notes

- Source story: [TD-15b-5](./TD-15b-5-editviewitems-code-quality.md)
- Review finding: #8 (missing input sanitization, LOW severity)
- Files affected: `src/features/transaction-editor/views/EditViewItemsSection.tsx` (1 file)
- Pre-existing: pattern inherited from `EditView.tsx` extraction — `EditView.tsx` likely has the same gap but is out of scope here
- Check `src/utils/sanitize.ts` for the correct function signature before implementing
