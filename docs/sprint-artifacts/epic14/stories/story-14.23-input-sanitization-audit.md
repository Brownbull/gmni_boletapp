# Story 14.23: Input Sanitization Audit

## Status: DRAFT

## Story

**As a** security-conscious user
**I want** all my text inputs to be sanitized before storage
**So that** the application is protected from XSS, injection attacks, and malicious content

## Background

Story 14.15 introduced input sanitization for the ScanResultView component. This story extends that security enhancement to ALL user input fields across the entire application to ensure consistent protection.

## Acceptance Criteria

### AC 1: Audit All Input Fields
- [ ] Identify all components with user text input fields
- [ ] Document which fields already have sanitization
- [ ] Document which fields need sanitization added

### AC 2: Apply Sanitization to EditView
- [ ] Merchant name input sanitized before save
- [ ] Item name inputs sanitized before save
- [ ] Item subcategory inputs sanitized before save
- [ ] City/location inputs sanitized before save

### AC 3: Apply Sanitization to Settings Views
- [ ] Profile name input sanitized (if editable)
- [ ] Any custom preference text fields sanitized
- [ ] Group name inputs sanitized (CreateGroupModal, EditGroupModal)

### AC 4: Apply Sanitization to Learning Modals
- [ ] Merchant mapping edit target sanitized
- [ ] Category mapping edit target sanitized
- [ ] Subcategory mapping edit target sanitized

### AC 5: Apply Sanitization to Filter/Search Inputs
- [ ] History search/filter text sanitized
- [ ] Any other search inputs sanitized

### AC 6: Unit Tests for Sanitization Utility
- [ ] Test script tag removal
- [ ] Test event handler removal
- [ ] Test protocol attack prevention
- [ ] Test control character removal
- [ ] Test whitespace normalization
- [ ] Test max length enforcement
- [ ] Test null/undefined handling

## Technical Notes

### Sanitization Utility Location
```
src/utils/sanitize.ts
```

### Available Functions
| Function | Max Length | Use Case |
|----------|------------|----------|
| `sanitizeMerchantName()` | 200 | Merchant/store names |
| `sanitizeItemName()` | 200 | Product/item names |
| `sanitizeLocation()` | 100 | City, country, address |
| `sanitizeSubcategory()` | 100 | Custom subcategories |
| `sanitizeInput()` | configurable | Generic text fields |

### Files to Audit

#### Views
- [ ] `EditView.tsx` - Transaction editing
- [ ] `SettingsView.tsx` - User settings
- [ ] `HistoryView.tsx` - Search/filter inputs

#### Components
- [ ] `CreateGroupModal.tsx` - Group name input
- [ ] `EditGroupModal.tsx` - Group name edit
- [ ] `LearnMerchantDialog.tsx` - Merchant mapping
- [ ] `CategoryLearningPrompt.tsx` - Category mapping
- [ ] `SubcategoryLearningPrompt.tsx` - Subcategory mapping
- [ ] `LocationSelect.tsx` - City/country inputs
- [ ] `SearchBar.tsx` - Search text input
- [ ] `FilterChips.tsx` - Filter text inputs

#### Services (Backend Validation)
- [ ] `firestore.ts` - Consider server-side sanitization
- [ ] `userPreferencesService.ts` - Preference storage

### Implementation Pattern
```typescript
import { sanitizeMerchantName, sanitizeItemName, sanitizeLocation } from '../utils/sanitize';

// Before saving to Firestore
const cleanData = {
  merchant: sanitizeMerchantName(rawMerchant),
  items: rawItems.map(item => ({
    ...item,
    name: sanitizeItemName(item.name),
    subcategory: item.subcategory ? sanitizeSubcategory(item.subcategory) : undefined,
  })),
  city: sanitizeLocation(rawCity),
};
```

## Out of Scope
- Server-side validation (Cloud Functions) - separate security story
- File upload validation (images) - handled by Firebase Storage rules
- Authentication/authorization - handled by Firebase Auth

## Dependencies
- Story 14.15 (DONE): Created `src/utils/sanitize.ts`

## Story Points: 3

## Priority: HIGH (Security)

## Notes
- React already escapes JSX content, but we sanitize before storage for defense-in-depth
- Sanitization should be transparent to users (they don't see stripped characters)
- Log stripped content in development mode for debugging (optional)
