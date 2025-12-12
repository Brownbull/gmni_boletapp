# Prompt Testing Quickstart

Iterate on AI prompts using real receipt images and measurable results.

## The Loop

```
1. Add Image → 2. Configure Input (optional) → 3. Generate → 4. Correct → 5. Compare → 6. Improve → 7. Deploy
```

**Only the image file is required.** Input and expected files are optional/auto-generated.

---

## 1. Add a Test Image

Add a receipt image to the appropriate category folder:

```bash
prompt-testing/test-cases/
├── supermarket/
├── pharmacy/
├── restaurant/
├── parking/
└── other/
```

Example: `prompt-testing/test-cases/restaurant/taco_bell.jpg`

---

## 2. Configure Input Variables (Optional)

**Optionally**, create an input file to customize how the AI processes this image.

If you skip this step, defaults are used: `currency: "CLP"`, `receiptType: "auto"`.

Create `taco_bell.input.json` (same name as image, with `.input.json` extension):

```json
{
  "currency": "MXN",
  "receiptType": "restaurant"
}
```

This simulates what the app would send when scanning:
- **currency** - The user's selected currency (affects price parsing)
- **receiptType** - Hint about document type (improves extraction accuracy)

**Input fields (all optional - defaults used if omitted):**

| Field | Default | Description |
|-------|---------|-------------|
| `currency` | `"CLP"` | Currency code: `"CLP"`, `"USD"`, `"EUR"`, `"MXN"`, `"ARS"`, etc. |
| `receiptType` | `"auto"` | Document type hint (see below) |

**Common receipt types:**

| Category | Types |
|----------|-------|
| Food | `supermarket`, `restaurant`, `cafe`, `bar`, `bakery` |
| Retail | `general_store`, `department_store`, `pharmacy` |
| Automotive | `gas_station`, `auto_repair`, `parking` |
| Travel | `hotel`, `car_rental`, `airline_ticket` |
| Services | `utility_bill`, `transport_ticket`, `subscription` |
| Default | `auto` (let AI detect) |

**Examples:**

Mexican restaurant receipt:
```json
{
  "currency": "MXN",
  "receiptType": "restaurant"
}
```

US online purchase:
```json
{
  "currency": "USD",
  "receiptType": "online_purchase"
}
```

Chilean parking ticket (uses defaults):
```json
{
  "currency": "CLP",
  "receiptType": "parking"
}
```

---

## 3. Generate Expected Results

Run the generator - it finds all related files automatically:

```bash
# Just specify the path without extension - it auto-detects the image
npm run test:scan:generate -- restaurant/taco_bell

# The CLI automatically finds:
#   - taco_bell.jpg (or .jpeg/.png) - REQUIRED
#   - taco_bell.input.json - optional (uses defaults if missing)
#   - Creates: taco_bell.expected.json

# Regenerate (overwrite existing expected.json)
npm run test:scan:generate -- restaurant/taco_bell --force
```

This:
1. Finds the image file (auto-detects `.jpg`, `.jpeg`, or `.png`)
2. Reads `taco_bell.input.json` if it exists (otherwise uses defaults: CLP, auto)
3. Builds prompt with `buildPrompt({ currency, receiptType })`
4. Calls Cloud Function with the image
5. Creates `taco_bell.expected.json` with AI extraction results and the input used

The generated file includes the input that was used:

```json
{
  "metadata": {
    "testId": "taco_bell",
    "storeType": "restaurant",
    "addedAt": "2025-12-12T..."
  },
  "input": {
    "currency": "MXN",
    "receiptType": "restaurant"
  },
  "aiExtraction": {
    "merchant": "Taco Bell",
    "date": "2025-12-10",
    "time": "14:35",
    "total": 15990,
    "currency": "MXN",
    "category": "Restaurant",
    "country": "Mexico",
    "city": "Mexico City",
    "items": [...],
    "aiMetadata": {
      "receiptType": "restaurant",
      "confidence": 0.95
    }
  }
}
```

**Key fields extracted by AI (v2.6.0):**
- `merchant` - Store/service name
- `date` - Receipt date (YYYY-MM-DD)
- `time` - Receipt time in 24h format (HH:MM), defaults to "04:04" if not found
- `total` - Total amount as integer
- `currency` - Detected currency code
- `category` - Store category (from 29 predefined options)
- `country`/`city` - Location if visible on receipt
- `items` - Line items with name, price, category, optional subcategory
- `aiMetadata` - Receipt type detection and confidence score

---

## 4. Add Corrections

Edit the `.expected.json` file to add corrections for what the AI got wrong:

```json
{
  "metadata": { ... },
  "input": {
    "currency": "MXN",
    "receiptType": "restaurant"
  },
  "aiExtraction": { ... },
  "corrections": {
    "category": "Restaurant",
    "total": 15990,
    "addItems": [
      { "name": "Taco Supreme", "price": 4500, "category": "Food" }
    ],
    "reviewNotes": "AI missed one taco item"
  }
}
```

