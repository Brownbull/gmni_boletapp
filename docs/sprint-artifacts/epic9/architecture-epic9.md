# Architecture: Epic 9 - Scan Enhancement & Merchant Learning

## Executive Summary

Epic 9 extends the Transaction data model to capture all fields from prompt v2.6.0 and implements merchant name learning following a simplified version of the Epic 6 category learning pattern. The architecture prioritizes backward compatibility, pattern consistency, and user transparency through source tracking.

**Key Architectural Decisions:**
- All new Transaction fields are optional for backward compatibility
- MerchantMapping uses a simplified data model (no pattern matching)
- Fuse.js fuzzy matching with configurable 0.3 threshold
- Full source tracking (`merchantSource`) for UX transparency
- Prompt-based learning triggered on merchant name edit

## Decision Summary

| Category | Decision | Rationale | Affects Stories |
|----------|----------|-----------|-----------------|
| Data Model | Optional fields only | Backward compatibility with existing transactions | 9.1, 9.2 |
| Data Model | Simplified MerchantMapping | No `merchantPattern` needed - simpler than category | 9.4 |
| Matching | Fuse.js threshold 0.3 | Stricter than category (0.6) to avoid false positives | 9.5 |
| Matching | Configurable threshold | May need tuning based on user feedback | 9.5 |
| Matching | Min 3-char normalized length | Prevent short string false matches | 9.5 |
| UX | merchantSource tracking | User needs to know auto-applied corrections | 9.1, 9.5 |
| UX | "Learned" indicator in UI | Visual feedback for auto-applied merchant names | 9.3 |
| Learning | Prompt on save | Matches category pattern, user stays in control | 9.6 |
| Storage | User-scoped subcollection | Privacy, personalization, established pattern | 9.4 |

## Project Structure

```
src/
├── types/
│   ├── transaction.ts          # Extended with new fields + MerchantSource
│   ├── categoryMapping.ts      # Existing (reference pattern)
│   └── merchantMapping.ts      # NEW: Simplified merchant mapping type
├── services/
│   ├── categoryMappingService.ts   # Existing (reference pattern)
│   ├── merchantMappingService.ts   # NEW: Firestore CRUD operations
│   └── merchantMatcherService.ts   # NEW: Fuse.js matching logic
├── hooks/
│   ├── useCategoryMappings.ts      # Existing (reference pattern)
│   └── useMerchantMappings.ts      # NEW: React hook for mappings
├── components/
│   ├── dialogs/
│   │   ├── LearnCategoryDialog.tsx     # Existing (reference pattern)
│   │   └── LearnMerchantDialog.tsx     # NEW: Learning prompt
│   └── settings/
│       ├── CategoryMappingsSettings.tsx  # Existing (reference pattern)
│       └── MerchantMappingsSettings.tsx  # NEW: Settings UI
└── views/
    ├── EditView.tsx            # Modified: display new fields, learning dialog
    └── SettingsView.tsx        # Modified: add Merchant Mappings section

firestore.rules                 # Modified: add merchant_mappings rules
tests/
├── unit/
│   ├── merchantMappingService.test.ts   # NEW
│   └── merchantMatcherService.test.ts   # NEW
└── integration/
    └── merchantLearning.test.ts         # NEW: End-to-end flow
```

## Story to Architecture Mapping

| Story | Files Created/Modified | Key Changes |
|-------|----------------------|-------------|
| 9.1 | `types/transaction.ts` | Add time, country, city, currency, receiptType, promptVersion, merchantSource |
| 9.2 | `types/transaction.ts` | TransactionItem category typing |
| 9.3 | `views/EditView.tsx` | Display new fields, "Learned" badge |
| 9.4 | `types/merchantMapping.ts`, `services/merchantMappingService.ts`, `firestore.rules` | New type, service, security rules |
| 9.5 | `services/merchantMatcherService.ts` | Fuse.js integration, threshold config |
| 9.6 | `components/dialogs/LearnMerchantDialog.tsx`, `views/EditView.tsx` | Learning prompt integration |
| 9.7 | `components/settings/MerchantMappingsSettings.tsx`, `hooks/useMerchantMappings.ts` | Settings management UI |
| 9.8 | `views/ScanView.tsx`, `services/gemini.ts`, `views/SettingsView.tsx`, `services/userPreferencesService.ts` | Pre-scan options (currency, store type), user preferences |
| 9.99 | N/A (deployment) | Production deployment, E2E verification, Git conventions |

