# E2E Testing Lessons Learned - Story 14d-v2-1-14

**Date:** 2026-02-05
**Context:** Multi-user join flow E2E tests (join-flow-opt-in.spec.ts)
**Sessions:** 5 (ran out of context 4 times)
**Total test runs:** 23 (only last 3 passed)
**Model:** Claude Opus 4.6

---

## Executive Summary

Writing 4 E2E tests for the join flow opt-in feature consumed ~5 hours across 5 sessions with 23 test runs. Only 3 of 5 root cause chains were truly unavoidable runtime discoveries. The other 2 were caused by **our own conventions actively teaching wrong patterns** and **workflow gaps that skip mandatory pre-flight research**.

The single highest-leverage insight: **3 of 5 root cause chains trace back to not reading component source files before writing tests.** This is not a developer discipline problem -- our ECC workflow never requires it, and our conventions doc provides copy-paste patterns that avoid source reading entirely.

---

## Full Failure Timeline (23 Runs)

### Phase 1: Initial Writing + Firestore Rules (Runs 1-3)

| Run | Result | Root Cause | Category |
|-----|--------|-----------|----------|
| 1 | 4/4 timeout | Firestore rules blocked non-member reads of sharedGroups | SYSTEMIC |
| 2 | 4/4 timeout (diagnostic) | Same -- captured screenshots to diagnose | UNAVOIDABLE |
| 3 | 2 pass, 2 fail | Rules deployed; AC9/AC10 fail at create-btn disabled | Progress |

### Phase 2: Orphan Accumulation + Cleanup (Runs 4-11)

| Run | Result | Root Cause | Category |
|-----|--------|-----------|----------|
| 4 | 1 fail | Alice hit BC-1 group limit from orphaned E2E groups | AVOIDABLE |
| 5 | 1 fail | Same -- no pre-test cleanup designed | AVOIDABLE |
| 6 | 0 tests | Wrong Playwright project (`--project=multi-user`) | AVOIDABLE |
| 7 | 2 pass, 2 fail | Cleanup regex `^E2E` didn't match emoji-prefixed card text | AVOIDABLE |
| 8 | 4/4 fail | Delete dialog backdrop blocks subsequent clicks | UNAVOIDABLE |
| 9 | 4/4 fail | Multi-member cascade delete fails (PERMISSION_DENIED) | UNAVOIDABLE |
| 10 | 1 pass | AC7 passes after bidirectional cleanup implemented | Progress |
| 11 | 4/4 pass | First all-green (but file was 450+ lines) | Success |

### Phase 3: File Size Refactor + Regression (Runs 12-14)

| Run | Result | Root Cause | Category |
|-----|--------|-----------|----------|
| 12 | 1 fail | Regression from line-trimming refactor (lost Escape fallback) | AVOIDABLE |
| 13 | Diagnostic | grep matched emulator noise, not real error | AVOIDABLE |
| 14 | 4/4 timeout | Orphan accumulation from regression runs | AVOIDABLE |

### Phase 4: Selector + Async Fixes (Runs 15-23)

| Run | Result | Root Cause | Category |
|-----|--------|-----------|----------|
| 15 | 1 fail + 3 timeout | `leaveGroupAsMember` used guessed button text selectors | AVOIDABLE |
| 16 | 1 fail | Share code "PENDING..." from optimistic update (10 chars) | UNAVOIDABLE |
| 17 | 1 fail | `text=Ajustes` strict mode violation (2 elements) | AVOIDABLE |
| 18 | 1 fail | SPA navigation shortcut didn't work | AVOIDABLE |
| 19 | 1 fail | Share code still "PENDING..." after first fix attempt | UNAVOIDABLE |
| 20 | 1 fail | Join dialog still in "Uniendose..." state, 2s wait insufficient | AVOIDABLE |
| 21 | 4/4 pass | All fixes applied | Success |
| 22 | 4/4 pass | Cleanup verification | Success |
| 23 | 4/4 pass | Post-trim verification | Success |

---

## Classification Summary

| Category | Events | Time Wasted | % of Waste |
|----------|--------|-------------|------------|
| **AVOIDABLE** | 26 | ~55 min | 60% |
| **UNAVOIDABLE** | 14 | ~28 min | 30% |
| **SYSTEMIC** | 4 | ~12 min | 10% |

