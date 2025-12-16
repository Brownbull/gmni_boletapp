# Story 9.1: Transaction Type Extension

**Epic:** Epic 9 - Scan Enhancement & Merchant Learning
**Status:** review
**Story Points:** 3

---

## User Story

As a **developer**,
I want **the Transaction type extended with v2.6.0 prompt fields**,
So that **all AI-extracted data is stored in Firestore for future features**.

---

## Acceptance Criteria

- [x] **AC #1:** Transaction interface includes `time?: string` (HH:mm format)
- [x] **AC #2:** Transaction interface includes `country?: string`
- [x] **AC #3:** Transaction interface includes `city?: string`
- [x] **AC #4:** Transaction interface includes `currency?: string` (ISO 4217)
- [x] **AC #5:** Transaction interface includes `receiptType?: string`
- [x] **AC #6:** Transaction interface includes `promptVersion?: string`
- [x] **AC #7:** Transaction interface includes `merchantSource?: MerchantSource` type
- [x] **AC #8:** `MerchantSource` type defined as `'scan' | 'learned' | 'user'`
- [x] **AC #9:** Scanner service passes new fields from AI extraction to transaction
- [x] **AC #10:** Existing tests pass (all fields are optional for backward compatibility)
- [x] **AC #11:** Test fixtures updated to include new fields where appropriate

---

## Tasks / Subtasks

