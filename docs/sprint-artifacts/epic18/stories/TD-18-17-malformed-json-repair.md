# Tech Debt Story TD-18-17: Malformed JSON Repair + Adversarial Fixture

Status: done

> **Source:** Production scan failure 2026-04-02 23:07 UTC
> **Priority:** HIGH | **Estimated Effort:** 2 points

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Gemini speaks broken JSON — teach the parser to listen anyway"
**Value:** V5 — "Easier than the receipt drawer" — a scan that fails because of a misplaced quote wastes the user's credit and trust.

## Story
As a **user**, I want **scans to succeed even when Gemini returns slightly malformed JSON**, so that **I don't lose credits to formatting errors I can't control**.

## Background

### Symptom
Production scan at 2026-04-02 23:07 UTC failed with:
```
Expected double-quoted property name in JSON at position 365
```
Credit was refunded, but the user saw an error. The receipt was readable — Gemini just returned a property name without double quotes (e.g., `{merchant: "Store"}` instead of `{"merchant": "Store"}`).

### Root Cause
`processReceiptScan.ts:284` does `JSON.parse(cleanedText)` with no error recovery. `JSON.parse` is strict — it rejects single quotes, unquoted keys, trailing commas, and comments. Gemini occasionally returns any of these.

### Known Gemini JSON malformation patterns
1. **Unquoted property names:** `{merchant: "Store"}` — the production error
2. **Single-quoted strings:** `{'merchant': 'Store'}`
3. **Trailing commas:** `{"items": [{"name": "A"},]}`
4. **Comments:** `{"merchant": "Store" // extracted from header}`

## Acceptance Criteria

### Task 1: Add JSON repair before JSON.parse (processReceiptScan.ts)
- [x] AC-1: Insert a `repairJson(text: string): string` function that fixes known malformation patterns BEFORE `JSON.parse`
- [x] AC-2: Repair handles: unquoted keys, single quotes → double quotes, trailing commas, inline comments
- [x] AC-3: Repair runs on BOTH production and fixture paths (after markdown fence removal, before JSON.parse)
- [x] AC-4: If repair still fails JSON.parse, the original error is thrown (don't swallow real parse errors)

### Task 2: Add adversarial fixture for malformed JSON
- [x] AC-5: Create `prompt-testing/test-cases/adversarial/malformed-json.jpg` (1x1 pixel)
- [x] AC-6: Create `prompt-testing/test-cases/adversarial/malformed-json.fixture.json` with raw Gemini response containing unquoted keys and trailing commas
- [ ] AC-7: Seed to staging with `npm run fixtures:seed`
- [x] AC-8: Verify fixture exercises the repair path in unit tests

### Task 3: Unit tests
- [x] AC-9: Test `repairJson` with each malformation pattern (unquoted keys, single quotes, trailing commas, comments)
- [x] AC-10: Test that valid JSON passes through unchanged
- [x] AC-11: Test that truly broken JSON (incomplete, wrong structure) still throws

## Technical Notes
- The repair function should be lightweight — regex-based, not a full parser
- Consider using a well-tested library like `json5` or `jsonrepair` if available, but check bundle size impact on Cloud Functions
- The repair runs server-side only (Cloud Functions), not client-side
- Log when repair was needed: `console.log('processReceiptScan: JSON repair applied for scan ${scanId}')`

## Dev Notes
- Keep `repairJson` in a separate utility file (`functions/src/utils/jsonRepair.ts`) — it's reusable for statement scanning too
- The existing `cleanedText` pipeline (markdown fence removal) is the right place to insert repair — after fences are removed, before JSON.parse
- **Expanded scope:** Applied to all 3 CF files with identical `JSON.parse(cleanedText)` pattern (processReceiptScan, analyzeReceipt, analyzeStatement) — same one-line change each
- **Try-native-first design:** `parseJsonWithRepair` calls `JSON.parse` first; repair only runs on failure. Zero overhead on well-formed JSON.
- **Regex limitation (documented):** Comment stripping uses negative lookbehind `(?<!:)` to preserve `://` in URLs, but is not fully string-aware. Safe for current Gemini receipt/statement schema which has no URL fields. If schema adds URLs, upgrade to string-aware parser or `jsonrepair` library.
- **AC-7 deferred:** `fixtures:seed` is a deploy-time operation — defer to deploy-story
- **28 unit tests, 100% coverage** on jsonRepair.ts

## Dependencies
- None — self-contained fix

## Files Touched
1. `functions/src/utils/jsonRepair.ts` (NEW — repair utility, 81 lines)
2. `functions/src/__tests__/jsonRepair.test.ts` (NEW — 28 tests, 100% coverage)
3. `functions/src/processReceiptScan.ts` (edit — import + JSON.parse → parseJsonWithRepair)
4. `functions/src/analyzeReceipt.ts` (edit — same change, expanded scope)
5. `functions/src/analyzeStatement.ts` (edit — same change, expanded scope)
6. `prompt-testing/test-cases/adversarial/malformed-json.fixture.json` (NEW)
7. `prompt-testing/test-cases/adversarial/malformed-json.jpg` (NEW — 1x1 stub)

## Senior Developer Review (ECC)

- **Date:** 2026-04-05
- **Agents:** code-reviewer (sonnet), security-reviewer (sonnet), tdd-guide (sonnet)
- **Classification:** STANDARD (7 files, functions/ security domain, pipeline touch)
- **Outcome:** APPROVE with 3 quick fixes applied + 1 TD story created
- **Score:** 8/10
- **Quick fixes (3):** ReDoS length guard added, `fail()` → `expect.assertions(1)`, `beforeEach(jest.restoreAllMocks)` added
- **TD stories (1):** TD-18-20 — CF-level test for repair path (MVP, 2 pts)
- **Backlog (1):** Regex string-awareness upgrade (PROD, bundled 2 findings)

## Deferred Item Tracking

| # | Finding | Stage | Destination | Tracking |
|---|---------|-------|-------------|----------|
| 8 | No CF-level test exercises repair path | MVP | TD-18-20 | DEFER_EPIC |
| 1+2 | Regex not string-aware (comment stripping + key quoting) | PROD | Backlog | DEFER_BACKLOG |

<!-- CITED: L2-009 (Integration Seam Coverage) -->
<!-- INTENT: aligned -->
<!-- ORDERING: clean -->