## Technology Stack Details

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| TypeScript | 5.x | Type safety for new interfaces |
| Firebase/Firestore | 10.x | Merchant mapping storage |
| Fuse.js | 7.x | Fuzzy string matching (existing dependency) |
| React | 18.x | UI components |

### Integration Points

| Integration | Description |
|-------------|-------------|
| Scanner → Matcher | Scanner calls `findMerchantMatch()` after AI extraction |
| Matcher → Transaction | Match result applied to transaction before save |
| EditView → Learning Dialog | Merchant change detection triggers dialog |
| Settings → Firestore | Real-time subscription to merchant mappings |

## Data Architecture

### Extended Transaction Type

```typescript
// src/types/transaction.ts

export type MerchantSource = 'scan' | 'learned' | 'user';

export interface Transaction {
  // Existing fields
  id?: string;
  date: string;
  merchant: string;
  alias?: string;
  category: StoreCategory;
  total: number;
  items: TransactionItem[];
  imageUrls?: string[];
  thumbnailUrl?: string;
  createdAt?: any;
  updatedAt?: any;

  // NEW: v2.6.0 fields (all optional for backward compatibility)
  time?: string;           // "15:01" format
  country?: string;        // "United Kingdom"
  city?: string;           // "London"
  currency?: string;       // "GBP" (ISO 4217)
  receiptType?: string;    // "receipt" | "invoice" | "ticket"
  promptVersion?: string;  // "2.6.0"

  // NEW: Source tracking
  merchantSource?: MerchantSource;
}
```

### MerchantMapping Type (Simplified)

```typescript
// src/types/merchantMapping.ts

import { Timestamp } from 'firebase/firestore';

/**
 * MerchantMapping represents a user's learned merchant name correction.
 * Simplified from CategoryMapping - no pattern matching needed.
 *
 * Firestore path: artifacts/{appId}/users/{userId}/merchant_mappings/{mappingId}
 */
export interface MerchantMapping {
  id?: string;

  // Original merchant name from AI (for dialog display)
  originalMerchant: string;

  // Normalized for fuzzy matching (lowercase, trimmed, alphanumeric)
  normalizedMerchant: string;

  // User's preferred merchant name
  targetMerchant: string;

  // Always 1.0 for user-set mappings
  confidence: number;

  // Always 'user' for MVP (no AI suggestions)
  source: 'user';

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Analytics: how many times auto-applied
  usageCount: number;
}

/**
 * Data required to create a new merchant mapping
 */
export type NewMerchantMapping = Omit<MerchantMapping, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Result from fuzzy matching
 */
export interface MerchantMatchResult {
  mapping: MerchantMapping;
  score: number;      // Fuse.js score (0 = perfect, 1 = no match)
  confidence: number; // 1 - score
}
```

### Comparison: CategoryMapping vs MerchantMapping

| Field | CategoryMapping | MerchantMapping | Notes |
|-------|-----------------|-----------------|-------|
| originalItem/Merchant | ✓ | ✓ | Display in learning dialog |
| normalizedItem/Merchant | ✓ | ✓ | Fuzzy matching key |
| targetCategory/Merchant | ✓ | ✓ | Value to apply |
| merchantPattern | ✓ | ✗ | Not needed for merchant-to-merchant |
| confidence | ✓ | ✓ | Always 1.0 for user |
| source | 'user' \| 'ai' | 'user' | No AI suggestions for MVP |
| usageCount | ✓ | ✓ | Analytics |

## Implementation Patterns

### Pattern 1: Merchant Normalization