**Correction fields:**
- `category`, `merchant`, `date`, `total` - Override AI values
- `addItems` - Items AI missed
- `deleteItems` - Items AI hallucinated (by index)
- `modifyItems` - Fix item values (by index)
- `reviewNotes` - Human notes for context

---

## 5. Run Comparison

```bash
npm run test:scan
```

The test harness:
1. Reads each `.expected.json`
2. Uses the `input` field to build the same prompt
3. Compares AI results against corrections

Output shows accuracy and what AI got wrong:

```
Summary: 2/3 passed (67%)
Overall accuracy: 83.5%

By Field:
  total:       3/3 (100%)  ✓
  category:    2/3 (67%)   ✗
  itemPrices:  1/3 (33%)   ✗

📝 AI Accuracy Insights:
  Fields commonly incorrect:
    - category: 2 time(s)
  Item extraction issues:
    - Items missed by AI: 3
```

---

## 6. Improve the Prompt

Results are saved to `prompt-testing/results/YYYYMMDD_HHMMSS_ACTIVE_PROMPT.json`.

**Use this prompt with Claude Code to get improvement suggestions:**

```
I ran the scan test and got these results:

[paste the JSON results or key findings]

Based on the AI errors:
- Category mismatches: [list them]
- Items missed: [count]
- Fields incorrect: [list]

Suggest specific improvements to the prompt in:
prompt-testing/prompts/v2-multi-currency-receipt-types.ts

Focus on:
1. What extraction rules to add/modify
2. What context to provide for the failing cases
3. Keep changes minimal and targeted
```

### Creating a New Prompt Version

1. Copy existing prompt:
   ```bash
   cp prompt-testing/prompts/v2-multi-currency-receipt-types.ts \
      prompt-testing/prompts/v3-improved.ts
   ```

2. Edit `v3-improved.ts` using this template:
   ```typescript
   /**
    * Prompt V3 - Description of what's new
    */
   import type { PromptConfig } from './types';
   import { STORE_CATEGORY_LIST, ITEM_CATEGORY_LIST } from './output-schema';

   function buildV3Prompt(): string {
     return `Your prompt with {{currency}}, {{date}}, {{receiptType}} placeholders...`;
   }

   export const PROMPT_V3: PromptConfig = {
     id: 'v3-description',           // Lowercase, hyphenated
     name: 'Human Readable Name',
     description: 'What makes this version different',
     version: '3.0.0',               // Semver
     createdAt: '2025-12-12',
     prompt: buildV3Prompt(),
   };
   ```

   **Naming conventions:**
   | Field | Convention | Example |
   |-------|------------|---------|
   | File | `v{N}-{slug}.ts` | `v3-few-shot.ts` |
   | ID | `v{n}-{slug}` | `v3-few-shot` |
   | Version | Semver | `3.0.0` |

3. Register in `prompt-testing/prompts/index.ts`:
   ```typescript
   import { PROMPT_V3 } from './v3-improved';

   const PROMPT_REGISTRY: Map<string, PromptConfig> = new Map([
     [PROMPT_V1.id, PROMPT_V1],
     [PROMPT_V2.id, PROMPT_V2],
     [PROMPT_V3.id, PROMPT_V3],  // Add this
   ]);
   ```

4. Set as development prompt:
   ```typescript
   export const DEV_PROMPT: PromptConfig = PROMPT_V3;
   // PRODUCTION_PROMPT stays unchanged (safe for users)
   ```

**Template variables** (replaced at runtime):
| Variable | Replaced With | Example |
|----------|---------------|---------|
| `{{currency}}` | Currency context | `CLP`, `USD` |
| `{{date}}` | Today's date | `2025-12-11` |
| `{{receiptType}}` | Receipt type hint | `supermarket`, `auto` |

---

## 7. Deploy to Production

### Dual Prompt Architecture

The system supports **two parallel prompts**:

| Prompt | Purpose | Used By |
|--------|---------|---------|
| `PRODUCTION_PROMPT` | Stable prompt for real users | Mobile app |
| `DEV_PROMPT` | Experimental prompt for testing | Test harness |

