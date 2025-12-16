# Shared Prompts Library

Single source of truth for Gemini AI prompts used by the Cloud Function and test harness.

## Quick Start

```typescript
import { ACTIVE_PROMPT, replacePromptVariables } from 'shared/prompts';

// Get the production-ready prompt with variables replaced
const prompt = replacePromptVariables(ACTIVE_PROMPT.prompt, {
  currency: 'CLP',
  date: '2025-12-11'
});
```

## Available Prompts

| ID | Name | Description |
|----|------|-------------|
| `v1-original` | Original Chilean | Baseline production prompt (current ACTIVE) |
| `v2-multi-currency-types` | Multi-Currency + Receipt Types | Enhanced with currency context and receipt type hints |

## API Reference

### Core Exports

```typescript
// The active production prompt
ACTIVE_PROMPT: PromptConfig

// Get a specific prompt by ID
getPrompt(id: string): PromptConfig

// List all available prompts
listPrompts(): PromptConfig[]

// Replace {{currency}} and {{date}} placeholders (V1 style)
replacePromptVariables(prompt: string, { currency, date }): string
```

### V2 Specific Exports

```typescript
// V2 prompt with multi-currency and receipt type support
PROMPT_V2: PromptConfig

// Get human-readable currency context
getCurrencyContext(currencyCode: string): string

// Get receipt type description
getReceiptTypeDescription(receiptType?: ReceiptType): string

// Build complete V2 prompt with all variables replaced
buildCompleteV2Prompt({ currency, date, receiptType? }): string

// Supported currencies with context
CURRENCY_CONTEXTS: Record<string, string>
```

### Types

```typescript
interface PromptConfig {
  id: string;           // "v1-original"
  name: string;         // "Original Chilean"
  description: string;  // What this prompt does
  version: string;      // "1.0.0"
  createdAt: string;    // "2025-12-11"
  prompt: string;       // The actual prompt text
  fewShotExamples?: string[];
}

type ReceiptType =
  | 'supermarket' | 'restaurant' | 'pharmacy' | 'gas_station' | 'general_store'
  | 'utility_bill' | 'parking' | 'transport_ticket'
  | 'online_purchase' | 'subscription'
  | 'credit_card_statement' | 'bank_statement'
  | 'auto';
```

## Directory Structure

```
shared/prompts/
├── index.ts                           # Main exports, ACTIVE_PROMPT
├── types.ts                           # PromptConfig interface
├── base.ts                            # Shared components (categories, format)
├── v1-original.ts                     # Baseline production prompt
├── v2-multi-currency-receipt-types.ts # Enhanced prompt for testing
├── __tests__/
│   └── index.test.ts                  # Unit tests
└── README.md                          # This file
```

## Related Documentation

- [PROMPT_DEPLOYMENT.md](./PROMPT_DEPLOYMENT.md) - How to create and deploy new prompts
- [Architecture: ADR-010](../../docs/sprint-artifacts/epic8/architecture-epic8.md) - Shared Prompts Library design decision
