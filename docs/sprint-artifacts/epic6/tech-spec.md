# Epic 6 Technical Specification: Smart Category Learning

**Date:** 2025-12-03
**Epic:** 6 - Smart Category Learning
**Author:** Gabe (with AI facilitation)
**Status:** Ready for Implementation

---

## Executive Summary

Epic 6 adds AI-assisted category learning that remembers user category corrections and automatically applies learned categories to future similar items. The system reduces manual categorization effort while maintaining user control.

Key Features:
1. **Category Override Memory** - User corrections persist per user in Firestore
2. **Auto-Apply Learned Categories** - Fuzzy matching applies learned categories to similar items
3. **Category Mapping Management** - UI to view, edit, and delete learned mappings

This is a **client-side + Firestore feature** - the fuzzy matching runs client-side using fuse.js. No Cloud Functions required for the learning logic.

---

## Architecture Decisions

### ADR-013: Client-Side Fuzzy Matching Strategy

**Decision:** Fuzzy matching for item similarity runs client-side using fuse.js library
**Context:** Need to match similar item names efficiently (e.g., "Uber" matches "UBER EATS", "Uber Trip")
**Date:** 2025-12-03

**Rationale:**
- fuse.js is lightweight (~3KB gzipped) and well-maintained
- Client-side avoids Cloud Function latency for category lookup
- User's category mappings are already loaded for the UI
- Matching happens during receipt scan result processing

**Consequences:**
- ✅ Zero server costs for matching
- ✅ Instant category suggestions (no network round-trip)
- ✅ Works offline if mappings cached
- ⚠️ Large mapping sets (1000+) may need pagination
- ⚠️ Matching quality depends on fuse.js configuration

**Status:** Accepted

---

### ADR-014: Firestore Collection Structure for Category Mappings

**Decision:** Store category mappings in `user_category_mappings` subcollection per user
**Context:** PRD requires per-user learning (no cross-user data sharing)
**Date:** 2025-12-03

**Collection Path:**
```
artifacts/{appId}/users/{userId}/category_mappings/{mappingId}
```

**Document Schema:**
```typescript
interface CategoryMapping {
  id?: string;
  originalItem: string;       // "UBER EATS" - exact match from receipt
  normalizedItem: string;     // "uber eats" - lowercase for fuzzy matching
  targetCategory: StoreCategory; // "Transport"
  merchantPattern?: string;   // Optional: "uber*" for merchant-based rules
  confidence: number;         // 1.0 for user-set, 0.0-1.0 for suggestions
  source: 'user' | 'ai';      // Who created this mapping
  createdAt: Timestamp;
  updatedAt: Timestamp;
  usageCount: number;         // Times this mapping was applied
}
```

**Consequences:**
- ✅ Per-user isolation (privacy compliant)
- ✅ Firestore security rules can enforce user ownership
- ✅ Efficient querying by user
- ⚠️ No cross-user learning (by design)

**Status:** Accepted

---

### ADR-015: Category Override Capture Strategy

**Decision:** Capture category changes in TransactionDetailView as category mappings
**Context:** Need to detect when user manually changes a category
**Date:** 2025-12-03

**Trigger Points:**
1. User edits a transaction's category → Create/update mapping for first item name
2. User edits an item's category → Create/update mapping for that specific item

**Implementation:**
```typescript
// When category changes, offer to learn
const handleCategoryChange = async (newCategory: StoreCategory) => {
  await updateTransaction(/* ... */);

  // Ask user if they want to learn this preference
  if (transaction.items.length > 0) {
    const itemName = transaction.items[0].name;
    showLearningPrompt(itemName, newCategory);
  }
};
```

**Consequences:**
- ✅ Non-intrusive (user must confirm learning)
- ✅ Works with existing edit flow
- ✅ Captures intent at the moment of correction
- ⚠️ Requires UI prompt (not silent learning)

**Status:** Accepted

---

## Technology Decisions

