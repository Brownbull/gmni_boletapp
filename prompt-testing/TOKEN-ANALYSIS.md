# Token Analysis & Cost Tracking

Track token counts and cost impact across prompt versions.

## Current Analysis (2025-12-12)

### Token Comparison: V1 vs V2

| Scenario | V1 Tokens | V2 Tokens | Increase |
|----------|-----------|-----------|----------|
| Default (CLP, auto) | ~149 | ~720 | +571 (+383%) |
| Parking (CLP) | ~149 | ~720 | +571 (+383%) |
| Restaurant (USD) | ~149 | ~720 | +571 (+383%) |
| Supermarket (MXN) | ~149 | ~720 | +571 (+383%) |

**Average:** V1 = ~149 tokens, V2 v2.6.0 = ~720 tokens (+383%)

### Cost Impact (Gemini 2.0 Flash)

Pricing: $0.075 per 1M input tokens, $0.30 per 1M output tokens

| Scans/Month | V1 Cost | V2 Cost | Difference |
|-------------|---------|---------|------------|
| 1,000 | $0.0001 | $0.0005 | +$0.0004 |
| 10,000 | $0.0011 | $0.0053 | +$0.0042 |
| 100,000 | $0.0112 | $0.0525 | +$0.0413 |

**Conclusion:** V2 v2.5.0 is ~4.7x larger but cost increase is negligible (~$0.05/month at 100K scans).

---

## Prompt Version History

### V1: Original Chilean (v1-original)

- **Created:** 2025-12-11
- **Tokens:** ~149
- **Description:** Initial production prompt, extracted from analyzeReceipt.ts
- **Features:**
  - Basic receipt extraction
  - CLP currency only
  - No receipt type hints
  - Simple item categorization

### V2: Multi-Currency + Receipt Types (v2-multi-currency-types)

- **Current Version:** 2.6.0
- **Created:** 2025-12-11, Last Updated: 2025-12-12
- **Tokens:** ~720 (estimate, increased from ~645 due to new rules)
- **Description:** Enhanced prompt with multi-currency support, receipt type hints, and 13 extraction rules
- **Features:**
  - Multi-currency support (CLP, USD, EUR, MXN, ARS, etc.)
  - Receipt type hints for better context (35+ types)
  - Location extraction (country, city from receipt text only)
  - Time extraction (24-hour format, default 04:04 if not found)
  - Enhanced item categorization (29 store categories, 28 item categories)
  - Single-charge receipt handling (parking, tolls, transport)
  - Confidence metadata
- **Extraction Rules (v2.6.0):**
  1. Extract ALL line items visible on receipt
  2. Utility bills: category="Services"
  3. Parking receipts: category="Transport"
  4. Transport tickets: category="Transport"
  5. Online purchases: extract order items
  6. Currency mismatch handling
  7. Store category validation (strict list)
  8. Simple single-charge receipts must have at least one item
  9. Max 100 items limit
  10. Item names max 50 characters
  11. Email domain fallback for unclear merchant names
  12. Subcategory is optional and free-form (only when useful)
  13. Time in 24-hour format (HH:MM), default "04:04" if not found

---

## Running Token Analysis

Compare prompt versions:

```bash
npm run test:scan:compare
```

Output includes:
- Token counts by scenario
- Cost estimates at different usage levels
- Raw prompt character lengths
- Preview of each prompt

---

## Adding New Prompt Versions

When you create a new prompt version, update this document:

1. Add a new section under "Prompt Version History"
2. Run `npm run test:scan:compare` and update the comparison tables
3. Document key changes and expected impact

### Template for New Version

```markdown
### V3: [Name] (v3-[id])

- **Created:** YYYY-MM-DD
- **Tokens:** ~XXX
- **Description:** [Brief description]
- **Changes from V2:**
  - [Change 1]
  - [Change 2]
- **Expected Impact:**
  - Accuracy: [improvement area]
  - Cost: +X% tokens (~$X.XX/month at 100K scans)
```

---

## Cost Estimation Formula

```
Monthly Cost = (avg_tokens × scans_per_month / 1,000,000) × price_per_1M_tokens
```

For Gemini 2.0 Flash:
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens (same for all prompts, ~200-500 tokens response)

**Note:** Token estimates use ~4 characters per token approximation. Actual counts may vary 10-20%.