```typescript
// src/services/merchantMappingService.ts

/**
 * Normalize merchant name for fuzzy matching.
 * - Lowercase
 * - Trim whitespace
 * - Remove special characters except alphanumeric and spaces
 * - Collapse multiple spaces
 */
export function normalizeMerchantName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, ' ');
}
```

### Pattern 2: Fuzzy Matching with Threshold

```typescript
// src/services/merchantMatcherService.ts

import Fuse from 'fuse.js';
import { MerchantMapping, MerchantMatchResult } from '../types/merchantMapping';
import { normalizeMerchantName } from './merchantMappingService';

// Configurable threshold - may need adjustment based on user feedback
const DEFAULT_THRESHOLD = 0.3;
const MIN_NORMALIZED_LENGTH = 3;

const fuseOptions: Fuse.IFuseOptions<MerchantMapping> = {
  includeScore: true,
  threshold: DEFAULT_THRESHOLD,
  keys: ['normalizedMerchant']
};

/**
 * Find best matching merchant mapping for a given merchant name.
 * Returns null if no match meets threshold or input too short.
 */
export function findMerchantMatch(
  merchantName: string,
  mappings: MerchantMapping[],
  threshold: number = DEFAULT_THRESHOLD
): MerchantMatchResult | null {
  const normalized = normalizeMerchantName(merchantName);

  // Guard: minimum length to prevent short string false matches
  if (normalized.length < MIN_NORMALIZED_LENGTH) {
    return null;
  }

  const fuse = new Fuse(mappings, { ...fuseOptions, threshold });
  const results = fuse.search(normalized);

  if (results.length > 0 && results[0].score !== undefined && results[0].score <= threshold) {
    return {
      mapping: results[0].item,
      score: results[0].score,
      confidence: 1 - results[0].score
    };
  }

  return null;
}
```

### Pattern 3: Upsert to Prevent Duplicates

```typescript
// src/services/merchantMappingService.ts

/**
 * Create or update a merchant mapping.
 * If a mapping with the same normalizedMerchant exists, update it.
 * This prevents duplicate mappings for the same merchant.
 */
export async function saveMerchantMapping(
  db: Firestore,
  userId: string,
  appId: string,
  mapping: NewMerchantMapping
): Promise<string> {
  const collectionPath = getMappingsCollectionPath(appId, userId);
  const mappingsRef = collection(db, collectionPath);

  // Check for existing mapping with same normalizedMerchant
  const q = query(mappingsRef, where('normalizedMerchant', '==', mapping.normalizedMerchant));
  const existingDocs = await getDocs(q);

  if (!existingDocs.empty) {
    // Update existing mapping
    const existingDoc = existingDocs.docs[0];
    await updateDoc(existingDoc.ref, {
      ...mapping,
      updatedAt: serverTimestamp()
    });
    return existingDoc.id;
  }

  // Create new mapping
  const docRef = await addDoc(mappingsRef, {
    ...mapping,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}
```

### Pattern 4: Scanner Integration

```typescript
// In scanner service (pseudo-code)

async function processReceipt(image: File, userId: string): Promise<Transaction> {
  // 1. AI extraction
  const aiResult = await extractWithGemini(image);

  // 2. Create base transaction from AI result
  const transaction: Transaction = {
    merchant: aiResult.merchant,
    merchantSource: 'scan',  // Default: came from AI
    date: aiResult.date,
    time: aiResult.time,
    country: aiResult.country,
    city: aiResult.city,
    currency: aiResult.currency,
    receiptType: aiResult.receiptType,
    promptVersion: aiResult.promptVersion,
    // ... other fields
  };

  // 3. Check for merchant mapping
  const mappings = await getMerchantMappings(db, userId, appId);
  const match = findMerchantMatch(transaction.merchant, mappings);

  if (match) {
    // 4. Apply learned merchant name
    transaction.merchant = match.mapping.targetMerchant;
    transaction.merchantSource = 'learned';

    // 5. Increment usage count
    await incrementMappingUsage(db, userId, appId, match.mapping.id!);
  }

  return transaction;
}
```

