# Story 18-3: Statement Scanning Cloud Function Pipeline

## Status: ready-for-dev

## Intent
**Epic Handle:** "One statement in, many transactions out"
**Story Handle:** "This story builds the loading dock by wiring the AI unpacker that turns one box into many labeled items"

## Story
As a user, I want the AI to process my credit card statement and extract all transactions, so that I don't have to enter them manually.

## Acceptance Criteria

### Functional
- **AC-1:** Given a Cloud Function `analyzeStatement` exists, when called with statement image(s) or PDF, then it returns an array of extracted transactions
- **AC-2:** Given a 50-transaction statement, when processed, then extraction completes in < 15s (NFR-1.2)
- **AC-3:** Given each extracted transaction, when returned, then it includes: date, merchant, amount, currency
- **AC-4:** Given the Gemini prompt for statements, when processing, then it differentiates credits (payments) from debits (charges)
- **AC-5:** Given an extraction error, when the function fails, then it returns a structured error with retry guidance

### Architectural
- **AC-ARCH-LOC-1:** Cloud Function at `functions/src/analyzeStatement.ts`
- **AC-ARCH-PATTERN-1:** Same pipeline pattern as `analyzeReceipt` -- Gemini call with structured JSON response
- **AC-ARCH-PATTERN-2:** Structured error response: `{ success: false, error: { code, message } }`
- **AC-ARCH-NO-1:** No Cloud Run infrastructure -- Gemini handles PDF directly

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Statement Cloud Function | `functions/src/analyzeStatement.ts` | Cloud Functions | NEW |
| Statement prompt template | `functions/src/prompts/statementPrompt.ts` | Prompt template | NEW |
| Response types | `functions/src/types/statementTypes.ts` | Types | NEW |
| Tests | `functions/src/__tests__/analyzeStatement.test.ts` | Jest/Vitest | NEW |

## Tasks

### Task 1: Define Statement Extraction Schema (2 subtasks)
- [ ] 1.1: Define `StatementTransaction` type: `{ date, merchant, amount, currency, type: 'debit' | 'credit' }`
- [ ] 1.2: Define response schema: `{ transactions: StatementTransaction[], statementDate?: string, statementPeriod?: string }`

### Task 2: Build Gemini Prompt (2 subtasks)
- [ ] 2.1: Create statement-specific prompt -- extract all transactions from bank/credit card statement
- [ ] 2.2: Include Chilean bank formatting guidance (RUT, CLP dots, date format DD/MM/YYYY)

### Task 3: Build Cloud Function (3 subtasks)
- [ ] 3.1: Create `analyzeStatement.ts` callable function -- accepts image URLs or PDF buffer
- [ ] 3.2: Call Gemini with statement prompt, parse JSON response
- [ ] 3.3: **HARDENING:** Add timeout (30s), error handling, structured error responses

### Task 4: Test (3 subtasks)
- [ ] 4.1: Unit test: prompt formatting, response parsing
- [ ] 4.2: Integration test with spike samples from 18-1
- [ ] 4.3: Performance test: verify < 15s for 50-transaction statement

### Task 5: Build and Deploy (1 subtask)
- [ ] 5.1: `cd functions && npm run build` -- deploy to staging

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 11
- **Files:** ~4

## Dependencies
- **18-1** (spike results inform prompt design)

## Risk Flags
- DATA_PIPELINE (AI extraction pipeline)
- ERROR_RESILIENCE (Gemini timeout, malformed responses)

## Dev Notes
- Reuse patterns from `analyzeReceipt.ts` -- same Gemini client, same error handling structure
- Statement prompt is different from receipt prompt: statements have tabular data, multiple transactions, header/footer noise
- Credit vs debit: Chilean statements typically show "CARGO" (charge) and "ABONO" (payment/credit)
- PDF: Gemini 2.5 Flash accepts PDF input natively -- no conversion needed
- Multi-page: if statement is captured as multiple images, concatenate in prompt context
