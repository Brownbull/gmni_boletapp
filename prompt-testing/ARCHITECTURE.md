# Prompt Architecture

Visual documentation of how prompts are constructed, managed, and deployed.

## 1. Unified Schema (Single Source of Truth)

V3 introduces a **unified schema** that centralizes all category and currency definitions:

```
shared/schema/
├── categories.ts   # 35 store + 37 item categories
├── currencies.ts   # 20+ currencies with usesCents flag
└── index.ts        # Re-exports everything
```

```mermaid
flowchart TB
    subgraph UnifiedSchema["shared/schema/ (Single Source of Truth)"]
        CATS["categories.ts<br/>35 Store + 37 Item Categories"]
        CURR["currencies.ts<br/>20+ Currencies + usesCents flag"]
    end

    subgraph Consumers["Consumers (import from unified schema)"]
        V3["v3-category-standardization.ts<br/>DEV_PROMPT"]
        TYPES["src/types/transaction.ts<br/>App types"]
        COLORS["src/config/categoryColors.ts<br/>UI colors"]
        OUTPUT["output-schema.ts<br/>Re-exports for V1/V2"]
    end

    CATS --> V3
    CATS --> TYPES
    CATS --> COLORS
    CATS --> OUTPUT
    CURR --> V3
```

## 2. Prompt Component Structure

How individual prompt pieces combine to form the final prompt:

```mermaid
flowchart TB
    subgraph Schema["shared/schema/"]
        CATS["categories.ts<br/>STORE_CATEGORIES, ITEM_CATEGORIES"]
        CURR["currencies.ts<br/>getCurrencyPromptContext()"]
    end

    subgraph Prompts["prompt-testing/prompts/"]
        OUTPUT["output-schema.ts<br/>DATE_INSTRUCTIONS, JSON helpers"]
        V2HELPERS["v2-multi-currency.ts<br/>getReceiptTypeDescription()"]
        V3["v3-category-standardization.ts<br/>buildV3Prompt()"]
    end

    CATS --> V3
    CURR --> V3
    OUTPUT --> V3
    V2HELPERS --> V3
    V3 --> PROMPT_V3["PROMPT_V3"]
```

## 3. Dual Prompt System

The system supports **two parallel prompts** for safe development:

| Prompt | Version | Purpose | Used By |
|--------|---------|---------|---------|
| `PRODUCTION_PROMPT` | V2 | Stable prompt for real users | Mobile app (`promptContext='production'`) |
| `DEV_PROMPT` | V3 | Experimental prompt for testing | Test harness (`promptContext='development'`) |

```mermaid
flowchart LR
    subgraph Prompt Versions
        V1["PROMPT_V1<br/>v1-original.ts"]
        V2["PROMPT_V2<br/>v2-multi-currency...ts"]
        V3["PROMPT_V3<br/>v3-category-standardization.ts"]
    end

    subgraph index.ts["index.ts - Registry"]
        REGISTRY["PROMPT_REGISTRY<br/>Map&lt;id, PromptConfig&gt;"]
        PROD["PRODUCTION_PROMPT = V2<br/>(mobile app)"]
        DEV["DEV_PROMPT = V3<br/>(test harness)"]
        getPrompt["getPrompt(id)"]
        getActive["getActivePrompt(context)"]
    end

    V1 --> REGISTRY
    V2 --> REGISTRY
    V3 --> REGISTRY

    REGISTRY --> getPrompt
    V2 --> PROD
    V3 --> DEV

    getActive -->|"'production'"| PROD
    getActive -->|"'development'"| DEV

    style PROD fill:#90EE90
    style DEV fill:#FFD700
    style V3 fill:#FFD700
```

### Workflow

1. **Create/Edit V3 prompt** - experimental version
2. **Set `DEV_PROMPT = PROMPT_V3`** - test harness uses it
3. **Deploy to Cloud Function** - both prompts available
4. **Test with harness** - sends `promptContext='development'`
5. **Mobile app unaffected** - sends no context, defaults to `'production'`
6. **Promote when ready** - set `PRODUCTION_PROMPT = PROMPT_V3`

## 4. Currency System (V3)

V3 simplifies currency handling with a `usesCents` flag:

