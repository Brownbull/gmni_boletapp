# Tech Debt Story TD-18-11: Gemini Model Migration + Client Timeout Fix

Status: done

> **Source:** Production scan failures & latency (2026-03-17)
> **Priority:** CRITICAL | **Estimated Effort:** 3 points

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Stop thinking, start scanning"
**Value:** V5 — "Easier than the receipt drawer" — 36-second scans that timeout are worse than typing manually. Switching to a non-thinking model restores sub-8s scan times.

## Story
As a **user**, I want **receipt scans to complete in under 10 seconds and never timeout**, so that **I can trust the scan button to work every time**.

## Background

### Symptom
Production scans on 2026-03-17 showed:
- 5 Cloud Function calls, all **succeeded server-side** (HTTP 200)
- Execution times: 17.9s, 18.4s, **36.4s**, 20.0s, 25.4s
- Scan #3 (36.4s) **exceeded client-side 30s timeout** — user saw error, credit refunded, but server completed (orphaned images)
- Even "successful" scans at 20-25s + mobile network latency risk exceeding 30s
- Zero server errors — all failures are client-side timeouts

### Root Cause Analysis

**1. `gemini-2.5-flash` is a thinking model (primary cause)**

Story 15b-5a upgraded from `gemini-2.0-flash` to `gemini-2.5-flash` as a "stable GA" upgrade. However, `gemini-2.5-flash` is a chain-of-thought reasoning model that "thinks" internally before responding. For receipt OCR (structured JSON extraction), this thinking is unnecessary overhead:

- Gemini API latency: **14-36 seconds** (highly variable)
- This accounts for **75%+ of total Cloud Function execution time**
- `gemini-2.0-flash` was 2-5 seconds for the same task

Breakdown of scan #3 (36.4s total):
- Auth verification to "Receipt analyzed": **36 seconds** (Gemini API)
- "Receipt analyzed" to "Images stored": **0.3 seconds** (Storage upload)

**2. `gemini-2.0-flash` is being deprecated (June 1, 2026)**

Going back to `gemini-2.0-flash` would be a short-lived fix. Google recommends `gemini-2.5-flash-lite` as the direct replacement:
- **1.5x faster** than 2.0-flash
- **No thinking by default** (matches 2.0-flash behavior)
- Same pricing ($0.10/1M input, $0.40/1M output tokens)
- Higher benchmark scores across all categories
- 65,536 output token limit (vs 8,192 for 2.0-flash)

**3. Client timeout too tight (30s)**

`PROCESSING_TIMEOUT_MS = 30000` in `src/features/scan/store/index.ts` races against the Cloud Function via `Promise.race` in `processScan.ts:166-180`. Even with a faster model, 30s leaves no margin for cold starts or slow mobile connections.

### Timeline
| Model | When | Latency | Status |
|-------|------|---------|--------|
| `gemini-2.0-flash` | Epic 9 (2025-12) | 2-5s | Deprecated, sunset June 1, 2026 |
| `gemini-2.5-flash` | Story 15b-5a (2026-03-01) | 14-36s | Current (thinking model) |
| `gemini-2.5-flash-lite` | This story | Expected 1-4s | Recommended replacement |

## Acceptance Criteria

### Functional
- **AC-1:** Production scans complete in under 10 seconds (Gemini API portion under 5 seconds)
- **AC-2:** No client-side timeouts for scans completing within 45 seconds
- **AC-3:** Scan output quality (JSON structure, field accuracy) is equivalent or better than current

### Technical
- **AC-4:** Cloud Function default model changed to `gemini-2.5-flash-lite`
- **AC-5:** `gemini-2.5-flash-lite` added to `ALLOWED_GEMINI_MODELS` allowlist
- **AC-6:** Client-side `PROCESSING_TIMEOUT_MS` increased from 30000 to 60000
- **AC-7:** `GEMINI_MODEL` env var override still works (for rollback or A/B testing)
- **AC-8:** Existing prompt (V4) works without modification with the new model

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Cloud Function | `functions/src/analyzeReceipt.ts` | EDIT |
| Client timeout | `src/features/scan/store/index.ts` | EDIT |
| Functions env | `functions/.env` | VERIFY (no change needed if using default) |