### Fuzzy Matching Library

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Library | fuse.js v7.x | Lightweight, well-maintained, TypeScript support |
| Threshold | 0.3 | Balance between strict and fuzzy (0=exact, 1=anything) |
| Keys | `normalizedItem`, `merchantPattern` | Match on item name and optional merchant |
| Sort | By score, then usageCount | Prefer better matches and frequently used |

### Matching Configuration

```typescript
const fuseOptions: Fuse.IFuseOptions<CategoryMapping> = {
  includeScore: true,
  threshold: 0.3,         // 0.3 = fairly strict
  ignoreLocation: true,   // Match anywhere in string
  keys: [
    { name: 'normalizedItem', weight: 0.7 },
    { name: 'merchantPattern', weight: 0.3 }
  ]
};
```

### Performance Targets

| Metric | Target | Implementation |
|--------|--------|----------------|
| Matching lookup | <50ms | In-memory fuse.js search |
| Mapping load | <200ms | Firestore query on auth |
| Mapping save | <500ms | Single Firestore write |
| Max mappings per user | 1000 | Warn if approaching limit |

---

## Data Architecture

### CategoryMapping Document Schema

```typescript
// src/types/categoryMapping.ts
export interface CategoryMapping {
  id?: string;
  originalItem: string;       // Original text from receipt
  normalizedItem: string;     // Lowercase, trimmed
  targetCategory: StoreCategory;
  merchantPattern?: string;   // Optional merchant hint
  confidence: number;         // 1.0 = user-set
  source: 'user' | 'ai';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  usageCount: number;
}
```

### Matching Result Schema

```typescript
interface MatchResult {
  mapping: CategoryMapping;
  score: number;              // 0 = perfect match, 1 = no match
  confidence: number;         // Combined confidence score
}
```

---

## Component Architecture

### New Files to Create

```
src/
├── types/
│   └── categoryMapping.ts       # NEW: CategoryMapping type
├── services/
│   └── categoryMappingService.ts # NEW: Firestore CRUD for mappings
├── utils/
│   └── categoryMatcher.ts       # NEW: Fuse.js matching logic
├── hooks/
│   └── useCategoryMappings.ts   # NEW: React hook for mappings
├── components/
│   ├── CategoryLearningPrompt.tsx  # NEW: "Learn this category?" modal
│   └── CategoryMappingsList.tsx    # NEW: Settings page for managing mappings
└── views/
    (no new views - modifications only)
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/views/TransactionDetailView.tsx` | Add category learning prompt on edit |
| `src/views/SettingsView.tsx` | Add "Manage Learned Categories" section |
| `src/services/gemini.ts` | Apply learned categories to scan results |
| `src/utils/translations.ts` | Add category learning strings |
| `package.json` | Add fuse.js dependency |

### Component Hierarchy (Epic 6 additions)

```
App.tsx
├── TransactionDetailView.tsx
│   └── [On category edit] → CategoryLearningPrompt
│       ├── "Remember for future [item]?" prompt
│       ├── Confirm → saveCategoryMapping()
│       └── Skip → no action
│
├── SettingsView.tsx
│   ├── [Existing sections...]
│   └── "Learned Categories" section
│       └── CategoryMappingsList
│           ├── List of learned mappings
│           ├── Edit mapping → inline category select
│           └── Delete mapping → confirmation
│
└── (Receipt scan flow)
    └── After Gemini analyzes → applyCategoryMappings()
        └── For each item, check for matching mapping
```

---

## API Contracts

### categoryMappingService.ts Functions

```typescript
/**
 * Create or update a category mapping
 */
export async function saveCategoryMapping(
  db: Firestore,
  userId: string,
  appId: string,
  mapping: Omit<CategoryMapping, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string>;

/**
 * Get all mappings for a user
 */
export async function getCategoryMappings(
  db: Firestore,
  userId: string,
  appId: string
): Promise<CategoryMapping[]>;

/**
 * Subscribe to category mappings (real-time)
 */
export function subscribeToCategoryMappings(
  db: Firestore,
  userId: string,
  appId: string,
  callback: (mappings: CategoryMapping[]) => void
): Unsubscribe;

/**
 * Delete a category mapping
 */
export async function deleteCategoryMapping(
  db: Firestore,
  userId: string,
  appId: string,
  mappingId: string
): Promise<void>;

/**
 * Increment usage count when mapping is applied
 */
export async function incrementMappingUsage(
  db: Firestore,
  userId: string,
  appId: string,
  mappingId: string
): Promise<void>;
```

