# Story 14.39: Improve Dollar Sign Recognition in Scan Prompt

**Status:** cancelled
**Points:** 2
**Epic:** 14 - Core Implementation
**Dependencies:** None

---

## Story

**As a** user scanning receipts with dollar signs before item prices,
**I want** the AI to correctly recognize `$` symbols instead of misreading them as `4`,
**So that** extracted prices are accurate without manual correction.

---

## Context

### Problem
When scanning receipts where prices have the dollar sign prefix (e.g., `$15.99`, `$4.50`), the OCR/AI sometimes misinterprets the `$` character as the digit `4`. This results in extracted prices like:
- `$15.99` → `415.99` (incorrect - prefixed with 4)
- `$4.50` → `44.50` (incorrect - doubled 4)
- `$100.00` → `4100.00` (incorrect - prefixed with 4)

This is a common OCR error because:
1. The `$` symbol and `4` have similar curved features
2. Some receipt fonts make `$` look like a styled `4`
3. Low-quality images or thermal receipt fading amplifies ambiguity

### Current Prompt Location
The V3 prompt in `functions/src/prompts/v3-category-standardization.ts` handles price extraction but doesn't explicitly address this common OCR confusion.

### Solution
Add explicit instructions to the prompt that:
1. Warn the AI about `$` vs `4` confusion
2. Provide recognition heuristics (position, context, pattern)
3. Instruct post-processing validation rules

---

## Acceptance Criteria

### AC 1: Add Dollar Sign Recognition Instructions to V3 Prompt

- [ ] Add new section "CURRENCY SYMBOL RECOGNITION" to the V3 prompt
- [ ] Include explicit warning about `$` ↔ `4` OCR confusion
- [ ] Provide contextual recognition rules:
  - Dollar signs appear at the START of price values, not middle
  - If a price starts with `4` followed by typical price pattern, verify it's not `$`
  - Look for consistent pattern across all line items (if one has `$`, all likely do)
- [ ] Add examples of correct vs incorrect interpretation

### AC 2: Add Price Pattern Validation Instructions

- [ ] Instruct AI to validate extracted prices against common patterns
- [ ] If price seems unreasonably high (e.g., `4,599` for a typical grocery item), consider `$` misread
- [ ] Cross-reference with receipt total for sanity check
- [ ] If items sum to ~10x the total, likely `$` was misread as `4` prefix

### AC 3: Handle Multiple Currency Symbol Formats

- [ ] Address that `$` can appear:
  - Before amount: `$15.99`
  - After amount: `15.99$` (some regions)
  - With space: `$ 15.99`
- [ ] Same confusion can occur with other symbols (€, £) but `$` is most common

### AC 4: Test with Problematic Receipt Examples

- [ ] Create test cases with receipts showing `$` prefixed prices
- [ ] Verify improved accuracy after prompt changes
- [ ] Document any remaining edge cases

---

## Technical Notes

### Proposed Prompt Addition

Add this section to the V3 prompt after "CURRENCY DETECTION":

```
IMPORTANT - CURRENCY SYMBOL RECOGNITION:
The dollar sign ($) is often misread as the digit 4 by OCR. Apply these rules:

1. POSITION CHECK: Currency symbols appear BEFORE or AFTER amounts, never in the middle
   - "$15.99" or "15.99$" = valid price format
   - "415.99" where $ was misread = INCORRECT - this is likely "$15.99"

2. PATTERN CONSISTENCY: If one price has a symbol prefix, ALL prices likely do
   - If you see: 4.99, 412.50, 43.99 - these are likely $4.99, $12.50, $3.99
   - The leading "4" in each is actually "$"

3. SANITY CHECK: If extracted prices seem ~10x too high, check for $ → 4 misread
   - Item "Bread" with price 42.99 is suspicious - likely $2.99
   - Item "Coffee" with price 45.50 is suspicious - likely $5.50

4. TOTAL VALIDATION: Sum of items should approximate the receipt total
   - If items sum to ~10x total, you likely misread $ as 4

When in doubt: If a price starts with 4 and looks too high for the item, treat the leading 4 as $
```

### File to Modify

`/home/khujta/projects/bmad/boletapp/functions/src/prompts/v3-category-standardization.ts`

In the `buildV3Prompt()` function, add the new section after "CURRENCY DETECTION".

### Version Bump

Update `version` in `PROMPT_V3` from `'3.1.0'` to `'3.2.0'` to track this improvement.

---

## Example Receipt for Testing

User provided example where this issue occurred (receipt with `$` before all item amounts being misread as prices with leading `4`).

Request user to share the specific receipt image for:
1. Pre-implementation baseline test
2. Post-implementation verification
3. Regression test suite addition

---

## Out of Scope

- Changes to image preprocessing (compression, contrast)
- OCR model selection (Gemini handles this)
- Price editing UI improvements (separate concern)
- Other currency symbol confusions (€ → 6, £ → L, etc.) - can be future story

---

## Testing Checklist

- [ ] Test with receipt showing `$X.XX` format on all items
- [ ] Test with receipt showing `X.XX$` format (suffix style)
- [ ] Test with receipt showing `$ X.XX` format (space separated)
- [ ] Verify items sum matches total after extraction
- [ ] Test edge case: actual price starting with 4 (e.g., `$4.99`, `$40.00`)
- [ ] Test mixed receipt with some items showing $ and some not
- [ ] Measure accuracy improvement (before/after comparison)

---

## Success Metrics

- Reduce `$` → `4` misread rate by >80%
- No regression on receipts without dollar signs
- User-reported scan accuracy improvement

---

## Cancellation Notes

**Date:** 2026-01-13
**Reason:** Story cancelled - testing with the US receipt image (`prompt-testing/test-cases/trips/US/long.jpg`) showed that the current V3 prompt (v3.1.0) already handles dollar sign recognition correctly. The AI produces acceptable extraction results without the `$` → `4` misread issue.

**Verification:** Tested with LOTTE Market Orlando receipt showing `$X.XX F` format prices. The V3 prompt correctly extracted prices without prefixing them with `4`.

**Conclusion:** No prompt changes needed. The existing "CURRENCY DETECTION" and "PRICE CONVERSION" instructions in the V3 prompt are sufficient for handling dollar-prefixed prices.
