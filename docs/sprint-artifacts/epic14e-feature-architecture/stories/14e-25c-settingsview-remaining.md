# Story 14e.25c: SettingsView + Remaining Views Migration

Status: split

> **SPLIT 2026-01-27:** This story was split into two sub-stories during pre-dev review.
> - **14e-25c.1**: [SettingsView Migration](./14e-25c1-settingsview-migration.md) - 5 pts
> - **14e-25c.2**: [Remaining Views Migration](./14e-25c2-remaining-views-migration.md) - 2 pts
>
> **Reason:** SettingsView has 55+ props (not 15+ as originally estimated). The complexity
> warranted splitting to ensure independent shippability and accurate sizing.

**Epic:** 14e - Feature-Based Architecture (Follow-up)
**Points:** 3 → SPLIT (5 + 2 = 7 total)
**Created:** 2026-01-27
**Author:** Archie (React Opinionated Architect)
**Depends:** 14e-25b (TrendsView + DashboardView)
**Blocks:** 14e-25d

---

## Story

As a **developer**,
I want **SettingsView and all remaining views migrated to own their data**,
So that **every view follows the view-owned data pattern before final cleanup**.

---

## Context

### Parent Story

This is part 3 of 4 for Story 14e-25 "App.tsx Architectural Completion":

| Sub-Story | Focus | Points | Status |
|-----------|-------|--------|--------|
| 14e-25a | Navigation store + HistoryView | 5 | Prerequisite |
| 14e-25b | TrendsView + DashboardView | 5 | Prerequisite |
| **14e-25c** | SettingsView + remaining views | 3 | THIS STORY |
| 14e-25d | ViewHandlersContext deletion + cleanup | 3 | Blocked by 25c |

### Remaining Views

After 25a and 25b, these views still receive props from App.tsx:
- **SettingsView** - Most complex (15+ callback props)
- **TransactionEditorView** - Uses `useTransactionHandlers` heavily
- **ItemsView** - Similar pattern to HistoryView
- **InsightsView** - Insight state and handlers
- **ReportsView** - Report generation handlers
- **BatchCaptureView** - Minimal (mostly uses ScanStore already)

### Why Lower Points?

- Pattern is established by 25a/25b
- Remaining views are simpler or already partially migrated
- SettingsView is complex but well-understood

---

## Acceptance Criteria

### AC1: SettingsView Owns Its Data

**Given** SettingsView needs preferences and user data
**When** SettingsView renders
**Then:**
- [ ] SettingsView calls `useUserPreferences()` internally
- [ ] SettingsView calls `useUserCredits()` internally
- [ ] SettingsView uses `useSettingsStore()` for theme/font settings
- [ ] SettingsView uses `useNavigation()` for subview navigation
- [ ] SettingsView receives NO props from App.tsx

### AC2: TransactionEditorView Owns Its Data

**Given** TransactionEditorView needs transaction handlers
**When** TransactionEditorView renders
**Then:**
- [ ] TransactionEditorView calls `useTransactionHandlers()` internally
- [ ] TransactionEditorView accesses category/merchant mappings via hooks
- [ ] TransactionEditorView uses stores for scan/batch state
- [ ] TransactionEditorView receives minimal props (transaction to edit, mode)

### AC3: Remaining Views Migrated

**Given** ItemsView, InsightsView, ReportsView, BatchCaptureView
**When** these views render
**Then:**
- [ ] Each view calls its own data hooks
- [ ] Each view uses `useNavigation()` for navigation
- [ ] Each view receives NO props from App.tsx (or minimal config)

### AC4: App.tsx Reduced

**Given** all views migrated
**When** measuring App.tsx
**Then:**
- [ ] SettingsView props composition removed (~50 lines)
- [ ] TransactionEditorView props composition removed (~40 lines)
- [ ] Other view props removed (~40 lines)
- [ ] Net reduction: ~130-150 lines

### AC5: Tests Updated