- [x] Update `src/types/transaction.ts` with new fields (AC: #1-#8)
  - [x] Add `time?: string`
  - [x] Add `country?: string`
  - [x] Add `city?: string`
  - [x] Add `currency?: string`
  - [x] Add `receiptType?: string`
  - [x] Add `promptVersion?: string`
  - [x] Add `MerchantSource` type definition
  - [x] Add `merchantSource?: MerchantSource`
- [x] Update scanner service to pass new fields (AC: #9)
  - [x] Map AI extraction `time` → transaction.time
  - [x] Map AI extraction `country` → transaction.country
  - [x] Map AI extraction `city` → transaction.city
  - [x] Map AI extraction `currency` → transaction.currency
  - [x] Map AI extraction `receiptType` → transaction.receiptType
  - [x] Set `promptVersion` from current prompt version constant
  - [x] Set `merchantSource: 'scan'` as default
- [x] Update test fixtures with new fields (AC: #11)
- [x] Run all tests to verify backward compatibility (AC: #10)
- [x] Run build to verify no TypeScript errors

---

## Technical Summary

This story extends the Transaction type to capture all fields from prompt v2.6.0:

1. **New Transaction Fields:** All optional for backward compatibility
   - `time` - Purchase time in HH:mm format
   - `country` - Country name from receipt
   - `city` - City name from receipt
   - `currency` - ISO 4217 currency code (e.g., "GBP", "CLP")
   - `receiptType` - Document type (receipt/invoice/ticket)
   - `promptVersion` - Version of prompt used for extraction
   - `merchantSource` - Source of merchant name (scan/learned/user)

2. **Scanner Integration:**
   - Map AI extraction fields to transaction
   - Default `merchantSource` to 'scan' (Story 9.5 will set to 'learned' when matched)

---

## Project Structure Notes

- **Files to modify:**
  - `src/types/transaction.ts` - Add new fields and MerchantSource type
  - `src/services/scannerService.ts` (or equivalent) - Pass new fields
  - `tests/**/*.test.ts` - Update fixtures as needed
- **Expected test locations:** `tests/unit/`, `tests/integration/`
- **Prerequisites:** None (foundation story)

---

## Key Code References

**Architecture Reference:**
- [architecture-epic9.md](./architecture-epic9.md) - ADR-5: Source Tracking for Transparency

**Existing Patterns:**
- `src/types/transaction.ts` - Current Transaction interface
- `src/types/transaction.ts:CategorySource` - Similar source tracking pattern

**Type Definition:**
```typescript
// src/types/transaction.ts additions
export type MerchantSource = 'scan' | 'learned' | 'user';

export interface Transaction {
  // ... existing fields

  // NEW: v2.6.0 fields (all optional for backward compatibility)
  time?: string;           // "15:01" format
  country?: string;        // "United Kingdom"
  city?: string;           // "London"
  currency?: string;       // "GBP" (ISO 4217)
  receiptType?: string;    // "receipt" | "invoice" | "ticket"
  promptVersion?: string;  // "2.6.0"

  // NEW: Source tracking
  merchantSource?: MerchantSource;
}
```

---

## Context References

**Tech-Spec:** [tech-spec-epic-9.md](./tech-spec-epic-9.md)
**PRD:** [prd-epic9-scan-enhancement.md](./prd-epic9-scan-enhancement.md)
**Architecture:** [architecture-epic9.md](./architecture-epic9.md)

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes
**Implementation completed 2025-12-13** after addressing code review blockers.

**First Implementation Phase (2025-12-12):**
- Added Transaction type fields (AC #1-8) in src/types/transaction.ts

**Second Implementation Phase (2025-12-13):**
- Fixed AC #9 (BLOCKED by code review):
  - Updated `GeminiAnalysisResult` interface in Cloud Function to include v2.6.0 fields
  - Updated `AnalyzeReceiptResponse` interface to include promptVersion and merchantSource
  - Updated Cloud Function return to pass promptVersion from active prompt and merchantSource: 'scan'
  - Updated App.tsx processScan to map all new fields to Transaction
- Fixed AC #10: Updated test expectations for new category counts (34 store, 32 item) and version (2.6.0)
- Fixed AC #11: Updated both test fixtures with v2.6.0 fields

### Files Modified
- `functions/src/analyzeReceipt.ts` - Extended GeminiAnalysisResult and AnalyzeReceiptResponse interfaces, added promptVersion and merchantSource to return
- `src/App.tsx` - Updated processScan to map all v2.6.0 fields to Transaction
- `tests/fixtures/gemini-responses.json` - Updated both fixtures with new fields
- `functions/src/prompts/__tests__/index.test.ts` - Fixed category counts and version expectations
- `prompt-testing/prompts/__tests__/index.test.ts` - Fixed category counts and version expectations

### Test Results
```
✓ TypeScript type-check passes
✓ Build completes successfully (756.30 kB bundle)
✓ 1525 tests pass
Note: 3 test file configuration issues (Jest vs Vitest, CommonJS vs ESM) - pre-existing infrastructure issues
```

---

## Senior Developer Review (AI)

### Reviewer
Gabe

### Date
2025-12-13

### Outcome
**BLOCKED** - Critical acceptance criterion not implemented

### Summary
Story 9.1 Transaction Type Extension is **partially implemented**. The Transaction type definition in `src/types/transaction.ts` has been correctly updated with all new v2.6.0 fields and MerchantSource type (AC #1-8). However, **AC #9 is NOT implemented** - the scanner service does not pass new fields from AI extraction to the transaction. The Cloud Function response interface and client-side mapping are both missing the new fields.

### Key Findings

#### HIGH Severity
- [ ] **[HIGH] AC #9 NOT IMPLEMENTED**: Scanner service does not pass new fields from AI extraction to transaction. The `GeminiAnalysisResult` interface in `functions/src/analyzeReceipt.ts:128-138` does not include `time`, `country`, `city`, `currency`, `receiptType`, `promptVersion`, or `merchantSource`. [file: functions/src/analyzeReceipt.ts:128-138]
- [ ] **[HIGH] Client-side mapping missing**: `App.tsx` `processScan` function (lines 132-146) builds the Transaction without the new fields even though Gemini extracts them. [file: src/App.tsx:132-146]

#### MEDIUM Severity
- [ ] **[MED] Pre-existing test failures**: 4 tests in `functions/src/prompts/__tests__/index.test.ts` fail due to outdated expectations (category counts, version number). These are unrelated to Story 9.1 but should be fixed. [file: functions/src/prompts/__tests__/index.test.ts:195-218]

#### LOW Severity
- Note: Test fixture `gemini-responses.json` only has 1 of 2 receipts updated with new fields (successfulReceipt has them, restaurantReceipt does not)

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC #1 | Transaction interface includes `time?: string` | ✅ IMPLEMENTED | [src/types/transaction.ts:64](src/types/transaction.ts#L64) |
| AC #2 | Transaction interface includes `country?: string` | ✅ IMPLEMENTED | [src/types/transaction.ts:66](src/types/transaction.ts#L66) |
| AC #3 | Transaction interface includes `city?: string` | ✅ IMPLEMENTED | [src/types/transaction.ts:68](src/types/transaction.ts#L68) |
| AC #4 | Transaction interface includes `currency?: string` | ✅ IMPLEMENTED | [src/types/transaction.ts:70](src/types/transaction.ts#L70) |
| AC #5 | Transaction interface includes `receiptType?: string` | ✅ IMPLEMENTED | [src/types/transaction.ts:72](src/types/transaction.ts#L72) |
| AC #6 | Transaction interface includes `promptVersion?: string` | ✅ IMPLEMENTED | [src/types/transaction.ts:74](src/types/transaction.ts#L74) |
| AC #7 | Transaction interface includes `merchantSource?: MerchantSource` | ✅ IMPLEMENTED | [src/types/transaction.ts:78](src/types/transaction.ts#L78) |
| AC #8 | `MerchantSource` type defined as `'scan' \| 'learned' \| 'user'` | ✅ IMPLEMENTED | [src/types/transaction.ts:37](src/types/transaction.ts#L37) |
| AC #9 | Scanner service passes new fields from AI extraction | ❌ **NOT IMPLEMENTED** | Cloud Function and App.tsx do not pass new fields |
| AC #10 | Existing tests pass | ⚠️ PARTIAL | Build passes, TypeScript passes, 4 unrelated prompt tests fail |
| AC #11 | Test fixtures updated with new fields | ⚠️ PARTIAL | [tests/fixtures/gemini-responses.json](tests/fixtures/gemini-responses.json) only 1 fixture updated |

**Summary: 8 of 11 acceptance criteria fully implemented, 1 MISSING (AC #9), 2 PARTIAL (AC #10, AC #11)**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Update `src/types/transaction.ts` with new fields | [ ] incomplete | ✅ DONE | All 8 subtasks completed - [src/types/transaction.ts:37,64-78](src/types/transaction.ts#L37) |
| Update scanner service to pass new fields (AC: #9) | [ ] incomplete | ❌ NOT DONE | `functions/src/analyzeReceipt.ts` interface missing fields, `App.tsx` processScan missing fields |
| Update test fixtures with new fields | [ ] incomplete | ⚠️ PARTIAL | Only `successfulReceipt` updated, not `restaurantReceipt` |
| Run all tests to verify backward compatibility | [ ] incomplete | ⚠️ PARTIAL | Build passes, 4 pre-existing test failures |
| Run build to verify no TypeScript errors | [ ] incomplete | ✅ DONE | `npm run build` succeeds |

**Summary: 2 of 5 tasks verified complete, 1 NOT DONE (scanner service), 2 PARTIAL**

### Test Coverage and Gaps
- ✅ TypeScript type-check passes
- ✅ Build completes successfully
- ⚠️ 4 pre-existing test failures in prompts/__tests__/index.test.ts (unrelated to this story)
- ❌ No tests for passing new fields through scanner service (because feature not implemented)

### Architectural Alignment
- ✅ MerchantSource type follows CategorySource pattern (ADR-5)
- ✅ All new fields are optional for backward compatibility
- ❌ Scanner integration not implemented per architecture spec

### Security Notes
- No security concerns identified. All new fields are read-only from AI extraction.

### Best-Practices and References
- TypeScript 5.x optional fields pattern: correct usage with `?:` syntax
- Firebase Cloud Functions interface pattern: response interface should mirror data structure

### Action Items

**Code Changes Required:**
- [ ] [High] Update `GeminiAnalysisResult` interface to include new fields (time, country, city, currency, receiptType from metadata) [file: functions/src/analyzeReceipt.ts:128-138]
- [ ] [High] Update `AnalyzeReceiptResponse` interface to include promptVersion and merchantSource [file: functions/src/analyzeReceipt.ts:144-148]
- [ ] [High] Update `processScan` in App.tsx to map all new fields to initialTransaction [file: src/App.tsx:132-146]
- [ ] [High] Set `merchantSource: 'scan'` default and `promptVersion: '2.6.0'` in Cloud Function response [file: functions/src/analyzeReceipt.ts:311-316]
- [ ] [Med] Update restaurantReceipt fixture to include new fields [file: tests/fixtures/gemini-responses.json:16-28]
- [ ] [Med] Fix pre-existing test expectations in prompts/__tests__/index.test.ts (category counts, version) [file: functions/src/prompts/__tests__/index.test.ts:195-218]

**Advisory Notes:**
- Note: Consider adding integration test for end-to-end field passing from Gemini → Cloud Function → App → Firestore

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-12 | 1.0 | Story drafted |
| 2025-12-13 | 1.1 | Senior Developer Review notes appended - BLOCKED |
| 2025-12-13 | 1.2 | All review blockers addressed - AC #9, #10, #11 implemented - Ready for re-review |
