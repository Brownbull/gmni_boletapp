# Tech Spec: Epic 9 - Scan Enhancement & Merchant Learning

**Date:** 2025-12-12
**Status:** Draft
**Total Story Points:** ~18 points
**Estimated Duration:** 5-7 days

---

## Overview

Epic 9 integrates the enhanced fields from prompt v2.6.0 into the application and implements merchant name learning. This is a primarily backend/data model epic with minimal UI changes.

### Architecture Approach

1. **Transaction Type Extension** - Add optional fields for backward compatibility
2. **Merchant Mapping Service** - Simplified version of categoryMappingService (no merchantPattern)
3. **Minimal UI Changes** - Display fields in existing views, no redesign
4. **Test Coverage** - Update existing tests, add new unit/integration tests
5. **Source Tracking** - Add `merchantSource` for UX transparency ("Learned" badge)

> **Architecture Reference:** See [architecture-epic9.md](./architecture-epic9.md) for full ADRs and implementation patterns.

---

## Story Map

```
Epic 9: Scan Enhancement & Merchant Learning (~18 points)
│
├── Story 9.1: Transaction Type Extension (3 points)
│   Dependencies: None
│   Deliverable: Updated types, scanner integration, test fixture updates
│
├── Story 9.2: Transaction Item Category Fields (2 points)
│   Dependencies: Story 9.1
│   Deliverable: Item category/subcategory properly typed and stored
│
├── Story 9.3: Edit View Field Display (3 points)
│   Dependencies: Story 9.1
│   Deliverable: Display new fields in Edit view
│
├── Story 9.4: Merchant Mapping Infrastructure (3 points)
│   Dependencies: None
│   Deliverable: Types, Firestore service, security rules
│
├── Story 9.5: Merchant Fuzzy Matching (3 points)
│   Dependencies: Story 9.4
│   Deliverable: Fuse.js matcher, auto-apply logic
│
├── Story 9.6: Merchant Learning Prompt (2 points)
│   Dependencies: Story 9.4
│   Deliverable: UI prompt on merchant name edit
│
└── Story 9.7: Merchant Mappings Management UI (2 points)
    Dependencies: Story 9.4, 9.5, 9.6
    Deliverable: Settings section for managing mappings
```

---

## Stories

### Story 9.1: Transaction Type Extension

**As a developer,**
I want the Transaction type extended with v2.6.0 fields,
So that all AI-extracted data is stored in Firestore.

**Acceptance Criteria:**

- [x] AC #1: Transaction interface includes `time?: string` (HH:mm format)
- [x] AC #2: Transaction interface includes `country?: string`
- [x] AC #3: Transaction interface includes `city?: string`
- [x] AC #4: Transaction interface includes `currency?: string` (ISO 4217)
- [x] AC #5: Transaction interface includes `receiptType?: string`
- [x] AC #6: Transaction interface includes `promptVersion?: string`
- [x] AC #7: Scanner service passes new fields from AI extraction to transaction
- [x] AC #8: Existing tests pass (fields are optional)
- [x] AC #9: Test fixtures updated to include new fields where appropriate

**Technical Notes:**

```typescript
// src/types/transaction.ts additions
export interface Transaction {
  // ... existing fields
  time?: string;        // "15:01" format
  country?: string;     // "United Kingdom"
  city?: string;        // "London"
  currency?: string;    // "GBP"
  receiptType?: string; // "receipt" | "invoice" | "ticket"
  promptVersion?: string; // "2.6.0"
}
```

**Story Points:** 3

---

### Story 9.2: Transaction Item Category Fields

**As a developer,**
I want TransactionItem category and subcategory fields properly typed,
So that item-level categorization is stored and displayed.

**Acceptance Criteria:**

- [x] AC #1: TransactionItem `category` field uses ItemCategory type from output-schema
- [x] AC #2: TransactionItem `subcategory` remains as optional string
- [x] AC #3: Scanner passes item category/subcategory from AI extraction
- [x] AC #4: Edit view displays item categories (read-only or editable)
- [x] AC #5: Existing item tests pass

**Technical Notes:**

TransactionItem already has these fields, but they need:
1. Proper typing (ItemCategory type from output-schema.ts)
2. Consistent storage from AI extraction
3. Display in the item list

**Story Points:** 2

---

### Story 9.3: Edit View Field Display

**As a user,**
I want to see the time, location, and currency of my receipt,
So that I have complete context about my purchase.

**Acceptance Criteria:**

- [x] AC #1: Time displayed in receipt header or metadata section
- [x] AC #2: Country and city displayed together (e.g., "London, United Kingdom")
- [x] AC #3: Currency code displayed near total (e.g., "GBP 29.97")
- [x] AC #4: Receipt type shown as a badge/label if not "receipt"
- [x] AC #5: Prompt version shown in collapsible "Debug Info" section
- [x] AC #6: Fields gracefully hidden when not available (no "N/A" spam)
- [x] AC #7: Existing Edit view tests pass

**Technical Notes:**

