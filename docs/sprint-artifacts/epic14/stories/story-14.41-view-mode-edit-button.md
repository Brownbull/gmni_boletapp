# Story 14.41: View Mode Edit Button & Field Locking

**Status:** done
**Points:** 2
**Epic:** 14 - Core Implementation
**Dependencies:** 14.38 (Item View Toggle - Re-scan button relocation)

---

## Story

**As a** user viewing an existing transaction,
**I want to** see an edit button below the thumbnail and have all fields locked until I click it,
**So that** I don't accidentally modify transaction data while browsing.

---

## Context

### Problem
Currently in `TransactionEditorView` when viewing an existing transaction in read-only mode:

1. **Metadata fields are still interactive** - Clicking on city, date, time, or currency opens their selectors, allowing unintended changes
2. **No clear way to enter edit mode** - The edit button is at the bottom of the view, not easily visible
3. **Inconsistent UX** - Some fields are locked (items) but metadata fields are not

### Solution
1. Lock ALL fields in view mode (metadata + items)
2. Add an edit button below the thumbnail (same position as re-scan button in edit mode)
3. Clicking the edit button transitions to edit mode where all fields become interactive

### Technical Context

**Current State:**
- `readOnly` prop controls item editing but not metadata fields
- Re-scan button appears below thumbnail in edit mode (from Story 14.38)
- Edit button exists at bottom of view but is not prominent

**Target State:**
- `readOnly` prop should disable ALL interactive elements including LocationSelect, DateTimeTag, CurrencyTag
- Edit button (pencil icon) below thumbnail in view mode
- Re-scan button below thumbnail in edit mode

---

## Acceptance Criteria

### AC 1: Lock Metadata Fields in View Mode

- [x] LocationSelect: Disable country/city selection when `readOnly=true`
- [x] DateTimeTag: Disable date/time pickers when `readOnly=true`
- [x] CurrencyTag: Disable currency selector when `readOnly=true`
- [x] Category badge: Disable category selector when `readOnly=true` (already handled by existing readOnly logic)
- [x] Merchant name: Already locked (no action needed)

### AC 2: Add Edit Button Below Thumbnail

- [x] Show edit button (pencil icon) below thumbnail in view mode
- [x] Same position and style as re-scan button (circular, icon-only)
- [x] Button triggers `onRequestEdit` callback (existing prop)
- [x] Hidden when not in view mode (readOnly=false)

### AC 3: Conditional Button Display

- [x] View mode (`readOnly=true`): Show edit button below thumbnail
- [x] Edit mode (`readOnly=false`): Show re-scan button below thumbnail (existing behavior)
- [x] New transaction mode: No button needed (no thumbnail yet, or scan button state machine handles it)

---

## Technical Notes

### Components to Update

**TransactionEditorView.tsx:**
```typescript
// Pass readOnly to metadata components
<LocationSelect
  ...
  disabled={readOnly}  // NEW
/>

<DateTimeTag
  ...
  disabled={readOnly}  // NEW
/>

<CurrencyTag
  ...
  disabled={readOnly}  // NEW
/>

// Edit button below thumbnail (view mode only)
{mode === 'existing' && readOnly && onRequestEdit && (
  <button
    onClick={onRequestEdit}
    className="w-8 h-8 rounded-full flex items-center justify-center"
    style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}
    aria-label={t('edit')}
  >
    <Pencil size={16} />
  </button>
)}
```

**LocationSelect.tsx:**
- Add `disabled?: boolean` prop
- When disabled, make buttons non-interactive (pointer-events: none or disabled attribute)

**DateTimeTag.tsx:**
- Add `disabled?: boolean` prop
- When disabled, prevent date/time picker from opening

**CurrencyTag.tsx:**
- Add `disabled?: boolean` prop
- When disabled, prevent currency selector from opening

### Existing Props
- `readOnly` prop already exists on TransactionEditorView
- `onRequestEdit` callback already exists for transitioning to edit mode

---

## Out of Scope

- Changing the bottom edit button behavior (it can remain as backup)
- Visual indication that fields are locked (hover states, etc.)
- Edit button animation or transitions

---

## Testing Checklist

- [x] View mode: Cannot click city to change it
- [x] View mode: Cannot click date to change it
- [x] View mode: Cannot click time to change it
- [x] View mode: Cannot click currency to change it
- [x] View mode: Cannot click category badge to change it
- [x] View mode: Edit button appears below thumbnail
- [x] View mode: Clicking edit button triggers onRequestEdit
- [x] Edit mode: All fields are interactive
- [x] Edit mode: Re-scan button appears below thumbnail (not edit button)
- [x] New transaction: Neither edit nor re-scan button below thumbnail

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-13 | Story created | User |
| 2026-01-13 | Implementation complete | Claude |
| 2026-01-13 | Code review: Added missing `edit` translation key, added `lang` prop to LocationSelect | Claude |

---

## Implementation Summary

### Files Modified

1. **src/components/LocationSelect.tsx**
   - Added `disabled?: boolean` prop
   - When disabled: button is disabled, opacity reduced to 0.7, cursor set to default
   - Dropdown does not open when disabled

2. **src/components/DateTimeTag.tsx**
   - Added `disabled?: boolean` prop
   - Both date and time buttons are disabled when prop is true
   - Dropdowns do not open when disabled

3. **src/components/CurrencyTag.tsx**
   - Added `disabled?: boolean` prop
   - Button is disabled with reduced opacity when prop is true
   - Dropdown does not open when disabled

4. **src/views/TransactionEditorView.tsx**
   - Pass `disabled={readOnly}` to LocationSelect, DateTimeTag, CurrencyTag
   - Added edit button (pencil icon, circular) below thumbnail in view mode
   - Edit button only shows when `mode='existing' && readOnly && onRequestEdit`
   - Re-scan button only shows when `!readOnly` (existing behavior preserved)
   - Code review fix: Added `lang={lang}` prop to LocationSelect for localization

5. **src/utils/translations.ts** (Code review fix)
   - Added `edit` translation key for edit button aria-label (EN: "Edit", ES: "Editar")

### Tests Added

1. **tests/unit/components/LocationSelect.test.tsx** - 12 tests
2. **tests/unit/components/DateTimeTag.test.tsx** - 19 tests
3. **tests/unit/components/CurrencyTag.test.tsx** - 18 tests

All 49 new tests pass.
