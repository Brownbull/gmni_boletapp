# Prompt Architecture

Visual documentation of how prompts are constructed, managed, and deployed.

## 1. Prompt Component Structure

How individual prompt pieces combine to form the final prompt:

```mermaid
flowchart TB
    OUTPUT["output-schema.ts<br/>AI OUTPUT: categories, JSON structure"]
    INPUT["input-hints.ts<br/>USER INPUT: currencies, receipt types"]
    V2["v2-multi-currency.ts<br/>RECEIPT_TYPES + buildV2Prompt()"]
    TYPES["types.ts<br/>PromptConfig interface"]

    OUTPUT --> V2
    INPUT --> V2
    TYPES --> V2
    V2 --> PROMPT["PROMPT_V2"]
```

## 2. Dual Prompt System

The system supports **two parallel prompts** for safe development:

| Prompt | Purpose | Used By |
|--------|---------|---------|
| `PRODUCTION_PROMPT` | Stable prompt for real users | Mobile app (`promptContext='production'`) |
| `DEV_PROMPT` | Experimental prompt for testing | Test harness (`promptContext='development'`) |

```mermaid
flowchart LR
    subgraph Prompt Versions
        V1["PROMPT_V1<br/>v1-original.ts"]
        V2["PROMPT_V2<br/>v2-multi-currency...ts"]
        V3["PROMPT_V3<br/>(future)"]
    end

    subgraph index.ts["index.ts - Registry"]
        REGISTRY["PROMPT_REGISTRY<br/>Map&lt;id, PromptConfig&gt;"]
        PROD["PRODUCTION_PROMPT<br/>(mobile app)"]
        DEV["DEV_PROMPT<br/>(test harness)"]
        getPrompt["getPrompt(id)"]
        getActive["getActivePrompt(context)"]
    end

    V1 --> REGISTRY
    V2 --> REGISTRY
    V3 -.-> REGISTRY

    REGISTRY --> getPrompt
    V2 --> PROD
    V3 -.-> DEV

    getActive -->|"'production'"| PROD
    getActive -->|"'development'"| DEV

    style PROD fill:#90EE90
    style DEV fill:#FFD700
```

### Workflow

1. **Create V3 prompt** - new experimental version
2. **Set `DEV_PROMPT = PROMPT_V3`** - test harness uses it
3. **Deploy to Cloud Function** - both prompts available
4. **Test with harness** - sends `promptContext='development'`
5. **Mobile app unaffected** - sends no context, defaults to `'production'`
6. **Promote when ready** - set `PRODUCTION_PROMPT = PROMPT_V3`

## 3. Variable Substitution Flow

How template variables are replaced at runtime using the generic `buildPrompt()` function:

```mermaid
flowchart TB
    subgraph Source["input-hints.ts"]
        IFACE["InputHints interface<br/>currency, date, receiptType"]
        DEFAULTS["DEFAULT_INPUT_HINTS<br/>currency: 'CLP'"]
        CONTEXT["CURRENCY_PARSING_CONTEXT<br/>CLP, USD, EUR, MXN..."]
    end

    subgraph Input["Input Sources"]
        APP["App Settings<br/>(default currency)"]
        SCAN["Scan Options<br/>(override per-scan)"]
        TEST["Test Input File<br/>(per-image config)"]
    end

    subgraph BuildPrompt["buildPrompt() - index.ts"]
        OPTS["BuildPromptOptions<br/>currency?, date?, receiptType?,<br/>promptConfig?"]
        GET_CTX["getCurrencyContext()<br/>'USD' → 'US Dollar (USD)...'"]
        GET_TYPE["getReceiptTypeDescription()<br/>'parking' → 'a parking ticket...'"]
        REPLACE_ALL["replaceAll() for each<br/>{{currency}}, {{date}}, {{receiptType}}"]
    end

    subgraph Template["Prompt Template (ACTIVE_PROMPT)"]
        PLACEHOLDERS["{{currency}}<br/>{{date}}<br/>{{receiptType}}"]
    end

    subgraph Final["Final Prompt"]
        OUTPUT["CURRENCY CONTEXT: US Dollar (USD)...<br/>TODAY'S DATE: 2025-12-12<br/>This is a parking ticket..."]
    end

    DEFAULTS --> OPTS
    APP --> OPTS
    SCAN --> OPTS
    TEST --> OPTS
    CONTEXT --> GET_CTX

    OPTS --> GET_CTX
    OPTS --> GET_TYPE
    PLACEHOLDERS --> REPLACE_ALL
    GET_CTX --> REPLACE_ALL
    GET_TYPE --> REPLACE_ALL
    REPLACE_ALL --> OUTPUT
```

