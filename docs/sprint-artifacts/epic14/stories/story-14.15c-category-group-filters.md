# Story 14.15c: Category Group Filters in Transaction List

**Status:** done
**Points:** 3
**Epic:** 14 - Core Implementation
**Dependencies:** Story 14.14 (Transaction List Redesign), Story 14.21 (Category Color Consolidation)
**Mockup:** [transaction-list.html](../../../uxui/mockups/01_views/transaction-list.html)

---

## Story

**As a** user browsing my transaction history,
**I want to** filter transactions by category groups (e.g., "Food & Dining", "Health & Wellness"),
**So that** I can quickly view related spending categories together without selecting each individually.

---

## Context

The `categoryColors.ts` configuration defines category groups that logically cluster related categories:

### Store Category Groups (8 groups)
| Group | Categories |
|-------|-----------|
| `food-dining` | Supermarket, Restaurant, Bakery, Butcher, StreetVendor |
| `health-wellness` | Pharmacy, Medical, Veterinary, HealthBeauty |
| `retail-general` | Bazaar, Clothing, Electronics, HomeGoods, Furniture, Hardware, GardenCenter |
| `retail-specialty` | PetShop, BooksMedia, OfficeSupplies, SportsOutdoors, ToysGames, Jewelry, Optical |
| `automotive` | Automotive, GasStation, Transport |
| `services` | Services, BankingFinance, Education, TravelAgency |
| `hospitality` | HotelLodging, Entertainment |
| `other` | CharityDonation, Other |

### Item Category Groups (7 groups)
| Group | Categories |
|-------|-----------|
| `food-fresh` | Produce, Meat & Seafood, Bakery, Dairy & Eggs |
| `food-packaged` | Pantry, Frozen Foods, Snacks, Beverages, Alcohol |
| `health-personal` | Health & Beauty, Personal Care, Pharmacy, Supplements, Baby Products |
| `household` | Cleaning Supplies, Household, Pet Supplies |
| `nonfood-retail` | Clothing, Electronics, Hardware, Garden, Automotive, Sports & Outdoors, Toys & Games, Books & Media, Office & Stationery, Crafts & Hobbies, Furniture |
| `services-fees` | Service, Tax & Fees |
| `other-item` | Tobacco, Other |

The IconFilterBar's category dropdown (Tag icon) currently shows individual categories. This story adds a "Groups" section that allows filtering by these predefined groups.

---

## Acceptance Criteria

### AC #1: Category Dropdown Enhancement
- [x] Category dropdown (Tag icon) gains a new "Groups" section
- [x] Groups section appears above individual categories, separated by divider
- [x] Section header "Grupos de Categorías" with subtle styling
- [x] Groups use their defined colors from `GROUP_COLORS` in categoryColors.ts

### AC #2: Store Category Groups
- [x] Show 8 store category groups with emoji and translated name
- [x] Each group shows count of categories in the group
- [x] Selecting a group sets category filter to include all categories in that group
- [x] Group selection clears any individual category selections

### AC #3: Item Category Groups (Optional Enhancement)
- [x] Toggle or tabs to switch between Store Groups and Item Groups
- [x] Item groups filter by item-level categories in transaction line items
- [x] ~~Can be deferred to future story if complex~~ → **IMPLEMENTED**

### AC #4: Visual Design
- [x] Group items use slightly larger styling than individual categories
- [x] Group emoji uses dedicated emoji from `STORE_CATEGORY_GROUP_EMOJIS`
- [x] Active group has highlight matching pending/active state
- [x] Clear visual distinction between groups and individual categories

### AC #5: Filter Chips Integration
- [x] When a group filter is active, show chip with group name (not individual categories)
- [x] Chip shows group emoji and name: "🍽️ Alimentación"
- [x] Clicking X on chip clears the group filter

### AC #6: Multi-Selection Behavior
- [x] Selecting a group replaces any current category selection
- [x] After selecting a group, can add/remove individual categories (becomes custom selection)
- [x] If all categories of a group are manually selected, auto-detect and display as group

---

## Technical Notes

### Existing Infrastructure
- `STORE_CATEGORY_GROUPS` in `categoryColors.ts` - maps categories to groups
- `GROUP_COLORS` in `categoryColors.ts` - color definitions for each group
- `IconFilterBar` - current filter component to extend
- `useHistoryFilters` hook - manages filter state

### New Requirements
- Add `categoryGroup` field to filter state (or use existing `category` field with array)
- Create helper to expand group to array of categories
- Create helper to check if selection matches a known group
- Add group translations to `categoryTranslations.ts`

### Group Display Names (Spanish)
| Group Key | Display Name | Emoji |
|-----------|-------------|-------|
| `food-dining` | Alimentación | 🍽️ |
| `health-wellness` | Salud y Bienestar | 💊 |
| `retail-general` | Tiendas General | 🛒 |
| `retail-specialty` | Tiendas Especializadas | 🎁 |
| `automotive` | Automotriz | ⛽ |
| `services` | Servicios | 🏢 |
| `hospitality` | Hospitalidad | 🏨 |
| `other` | Otros | 📦 |

---

## Tasks

### Task 1: Add Group Translations
- [x] Add group display names to `categoryTranslations.ts`
- [x] Add group emojis mapping
- [x] Support both English and Spanish

### Task 2: Extend Filter State
- [x] Add `categoryGroup` field to `HistoryFilterState` (or extend category handling)
- [x] Create `expandCategoryGroup()` helper to get all categories in a group
- [x] Create `detectCategoryGroup()` helper to check if selection matches a group

### Task 3: Update IconFilterBar Category Dropdown
- [x] Add "Grupos de Categorías" section header
- [x] Render group items with emoji, name, and count
- [x] Handle group selection/deselection
- [x] Add visual separator between groups and categories

### Task 4: Update Filter Chips
- [x] Show group name instead of individual categories when group is active
- [x] Use group emoji in chip

### Task 5: Testing
- [x] Unit tests for group expansion/detection helpers
- [x] Integration test for filter by group
- [x] Visual verification of dropdown styling

---

## Out of Scope
- Item-level category group filtering (deferred)
- Custom user-defined groups (handled by Story 14.15b)
- Group editing or reordering

---

## Definition of Done
- [x] All acceptance criteria verified
- [x] No TypeScript errors
- [x] Tested on light and dark mode
- [x] Tested on all three themes (normal, professional, mono)
- [x] Code reviewed
