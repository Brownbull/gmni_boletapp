# Story 18-5: Statement Prompt V2 — Fix Categories, CardHolder, Location

## Status: backlog

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Teach the AI to speak our language — fix what it misreads before we build anything on top of it"

## Story
As a developer, I want to iterate the statement extraction prompt to fix known V1 issues (mixed category language, missing cardHolder, missing location), so that downstream stories receive clean, well-typed data.

## Acceptance Criteria

### Functional
- **AC-1:** Given a CMR Falabella statement with 80+ transactions, when processed with V2 prompt, then ALL categories use English keys from STORE_CATEGORIES (no "Restaurantes", "Vestuario", etc.)
- **AC-2:** Given a statement with "TITULAR" / "ADICIONAL" sections, when processed, then cardHolderType is extracted as 'titular' or 'additional' per transaction
- **AC-3:** Given transaction descriptions with location hints (e.g., "UBER EATS SANTIAGO CL"), when processed, then country and city are best-effort extracted
- **AC-4:** Given "1/1" installment values, when processed, then installment fields are omitted (not "1/1")
- **AC-5:** Given insurance charges ("SEGURO DESGRAVAMEN"), when processed, then category is "BankingFinance" (not "GeneralServices")
- **AC-6:** V2 prompt passes test suite across CMR (12), Edwards (9), Scotiabank (3) PDFs with >= 90% category accuracy

### Architectural
- **AC-ARCH-1:** Prompt lives in `prompt-testing/prompts/statement/v2-statement-extraction.ts`
- **AC-ARCH-2:** Test results documented per bank in `scripts/statement-scan-spike/results/`
- **AC-ARCH-3:** Cloud Function `analyzeStatement.ts` updated to use V2 prompt as default

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| V2 prompt | `prompt-testing/prompts/statement/v2-statement-extraction.ts` | NEW |
| Prompt index | `prompt-testing/prompts/statement/index.ts` | MODIFY |
| Test runner script | `scripts/statement-scan-spike/run-test-suite.sh` | MODIFY |
| Cloud Function | `functions/src/analyzeStatement.ts` | MODIFY (prompt version) |
| Test results | `scripts/statement-scan-spike/results/v2/` | NEW (directory) |
| Edwards credentials | `prompt-testing/test-cases/CreditCard/edwards/credentials.json` | NEW |
| Password support | `scripts/statement-scan-spike/analyze-statement.ts` | MODIFY (--password flag) |

## Tasks

### Task 1: Fix Category Language (3 subtasks)
- [ ] 1.1: Audit V1 prompt for category instruction — identify why Spanish categories leak through
- [ ] 1.2: Update prompt to explicitly list all 44 STORE_CATEGORIES English keys with "MUST use these exact values"
- [ ] 1.3: Add negative examples: "Do NOT return 'Restaurantes' — use 'Restaurant'"

### Task 2: Add CardHolder Extraction (2 subtasks)
- [ ] 2.1: Add cardHolder instruction: detect TITULAR/ADICIONAL sections, flag per transaction
- [ ] 2.2: Add cardHolderName extraction for additional cardholders

### Task 3: Add Location Extraction (2 subtasks)
- [ ] 3.1: Add location hint instruction: extract country code and city from description when available
- [ ] 3.2: Add examples: "UBER EATS SANTIAGO CL" → country: "CL", city: "Santiago"

### Task 4: Fix Edge Cases (3 subtasks)
- [ ] 4.1: Fix "1/1" installments — omit both fields when installment is 1 of 1
- [ ] 4.2: Fix insurance categorization — SEGURO charges → "BankingFinance"
- [ ] 4.3: Add password support to test CLI (--password flag + credentials.json auto-read)

### Task 5: Test Suite Validation (3 subtasks)
- [ ] 5.1: Run V2 against all 12 CMR PDFs, document category accuracy delta vs V1
- [ ] 5.2: Run V2 against 9 Edwards PDFs (with password), document results
- [ ] 5.3: Run V2 against 3 Scotiabank PDFs, document results

### Task 6: Deploy V2 Prompt (2 subtasks)
- [ ] 6.1: Register V2 in prompt index, set as default
- [ ] 6.2: Update analyzeStatement.ts to reference V2 prompt version

## Sizing
- **Points:** 3 (SMALL-MEDIUM)
- **Tasks:** 6
- **Subtasks:** 15
- **Files:** ~7

## Dependencies
- 18-1 spike (DONE) — uses spike infrastructure and test data

## Risk Flags
- PROMPT_ITERATION (may require multiple rounds to hit 90% accuracy)
- Edwards PDFs are password-protected — need --password support before testing