### Input Variable Priority

Variables are resolved with this priority (highest to lowest):

1. **Per-image test config** (`input` in `.expected.json`) - for testing specific scenarios
2. **Scan options** (passed to Cloud Function) - for user overrides at scan time
3. **App settings** (user's default currency) - from user preferences
4. **Defaults** (`DEFAULT_INPUT_HINTS`) - CLP, auto, today's date

## 4. Deployment Pipeline

How prompts flow from development to production:

```mermaid
flowchart TB
    subgraph Dev["Development (prompt-testing/)"]
        PROMPTS_SRC["prompts/<br/>index.ts, v1.ts, v2.ts..."]
        TEST_HARNESS["scripts/<br/>Test Harness CLI"]
        TEST_CASES["test-cases/<br/>Images + expected.json"]
    end

    subgraph Build["Build Process"]
        PREBUILD["prebuild script<br/>cp -r prompts → functions/src/prompts"]
        TSC["tsc compile"]
    end

    subgraph Prod["Production (functions/)"]
        PROMPTS_COPY["src/prompts/<br/>(copied from prompt-testing)"]
        ANALYZE["analyzeReceipt.ts<br/>Cloud Function"]
        GEMINI["Gemini API"]
    end

    PROMPTS_SRC -->|"npm run build"| PREBUILD
    PREBUILD --> PROMPTS_COPY
    PROMPTS_COPY --> TSC
    TSC --> ANALYZE
    ANALYZE -->|"prompt + image"| GEMINI

    TEST_HARNESS -->|"validates"| PROMPTS_SRC
    TEST_CASES -->|"ground truth"| TEST_HARNESS

    style PROMPTS_SRC fill:#FFD700
    style PROMPTS_COPY fill:#FFD700
```

## 5. Cloud Function Integration

How the prompt is used in the actual receipt analysis:

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant Test as Test Harness
    participant CF as analyzeReceipt.ts
    participant Prompts as prompts/index.ts
    participant Gemini as Gemini API

    Note over App,Test: Both use same Cloud Function

    App->>CF: analyzeReceipt({<br/>images, currency,<br/>receiptType?})
    Note right of App: No promptContext<br/>→ defaults to 'production'

    Test->>CF: analyzeReceipt({<br/>images, currency,<br/>promptContext: 'development'})
    Note right of Test: Uses DEV_PROMPT

    CF->>Prompts: buildPrompt({<br/>currency, receiptType,<br/>context})
    Prompts->>Prompts: getActivePrompt(context)
    Prompts-->>CF: Final prompt string<br/>(PRODUCTION or DEV)

    CF->>Gemini: generateContent(<br/>finalPrompt,<br/>imageData)

    Gemini-->>CF: JSON response
    CF->>CF: Parse & validate
    CF-->>App: Receipt data + transactionId
```

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `images` | `string[]` | Yes | - | Base64-encoded images (data URI format) |
| `currency` | `string` | Yes | - | Currency code (CLP, USD, EUR, MXN...) |
| `receiptType` | `ReceiptType` | No | `'auto'` | Hint for document type (parking, supermarket...) |
| `promptContext` | `'production' \| 'development'` | No | `'production'` | Which prompt to use (PRODUCTION or DEV) |

## 6. Complete V2 Prompt Structure

Detailed breakdown of V2 prompt components (v2.1.0):

```mermaid
flowchart TB
    subgraph Header["Header Section"]
        H1["'Analyze the document image.'"]
        H2["'This is {{receiptType}}.'"]
    end

    subgraph Currency["Currency Section"]
        C1["'CURRENCY CONTEXT: {{currency}}'"]
        C2["Integer conversion rules"]
        C3["Decimal handling per currency"]
    end

    subgraph Date["Date Section"]
        D1["'TODAY'S DATE: {{date}}'"]
        D2["DATE_INSTRUCTIONS from output-schema.ts"]
    end

    subgraph Format["Output Format"]
        F1["'OUTPUT FORMAT: Strict JSON only'"]
        F2["JSON structure with fields:<br/>merchant, date, time, total, currency,<br/>category, country, city,<br/>items[], metadata"]
    end

    subgraph Rules["Extraction Rules (1-13)"]
        R1["1. Extract ALL line items"]
        R2["2-6. Document-specific handling"]
        R7["7-9. Currency/category rules"]
        R10["10. Item names max 50 chars"]
        R11["11. Email domain fallback for merchant"]
        R12["12. Subcategory optional, free-form"]
        R13["13. Time in 24h format, default 04:04"]
    end

    subgraph Location["Location Extraction"]
        L1["Extract country/city from<br/>receipt text ONLY"]
        L2["Set null if not visible"]
        L3["Do NOT guess from currency"]
    end

    Header --> Currency --> Date --> Format --> Rules --> Location

    subgraph Categories["Category Lists (from output-schema.ts)"]
        SC["STORE_CATEGORY_LIST"]
        IC["ITEM_CATEGORY_LIST"]
    end

    Categories --> Format
```

## File Locations

| Component | Location | Purpose |
|-----------|----------|---------|
| `output-schema.ts` | `prompt-testing/prompts/` | **AI OUTPUT**: Store/item categories, JSON structure (what AI must output) |
| `input-hints.ts` | `prompt-testing/prompts/` | **USER INPUT**: Currencies, receipt types, date (pre-scan hints) |
| `types.ts` | `prompt-testing/prompts/` | PromptConfig interface, re-exports category types from output-schema.ts |
| `v1-original.ts` | `prompt-testing/prompts/` | Baseline prompt (simple) |
| `v2-multi-currency...ts` | `prompt-testing/prompts/` | Enhanced prompt v2.6.0 (current active) with location/time extraction, name limits, email fallback, free-form subcategories |
| `index.ts` | `prompt-testing/prompts/` | Registry, PRODUCTION_PROMPT, DEV_PROMPT, buildPrompt() |
| `config.ts` | `prompt-testing/scripts/` | Test harness config, validStoreTypes (folder names) |
| `analyzeReceipt.ts` | `functions/src/` | Cloud Function that uses buildPrompt() |
| `*.input.json` | `prompt-testing/test-cases/` | Per-image input variables (created before generate) |
| `*.expected.json` | `prompt-testing/test-cases/` | AI results + corrections (created by generate) |

## API Reference

### Core Exports (from `prompts/index.ts`)

```typescript
// Active prompts
PRODUCTION_PROMPT: PromptConfig  // For mobile app users
DEV_PROMPT: PromptConfig         // For test harness

// Build prompt with variables replaced
buildPrompt({ currency, date, receiptType, promptConfig? }): string

// Get prompt by ID
getPrompt(id: string): PromptConfig

// List all registered prompts
listPrompts(): PromptConfig[]

// Get active prompt by context
getActivePrompt(context: 'production' | 'development'): PromptConfig
```

### Types

```typescript
interface PromptConfig {
  id: string;           // "v2-multi-currency-types"
  name: string;         // "Multi-Currency + Receipt Types"
  description: string;  // What this prompt does
  version: string;      // "2.6.0"
  createdAt: string;    // "2025-12-12"
  prompt: string;       // The actual prompt text with placeholders
}

type ReceiptType =
  | 'supermarket' | 'restaurant' | 'pharmacy' | 'gas_station'
  | 'utility_bill' | 'parking' | 'transport_ticket'
  | 'online_purchase' | 'subscription' | 'auto';
```

## Type Derivation Pattern

To prevent duplication between arrays and types, we use `as const` with type inference:

```typescript
// output-schema.ts - Single source of truth for AI output
export const STORE_CATEGORIES = [
  'Supermarket',
  'Restaurant',
  // ...
] as const;

// Type derived from array (not duplicated!)
export type StoreCategory = (typeof STORE_CATEGORIES)[number];
```

This pattern is used for:
- `STORE_CATEGORIES` / `StoreCategory` in output-schema.ts
- `ITEM_CATEGORIES` / `ItemCategory` in output-schema.ts
- `CONFIG.validStoreTypes` / `ValidStoreType` in config.ts

**Note**: The app's `src/types/transaction.ts` has its own `StoreCategory` type for the frontend. Keep them in sync manually when categories change.

## 7. Per-Image Test Input Configuration

Test cases can optionally specify input variables using a separate `.input.json` file.
This mirrors the app flow: user settings are known before the scan button is pressed.

**Only the image file is required.** Input and expected files are optional.

```mermaid
flowchart LR
    subgraph TestCase["test-cases/restaurant/"]
        IMG["taco_bell.jpg<br/>(REQUIRED)"]
        INPUT["taco_bell.input.json<br/>(optional)"]
        EXPECTED["taco_bell.expected.json<br/>(auto-generated)"]
    end

    subgraph InputFile["input.json (optional)"]
        CURR["currency: 'MXN'"]
        TYPE["receiptType: 'restaurant'"]
        DEFAULTS["or defaults:<br/>CLP, auto"]
    end

    subgraph Generate["test:scan:generate -- restaurant/taco_bell"]
        FIND["1. Find taco_bell.jpg"]
        READ["2. Read input.json<br/>(or use defaults)"]
        BUILD["3. buildPrompt(input)"]
        SCAN["4. Call Cloud Function"]
        WRITE["5. Write expected.json"]
    end

    IMG --> FIND
    FIND --> READ
    INPUT -.-> READ
    DEFAULTS -.-> READ
    READ --> BUILD
    BUILD --> SCAN
    SCAN --> WRITE
    WRITE --> EXPECTED
```

### Test Case File Structure

Each test case has 1 required file and 2 optional files:

```
test-cases/restaurant/
├── taco_bell.jpg           # REQUIRED - Receipt image (.jpg, .jpeg, or .png)
├── taco_bell.input.json    # OPTIONAL - Input variables (uses defaults if missing)
└── taco_bell.expected.json # AUTO-GENERATED - AI results + corrections
```

| File | Required | Created By | Purpose |
|------|----------|------------|---------|
| `*.jpg` / `*.jpeg` / `*.png` | **Yes** | You | Receipt image |
| `*.input.json` | No | You (optional) | Custom currency/receiptType |
| `*.expected.json` | No | `generate` command | AI results + corrections |

### CLI Path Resolution

The generate command accepts paths without file extensions:

```bash
npm run test:scan:generate -- restaurant/taco_bell
```

The CLI automatically:
1. Searches for `taco_bell.jpg`, `taco_bell.jpeg`, or `taco_bell.png`
2. Looks for optional `taco_bell.input.json`
3. Creates `taco_bell.expected.json`

### Input File Format (`.input.json`)

Optionally created before running `test:scan:generate`:

```json
{
  "currency": "MXN",
  "receiptType": "restaurant"
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `currency` | `string` | `"CLP"` | Currency code for price parsing |
| `receiptType` | `ReceiptType` | `"auto"` | Document type hint |

### Expected File Format (`.expected.json`)

Generated by the test harness, includes the input that was used:

```json
{
  "metadata": { ... },
  "input": {
    "currency": "MXN",
    "receiptType": "restaurant"
  },
  "aiExtraction": { ... },
  "corrections": { ... }
}
```

### Why Separate Input Files?

Input files are **optional** but useful when you need to test non-default scenarios.

This design mirrors the real app flow:

1. **App flow**: User's settings (currency) exist BEFORE they tap "Scan"
2. **Test flow**: Input file (if present) is read BEFORE running the scan

The input variables affect what prompt is built, which affects what the AI extracts.
When no input file exists, defaults are used (CLP currency, auto receipt type).

### Supported Receipt Types

Organized by category:

| Category | Receipt Types |
|----------|---------------|
| Grocery & Food | `supermarket`, `restaurant`, `cafe`, `bar`, `bakery` |
| Retail | `general_store`, `department_store`, `clothing_store`, `electronics_store`, `furniture_store`, `bookstore` |
| Health | `pharmacy`, `medical_clinic`, `dental_clinic`, `optical_store` |
| Automotive | `gas_station`, `auto_repair`, `car_wash` |
| Travel | `hotel`, `car_rental`, `airline_ticket` |
| Entertainment | `movie_theater`, `concert_ticket`, `event_ticket`, `museum_entry` |
| Services | `utility_bill`, `parking`, `transport_ticket`, `cleaning_service`, `home_improvement` |
| Fitness | `gym_membership`, `spa_service` |
| Education | `tuition_payment` |
| Government | `tax_payment`, `court_fee` |
| Other | `donation_receipt`, `online_purchase`, `subscription`, `auto` |

### Supported Currencies

| Code | Description | Decimal Handling |
|------|-------------|------------------|
| `CLP` | Chilean Peso | Integers only |
| `USD` | US Dollar | Cents (multiply by 100) |
| `EUR` | Euro | Cents (multiply by 100) |
| `MXN` | Mexican Peso | Centavos possible |
| `ARS` | Argentine Peso | Integers common |
| `COP` | Colombian Peso | Integers only |
| `PEN` | Peruvian Sol | Centimos possible |
| `BRL` | Brazilian Real | Centavos possible |
| `GBP` | British Pound | Pence (multiply by 100) |

## Key Concepts

1. **Single Source of Truth**: Arrays define values, types are derived (no duplication)
2. **Prebuild Copy**: Prompts are copied to functions during build
3. **Template Variables**: `{{currency}}`, `{{date}}`, `{{receiptType}}` replaced at runtime
4. **Dual Prompt System**: PRODUCTION_PROMPT for app users, DEV_PROMPT for testing
5. **Versioning**: Each prompt has id, version, and metadata for tracking
6. **Input Hints**: User-provided pre-scan context defined in `input-hints.ts` (currencies: CLP, USD, EUR)
7. **Location Extraction**: Country/city extracted from receipt text only, null if not visible
8. **Image-Only Required**: Only the image file is required; input.json and expected.json are optional
9. **Extension-Free Paths**: CLI accepts `restaurant/taco_bell` and auto-detects `.jpg/.jpeg/.png`
10. **Generic buildPrompt()**: Single function works with any prompt version, handles all variable substitution
11. **Context-Aware Selection**: `promptContext` parameter controls which prompt is used (production or development)
12. **Name Length Limits**: Item names max 50 characters to avoid cryptic multi-line descriptions
13. **Email Domain Fallback**: For unclear merchant names, extract from email domain on receipt (e.g., `info@mufin.cl` → "Mufin")
14. **Free-Form Subcategories**: Subcategory is optional and AI-generated (not predefined). Only used when it adds useful granularity (e.g., "Fresh Fruits", "Craft Beer")
15. **Time Extraction**: Time in 24-hour format (HH:MM). Default "04:04" if not found on receipt (404 = not found)