## Tasks

### Task 1: Update Gemini model configuration (3 subtasks)
- [ ] 1.1: Add `'gemini-2.5-flash-lite'` to `ALLOWED_GEMINI_MODELS` array in `functions/src/analyzeReceipt.ts`
- [ ] 1.2: Change default model from `'gemini-2.5-flash'` to `'gemini-2.5-flash-lite'` in the fallback of `process.env.GEMINI_MODEL || '...'`
- [ ] 1.3: Update comment from "stable GA" to note this is the non-thinking replacement

### Task 2: Increase client-side timeout (1 subtask)
- [ ] 2.1: Change `PROCESSING_TIMEOUT_MS` from `30000` to `60000` in `src/features/scan/store/index.ts` and update the comment

### Task 3: Verify prompt compatibility (3 subtasks)
- [ ] 3.1: Run `/scan-test run --limit all` against staging with `GEMINI_MODEL=gemini-2.5-flash-lite` — all tests pass
- [ ] 3.2: Test 3 production-like receipts (supermarket, restaurant, pharmacy) — fields parse correctly
- [ ] 3.3: Compare output quality: merchant, date, total, items, category accuracy matches or exceeds current

### Task 4: Deploy and verify (2 subtasks)
- [ ] 4.1: Deploy Cloud Functions to production: `cd functions && npm run build && firebase deploy --only functions:analyzeReceipt`
- [ ] 4.2: Perform 3 live scans in production, verify completion under 10 seconds

## Sizing
- **Points:** 3 (STANDARD)
- **Tasks:** 4
- **Subtasks:** 9
- **Files:** 2-3

## Dependencies
- None (standalone fix, applies to both sync and async scan paths)

## Risk Flags
- **LOW:** Prompt may behave differently with new model — mitigated by Task 3 scan-test validation
- **LOW:** `gemini-2.5-flash-lite` is new — can rollback via `GEMINI_MODEL=gemini-2.5-flash` env var without code change

## Evidence (Firebase Function Logs, 2026-03-17)

```
05:17 → 17,918ms (200) — Gemini ~14s
20:05 → 18,434ms (200) — Gemini ~14s
20:05 → 36,429ms (200) — Gemini ~36s ← CLIENT TIMEOUT (>30s)
20:06 → 20,051ms (200) — Gemini ~10s
20:06 → 25,445ms (200) — Gemini ~21s ← At risk with network latency
```

## Senior Developer Review (ECC)

- **Date:** 2026-03-17
- **Classification:** STANDARD
- **Agents:** code-reviewer (8.5/10), security-reviewer (9/10)
- **Overall:** APPROVE 8.8/10
- **Quick fixes applied:** 4 (currency type alignment, partial userId in log, model allowlist fail-fast)
- **TD stories created:** 1 (TD-18-12, 1pt — 18-13b cleanup)
- **Backlog entries:** 1 (serial fetch in copyPendingToReceipts, PROD)
<!-- CITED: P7-validation-before-action, L2-008-SSoT -->

## Review Deferred Items (2026-03-17)

| # | Finding | Stage | Destination | Tracking |
|---|---------|-------|-------------|----------|
| 6 | getState() in useCallback (18-13b) | MVP | TD-18-12 | ready-for-dev |
| 7 | Dead processScan prop (18-13b) | MVP | TD-18-12 | ready-for-dev |
| 8 | Serial fetch in copyPendingToReceipts (18-13b) | PROD | Backlog | deferred-findings.md |
| 9 | SSoT drift ScanPendingState (18-13b) | MVP | TD-18-12 | ready-for-dev |
| 10 | Dead mockGetDoc (18-13b) | MVP | TD-18-12 | ready-for-dev |
| 11 | Stale comment (18-13b) | MVP | TD-18-12 | ready-for-dev |

<!-- CITED: functions/src/analyzeReceipt.ts:429, src/features/scan/store/index.ts:19, src/features/scan/handlers/processScan/processScan.ts:166-180 -->