### categoryMatcher.ts Functions

```typescript
/**
 * Initialize Fuse.js with user's mappings
 */
export function createMatcher(mappings: CategoryMapping[]): Fuse<CategoryMapping>;

/**
 * Find best matching category for an item
 */
export function findCategoryMatch(
  matcher: Fuse<CategoryMapping>,
  itemName: string,
  merchant?: string
): MatchResult | null;

/**
 * Apply learned categories to transaction items
 */
export function applyCategoryMappings(
  transaction: Transaction,
  mappings: CategoryMapping[]
): Transaction;

/**
 * Normalize item name for matching
 */
export function normalizeItemName(name: string): string;
```

### useCategoryMappings.ts Hook

```typescript
/**
 * React hook for category mappings
 */
export function useCategoryMappings(): {
  mappings: CategoryMapping[];
  loading: boolean;
  error: Error | null;
  saveMapping: (item: string, category: StoreCategory) => Promise<void>;
  deleteMapping: (mappingId: string) => Promise<void>;
  findMatch: (itemName: string, merchant?: string) => MatchResult | null;
};
```

---

## Implementation Patterns

### Fuzzy Matching Pattern

```typescript
// Pattern: Fuse.js matcher with confidence scoring
import Fuse from 'fuse.js';

const fuseOptions: Fuse.IFuseOptions<CategoryMapping> = {
  includeScore: true,
  threshold: 0.3,
  ignoreLocation: true,
  keys: [
    { name: 'normalizedItem', weight: 0.7 },
    { name: 'merchantPattern', weight: 0.3 }
  ]
};

export function findCategoryMatch(
  matcher: Fuse<CategoryMapping>,
  itemName: string,
  merchant?: string
): MatchResult | null {
  const normalizedName = normalizeItemName(itemName);
  const results = matcher.search(normalizedName);

  if (results.length === 0) return null;

  const best = results[0];
  // Lower score is better in Fuse.js (0 = perfect match)
  if (best.score && best.score > 0.3) return null;

  return {
    mapping: best.item,
    score: best.score ?? 1,
    confidence: best.item.confidence * (1 - (best.score ?? 0))
  };
}
```

### Category Learning Prompt Pattern

```typescript
// Pattern: Non-blocking category learning prompt
const [showLearnPrompt, setShowLearnPrompt] = useState(false);
const [itemToLearn, setItemToLearn] = useState<string | null>(null);
const [categoryToLearn, setCategoryToLearn] = useState<StoreCategory | null>(null);

const handleCategoryChange = async (newCategory: StoreCategory) => {
  // Update the transaction
  await updateTransaction(/* ... */);

  // Offer to learn if there are items
  if (transaction.items.length > 0) {
    setItemToLearn(transaction.items[0].name);
    setCategoryToLearn(newCategory);
    setShowLearnPrompt(true);
  }
};

const confirmLearn = async () => {
  if (itemToLearn && categoryToLearn) {
    await saveMapping(itemToLearn, categoryToLearn);
    // Toast: "Got it! I'll remember this for next time"
  }
  setShowLearnPrompt(false);
};
```

### Category Application Pattern

```typescript
// Pattern: Apply mappings after Gemini scan
export function applyCategoryMappings(
  transaction: Transaction,
  mappings: CategoryMapping[]
): Transaction {
  if (mappings.length === 0) return transaction;

  const matcher = createMatcher(mappings);

  // Check store category first (from merchant name)
  const merchantMatch = findCategoryMatch(matcher, transaction.merchant);
  if (merchantMatch && merchantMatch.confidence > 0.7) {
    transaction.category = merchantMatch.mapping.targetCategory;
    // TODO: Track mapping usage
  }

  // Then check individual items (for item-level category)
  transaction.items = transaction.items.map(item => {
    const itemMatch = findCategoryMatch(matcher, item.name);
    if (itemMatch && itemMatch.confidence > 0.7) {
      return { ...item, category: itemMatch.mapping.targetCategory };
    }
    return item;
  });

  return transaction;
}
```