- Time: Add to metadata row with date
- Location: Single line "City, Country" format
- Currency: Prefix total display
- Receipt type: Small badge only for non-standard types
- Prompt version: Hidden by default, shown in expandable debug section

**Story Points:** 3

---

### Story 9.4: Merchant Mapping Infrastructure

**As a developer,**
I want merchant mapping types and Firestore service,
So that merchant name corrections can be stored and retrieved.

**Acceptance Criteria:**

- [x] AC #1: MerchantMapping interface defined in `src/types/merchantMapping.ts`
- [x] AC #2: merchantMappingService created following categoryMappingService pattern
- [x] AC #3: Firestore security rules added for `merchant_mappings` collection
- [x] AC #4: `normalizeMerchantName()` function normalizes merchant names for matching
- [x] AC #5: Unit tests for merchantMappingService
- [x] AC #6: Integration tests for Firestore operations

**Technical Notes:**

```typescript
// src/types/merchantMapping.ts
export interface MerchantMapping {
  id?: string;
  originalMerchant: string;
  normalizedMerchant: string;
  targetMerchant: string;
  confidence: number;
  source: 'user';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  usageCount: number;
}

// Firestore path: artifacts/{appId}/users/{userId}/merchant_mappings/
```

**Story Points:** 3

---

### Story 9.5: Merchant Fuzzy Matching

**As a developer,**
I want fuzzy matching for merchant names,
So that similar merchant names are recognized and corrected.

**Acceptance Criteria:**

- [ ] AC #1: Fuse.js configured for merchant matching (default threshold: 0.3, configurable)
- [ ] AC #2: `findMerchantMatch()` returns best matching mapping or null
- [ ] AC #3: Minimum 3-character normalized length guard to prevent false matches
- [ ] AC #4: Scanner checks for merchant match after AI extraction
- [ ] AC #5: Matched merchant name applied to transaction
- [ ] AC #6: Transaction marked with `merchantSource: 'learned'`
- [ ] AC #7: Mapping usage count incremented on auto-apply
- [ ] AC #8: Unit tests for fuzzy matching logic including threshold boundary tests

**Technical Notes:**

```typescript
// src/services/merchantMatcherService.ts
import Fuse from 'fuse.js';

// Configurable threshold - may need adjustment based on user feedback
const DEFAULT_THRESHOLD = 0.3;
const MIN_NORMALIZED_LENGTH = 3;

const fuseOptions: Fuse.IFuseOptions<MerchantMapping> = {
  includeScore: true,
  threshold: DEFAULT_THRESHOLD,
  keys: ['normalizedMerchant']
};

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

**Story Points:** 3

---

### Story 9.6: Merchant Learning Prompt

**As a user,**
I want to be prompted to remember my merchant name correction,
So that future receipts from the same store are corrected automatically.

**Acceptance Criteria:**

- [x] AC #1: Dialog appears when merchant name is changed and saved
- [x] AC #2: Dialog shows original vs corrected merchant name
- [x] AC #3: "Remember" button creates merchant mapping
- [x] AC #4: "Don't remember" dismisses dialog without saving mapping
- [x] AC #5: Dialog follows same UX pattern as category learning prompt
- [x] AC #6: Dialog can be disabled via Settings toggle (future enhancement)

**Technical Notes:**

Reuse LearnCategoryDialog pattern:
- Check if merchant name changed on save
- If changed, show dialog with original/corrected values
- On confirm, call `saveMerchantMapping()`

**Story Points:** 2

---

### Story 9.7: Merchant Mappings Management UI

**As a user,**
I want to view and manage my merchant name mappings,
So that I can edit or delete incorrect mappings.

**Acceptance Criteria:**

- [x] AC #1: "Merchant Mappings" section added to Settings view
- [x] AC #2: List shows all merchant mappings (original → corrected)
- [x] AC #3: Each mapping shows usage count
- [x] AC #4: Delete button removes mapping with confirmation
- [x] AC #5: Edit functionality allows updating target merchant name
- [x] AC #6: Empty state message when no mappings exist
- [x] AC #7: Follows Category Mappings UI pattern

**Technical Notes:**

Copy CategoryMappingsSettings component structure:
- `MerchantMappingsSettings.tsx`
- `useMerchantMappings.ts` hook
- Reuse existing list/edit/delete patterns

**Story Points:** 2

---

## Implementation Sequence

```
Week 1:
├── Day 1-2: Story 9.1 (Transaction Type Extension)
│            Story 9.4 (Merchant Mapping Infrastructure) [parallel]
├── Day 2-3: Story 9.2 (Item Category Fields)
│            Story 9.5 (Merchant Fuzzy Matching) [parallel]
└── Day 3-4: Story 9.3 (Edit View Field Display)

