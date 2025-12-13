# PRD: Epic 9 - Scan Enhancement & Merchant Learning

**Date:** 2025-12-12
**Status:** Draft
**Epic Slug:** scan-enhancement-merchant-learning

---

## Executive Summary

Epic 9 bridges the gap between the enhanced AI extraction capabilities delivered in Epic 8 (prompt v2.6.0) and the application's data model. The prompt now extracts rich metadata (time, country, city, currency, receiptType, item categories/subcategories, promptVersion) that isn't currently stored or displayed. Additionally, this epic implements merchant name learning following the same successful pattern as category learning from Epic 6.

### Business Value

1. **Data Completeness** - Store all available receipt data for future analytics and features
2. **User Experience** - Display contextual information (location, currency, time)
3. **Accuracy Improvement** - Merchant name learning reduces repetitive corrections
4. **Foundation for UX Redesign** - Clean data model enables Epic 10 UI improvements

---

## Problem Statement

### Current State

The Gemini prompt v2.6.0 extracts the following fields that are **not stored** in the Transaction type:
- `time` - Hour/minute of purchase (e.g., "15:01")
- `country` - Country where receipt originated (e.g., "United Kingdom")
- `city` - City where receipt originated (e.g., "London")
- `currency` - Currency used (e.g., "GBP", "CLP", "EUR")
- `receiptType` - Type of document (e.g., "receipt", "invoice", "ticket")
- `promptVersion` - Version of prompt used (e.g., "2.6.0")

The TransactionItem type has `category` and `subcategory` fields, but they're optional and not consistently used.

Additionally, users must manually correct merchant names for every receipt from the same store, even when they've corrected the name before (e.g., "SUPERMERC JUMBO" → "Jumbo Supermarket").

### Desired State

1. All AI-extracted fields are stored in the Transaction/TransactionItem types
2. New fields are displayed in the Edit view with appropriate formatting
3. Merchant name corrections are learned and auto-applied to future scans
4. Users can manage their merchant name mappings in Settings

---

## Goals

### Primary Goals

1. **G1:** Extend Transaction type to include all v2.6.0 fields
2. **G2:** Implement merchant name learning infrastructure
3. **G3:** Display new fields in Edit view with minimal UI changes
4. **G4:** Show prompt version in receipt detail (debugging/transparency)

### Non-Goals

- Full UX redesign (Epic 10)
- Analytics based on new fields (future enhancement)
- Currency conversion features
- Location-based features beyond display
- Cross-user learning

---

## User Stories

### Transaction Field Integration

**US-1:** As a user, I want to see the time of my purchase so I can distinguish between morning/afternoon shopping trips.

**US-2:** As a user, I want to see the country and city of my purchase so I can track spending while traveling.

**US-3:** As a user, I want to know what currency was used on my receipt so I understand the original amount.

**US-4:** As a power user, I want to see which prompt version extracted my receipt data for debugging purposes.

### Merchant Name Learning

**US-5:** As a user, when I correct a merchant name, I want the app to remember my correction so I don't have to repeat it.

**US-6:** As a user, when I scan a receipt from a store I've corrected before, I want the corrected name applied automatically.

**US-7:** As a user, I want to view and manage my merchant name mappings so I can edit or delete them.

**US-8:** As a user, I want to see when a merchant name was auto-applied so I know it came from my learning history.

---

## Functional Requirements

### FR1: Extended Transaction Type

| Field | Type | Source | Required | Description |
|-------|------|--------|----------|-------------|
| `time` | string | AI | No | Time of purchase (HH:mm format) |
| `country` | string | AI | No | Country name |
| `city` | string | AI | No | City name |
| `currency` | string | AI | No | Currency code (ISO 4217) |
| `receiptType` | string | AI | No | Document type (receipt/invoice/ticket) |
| `promptVersion` | string | AI | No | Prompt version used for extraction |

### FR2: Extended TransactionItem Type

| Field | Type | Source | Required | Description |
|-------|------|--------|----------|-------------|
| `category` | string | AI/User | No | Item category from ITEM_CATEGORIES |
| `subcategory` | string | AI | No | Item subcategory (free text) |

### FR3: Merchant Name Mapping

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Firestore document ID |
| `originalMerchant` | string | Original merchant name from AI |
| `normalizedMerchant` | string | Lowercase, trimmed for matching |
| `targetMerchant` | string | User's preferred merchant name |
| `confidence` | number | 1.0 for user-set |
| `source` | string | 'user' |
| `createdAt` | Timestamp | Creation time |
| `updatedAt` | Timestamp | Last update time |
| `usageCount` | number | Times auto-applied |

**Firestore Path:** `artifacts/{appId}/users/{userId}/merchant_mappings/{mappingId}`