---

## 5 Root Cause Chains

### Chain 1: "Firestore Rules Gap" (Runs 1-3, ~15 min)

```
Wrote test without reading firestore.rules
  --> Bob gets PERMISSION_DENIED on getGroupByShareCode
  --> Needed staging Firestore deploy
  --> No staging environment readiness checklist existed
```

**Category:** SYSTEMIC -- no checklist verifies staging rules match feature requirements before E2E writing.

### Chain 2: "Selector Guessing" (Runs 7, 15, 17, ~12 min)

```
Wrote helpers with guessed button text ("Confirmar", "Salir", "Leave")
  --> Actual button text is "Dejar grupo" (data-testid="leave-group-confirm-btn")
  --> Copied text=Ajustes from conventions doc
  --> text=Ajustes matches 2 elements in strict mode
  --> Cleanup regex ^E2E fails on emoji-prefixed card text
```

**Category:** AVOIDABLE -- caused by not reading component source AND by conventions doc teaching wrong patterns.

### Chain 3: "Optimistic Update Blindness" (Runs 16, 19, ~15 min)

```
Did not read useGroups.ts before writing getShareCode
  --> Unaware shareCode starts as "PENDING..." via optimistic update
  --> Read DOM during optimistic state
  --> Got 10-char invalid code
  --> Bob's join validation fails silently
  --> Took 6 runs + debug screenshot to discover
```

**Category:** UNAVOIDABLE at runtime, but AVOIDABLE if source had been read first (optimistic update is explicit in code: `shareCode: 'PENDING...'`).

### Chain 4: "Fixed Timeout Anti-Pattern" (Runs 20, ~8 min)

```
Used waitForTimeout(2000) after join click
  --> Join still in progress ("Uniendose..." on screenshot)
  --> Test proceeds to assertions
  --> Reload shows no group
  --> Should have used dialog.waitFor({ state: 'hidden' })
```

**Category:** AVOIDABLE -- known anti-pattern, but our conventions don't warn against it.

### Chain 5: "Orphan Accumulation" (Runs 4-9, ~15 min)

```
No pre-test cleanup of old E2E groups
  --> Previous failed runs leave orphan groups
  --> Alice hits BC-1 max group limit (10)
  --> create-btn disabled, new tests can't create groups
  --> Needed bidirectional cleanup (Bob leaves, Alice deletes)
  --> Bidirectional cleanup itself needed source reading (LeaveGroupDialog, DeleteGroupDialog)
```

**Category:** AVOIDABLE -- no convention or workflow mentions pre-test cleanup for shared staging environments.

---

## Deep Audit: Conventions & Workflows That Misled Us

### A. E2E-TEST-CONVENTIONS.md: 11 Problems Found

| # | Line | Problem | Impact |
|---|------|---------|--------|
| A1 | 112 | Documents `text=Ajustes` as THE navigation pattern | All 5 specs copy this fragile selector; caused Run 17 strict mode failure |
| A2 | 309-329 | Cleanup pattern has NO `try/finally` | All 5 specs copy this; test failures leak data, causing orphan accumulation |
| A3 | 232-255 | Common TestIds section missing Ajustes menu item | Forces text selector usage; no testid alternative documented |
| A4 | 27-37 | File structure listing stale (only 1 of 6 spec files listed) | Agent thinks only 1 staging test exists to learn from |
| A5 | 279 | Run command `npm run test:e2e --` is wrong | Should be `npx playwright test --project=staging` |
| A6 | 344-353 | Config example uses `Desktop Chrome` device (1280x720) | Misleading; tests need per-test viewport override that isn't obvious |
| A7 | - | No bilingual selector guidance | App is ES/EN but all examples hardcode Spanish text selectors |
| A8 | - | No `waitForTimeout` vs `waitFor` guidance | Every spec uses fixed timeouts for async ops; caused Run 20 |
| A9 | - | No optimistic update handling | No guidance on PENDING/temp states; caused Runs 16, 19 |
| A10 | - | No multi-user test patterns | No docs for browser.newContext(), try/finally, bidirectional cleanup |
| A11 | - | No SPA reload warning | No guidance on re-navigation after reload; caused Run 18 |

### B. Existing Spec Files: 15 Latent Bugs