Week 2:
├── Day 1-2: Story 9.6 (Merchant Learning Prompt)
└── Day 2-3: Story 9.7 (Merchant Mappings Management UI)
```

**Parallelization:**
- Stories 9.1 and 9.4 have no dependencies, can run in parallel
- Stories 9.2/9.5 depend on 9.1/9.4 respectively, can run in parallel
- Story 9.3 depends on 9.1, can run while 9.5 is in progress
- Stories 9.6 and 9.7 are sequential (depend on 9.4/9.5)

---

## Technical Decisions

> **Full ADRs:** See [architecture-epic9.md](./architecture-epic9.md) for complete Architecture Decision Records.

### TD1: Simplified MerchantMapping Model

**Decision:** MerchantMapping does NOT include `merchantPattern` field (unlike CategoryMapping)

**Rationale:** Merchant-to-merchant mapping is simpler than item-to-category. No cross-merchant patterns needed.

### TD2: Configurable Fuzzy Threshold

**Decision:** Default 0.3 threshold, but make it a parameter in `findMerchantMatch()`

**Rationale:** May need tuning based on real-world merchant name variations. Stricter than category (0.6) to avoid false positives.

### TD3: Minimum Normalized Length Guard

**Decision:** Require minimum 3 characters in normalized name before fuzzy matching

**Rationale:** Prevents false positives on very short merchant names (e.g., "ABC" matching multiple mappings).

### TD4: MerchantSource Field

**Decision:** Add `merchantSource: 'scan' | 'learned' | 'user'` to Transaction

**Rationale:** Users need to know when merchant name was auto-applied. Enables "Learned" badge in UI.

### TD5: User-Scoped Mappings Only

**Decision:** Store mappings in user subcollection only (no global sharing)

**Rationale:** Privacy, personalization, matches existing category pattern. Global suggestions can be added later.

---

## File Changes Summary

### New Files

| File | Description |
|------|-------------|
| `src/types/merchantMapping.ts` | MerchantMapping interface |
| `src/services/merchantMappingService.ts` | Firestore CRUD operations |
| `src/services/merchantMatcherService.ts` | Fuse.js matching logic |
| `src/hooks/useMerchantMappings.ts` | React hook for mappings |
| `src/components/settings/MerchantMappingsSettings.tsx` | Settings UI |
| `src/components/dialogs/LearnMerchantDialog.tsx` | Learning prompt |

### Modified Files

| File | Changes |
|------|---------|
| `src/types/transaction.ts` | Add new fields, MerchantSource type |
| `src/views/EditView.tsx` | Display new fields, learning dialog |
| `src/views/SettingsView.tsx` | Add Merchant Mappings section |
| `firestore.rules` | Add merchant_mappings rules |
| `tests/unit/**` | Update test fixtures |
| `tests/integration/**` | Add merchant mapping tests |

---

## Testing Strategy

### Unit Tests

| Area | Test Coverage |
|------|---------------|
| merchantMappingService | CRUD operations, upsert behavior |
| merchantMatcherService | Fuzzy matching, threshold boundaries, min length guard |
| normalizeMerchantName | Normalization edge cases |
| Transaction type | New field handling, backward compatibility |

**Key Test Cases:**
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

### Integration Tests

| Area | Test Coverage |
|------|---------------|
| Scanner → Transaction | New fields passed through |
| Merchant learning flow | Save mapping → scan → match → apply |
| Security rules | User isolation |

### E2E Tests

| Flow | Coverage |
|------|----------|
| Edit transaction | New fields displayed, "Learned" badge |
| Merchant correction | Learning dialog appears |
| Settings | Merchant mappings management |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Existing tests fail | All new fields are optional |
| False merchant matches | Strict threshold (0.3), user can override |
| UI clutter | Minimal display, collapsible sections |
| Performance | Fuse.js runs client-side, no API calls |

---

## Success Criteria

1. All 7 stories completed and tested
2. 80%+ test coverage for new code
3. Existing test suite passes (no regressions)
4. New fields visible in Edit view
5. Merchant learning functional end-to-end

---

## Post-Review Follow-ups

### Story 9.1 Review (2025-12-13) - BLOCKED

**Critical findings requiring resolution before Story 9.1 can pass review:**

- [ ] **[High]** Update `GeminiAnalysisResult` interface to include new fields (time, country, city, currency, receiptType) [file: functions/src/analyzeReceipt.ts:128-138]
- [ ] **[High]** Update `AnalyzeReceiptResponse` interface to include promptVersion and merchantSource [file: functions/src/analyzeReceipt.ts:144-148]
- [ ] **[High]** Update `processScan` in App.tsx to map all new fields to initialTransaction [file: src/App.tsx:132-146]
- [ ] **[High]** Set `merchantSource: 'scan'` default and `promptVersion: '2.6.0'` in Cloud Function response [file: functions/src/analyzeReceipt.ts:311-316]

**Non-blocking items:**
- [ ] **[Med]** Fix pre-existing test expectations in prompts/__tests__/index.test.ts (category counts, version)
- [ ] **[Med]** Update restaurantReceipt fixture to include new fields

---

**Document Version:** 1.2
**Last Updated:** 2025-12-13
**Changes:** Added Post-Review Follow-ups section for Story 9.1 blocking issues