### FR4: Merchant Learning Flow

1. User edits merchant name in Edit view
2. On save, if merchant changed, prompt: "Remember this correction?"
3. If yes, create/update merchant mapping with fuzzy match key
4. On future scans, check if AI merchant matches any existing mapping
5. If match found (Fuse.js score < 0.3), apply learned merchant name
6. Mark transaction with `merchantSource: 'learned'`

### FR5: UI Requirements

**Edit View:**
- Display time field (read-only or editable)
- Display country/city (read-only)
- Display currency (read-only)
- Display receiptType (read-only badge)
- Show prompt version in collapsible debug section

**Settings View:**
- New "Merchant Mappings" section (following Category Mappings pattern)
- List all merchant mappings with original → corrected
- Edit/Delete functionality
- Usage count display

---

## Technical Requirements

### TR1: Type Updates

```typescript
// src/types/transaction.ts
export interface Transaction {
  // ... existing fields
  time?: string;        // HH:mm format
  country?: string;
  city?: string;
  currency?: string;    // ISO 4217
  receiptType?: string; // receipt | invoice | ticket | other
  promptVersion?: string;
}

export type MerchantSource = 'scan' | 'learned' | 'user';

export interface Transaction {
  // ... existing fields
  merchantSource?: MerchantSource;
}
```

### TR2: New Service

Create `merchantMappingService.ts` following `categoryMappingService.ts` pattern:
- `saveMerchantMapping()`
- `getMerchantMappings()`
- `subscribeMerchantMappings()`
- `deleteMerchantMapping()`
- `incrementMappingUsage()`
- `normalizeMerchantName()`

### TR3: Fuzzy Matching

Reuse Fuse.js from Epic 6 with merchant-specific options:
- Threshold: 0.3 default (configurable, stricter than category's 0.6)
- Minimum 3-character normalized length guard
- Keys: `['normalizedMerchant']`
- Include score for confidence calculation

> **Architecture Reference:** See [architecture-epic9.md](./architecture-epic9.md) for full implementation patterns and ADRs.

### TR4: Security Rules

Add Firestore rules for `merchant_mappings` collection:
```
match /artifacts/{appId}/users/{userId}/merchant_mappings/{mappingId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

## Non-Functional Requirements

### NFR1: Performance
- Merchant lookup must complete in < 100ms
- No additional API calls for merchant matching (local Fuse.js)

### NFR2: Data Migration
- Existing transactions remain unchanged (new fields optional)
- No backfill required for existing data

### NFR3: Backward Compatibility
- App must handle transactions with and without new fields
- UI gracefully handles missing optional fields

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| New field storage | 100% | All v2.6.0 fields saved |
| Merchant learning accuracy | 90%+ | Correct auto-apply rate |
| User corrections reduced | 30%+ | Fewer manual merchant edits |
| Test coverage | 80%+ | Unit + integration tests |

---

## Dependencies

### Internal
- Epic 8 completed (prompt v2.6.0 with enhanced fields)
- Epic 6 category learning (pattern to follow)
- Existing Fuse.js dependency

### External
- None (all dependencies in place)

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Existing tests break with new fields | Medium | Medium | Add optional fields, update test fixtures |
| Fuzzy matching false positives | Low | Medium | Use stricter threshold (0.3), allow user override |
| UI clutter with new fields | Medium | Low | Minimal display, collapsible sections |

---

## Out of Scope (Deferred)

- Currency conversion
- Location-based analytics
- Cross-user merchant learning
- Merchant name suggestions from AI
- Receipt type-specific workflows

---

## Appendix

### A1: Current Transaction Type

```typescript
export interface Transaction {
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
}
```

### A2: v2.6.0 AI Extraction Example

```json
{
  "merchant": "The British Museum",
  "date": "2025-05-23",
  "time": "15:01",
  "total": 2997,
  "currency": "GBP",
  "category": "BooksMedia",
  "country": "United Kingdom",
  "city": "London",
  "items": [
    {
      "name": "MASTERPIECES OF THE eac",
      "price": 1899,
      "quantity": 1,
      "category": "BooksMedia",
      "subcategory": null
    }
  ],
  "promptVersion": "2.6.0"
}
```

### A3: Category Mapping Reference (Epic 6)

```typescript
export interface CategoryMapping {
  id?: string;
  originalItem: string;
  normalizedItem: string;
  targetCategory: StoreCategory;
  merchantPattern?: string;
  confidence: number;
  source: 'user' | 'ai';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  usageCount: number;
}
```

---

**Document Version:** 1.1
**Last Updated:** 2025-12-12
**Changes:** Added architecture reference, updated TR3 with configurable threshold and min length guard