| # | File | Problem |
|---|------|---------|
| B1 | group-delete-journey.spec.ts | No `try/finally` cleanup (2 tests) |
| B2 | group-delete-journey.spec.ts | No pre-test cleanup of orphans |
| B3 | group-delete-journey.spec.ts | Bare `text=Ajustes` selector |
| B4 | view-mode-filtering-journey.spec.ts | No `try/finally` for group cleanup (2 groups created) |
| B5 | view-mode-filtering-journey.spec.ts | `deleteOldTestGroups` uses CSS class selectors (`.font-medium`) |
| B6 | view-mode-filtering-journey.spec.ts | Early return instead of `test.skip()` |
| B7 | transaction-sharing-toggle.spec.ts | **Phantom testId** `transaction-sharing-helper-text` (does not exist in source) |
| B8 | transaction-sharing-toggle.spec.ts | Speculative selector `button:has(svg)` matches any SVG button |
| B9 | transaction-sharing-toggle.spec.ts | No `try/finally`, no cleanup of toggle state |
| B10 | user-sharing-preferences.spec.ts | Likely phantom testIds (`double-gate-tooltip-button`) |
| B11 | user-sharing-preferences.spec.ts | Spanish accent missing in text comparison (`sincronizacion` vs `sincronización`) |
| B12 | user-sharing-preferences.spec.ts | Creates group but never deletes it |
| B13 | user-sharing-preferences.spec.ts | `waitForLoadState('networkidle')` never resolves with Firebase WebSocket |
| B14 | verify-staging-ui.spec.ts | Dead credentials in source (test passwords, unused) |
| B15 | verify-staging-ui.spec.ts | **Phantom testId** `user-avatar` (should be `profile-avatar`) |

### C. ECC Workflow Gaps (ecc-dev-story, ecc-create-story)

| # | File | Gap |
|---|------|-----|
| C1 | ecc-dev-story/instructions.xml | Does NOT require reading component source before writing E2E tests |
| C2 | ecc-dev-story/instructions.xml | Does NOT mention optimistic updates, multi-user patterns, or bilingual selectors |
| C3 | ecc-dev-story/instructions.xml | E2E session knowledge is 6 lines with no actionable guidance |
| C4 | ecc-create-story/instructions.xml | Step 5.75 does NOT require component testId mapping |
| C5 | ecc-create-story/instructions.xml | Says "verify test passes locally" but E2E only runs against staging |
| C6 | ecc-create-story/instructions.xml | No guidance on selector strategy for E2E ACs |

### D. Playwright Config Issues

| # | Problem | Impact |
|---|---------|--------|
| D1 | `globalSetup` (line 45) always runs for ALL projects including staging | Emulator auth errors on every staging run (noisy, confusing) |
| D2 | `webServer` starts `npm run dev` not `npm run dev:staging` (line 183) | CI would start wrong server; only works because devs run dev:staging manually |
| D3 | Staging project uses `Desktop Chrome` device (line 147) | 1280x720 viewport unless overridden per-test |

---

## The Root Problem

The audit reveals a **feedback loop of bad patterns**:

```
Conventions doc teaches wrong patterns (text=Ajustes, no try/finally)
  --> Agent copies patterns into new spec files
  --> Specs fail at runtime due to fragile selectors / missing cleanup
  --> Fixes are applied to the individual spec but NOT back to conventions
  --> Next agent copies same wrong patterns from conventions
  --> Cycle repeats
```

Additionally:

```
ECC workflow does not require source reading before E2E writing
  --> Agent writes tests from conventions + guessing
  --> Phantom testIds, wrong button text, missed optimistic updates
  --> Multiple debug cycles to discover real DOM state
  --> Fixes applied but root cause (no source reading step) unchanged
```

---

## Appendix: Session Statistics

- **Total sessions:** 5 (context ran out 4 times)
- **Total test runs:** 23 (20 failed, 3 passed)
- **Total spec file edits:** 59
- **Total source file reads:** 26 (mostly AFTER failures, not before)
- **Screenshots reviewed:** 10
- **Average debug cycle:** ~5 min (error -> screenshot -> source -> fix -> re-run)
- **File evolution:** 290 -> 450+ -> 392 lines (peaked during cleanup helpers, trimmed for 400-line limit)
- **Final test duration:** ~1.5-1.6 min per test, 6.2 min total (4 tests, 1 worker)
