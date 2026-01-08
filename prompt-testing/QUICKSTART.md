# Prompt Testing Quickstart

Iterate on AI prompts using real receipt images and measurable results.

## The Loop

```
1. Add Image → 2. Configure Input (optional) → 3. Generate → 4. Correct → 5. Compare → 6. Improve → 7. Deploy
```

**Only the image file is required.** Input and expected files are optional/auto-generated.

---

## Current Prompt Versions

| Version | Status | Categories | Key Features |
|---------|--------|------------|--------------|
| V2 | Legacy | 29 store, 32 item | Verbose context per currency |
| V3.2.0 | **Production** | 35 store, 37 item | Auto-detect currency, total validation |

V3 uses the **unified schema** (`shared/schema/`) as single source of truth for categories and currencies.

### V3.2.0 Features (Current)
- **Currency auto-detection** - No need to pass currency hint from app
- **Total validation** - AI self-checks total vs items sum (Rule #11)
- **20% smaller** than V2 (~250 tokens saved per scan)

---

## 1. Add a Test Image

Add a receipt image to the appropriate category folder:

```bash
prompt-testing/test-cases/
├── supermarket/
├── pharmacy/
├── restaurant/
├── gas-station/
├── convenience/
├── trips/
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
| `currency` | `"CLP"` | Any supported currency code (see below) |
| `receiptType` | `"auto"` | Document type hint (see below) |

**Supported Currencies (20+):**

| Region | Currencies |
|--------|------------|
| Americas | `CLP`, `USD`, `CAD`, `MXN`, `BRL`, `ARS`, `COP`, `PEN` |
| Europe | `EUR`, `GBP`, `CHF` |
| Asia-Pacific | `JPY`, `CNY`, `KRW`, `AUD`, `NZD`, `INR` |
| Middle East/Africa | `AED`, `ZAR`, `ILS` |

Currency handling is based on `usesCents` flag:
- **With cents** (USD, EUR, GBP): `$15.99 → 1599` (multiply by 100)
- **Without cents** (CLP, COP, JPY): `$15,990 → 15990` (as-is)

**Common receipt types:**

| Category | Types |
|----------|-------|
| Food | `supermarket`, `restaurant`, `cafe`, `bar`, `bakery` |
| Retail | `general_store`, `department_store`, `pharmacy` |
| Automotive | `gas_station`, `auto_repair`, `parking` |
| Travel | `hotel`, `car_rental`, `airline_ticket` |
| Services | `utility_bill`, `transport_ticket`, `subscription` |
| Default | `auto` (let AI detect) |

---

## 3. Generate Expected Results

Run the generator - it finds all related files automatically:

```bash
# Just specify the path without extension - it auto-detects the image
npm run test:scan:generate -- restaurant/taco_bell

# The CLI automatically finds:
#   - taco_bell.jpg (or .jpeg/.png) - REQUIRED
#   - taco_bell.input.json - optional (uses defaults if missing)
#   - Creates: taco_bell.expected.v3.json (version-tagged)

# Regenerate (overwrite existing expected.json)
npm run test:scan:generate -- restaurant/taco_bell --force
```

This:
1. Finds the image file (auto-detects `.jpg`, `.jpeg`, or `.png`)
2. Reads `taco_bell.input.json` if it exists (otherwise uses defaults: CLP, auto)
3. Builds prompt with `buildPrompt({ currency, receiptType })`
4. Calls Cloud Function with the image
5. Creates `taco_bell.expected.v3.json` with AI extraction results

**Key fields extracted by AI (V3):**
- `merchant` - Store/service name
- `date` - Receipt date (YYYY-MM-DD)
- `time` - Receipt time in 24h format (HH:MM), defaults to "04:04" if not found
- `total` - Total amount as integer (smallest currency unit)
- `currency` - Detected currency code
- `category` - Store category (from 35 options)
- `country`/`city` - Location if visible on receipt
- `items` - Line items with name, price, category (from 37 options), optional subcategory
- `metadata` - Receipt type detection and confidence score

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
      { "name": "Taco Supreme", "price": 4500, "category": "Prepared Food" }
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
```

---

## 6. Improve the Prompt

Results are saved to `prompt-testing/results/YYYYMMDD_HHMMSS_DEV_PROMPT.json`.

### Editing V3 Prompt

The V3 prompt is at `prompt-testing/prompts/v3-category-standardization.ts`.

**Key files to understand:**

| File | Purpose |
|------|---------|
| `shared/schema/categories.ts` | **Single source** for 35 store + 37 item categories |
| `shared/schema/currencies.ts` | **Single source** for currencies with `usesCents` flag |
| `v3-category-standardization.ts` | V3 prompt builder (imports from shared schema) |

**Template variables** (replaced at runtime):
| Variable | Replaced With | Example |
|----------|---------------|---------|
| `{{currency}}` | Currency context with usesCents guidance | `"Chilean Peso (CLP) uses whole numbers only..."` |
| `{{date}}` | Today's date | `2026-01-06` |
| `{{receiptType}}` | Receipt type hint | `a supermarket receipt` |

### Creating a New Prompt Version (V4+)

1. Copy existing prompt:
   ```bash
   cp prompt-testing/prompts/v3-category-standardization.ts \
      prompt-testing/prompts/v4-improved.ts
   ```

2. Edit the new file - import from unified schema:
   ```typescript
   import { STORE_CATEGORY_LIST, ITEM_CATEGORY_LIST } from '../../shared/schema/categories';
   import { getCurrencyPromptContext } from '../../shared/schema/currencies';
   ```

3. Register in `prompt-testing/prompts/index.ts`:
   ```typescript
   import { PROMPT_V4 } from './v4-improved';

   const PROMPT_REGISTRY: Map<string, PromptConfig> = new Map([
     [PROMPT_V1.id, PROMPT_V1],
     [PROMPT_V2.id, PROMPT_V2],
     [PROMPT_V3.id, PROMPT_V3],
     [PROMPT_V4.id, PROMPT_V4],  // Add this
   ]);
   ```

4. Set as development prompt:
   ```typescript
   export const DEV_PROMPT: PromptConfig = PROMPT_V4;
   // PRODUCTION_PROMPT stays unchanged (safe for users)
   ```

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

1. **Edit prompt** (e.g., `v3-category-standardization.ts`)

2. **Deploy to Cloud Function**:
   ```bash
   cd functions && npm run prebuild && npm run build
   firebase deploy --only functions
   ```

3. **Test with harness** (uses DEV_PROMPT):
   ```bash
   npm run test:scan:generate -- restaurant/test-receipt
   npm run test:scan
   ```

4. **Mobile app users** continue using PRODUCTION_PROMPT - unaffected!

### Promoting to Production

When DEV_PROMPT testing is successful:

1. **Update PRODUCTION_PROMPT** in `index.ts`:
   ```typescript
   export const PRODUCTION_PROMPT: PromptConfig = PROMPT_V3;
   export const DEV_PROMPT: PromptConfig = PROMPT_V3;
   ```

2. **Deploy**:
   ```bash
   cd functions && npm run prebuild && npm run build
   firebase deploy --only functions
   ```

3. **Verify in mobile app**: Scan a receipt to confirm new prompt is live.

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
├── prompts/           # Prompt versions
│   ├── index.ts       # PRODUCTION_PROMPT + DEV_PROMPT + buildPrompt()
│   ├── v1-original.ts
│   ├── v2-multi-currency-receipt-types.ts
│   └── v3-category-standardization.ts  # Current dev prompt
├── test-cases/        # Images + optional input/expected files
│   └── {category}/
│       ├── receipt.jpg             # REQUIRED - the receipt image
│       ├── receipt.input.json      # OPTIONAL - input variables
│       └── receipt.expected.json   # AUTO-GENERATED - AI results
├── results/           # Test run outputs (gitignored)
└── scripts/           # Test harness CLI

shared/
├── schema/            # SINGLE SOURCE OF TRUTH
│   ├── categories.ts  # 35 store + 37 item categories
│   ├── currencies.ts  # 20+ currencies with usesCents flag
│   └── index.ts       # Re-exports everything
└── prompts/           # (legacy - use prompt-testing/prompts instead)
```

## V3 Category Reference

### Store Categories (35)

| Group | Categories |
|-------|------------|
| Food & Dining | Supermarket, Restaurant, Bakery, Butcher, StreetVendor |
| Health & Wellness | Pharmacy, Medical, Veterinary, HealthBeauty |
| Retail - General | Bazaar, Clothing, Electronics, HomeGoods, Furniture, Hardware, GardenCenter |
| Retail - Specialty | PetShop, BooksMedia, OfficeSupplies, SportsOutdoors, ToysGames, Jewelry, Optical, **MusicStore** |
| Automotive & Transport | Automotive, GasStation, Transport |
| Services & Finance | Services, BankingFinance, Education, TravelAgency, **Subscription** |
| Hospitality & Entertainment | HotelLodging, Entertainment |
| Government | **Government** |
| Other | CharityDonation, Other |

### Item Categories (37)

| Group | Categories |
|-------|------------|
| Food - Fresh | Produce, Meat & Seafood, Bakery, Dairy & Eggs |
| Food - Packaged | Pantry, Frozen Foods, Snacks, Beverages, Alcohol |
| Food - Prepared | **Prepared Food** |
| Health & Personal | Health & Beauty, Personal Care, Pharmacy, Supplements, Baby Products |
| Household | Cleaning Supplies, Household, Pet Supplies |
| Non-Food Retail | Clothing, Electronics, Hardware, Garden, Automotive, Sports & Outdoors, Toys & Games, Books & Media, Office & Stationery, Crafts & Hobbies, Furniture, **Musical Instruments** |
| Services & Fees | Service, Tax & Fees, **Subscription**, **Insurance**, **Loan Payment**, Tobacco |
| Other | Other |

**Bold** = New in V3

---

## Best Practices

### DO
- Import categories from `shared/schema/categories.ts` (single source of truth)
- Import currencies from `shared/schema/currencies.ts`
- Test with diverse receipt types before deploying
- Use the `usesCents` flag for currency handling
- Run tests before deploying (`npm run test:scan`)

### DON'T
- Define categories inline in prompts (use the unified schema)
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
- Run `npx tsc --noEmit` to check for TypeScript errors
- Run `cd functions && npm run prebuild` before building

### Categories not matching between AI and app
- Both should use `shared/schema/categories.ts`
- Check if `src/types/transaction.ts` re-exports from unified schema

### Time shows "04:04" unexpectedly
- The `04:04` default means no time was found on receipt (404 = not found)
- Check if the receipt actually has a time printed

---

## Implementing in the App

### Total Validation (V3.2.0)

V3.2.0 includes a self-validation rule asking the AI to verify that the extracted total matches the sum of items. However, AI validation alone isn't 100% reliable, so the app includes **client-side validation** as a safety net.

#### Files Involved

| File | Purpose |
|------|---------|
| `src/utils/totalValidation.ts` | Validation utility (calculates discrepancy, detects error type) |
| `src/components/scan/TotalMismatchDialog.tsx` | Dialog component for user to choose corrected total |
| `src/App.tsx` | Integration in `processScan()` flow |
| `src/utils/translations.ts` | EN/ES translations for dialog |

#### How It Works

1. **AI extracts** transaction with total and items
2. **App validates** using `validateTotal(transaction)`:
   - Calculates `itemsSum = Σ(price × quantity)`
   - Checks discrepancy: `|total - itemsSum| / max(total, itemsSum)`
   - If >40%, returns `isValid: false` with error type
3. **If invalid**, `TotalMismatchDialog` shows:
   - Extracted total (highlighted as error)
   - Calculated items sum (recommended)
   - Error hint if digit pattern detected (missing/extra digit)
4. **User chooses**:
   - "Use items sum" → corrects total, continues flow
   - "Keep original" → uses AI total with reconciliation item

#### Code Example: Using the Validation Utility

```typescript
import { validateTotal, needsTotalValidation } from './utils/totalValidation';

// Quick check (boolean)
if (needsTotalValidation(transaction)) {
  // Show warning or dialog
}

// Full validation with details
const result = validateTotal(transaction);
// result = {
//   isValid: false,
//   extractedTotal: 10205,
//   itemsSum: 102052,
//   discrepancy: 0.9,
//   discrepancyPercent: 90,
//   suggestedTotal: 102052,
//   errorType: 'missing_digit' | 'extra_digit' | 'unknown' | 'none'
// }
```

#### Integrating in processScan()

The validation is already integrated in `App.tsx` processScan function. Key pattern:

```typescript
// After parsing items from AI response
const totalValidation = validateTotal(tempTransaction);

if (!totalValidation.isValid) {
  // Store data for dialog
  setTotalMismatchData({
    validationResult: totalValidation,
    pendingTransaction: transaction,
    parsedItems,
  });
  setShowTotalMismatch(true);
  return; // Wait for user decision
}

// Continue normal flow...
```

#### Threshold Configuration

The 40% threshold is defined in `totalValidation.ts`:

```typescript
export const TOTAL_DISCREPANCY_THRESHOLD = 0.4; // 40%
```

Adjust this if needed for different use cases:
- **Lower (e.g., 20%)**: More sensitive, catches smaller errors but may false-positive
- **Higher (e.g., 60%)**: Only catches major errors like digit issues

### Currency Mismatch (V3+)

Similar pattern for when AI-detected currency differs from user's default:

```typescript
import { CurrencyMismatchDialog } from './components/scan';

// In processScan(), after AI extraction:
if (detectedCurrency && detectedCurrency !== userDefaultCurrency) {
  setShowCurrencyMismatch(true);
  // Dialog lets user choose: detected vs default
}
```

### Testing the Implementation

1. **Unit tests for validation**:
   ```bash
   npm test -- tests/unit/utils/totalValidation.test.ts
   ```

2. **Component tests for dialog**:
   ```bash
   npm test -- tests/unit/components/scan/TotalMismatchDialog.test.ts
   ```

3. **Manual test with super_lider receipt**:
   - Image: `prompt-testing/test-cases/supermarket/super_lider.jpg`
   - Known issue: AI extracts 10,205 instead of 102,052 (missing digit)
   - Dialog should appear offering correction