---

## Error Handling

| Scenario | Handling | User Message |
|----------|----------|--------------|
| Mapping save fails | Retry + toast | "Couldn't save. Please try again." |
| Mapping load fails | Use empty array + retry | (Silent - degrades gracefully) |
| Fuse.js init fails | Fallback to no matching | (Silent - degrades gracefully) |
| Max mappings reached | Prevent save + prompt | "You've reached the limit. Delete some to add more." |

---

## Testing Strategy

### Unit Tests (categoryMatcher.ts)

| Test | Description |
|------|-------------|
| `normalizeItemName` basic | "UBER EATS" → "uber eats" |
| `normalizeItemName` special chars | "Café 50%" → "cafe 50" |
| `findCategoryMatch` exact | "uber" matches "uber" with high confidence |
| `findCategoryMatch` fuzzy | "UBER EATS" matches "uber" |
| `findCategoryMatch` no match | "random" returns null |
| `applyCategoryMappings` empty | Returns transaction unchanged |
| `applyCategoryMappings` merchant | Updates store category |
| `applyCategoryMappings` item | Updates item category |

### Unit Tests (categoryMappingService.ts)

| Test | Description |
|------|-------------|
| `saveCategoryMapping` creates | New mapping with correct fields |
| `saveCategoryMapping` updates | Existing mapping updated |
| `getCategoryMappings` returns | All mappings for user |
| `deleteCategoryMapping` removes | Mapping deleted |
| `incrementMappingUsage` updates | usageCount incremented |

### Integration Tests

| Test | Description |
|------|-------------|
| Learning flow | Change category → prompt → confirm → mapping saved |
| Apply on scan | Scan receipt → matching categories applied |
| Manage mappings | Settings → view → edit → delete |
| Real-time sync | Edit on one device → updates on another |

### E2E Tests (Playwright)

| Test | Description |
|------|-------------|
| Full learning flow | Login → edit txn → learn → scan similar → auto-categorized |
| Manage mappings flow | Login → Settings → Learned Categories → delete one |

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Learning prompt | Focus trap, Escape to close |
| Mappings list | Keyboard navigable, aria-labels |
| Delete confirmation | Focus on confirm button |
| Toast messages | aria-live announcements |

---

## Performance Considerations

| Metric | Target | Implementation |
|--------|--------|----------------|
| Initial mappings load | <200ms | Load on auth, cache in memory |
| Fuzzy match lookup | <50ms | Pre-built Fuse.js index |
| Prompt appearance | Instant | Already in DOM, just show |
| List render (100 items) | <100ms | Virtual list if >100 |

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Cross-user data access | Firestore rules: `userId == request.auth.uid` |
| Malicious item names | Sanitize display, no eval/innerHTML |
| Excessive mappings | Client-side limit (1000) + server validation |