### Pattern 5: Learning Dialog Trigger

```typescript
// In EditView (pseudo-code)

const handleSave = async () => {
  // Save transaction first
  await saveTransaction(transaction);

  // Check if merchant was changed from original
  if (originalTransaction.merchant !== transaction.merchant) {
    // Show learning dialog
    setShowLearnMerchantDialog(true);
    setOriginalMerchant(originalTransaction.merchant);
    setCorrectedMerchant(transaction.merchant);
  }
};

const handleLearnMerchant = async (remember: boolean) => {
  if (remember) {
    await saveMerchantMapping(db, userId, appId, {
      originalMerchant: originalMerchant,
      normalizedMerchant: normalizeMerchantName(originalMerchant),
      targetMerchant: correctedMerchant,
      confidence: 1.0,
      source: 'user',
      usageCount: 0
    });
  }
  setShowLearnMerchantDialog(false);
};
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Types | PascalCase | `MerchantMapping`, `MerchantMatchResult` |
| Services | camelCase + Service | `merchantMappingService.ts` |
| Functions | camelCase verb | `findMerchantMatch`, `saveMerchantMapping` |
| Hooks | use + PascalCase | `useMerchantMappings` |
| Components | PascalCase | `LearnMerchantDialog`, `MerchantMappingsSettings` |
| Test files | *.test.ts | `merchantMatcherService.test.ts` |

## Error Handling

| Scenario | Handling |
|----------|----------|
| Firestore write fails | Show toast, don't block transaction save |
| Fuzzy match throws | Return null, proceed without auto-apply |
| Missing optional fields | Gracefully hidden in UI (no "N/A") |
| Empty mappings list | Show empty state message in Settings |

## Security Architecture

### Firestore Rules

```javascript
// firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules...

    // Merchant mappings - user-scoped access
    match /artifacts/{appId}/users/{userId}/merchant_mappings/{mappingId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Performance Considerations

| Concern | Strategy |
|---------|----------|
| Fuzzy matching speed | Client-side Fuse.js, no API calls, <100ms target |
| Mapping list size | Paginate in Settings UI if >50 mappings (future) |
| Real-time updates | Use `onSnapshot` for Settings, one-time `getDocs` for scanner |
| Bundle size | Fuse.js already in bundle from Epic 6 |

## Testing Strategy

### Unit Tests

| Test File | Coverage |
|-----------|----------|
| `merchantMappingService.test.ts` | CRUD operations, normalization |
| `merchantMatcherService.test.ts` | Fuzzy matching, threshold, min length |

### Integration Tests

| Test File | Coverage |
|-----------|----------|
| `merchantLearning.test.ts` | Full flow: save mapping → scan → match → apply |

### Key Test Cases

```typescript
// Threshold boundary tests
test('matches at exactly 0.3 threshold', ...);
test('rejects at 0.31 threshold', ...);

// Min length guard
test('rejects normalized name under 3 chars', ...);

// Upsert behavior
test('updates existing mapping instead of creating duplicate', ...);

// Backward compatibility
test('transaction without new fields saves successfully', ...);
test('transaction with new fields saves successfully', ...);
```

## Architecture Decision Records (ADRs)

### ADR-1: Simplified MerchantMapping Model

**Status:** Accepted

**Context:** CategoryMapping includes `merchantPattern` for matching items across merchants. MerchantMapping doesn't need this complexity.

**Decision:** Remove `merchantPattern` from MerchantMapping. Keep only `originalMerchant`, `normalizedMerchant`, `targetMerchant`.

**Consequences:** Simpler model, less code, easier to understand. If pattern matching needed later, can add as enhancement.

### ADR-2: Configurable Fuzzy Threshold

**Status:** Accepted

**Context:** 0.3 threshold is reasonable but may need tuning based on real-world merchant names.

**Decision:** Default to 0.3 but make threshold a parameter in `findMerchantMatch()`.

**Consequences:** Can adjust without code changes. Future: could expose in Settings.

### ADR-3: Minimum Normalized Length Guard

**Status:** Accepted

**Context:** Short merchant names like "ABC" could false-match to many mappings.

**Decision:** Require minimum 3 characters in normalized name before fuzzy matching.

**Consequences:** Prevents false positives on very short names. Edge case: legitimate 2-char merchants won't auto-match (acceptable).

### ADR-4: User-Scoped Mappings Only

**Status:** Accepted

**Context:** Could share mappings globally (all users benefit from "STARBUCKS" → "Starbucks").

**Decision:** Keep mappings in user subcollection only.

**Consequences:** Privacy preserved, no consensus mechanism needed, matches existing category pattern. Future: could add global suggestions as opt-in.

### ADR-5: Source Tracking for Transparency

**Status:** Accepted

**Context:** Users need to know when merchant name was auto-applied vs AI-extracted.

**Decision:** Add `merchantSource: 'scan' | 'learned' | 'user'` to Transaction.

**Consequences:** UI can show "Learned" badge, builds user trust, helps debugging.

### ADR-6: Pre-Scan Options Architecture

**Status:** Accepted

**Context:** Users need to specify currency and store type before scanning to improve AI accuracy and price parsing.

**Decision:**
- Add store type quick-select labels in ScanView (Auto default)
- Add expandable "Advanced Options" with currency dropdown
- Store user's default currency in Firestore user preferences
- Leverage existing `input-hints.ts` infrastructure (`SUPPORTED_CURRENCIES = ['CLP', 'USD', 'EUR']`)
- Pass `currency` and `receiptType` to Cloud Function via `gemini.ts`

**Consequences:**
- Better AI extraction accuracy with explicit hints
- Correct price parsing for multi-currency receipts
- User preferences persist across sessions

---

## Story 9.8: Scan Advanced Options - Architecture Details

### User Preferences Storage

```typescript
// src/services/userPreferencesService.ts

interface UserPreferences {
  defaultCurrency: SupportedCurrency;  // 'CLP' | 'USD' | 'EUR'
  // Future: defaultReceiptType, theme, language, etc.
}

// Firestore path: artifacts/{appId}/users/{userId}/preferences/settings
```

### ScanView UI Components

```
┌─────────────────────────────────────┐
│  [← Back]                           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     Receipt Image(s)        │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Store Type:                        │
│  [Auto✓] [🛒] [🍽️] [⛽] [🏥] [...]  │
│                                     │
│  ▼ Advanced Options                 │
│  ┌─────────────────────────────┐   │
│  │ Currency: [CLP ▼]           │   │
│  └─────────────────────────────┘   │
│                                     │
│  [+ Add Photo]                      │
│  [📷 Scan Receipt]                  │
└─────────────────────────────────────┘
```

### Store Type Quick Labels

```typescript
// Subset of ReceiptType for quick selection
const QUICK_STORE_TYPES = [
  { id: 'auto', icon: '✓', label: 'Auto' },
  { id: 'supermarket', icon: '🛒', label: 'Supermarket' },
  { id: 'restaurant', icon: '🍽️', label: 'Restaurant' },
  { id: 'gas_station', icon: '⛽', label: 'Gas Station' },
  { id: 'pharmacy', icon: '🏥', label: 'Pharmacy' },
  { id: 'parking', icon: '🅿️', label: 'Parking' },
] as const;
```

### Data Flow

```
User selects currency/storeType in ScanView
        ↓
ScanView passes to App.tsx handleProcessScan()
        ↓
App.tsx calls analyzeReceipt(images, currency, receiptType)
        ↓
gemini.ts sends to Cloud Function with { images, currency, receiptType }
        ↓
Cloud Function uses buildPrompt({ currency, receiptType })
        ↓
AI returns extraction with hints applied
```

---

_Generated by BMAD Architecture Workflow v1.0_
_Date: 2025-12-12_
_For: Gabe_
_Enhanced via Advanced Elicitation: First Principles, Pre-mortem, Devil's Advocate, Decision Matrix, Journey Mapping_