```
┌────────────────────────────────────────────────────────────────────────┐
│                         prompt-testing/prompts/index.ts                │
│                                                                        │
│   PRODUCTION_PROMPT = PROMPT_V2  ←── Mobile app uses this              │
│   DEV_PROMPT = PROMPT_V3         ←── Test harness uses this            │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ prebuild copies
┌────────────────────────────────────────────────────────────────────────┐
│                         functions/src/prompts/                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ firebase deploy
┌────────────────────────────────────────────────────────────────────────┐
│                         Cloud Function                                 │
│                                                                        │
│   promptContext='production' → PRODUCTION_PROMPT (mobile app)          │
│   promptContext='development' → DEV_PROMPT (test harness)              │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Testing Workflow (Safe - Production Unaffected)

1. **Create new prompt** (e.g., `v3-improved.ts`)

2. **Set as DEV_PROMPT** in `index.ts`:
   ```typescript
   export const DEV_PROMPT: PromptConfig = PROMPT_V3;
   // PRODUCTION_PROMPT stays as PROMPT_V2 (unchanged)
   ```

3. **Deploy to Cloud Function**:
   ```bash
   cd functions && npm run prebuild && npm run build
   firebase deploy --only functions
   ```

4. **Test with harness** (uses DEV_PROMPT):
   ```bash
   npm run test:scan:generate -- parking/test-receipt
   npm run test:scan
   ```

5. **Mobile app users** continue using PRODUCTION_PROMPT - unaffected!

### Promoting to Production

When DEV_PROMPT testing is successful:

1. **Update PRODUCTION_PROMPT** in `index.ts`:
   ```typescript
   export const PRODUCTION_PROMPT: PromptConfig = PROMPT_V3;
   export const DEV_PROMPT: PromptConfig = PROMPT_V3;  // Keep in sync or set to V4
   ```

2. **Deploy**:
   ```bash
   cd functions && npm run prebuild && npm run build
   firebase deploy --only functions
   ```

3. **Verify in mobile app**: Scan a receipt to confirm new prompt is live.

4. **Commit**:
   ```bash
   git add prompt-testing/prompts/
   git commit -m "feat: Promote V3 prompt to production"
   ```

### Cost Impact

Before deploying a new prompt, check token/cost impact:

```bash
npm run test:scan:compare
```

See [TOKEN-ANALYSIS.md](./TOKEN-ANALYSIS.md) for detailed cost tracking across versions.

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run test:scan` | Run all tests with DEV_PROMPT |
| `npm run test:scan:generate -- <path>` | Generate expected.json using DEV_PROMPT |
| `npm run test:scan:validate` | Validate all test case files |
| `npm run test:scan:compare` | Compare token counts & costs between prompt versions |
| `npm run test:scan:self-test` | Run harness unit tests |

## Directory Structure

```
prompt-testing/
├── prompts/           # Prompt versions (source of truth)
│   ├── index.ts       # PRODUCTION_PROMPT + DEV_PROMPT + buildPrompt()
│   ├── v1-original.ts
│   └── v2-*.ts
├── test-cases/        # Images + optional input/expected files
│   └── {category}/
│       ├── receipt.jpg             # REQUIRED - the receipt image
│       ├── receipt.input.json      # OPTIONAL - input variables (uses defaults if missing)
│       └── receipt.expected.json   # AUTO-GENERATED - AI results + corrections
├── results/           # Test run outputs (gitignored)
└── scripts/           # Test harness CLI
```

## File Requirements

| File | Required | Created By | Purpose |
|------|----------|------------|---------|
| `receipt.jpg` | **Yes** | You | Receipt image to scan |
| `receipt.input.json` | No | You (optional) | Custom currency/receiptType |
| `receipt.expected.json` | No | `generate` command | AI results + your corrections |

## Flow Summary

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. Add Image   │────▶│ 2. Create Input │────▶│   3. Generate   │
│  receipt.jpg    │     │   (optional)    │     │ receipt.expected│
│                 │     │                 │     │   .json         │
│  REQUIRED       │     │ receipt.input   │     │                 │
│                 │     │   .json         │     │ Uses input or   │
│                 │     │                 │     │ defaults (CLP)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

This mirrors the app flow:
1. User has an image to scan
2. User's settings define currency (optional - defaults to CLP)
3. App calls `buildPrompt({ currency, receiptType })` then sends to Gemini

---

## Best Practices

### DO
- Keep prompts focused and concise
- Include all categories in the prompt (use `STORE_CATEGORY_LIST`, `ITEM_CATEGORY_LIST`)
- Test with diverse receipt types before deploying
- Document what changed and why in the version notes
- Use semantic versioning (major.minor.patch)
- Run tests before deploying (`npm run test:scan`)

### DON'T
- Deploy without testing first
- Remove required placeholders (`{{currency}}`, `{{date}}`)
- Make breaking changes to JSON output format without client updates
- Delete old prompt versions (keep for comparison/rollback)

---

## Troubleshooting

### "Prompt not found" error
- Verify prompt is registered in `PROMPT_REGISTRY` in index.ts
- Check the ID matches exactly (case-sensitive)

### Cloud Function fails to deploy
- Run `cd functions && npx tsc` to check for TypeScript errors
- Run `npm run prebuild` before building

### Extraction quality degraded
- Compare with previous prompt using test harness
- Check if new prompt instructions conflict with existing rules
- Review specific failure cases in test results

### Time shows "04:04" unexpectedly
- The `04:04` default means no time was found on receipt (404 = not found)
- Check if the receipt actually has a time printed