**Firestore Security Rules:**
```javascript
// In firestore.rules
match /artifacts/{appId}/users/{userId}/category_mappings/{mappingId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

## Story Breakdown

| Story | Title | Points | Description |
|-------|-------|--------|-------------|
| 6.1 | Category Mapping Infrastructure | 3 | Types, Firestore service, security rules |
| 6.2 | Fuzzy Matching Engine | 3 | fuse.js integration, matcher logic |
| 6.3 | Category Learning Prompt | 2 | UI prompt on category edit |
| 6.4 | Auto-Apply on Receipt Scan | 3 | Apply mappings to Gemini results |
| 6.5 | Mappings Management UI | 3 | Settings section for viewing/editing/deleting |

**Total:** 14 story points

---

## Story-to-File Mapping

| Story | Primary Files | Test Files |
|-------|---------------|------------|
| 6.1 Infrastructure | `src/types/categoryMapping.ts`, `src/services/categoryMappingService.ts` | `tests/unit/categoryMappingService.test.ts` |
| 6.2 Fuzzy Matching | `src/utils/categoryMatcher.ts` | `tests/unit/categoryMatcher.test.ts` |
| 6.3 Learning Prompt | `src/components/CategoryLearningPrompt.tsx`, `src/views/TransactionDetailView.tsx` | `tests/integration/category-learning.test.tsx` |
| 6.4 Auto-Apply | `src/services/gemini.ts`, `src/hooks/useCategoryMappings.ts` | `tests/integration/category-apply.test.tsx` |
| 6.5 Management UI | `src/components/CategoryMappingsList.tsx`, `src/views/SettingsView.tsx` | `tests/e2e/category-mappings.spec.ts` |

---

## Rollout Plan

1. **Story 6.0** - CI/CD Auto-Deploy ✅ (Infrastructure pre-requisite, completed)
2. **Story 6.1** - Infrastructure (types, service, rules)
3. **Story 6.2** - Fuzzy matching engine (can parallel with 6.1)
4. **Story 6.3** - Learning prompt (depends on 6.1)
5. **Story 6.4** - Auto-apply on scan (depends on 6.1, 6.2)
6. **Story 6.5** - Management UI (depends on 6.1)

**Deployment Notes:**
- Story 6.0 enables auto-deploy on merge to main
- Each story can be deployed independently
- Feature degrades gracefully if mappings not loaded

---

## Dependencies

### External Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| fuse.js | ^7.0.0 | Fuzzy matching library |

### Internal Dependencies

- Story 6.0 (CI/CD Auto-Deploy) - **DONE**
- Epic 4 (Security Hardening) - Firestore rules pattern
- Epic 4.5 (Image Storage) - Firestore subcollection pattern

---

## Documentation Updates

After Epic 6 completion, update:
- [ ] `docs/index.md` - Add Epic 6 section
- [ ] `docs/architecture/architecture.md` - Add ADR-013, ADR-014, ADR-015
- [ ] `docs/planning/epics.md` - Mark Epic 6 complete
- [ ] `src/utils/translations.ts` - Add i18n strings
- [ ] `firestore.rules` - Add category_mappings rules

---

## Appendix: Translation Keys

```typescript
// Add to translations.ts
export const CATEGORY_LEARNING_TRANSLATIONS = {
  en: {
    learnCategoryTitle: 'Learn This Category?',
    learnCategoryMessage: 'Remember "{item}" as {category} for future receipts?',
    learnCategoryConfirm: 'Yes, Remember',
    learnCategorySkip: 'Not Now',
    learnCategorySuccess: 'Got it! I\'ll remember this.',
    learnedCategories: 'Learned Categories',
    learnedCategoriesEmpty: 'No learned categories yet',
    learnedCategoriesHint: 'Edit a transaction\'s category to start learning',
    deleteMapping: 'Delete',
    deleteMappingConfirm: 'Remove this learned category?',
    mappingsLimit: 'You\'ve reached the limit of learned categories',
  },
  es: {
    learnCategoryTitle: '¿Aprender Esta Categoría?',
    learnCategoryMessage: '¿Recordar "{item}" como {category} para futuras boletas?',
    learnCategoryConfirm: 'Sí, Recordar',
    learnCategorySkip: 'Ahora No',
    learnCategorySuccess: '¡Entendido! Lo recordaré.',
    learnedCategories: 'Categorías Aprendidas',
    learnedCategoriesEmpty: 'Sin categorías aprendidas aún',
    learnedCategoriesHint: 'Edita la categoría de una transacción para empezar a aprender',
    deleteMapping: 'Eliminar',
    deleteMappingConfirm: '¿Eliminar esta categoría aprendida?',
    mappingsLimit: 'Has alcanzado el límite de categorías aprendidas',
  },
};
```

---

**Tech Spec Version:** 1.0
**Created:** 2025-12-03
**Ready for:** Story 6.1 implementation