```mermaid
flowchart TB
    subgraph CurrencySchema["shared/schema/currencies.ts"]
        DEF["CURRENCIES Record<br/>code, name, symbol, usesCents, decimals"]
        HELPER["getCurrencyPromptContext(code)"]
    end

    subgraph Examples["Currency Examples"]
        CLP["CLP: usesCents=false<br/>$15,990 → 15990 (as-is)"]
        USD["USD: usesCents=true<br/>$15.99 → 1599 (×100)"]
        JPY["JPY: usesCents=false<br/>¥1590 → 1590 (as-is)"]
    end

    DEF --> HELPER
    HELPER --> CLP
    HELPER --> USD
    HELPER --> JPY
```

### Supported Currencies (20+)

| Region | Currencies | usesCents |
|--------|------------|-----------|
| Americas | CLP, COP | false |
| Americas | USD, CAD, MXN, BRL, ARS, PEN | true |
| Europe | EUR, GBP, CHF | true |
| Asia | JPY, KRW | false |
| Asia | CNY, INR | true |
| Other | AUD, NZD, AED, ZAR, ILS | true |

## 5. Variable Substitution Flow

How template variables are replaced at runtime:

```mermaid
flowchart TB
    subgraph Sources["Input Sources"]
        APP["App Settings<br/>(default currency)"]
        SCAN["Scan Options<br/>(override per-scan)"]
        TEST["Test Input File<br/>(per-image config)"]
    end

    subgraph BuildPrompt["buildPrompt() - index.ts"]
        OPTS["BuildPromptOptions<br/>currency?, date?, receiptType?"]
        IS_V3{"isV3?"}
        V3_CTX["getCurrencyPromptContext()<br/>(unified schema)"]
        V2_CTX["getCurrencyContext()<br/>(legacy v2)"]
        GET_TYPE["getReceiptTypeDescription()"]
        REPLACE["replaceAll() for each<br/>{{currency}}, {{date}}, {{receiptType}}"]
    end

    subgraph Template["Prompt Template"]
        PLACEHOLDERS["{{currency}}<br/>{{date}}<br/>{{receiptType}}"]
    end

    subgraph Final["Final Prompt"]
        OUTPUT["CURRENCY: Chilean Peso (CLP) uses whole numbers...<br/>TODAY: 2026-01-06<br/>This is a supermarket receipt..."]
    end

    APP --> OPTS
    SCAN --> OPTS
    TEST --> OPTS

    OPTS --> IS_V3
    IS_V3 -->|"Yes (V3)"| V3_CTX
    IS_V3 -->|"No (V1/V2)"| V2_CTX
    OPTS --> GET_TYPE

    PLACEHOLDERS --> REPLACE
    V3_CTX --> REPLACE
    V2_CTX --> REPLACE
    GET_TYPE --> REPLACE
    REPLACE --> OUTPUT
```

## 6. Deployment Pipeline

How prompts flow from development to production:

```mermaid
flowchart TB
    subgraph Dev["Development"]
        SCHEMA["shared/schema/<br/>categories.ts, currencies.ts"]
        PROMPTS_SRC["prompt-testing/prompts/<br/>index.ts, v1.ts, v2.ts, v3.ts"]
        TEST_HARNESS["scripts/<br/>Test Harness CLI"]
    end

    subgraph Build["Build Process"]
        PREBUILD["prebuild script<br/>cp -r prompts → functions/src/prompts<br/>cp -r shared → functions/src/shared"]
        TSC["tsc compile"]
    end

    subgraph Prod["Production (functions/)"]
        SCHEMA_COPY["src/shared/schema/"]
        PROMPTS_COPY["src/prompts/"]
        ANALYZE["analyzeReceipt.ts<br/>Cloud Function"]
        GEMINI["Gemini API"]
    end

    SCHEMA --> PREBUILD
    PROMPTS_SRC --> PREBUILD
    PREBUILD --> SCHEMA_COPY
    PREBUILD --> PROMPTS_COPY
    SCHEMA_COPY --> TSC
    PROMPTS_COPY --> TSC
    TSC --> ANALYZE
    ANALYZE -->|"prompt + image"| GEMINI

    TEST_HARNESS -->|"validates"| PROMPTS_SRC

    style SCHEMA fill:#FFD700
    style SCHEMA_COPY fill:#FFD700
```

