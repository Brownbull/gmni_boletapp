# Tech Debt Story TD-18-7: Hide Default Time Sentinel in Transaction Display

Status: done

> **Source:** Production UX issue (2026-03-13)
> **Priority:** LOW | **Estimated Effort:** 1 point

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Don't show the clock when you never checked the time"
**Value:** V2 — "Would you bet money on this number?" — displaying a fake 04:04 time misleads users into thinking that's when the purchase happened.

## Story
As a **user**, I want **transactions without extracted time to hide the time display**, so that **I'm not misled by a placeholder value that looks like a real timestamp**.

## Background
`DEFAULT_TIME = '04:04'` is a sentinel meaning "no time was extracted from the receipt." It's currently rendered in TransactionCard and QuickSaveCard as if it were real data. Users see "04:04" and assume the purchase happened at 4:04 AM.

## Acceptance Criteria

### Functional
- **AC-1:** TransactionCard hides the time pill when `time === DEFAULT_TIME`
- **AC-2:** QuickSaveCard hides the Clock icon + time string when time matches sentinel
- **AC-3:** Transactions with real times (e.g., "12:30", "00:00") still show the time normally
- **AC-4:** "00:00" (midnight) is treated as valid time, NOT as a sentinel

### Audit
- **AC-5:** `duplicateGrouping.ts` sorts within groups by time — verify "04:04" sort position is cosmetic only, no logic change needed
- **AC-6:** No analytics or report views aggregate by time of day (confirm no downstream impact)

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| TransactionCard | `src/features/history/components/TransactionCard.tsx` | EDIT |
| TransactionCard (legacy) | `src/components/transactions/TransactionCard.tsx` | EDIT |
| QuickSaveCard | `src/features/scan/components/QuickSaveCard.tsx` | EDIT |
| DEFAULT_TIME import | `src/entities/transaction/utils/index.ts` | READ |
| Tests | `tests/unit/` (new or existing) | NEW/EDIT |

## Tasks

### Task 1: Hide sentinel time in display (3 subtasks)
- [x] 1.1: Import DEFAULT_TIME in TransactionCard; skip time pill render when `time === DEFAULT_TIME`
- [x] 1.2: Same for legacy TransactionCard in `src/components/transactions/`
- [x] 1.3: Import DEFAULT_TIME in QuickSaveCard; skip Clock+timeStr when sentinel

### Task 2: Audit downstream (2 subtasks)
- [x] 2.1: Verify "00:00" is valid midnight (not another sentinel) in transactionNormalizer
- [x] 2.2: Grep for time-based aggregation in analytics/reports — confirm none exists

### Task 3: Tests (2 subtasks)
- [x] 3.1: Unit test TransactionCard with DEFAULT_TIME → verify time pill not rendered
- [x] 3.2: Unit test TransactionCard with "12:30" → verify time pill rendered

## Sizing
- **Points:** 1 (SMALL)
- **Tasks:** 3
- **Subtasks:** 7
- **Files:** ~4

## Dependencies
- None (standalone)

## Senior Developer Review (ECC)

- **Date:** 2026-03-13
- **Classification:** SIMPLE
- **Agents:** code-reviewer (8/10), tdd-guide (6/10 → improved), ui-consistency (10/10)
- **Overall:** APPROVE 8/10
- **Quick fixes:** 3 applied (fragile test assertion, midnight AC-4 test, yesterday branch tests)
- **Backlog:** 4 PROD items deferred to deferred-findings.md
- **Archived:** 1 (acceptable inconsistency)
<!-- CITED: L2-008 -->

## Review Deferred Items (2026-03-13)

| # | Finding | Stage | Destination | Tracking |
|---|---------|-------|-------------|----------|
| 1 | timeStr derived from date not time in QuickSaveCard | PROD | Backlog | deferred-findings.md |
| 3 | getTimeDisplay() duplicated across 2 TransactionCards | PROD | Backlog | deferred-findings.md |
| 6 | No test file for legacy TransactionCard | PROD | Backlog | deferred-findings.md |
| 8 | parseHour DEFAULT_TIME guard undocumented | PROD | Backlog | deferred-findings.md |
| 4 | Inconsistent access pattern (transaction.time vs destructured) | — | Archived | Acceptable |

## Risk Flags
- None — minimal, localized change
