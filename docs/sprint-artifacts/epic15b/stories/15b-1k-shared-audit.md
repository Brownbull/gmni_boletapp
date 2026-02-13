# Story 15b-1k: Shared Audit

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 1
**Priority:** LOW
**Status:** drafted

## Description

After all consolidation stories (15b-1a through 15b-1j), audit remaining files in flat `src/hooks/`, `src/components/`, `src/utils/`, and `src/services/` to verify they are truly cross-feature shared code. Flag any files that should have been moved but were missed.

## Acceptance Criteria

- [ ] **AC1:** All files remaining in flat directories verified as cross-feature (used by 2+ features)
- [ ] **AC2:** Any feature-specific files found are flagged for follow-up (or moved immediately if simple)
- [ ] **AC3:** Audit results documented with file-by-file justification
- [ ] **AC4:** `src/views/` has <10 files (routing shells only)
- [ ] **AC5:** `src/hooks/` has <20 files (cross-feature only)
- [ ] **AC6:** `src/components/` has <30 files (shared only)

## Tasks

- [ ] **Task 1:** Audit `src/hooks/` — verify each remaining hook is used by 2+ features
  - [ ] grep each hook for imports from different feature modules
- [ ] **Task 2:** Audit `src/components/` — verify each component is shared
  - [ ] grep each component for imports from different features or views
- [ ] **Task 3:** Audit `src/utils/` and `src/services/` — same verification
- [ ] **Task 4:** Move any misplaced files found during audit
- [ ] **Task 5:** Document audit results (counts per directory)

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/*.ts` | VERIFY | Confirm cross-feature usage |
| `src/components/*.tsx` | VERIFY | Confirm shared usage |
| `src/utils/*.ts` | VERIFY | Confirm shared usage |
| `src/services/*.ts` | VERIFY | Confirm shared usage |
| Misplaced files (if found) | MOVE | → appropriate `features/*/` |

## Dev Notes

- This story depends on 15b-1a through 15b-1j being complete
- "Cross-feature" = imported by 2+ different feature modules, or by App.tsx/routing
- Files used by only 1 feature should be moved into that feature
- Infrastructure files (Firebase config, auth, error handler) are legitimately shared
