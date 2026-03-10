# Story 17-3: Update Gemini AI Prompt for New Taxonomy

## Status: review

## Intent
**Epic Handle:** "Name everything in the language the user thinks in"
**Story Handle:** "This story names everything by teaching the AI sorter the new label system"

## Story
As a user, I want AI receipt scanning to categorize items and merchants using the new Spanish labels, so that scanned results match what I see in the app.

## Acceptance Criteria

### Functional
- **AC-1:** Given the Gemini prompt includes category lists, when updated, then it uses the new Spanish canonical names from 17-2
- **AC-2:** Given a receipt image is scanned, when Gemini returns results, then merchant category and item categories use new taxonomy names
- **AC-3:** Given the Cloud Function is built locally, when tested with sample receipts, then categorization accuracy is >= current baseline
- **AC-4:** Given the Cloud Function is deployed to staging, when tested via `dev:staging`, then scan results use new names

### Architectural
- **AC-ARCH-LOC-1:** Gemini prompt at `functions/src/` (locate exact file -- likely `analyzeReceipt.ts` or prompt template)
- **AC-ARCH-PATTERN-1:** Prompt includes explicit category lists matching constants from 17-2
- **AC-ARCH-NO-1:** No changes to Cloud Function structure -- prompt text update only

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| V4 prompt | `prompt-testing/prompts/v4-spanish-taxonomy.ts` | Cloud Functions | CREATED |
| Prompt index | `prompt-testing/prompts/index.ts` | Cloud Functions | MODIFIED |
| Prompt tests | `prompt-testing/prompts/__tests__/index.test.ts` | Cloud Functions | MODIFIED |
| Category schema | `shared/schema/categories.ts` | Shared Schema | MODIFIED |
| Cloud Function build | `functions/` | npm build | VERIFIED |

## Tasks

### Task 1: Update Gemini Prompt (3 subtasks)
- [x] 1.1: Read current prompt -- identify where category lists are embedded
- [x] 1.2: Replace all category lists with new Spanish canonical names from taxonomy spec
- [x] 1.3: Update prompt instructions to use new level names (Rubro, Negocio, Familia, Tipo de Producto)

### Task 2: Build and Test Locally (3 subtasks)
- [x] 2.1: Run `cd functions && npm run build` -- verify build succeeds
- [ ] 2.2: **HARDENING:** Test with 5+ real Chilean receipt images (supermarket, pharmacy, restaurant, bakery, street vendor) -- verify categorization accuracy
- [ ] 2.3: Compare results against old prompt baseline -- flag any regressions

### Task 3: Verification (1 subtask)
- [x] 3.1: Run `npm run test:quick` -- all tests pass (Cloud Function tests if they exist)

## Sizing
- **Points:** 2 (SMALL)
- **Tasks:** 3
- **Subtasks:** 7
- **Files:** ~2

## Dependencies
- **17-2** (constants must be updated first -- prompt references same canonical values)

## Risk Flags
- DATA_PIPELINE (AI prompt changes affect extraction accuracy)

## Dev Notes
- CRITICAL: Always `cd functions && npm run build` locally before CI -- Cloud Function builds are separate from frontend.
- The prompt likely includes JSON examples showing expected category output. These need updating too.
- Consider adding a brief Spanish explanation of each level in the prompt to help Gemini understand the hierarchy.
- Test with receipts that have ambiguous items (e.g., "Aceite" could be cooking oil or motor oil) to verify categorization quality.
- If accuracy drops significantly with new names, consider adding few-shot examples in the prompt.