## 7. Cloud Function Integration

How the prompt is used in receipt analysis:

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant Test as Test Harness
    participant CF as analyzeReceipt.ts
    participant Prompts as prompts/index.ts
    participant Gemini as Gemini API

    Note over App,Test: Both use same Cloud Function

    App->>CF: analyzeReceipt({<br/>images, currency,<br/>receiptType?})
    Note right of App: No promptContext<br/>→ uses PRODUCTION (V2)

    Test->>CF: analyzeReceipt({<br/>images, currency,<br/>promptContext: 'development'})
    Note right of Test: Uses DEV (V3)

    CF->>Prompts: buildPrompt({<br/>currency, receiptType,<br/>context})
    Prompts->>Prompts: getActivePrompt(context)<br/>+ getCurrencyPromptContext() if V3
    Prompts-->>CF: Final prompt string

    CF->>Gemini: generateContent(<br/>finalPrompt,<br/>imageData)

    Gemini-->>CF: JSON response
    CF->>CF: Parse & validate
    CF-->>App: Receipt data
```

## 8. V3 Prompt Structure

Detailed breakdown of V3 prompt components:

```mermaid
flowchart TB
    subgraph Header["Header Section"]
        H1["'Analyze the document image.'"]
        H2["'This is {{receiptType}}.'"]
    end

    subgraph Currency["Currency Section (V3 simplified)"]
        C1["'CURRENCY: {{currency}}'"]
        C2["Uses usesCents flag for guidance:<br/>- With cents: multiply by 100<br/>- Without cents: use as-is"]
    end

    subgraph Date["Date Section"]
        D1["'TODAY: {{date}}'"]
        D2["DATE_INSTRUCTIONS"]
    end

    subgraph Format["Output Format"]
        F1["'OUTPUT: Strict JSON only'"]
        F2["JSON structure:<br/>merchant, date, time, total, currency,<br/>category, country, city, items[], metadata"]
    end

    subgraph Categories["Categories (from unified schema)"]
        SC["STORE_CATEGORY_LIST (35)"]
        IC["ITEM_CATEGORY_LIST (37)"]
    end

    subgraph Rules["Extraction Rules"]
        R1["1-10: Standard extraction rules"]
        R10["10. Single-charge: create item from keyword"]
        R11["11. VALIDATION: total ≈ items sum (re-check if >40% off)"]
    end

    Header --> Currency --> Date --> Format --> Categories --> Rules
```

## File Locations

| Component | Location | Purpose |
|-----------|----------|---------|
| `categories.ts` | `shared/schema/` | **Single source**: 35 store + 37 item categories |
| `currencies.ts` | `shared/schema/` | **Single source**: 20+ currencies with usesCents flag |
| `output-schema.ts` | `prompt-testing/prompts/` | Re-exports categories, JSON helpers |
| `input-hints.ts` | `prompt-testing/prompts/` | Legacy currency exports, InputHints interface |
| `types.ts` | `prompt-testing/prompts/` | PromptConfig interface |
| `v1-original.ts` | `prompt-testing/prompts/` | Baseline prompt (simple) |
| `v2-multi-currency...ts` | `prompt-testing/prompts/` | V2 prompt (legacy) |
| `v3-category-standardization.ts` | `prompt-testing/prompts/` | **V3.2.0 prompt (production)** |
| `index.ts` | `prompt-testing/prompts/` | Registry, PRODUCTION/DEV prompts, buildPrompt() |
| `transaction.ts` | `src/types/` | App types (re-exports from unified schema) |
| `totalValidation.ts` | `src/utils/` | Client-side total validation utility |
| `TotalMismatchDialog.tsx` | `src/components/scan/` | Dialog for total correction |

## API Reference

### Core Exports (from `prompts/index.ts`)

```typescript
// Active prompts
PRODUCTION_PROMPT: PromptConfig  // V2 - For mobile app users
DEV_PROMPT: PromptConfig         // V3 - For test harness

