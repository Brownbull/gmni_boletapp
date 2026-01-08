# Token Analysis & Cost Tracking

Track token counts and cost impact across prompt versions.

## Current Analysis (2026-01-07)

### Token Comparison: V2 vs V3 (Measured)

| Scenario | V2 Tokens | V3 Tokens | Savings |
|----------|-----------|-----------|---------|
| Default (CLP, auto) | 1,107 | 848 | 259 (23%) |
| Parking (CLP) | 1,101 | 842 | 259 (24%) |
| Restaurant (USD) | 1,100 | 843 | 257 (23%) |
| Supermarket (MXN) | 1,105 | 848 | 257 (23%) |

**Average: V2→V3: 1,103 → 845 tokens (SAVED 258 tokens, 23% reduction)**

### Raw Prompt Sizes

| Version | Characters | Est. Tokens | vs V2 |
|---------|------------|-------------|-------|
| V1 1.0.0 | 1,247 | ~312 | -71% |
| V2 2.6.0 | 4,428 | ~1,107 | baseline |
| V3 3.1.0 | 3,391 | ~848 | -23% |
| **V3 3.2.0** | **~3,550** | **~888** | **-20%** |

**V3.2.0 note:** Added Rule #11 (total validation) - adds ~40 tokens but prevents OCR errors.

**V3 savings vs V2:** ~1,000 characters (~250 tokens per request)

### Cost Impact (Gemini 2.0 Flash)

Pricing: $0.075 per 1M input tokens, $0.30 per 1M output tokens

| Scans/Month | V2 Cost | V3 Cost | Monthly Savings |
|-------------|---------|---------|-----------------|
| 1,000 | $0.08 | $0.06 | $0.02 |
| 10,000 | $0.83 | $0.63 | $0.19 |
| 100,000 | $8.27 | $6.34 | $1.94 |
| 1,000,000 | $82.73 | $63.38 | $19.35 |

**Note:** Costs are INPUT tokens only. V3 also removes currency from input (AI auto-detects).

### V3 Status: PRODUCTION (deployed 2026-01-07)

**V3 is now in production** because:
1. **23% smaller** than V2 (saves ~258 tokens per scan)
2. **Currency auto-detection** - simpler UX, no need to pass currency hint
3. **Same accuracy** - unified categories from shared schema
4. **Single-charge receipts** - properly handles parking, utilities, etc.

**Verified scans:**
- `test_villarrica.jpg` - CLP, quantity=3 items ✓
- `british_museum_1.jpg` - GBP (foreign currency auto-detected) ✓

---

## Prompt Version History

### V1: Original Chilean (v1-original)

- **Version:** 1.0.0
- **Created:** 2025-12-11
- **Tokens:** ~312
- **Status:** Legacy (not recommended)
- **Description:** Initial production prompt, extracted from analyzeReceipt.ts
- **Features:**
  - Basic receipt extraction
  - CLP currency only (hardcoded)
  - No receipt type hints
  - Simple item categorization (9 categories)

### V2: Multi-Currency + Receipt Types (v2-multi-currency-types)

- **Version:** 2.6.0
- **Created:** 2025-12-11, Last Updated: 2025-12-12
- **Tokens:** ~1,065
- **Status:** Production (current)
- **Description:** Enhanced prompt with multi-currency support and receipt type hints
- **Features:**
  - Multi-currency support (CLP, USD, EUR, MXN, ARS, etc.)
  - Receipt type hints for better context (35+ types)
  - Location extraction (country, city)
  - 13 detailed extraction rules
  - 29 store categories, 28 item categories
- **Drawbacks:**
  - Verbose rules (categories listed 3x in prompt)
  - Requires currency hint from app
  - Larger token footprint

### V3: Category Standardization (v3-category-standardization)

- **Version:** 3.2.0 (updated 2026-01-07)
- **Created:** 2026-01-06
- **Tokens:** ~888
- **Status:** PRODUCTION (deployed 2026-01-07)
- **Description:** Streamlined prompt with auto-detect currency, unified categories, and total validation
- **Changes from V2:**
  - **-20% tokens** (~1,000 chars smaller, ~250 tokens saved)
  - Currency AUTO-DETECTION (no app hint needed)
  - Categories listed once (not embedded in JSON example)
  - 11 concise rules (down from 13 verbose)
  - Unified categories from `shared/schema/categories.ts`
  - 36 store categories, 39 item categories
- **Key Rules:**
  1. Extract ALL visible line items (max 100)
  2. Store category = type of establishment
  3. Item category = what the item IS
  4. Use 'Other' only if no category fits
  5. Item names max 50 characters
  6. Time in 24h format, default "04:04"
  7. Extract country/city from receipt text only
  8. Subcategory is optional free-form
  9. Currency can be null (app will ask user)
  10. **MUST have at least one item** - if no line items, create one from receipt keyword
  11. **VALIDATION** - total should match items sum; if >40% discrepancy, re-check for missing digits
- **Currency Handling:**
  - AI detects from symbols ($, €, £, ¥) and text
  - Uses country clues for ambiguous symbols ($ = USD vs CLP)
  - Returns ISO 4217 code or null if uncertain
  - App can prompt user to confirm if needed
- **Total Validation (V3.2.0):**
  - AI self-checks that total ≈ sum of items
  - If >40% discrepancy, AI re-checks for OCR errors (missing/extra digits)
  - App also validates client-side with `TotalMismatchDialog`

---

## Token Optimization Details

### What V3 Removed from V2

| Removed | Reason | Token Savings |
|---------|--------|---------------|
| `{{currency}}` placeholder | AI auto-detects | ~50 tokens |
| Categories in JSON example | Listed separately | ~200 tokens |
| Duplicate category list in Rule #7 | Redundant | ~150 tokens |
| Verbose edge-case rules | Condensed to Rule #10 | ~100 tokens |
| LOCATION EXTRACTION section | Merged into Rule #7 | ~50 tokens |

### What V3 Kept/Improved

| Feature | Status |
|---------|--------|
| All extraction fields | Kept (merchant, date, time, total, items, etc.) |
| Store categories | Expanded (36 vs 29) |
| Item categories | Expanded (39 vs 28) |
| Location extraction | Kept (country, city) |
| Confidence metadata | Kept |
| Subcategory | Kept (optional free-form) |
| Single-charge handling | Improved (Rule #10) |

---

## Running Token Analysis

Compare prompt versions:

```bash
npm run test:scan:compare
```

Quick token estimate:

```bash
npx tsx -e "
import { PROMPT_V3 } from './prompt-testing/prompts/v3-category-standardization';
console.log('V3 chars:', PROMPT_V3.prompt.length);
console.log('V3 tokens (est):', Math.ceil(PROMPT_V3.prompt.length / 4));
"
```

---

## Promoting V3 to Production

To switch production from V2 to V3:

```typescript
// In prompt-testing/prompts/index.ts, change:
export const PRODUCTION_PROMPT: PromptConfig = PROMPT_V2;  // Current
// To:
export const PRODUCTION_PROMPT: PromptConfig = PROMPT_V3;  // Recommended
```

Then rebuild and deploy:

```bash
cd functions && npm run prebuild && npm run build
firebase deploy --only functions
```

---

## Cost Estimation Formula

```
Monthly Cost = (input_tokens + output_tokens) × scans × price_per_token

Where:
- input_tokens = prompt tokens (~836 for V3)
- output_tokens = response tokens (~300 average)
- scans = monthly scan count
- price = $0.075/1M input + $0.30/1M output (Gemini 2.0 Flash)
```

**Note:** Token estimates use ~4 characters per token approximation. Actual counts may vary 10-20%.