**Given** the refactored code
**When** running tests
**Then:**
- [ ] All view tests mock internal hooks
- [ ] All existing tests pass
- [ ] Settings save/load works correctly
- [ ] Transaction editor save/delete works correctly

---

## Tasks / Subtasks

### Task 1: Migrate SettingsView (AC: 1, 4)

- [ ] **1.1** Create `src/views/SettingsView/useSettingsViewData.ts`
- [ ] **1.2** Move `useUserPreferences`, `useUserCredits` calls into hook
- [ ] **1.3** Access theme settings via `useSettingsStore()`
- [ ] **1.4** Update SettingsView to use composition hook
- [ ] **1.5** Remove props from App.tsx
- [ ] **1.6** Update SettingsView tests

### Task 2: Migrate TransactionEditorView (AC: 2, 4)

- [ ] **2.1** Create `src/views/TransactionEditorView/useTransactionEditorData.ts`
- [ ] **2.2** Move `useTransactionHandlers` call into view
- [ ] **2.3** Access mappings via category/merchant hooks
- [ ] **2.4** Keep minimal props interface for transaction/mode
- [ ] **2.5** Remove App.tsx prop composition
- [ ] **2.6** Update tests

### Task 3: Migrate ItemsView (AC: 3, 4)

- [ ] **3.1** Create `src/views/ItemsView/useItemsViewData.ts`
- [ ] **3.2** Move data hooks into view
- [ ] **3.3** Remove props from App.tsx
- [ ] **3.4** Update tests

### Task 4: Migrate InsightsView and ReportsView (AC: 3, 4)

- [ ] **4.1** Create composition hooks for InsightsView
- [ ] **4.2** Create composition hooks for ReportsView
- [ ] **4.3** Remove props from App.tsx
- [ ] **4.4** Update tests

### Task 5: Verify BatchCaptureView (AC: 3)

- [ ] **5.1** Audit BatchCaptureView - already uses ScanStore heavily
- [ ] **5.2** Remove any remaining App.tsx props if present
- [ ] **5.3** Ensure all scan state comes from Zustand store

---

## Dev Notes

### SettingsView Complexity

SettingsView has the most callbacks (~15):
- Theme setters: `setTheme`, `setColorTheme`, `setFontColorMode`, `setFontSize`
- Preference setters: `setDefaultCurrency`, `setDefaultCountry`, `setDefaultCity`
- Profile setters: `setDisplayName`, `setPhoneNumber`, `setBirthDate`
- Actions: `signOut`, `wipeDB`, `handleExportData`

Most of these are already available from:
- `useSettingsStore()` - Theme settings
- `useUserPreferences()` - Preference setters
- `useAuth()` - signOut
- `useTransactionHandlers()` - wipeDB, exportData

### TransactionEditorView Pattern

```typescript
// AFTER: TransactionEditorView.tsx
export function TransactionEditorView({
    transaction,  // The transaction to edit
    mode,         // 'new' | 'existing'
}: MinimalProps) {
    const { user, services } = useAuth();
    const { saveTransaction, deleteTransaction } = useTransactionHandlers({ user, services });
    const { mappings } = useCategoryMappings(user, services);
    const { navigateBack } = useNavigation();

    // ... component logic
}
```

### Estimated Line Reduction

| View | Lines Removed |
|------|---------------|
| SettingsView props | ~50 |
| TransactionEditorView props | ~40 |
| ItemsView props | ~20 |
| InsightsView props | ~15 |
| ReportsView props | ~10 |
| **Total** | **~135** |

After this story: App.tsx ~2,760 lines (from ~2,895)

---

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 5 | ≤4 | ACCEPTABLE |
| Subtasks | 22 | ≤15 | LARGE |
| Files Changed | ~12 | ≤8 | OVER |

**Note:** Touches many files but changes are mechanical (same pattern repeated).

---

## References

- [Parent: 14e-25 App.tsx Architectural Completion](./14e-25-app-tsx-architectural-completion.md)
- [Prerequisite: 14e-25b TrendsView + DashboardView](./14e-25b-trendsview-dashboardview.md)