// Build prompt with variables replaced
buildPrompt({ currency, date, receiptType, promptConfig?, context? }): string

// Get prompt by ID
getPrompt(id: string): PromptConfig

// List all registered prompts
listPrompts(): PromptConfig[]

// Get active prompt by context
getActivePrompt(context: 'production' | 'development'): PromptConfig
```

### Unified Schema Exports (from `shared/schema/index.ts`)

```typescript
// Categories
STORE_CATEGORIES: readonly string[]  // 35 categories
ITEM_CATEGORIES: readonly string[]   // 37 categories
STORE_CATEGORY_LIST: string          // Comma-separated for prompts
ITEM_CATEGORY_LIST: string           // Comma-separated for prompts
type StoreCategory = ...             // Union type
type ItemCategory = ...              // Union type

// Currencies
CURRENCIES: Record<string, CurrencyDefinition>
CURRENCY_CODES: string[]             // All currency codes
getCurrencyPromptContext(code: string): string  // For V3 prompts
getCurrency(code: string): CurrencyDefinition

interface CurrencyDefinition {
  code: string;      // "USD"
  name: string;      // "US Dollar"
  symbol: string;    // "$"
  usesCents: boolean; // true
  decimals: 0 | 2;   // 2
}
```

### Types

```typescript
interface PromptConfig {
  id: string;           // "v3-category-standardization"
  name: string;         // "Category Standardization"
  description: string;  // What this prompt does
  version: string;      // "3.0.0"
  createdAt: string;    // "2026-01-06"
  prompt: string;       // The actual prompt text with placeholders
}

type ReceiptType =
  | 'supermarket' | 'restaurant' | 'pharmacy' | 'gas_station'
  | 'utility_bill' | 'parking' | 'transport_ticket'
  | 'online_purchase' | 'subscription' | 'auto';
```

## V3 Category Lists

### Store Categories (35)

```
Food & Dining:       Supermarket, Restaurant, Bakery, Butcher, StreetVendor
Health & Wellness:   Pharmacy, Medical, Veterinary, HealthBeauty
Retail - General:    Bazaar, Clothing, Electronics, HomeGoods, Furniture, Hardware, GardenCenter
Retail - Specialty:  PetShop, BooksMedia, OfficeSupplies, SportsOutdoors, ToysGames, Jewelry, Optical, MusicStore
Automotive:          Automotive, GasStation, Transport
Services:            Services, BankingFinance, Education, TravelAgency, Subscription
Hospitality:         HotelLodging, Entertainment
Government:          Government
Other:               CharityDonation, Other
```

### Item Categories (37)

```
Food - Fresh:        Produce, Meat & Seafood, Bakery, Dairy & Eggs
Food - Packaged:     Pantry, Frozen Foods, Snacks, Beverages, Alcohol
Food - Prepared:     Prepared Food
Health & Personal:   Health & Beauty, Personal Care, Pharmacy, Supplements, Baby Products
Household:           Cleaning Supplies, Household, Pet Supplies
Non-Food Retail:     Clothing, Electronics, Hardware, Garden, Automotive, Sports & Outdoors,
                     Toys & Games, Books & Media, Office & Stationery, Crafts & Hobbies,
                     Furniture, Musical Instruments
Services & Fees:     Service, Tax & Fees, Subscription, Insurance, Loan Payment, Tobacco
Other:               Other
```

## Key Concepts

1. **Unified Schema**: Categories and currencies defined once in `shared/schema/`, imported everywhere
2. **usesCents Flag**: Simple boolean instead of verbose currency context strings
3. **Dual Prompt System**: PRODUCTION_PROMPT for app users, DEV_PROMPT for testing
4. **Context-Aware Selection**: `buildPrompt()` uses V3 currency context for V3, legacy for V1/V2
5. **Prebuild Copy**: Schema and prompts copied to functions during build
6. **Template Variables**: `{{currency}}`, `{{date}}`, `{{receiptType}}` replaced at runtime
7. **Versioning**: Each prompt has id, version, and metadata for tracking
8. **Prepared Food**: New V3 category for restaurant meals (sandwiches, pizza, etc.)
9. **Financial Categories**: New V3 item categories: Insurance, Loan Payment, Subscription
