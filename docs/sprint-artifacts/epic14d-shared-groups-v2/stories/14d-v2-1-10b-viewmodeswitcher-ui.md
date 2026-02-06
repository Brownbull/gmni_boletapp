# Story 14d-v2-1.10b: ViewModeSwitcher UI Implementation

Status: done

## Story

As a **user**,
I want **to see my groups in the view mode switcher**,
So that **I can select which group's transactions to view**.

## Context

This is the second of 4 sub-stories split from the original Story 14d-v2-1.10.

This story focuses on the UI changes to ViewModeSwitcher - removing the "Coming soon" placeholder and rendering actual groups.

## Acceptance Criteria

### Core Functionality

1. **Given** I open the view mode switcher
   **When** I have groups (from useUserSharedGroups)
   **Then** I see a list of my groups with:
   - Group icon (Users)
   - Group name
   - Member count badge
   - Checkmark on active group

2. **Given** I open the view mode switcher
   **When** I have no groups
   **Then** I see:
   - "Personal" option (always first)
   - "Create Group" call-to-action button
   - No "Coming soon" placeholder

3. **Given** I click on a group in the switcher
   **When** the selection is processed
   **Then** the switcher closes
   **And** the selected group shows a checkmark

4. **Given** accessibility requirements
   **When** the switcher is rendered
   **Then** all options have proper ARIA labels
   **And** keyboard navigation works (arrow keys, Enter, Escape)

## Dependencies

### Upstream (Required First)
- **Story 14d-v2-1.10a:** Store integration complete
- **Story 14d-v2-1.4:** Create Shared Group (groups can exist)
- **Story 14d-v2-1.6:** Accept/Decline Invitation (joined groups appear)

### Downstream (Depends on This)
- **Story 14d-v2-1.10c:** Header indicator (needs switcher to work)

## Tasks / Subtasks

- [x] Task 1: Remove "Coming soon" placeholder (AC: #2)
  - [x] Delete the `data-testid="view-mode-coming-soon"` section
  - [x] Remove associated styles/comments

- [x] Task 2: Implement group list rendering (AC: #1)
  - [x] Map `groups` prop to `ViewModeOption` components
  - [x] Show group icon (Users from lucide-react)
  - [x] Show group name (truncate if needed)
  - [x] Show member count: `${group.members.length} members`
  - [x] Show checkmark when `mode === 'group' && groupId === group.id`

- [x] Task 3: Implement empty state (AC: #2)
  - [x] Show "Create Group" button when `groups.length === 0`
  - [x] Button opens CreateGroupDialog via groupDialogsActions
  - [x] Translation key: `createGroup` (already exists)

- [x] Task 4: Implement selection behavior (AC: #3)
  - [x] onClick calls `handleSelectGroup(group)`
  - [x] After selection, call `onClose()`
  - [x] Checkmark appears on newly selected group

- [x] Task 5: Implement accessibility (AC: #4)
  - [x] Add `role="listbox"` to container
  - [x] Add `role="option"` to each option
  - [x] Add `aria-selected` to active option
  - [x] Implement keyboard navigation:
    - Arrow Up/Down: Move focus
    - Enter/Space: Select focused option
    - Escape: Close switcher

- [x] Task 6: Update tests (AC: #1-4)
  - [x] Test group list renders correctly
  - [x] Test empty state shows "Create Group"
  - [x] Test selection callback called with group data
  - [x] Test accessibility attributes present
  - [x] Test keyboard navigation

- [x] **Task 7: UI Standards Compliance** (Reference: [14d-v2-ui-conventions.md](../14d-v2-ui-conventions.md))
  - [x] All colors use CSS custom properties (15 instances)
    - Group option background: `var(--bg-muted)`
    - Group name: `var(--text-primary)`
    - Member count: `var(--text-tertiary)`
    - Active checkmark: `var(--primary)`
    - Create Group button: `var(--primary)`
  - [x] Translation keys already exist in `src/utils/translations.ts`:
    - `members` / `miembros`
    - `createGroup` / `Crear grupo`
  - [x] All interactive elements have data-testid attributes:
    - `view-mode-option-group-{groupId}`
    - `view-mode-create-group`
    - `view-mode-option-personal`
  - [x] Accessibility: role="listbox" on container, role="option" on items, aria-selected on active
  - [x] Keyboard nav: Arrow Up/Down, Enter/Space, Escape
  - [x] Icons from lucide-react only: `Users`, `Plus`, `Check`
  - [x] Follows existing ViewModeOption component pattern

### ECC Review Follow-ups (2026-02-04)

> **Review Score:** 9.1/10 | **Security:** ✅ PASS | **Architecture:** ✅ 100% compliant

**HIGH Priority (Must fix before merge):** ✅ ALL COMPLETE

- [x] [ECC-Review][HIGH][Code] **Stale refs cleanup** - Add useEffect to trim `optionRefs.current` when groups change
  - File: `ViewModeSwitcher.tsx:139-142`
  - Implemented: `useEffect(() => { optionRefs.current = optionRefs.current.slice(0, allOptions.length); }, [allOptions.length]);`

- [x] [ECC-Review][HIGH][Code] **aria-activedescendant** - Add screen reader focus tracking to listbox
  - File: `ViewModeSwitcher.tsx:261` + id props on all options
  - Implemented: `aria-activedescendant={focusedIndex >= 0 ? \`view-mode-option-${focusedIndex}\` : undefined}` and `id` on options

**MEDIUM Priority (Should fix):** ✅ ALL COMPLETE

- [x] [ECC-Review][MEDIUM][Code] Focus effect timing - Guard against refs not ready on re-open (lines 220-227)
- [x] [ECC-Review][MEDIUM][Code] Extract inline style objects to STYLES constants (lines 72-105)
- [x] [ECC-Review][MEDIUM][Test] Add test for group without ID edge case (lines 292-311)
- [x] [ECC-Review][MEDIUM][Test] Remove duplicate loading state test (removed from Loading State block)

**LOW Priority (Nice to have):** ✅ ALL COMPLETE

- [x] [ECC-Review][LOW][Code] Add JSDoc for ViewModeOption sub-component (lines 354-375)
- [x] [ECC-Review][LOW][Code] Define icon size constants (`ICON_SIZE = 24`, `CHECK_ICON_SIZE = 20`) (lines 62-67)
- [x] [ECC-Review][LOW][Test] Reduce test setup duplication with renderViewModeSwitcher helper (lines 117-137)

### Post-Action-Items Review (2026-02-04)

> **Code Review:** ✅ APPROVED | **Security:** ✅ APPROVED (Risk: LOW) | **Tests:** 40 passing

All 9 action items from the ECC review have been addressed. Post-fix review confirmed no new issues.

## Dev Notes

### UI Implementation

```tsx
// ViewModeSwitcher.tsx - Group list section
{/* Group options */}
{groups.map((group) => (
  <ViewModeOption
    key={group.id}
    testId={`view-mode-option-group-${group.id}`}
    isActive={mode === 'group' && groupId === group.id}
    icon={<Users size={24} />}
    name={group.name}
    description={`${group.members.length} ${t('members')}`}
    onClick={() => handleSelectGroup(group)}
  />
))}

{/* Empty state - Create Group CTA */}
{groups.length === 0 && (
  <button
    className="view-mode-create-group"
    onClick={() => navigateToSettings('groups')}
    data-testid="view-mode-create-group"
  >
    <Plus size={20} />
    {t('createGroup')}
  </button>
)}
```

### Translation Keys Required

```json
{
  "members": "miembros",
  "createGroup": "Crear grupo",
  "noGroupsYet": "Aún no tienes grupos"
}
```

### File Locations

| File | Purpose |
|------|---------|
| `src/components/SharedGroups/ViewModeSwitcher.tsx` | Main component (existing) |
| `src/components/SharedGroups/ViewModeOption.tsx` | Option subcomponent (existing) |
| `tests/unit/components/SharedGroups/ViewModeSwitcher.test.tsx` | Tests (existing) |

> **Architecture Note:** These files are in the legacy location (`src/components/SharedGroups/`). Per 14d-v2-ui-conventions.md, they should be in `src/features/shared-groups/components/`. This migration is tracked in tech debt story [TD-14d-2-fsd-component-location](./TD-14d-2-fsd-component-location.md). For now, continue modifying files in their current location until TD-14d-2 is complete.

### Estimate

~3 story points

## References

- [Story 14d-v2-1.10a: Store Integration](./14d-v2-1-10a-viewmode-store-integration.md)
- [Original Story 14d-v2-1.10](./14d-v2-1-10-view-mode-switcher.md)
- [ViewModeSwitcher Component](../../../../src/components/SharedGroups/ViewModeSwitcher.tsx)

---

## E2E Testing Instructions (Staging)

### Staging Environment Setup

**Prerequisites:**
1. Staging dev server running: `npm run dev:staging`
2. Test users exist in Firebase Auth:
   - `alice@boletapp.test` (has groups)
   - `diana@boletapp.test` (no groups - for empty state test)
3. Seed data populated: `npm run staging:seed`

**CRITICAL: Viewport Constraints**
```typescript
// All staging E2E tests MUST use mobile viewport (360x780)
test.use({
    storageState: { cookies: [], origins: [] },
    viewport: { width: 360, height: 780 },
});

const STAGING_URL = 'http://localhost:5174';
```

### E2E Test File Location

```
tests/e2e/staging/view-mode-switcher.spec.ts
```

### Staging E2E Scenarios

#### Group List Renders Correctly (AC: #1)
```typescript
test('user with groups sees group list in view mode switcher', async ({ page }) => {
    // 1. Login as Alice (has groups)
    await page.goto(STAGING_URL);
    await page.click('[data-testid="test-login-button"]');
    await page.click('[data-testid="test-user-alice"]');
    await page.waitForTimeout(3000);

    // 2. Click header mode indicator to open switcher
    await page.click('[data-testid="header-mode-indicator"]');
    await page.waitForTimeout(500);

    // 3. Verify Personal option is always first
    await expect(page.locator('[data-testid="view-mode-option-personal"]')).toBeVisible();

    // 4. Verify groups are listed with:
    //    - Group name
    //    - Member count badge
    const groupOption = page.locator('[data-testid^="view-mode-option-group-"]').first();
    await expect(groupOption).toBeVisible();
    await expect(groupOption).toContainText(/\d+ (members|miembros)/i);

    // 5. Screenshot for visual verification
    await page.screenshot({
        path: 'test-results/staging-viewmode-01-group-list.png',
        fullPage: true,
    });
});
```

#### Empty State Shows Create Group CTA (AC: #2)
```typescript
test('user with no groups sees Create Group button', async ({ page }) => {
    // 1. Login as Diana (no groups)
    await page.goto(STAGING_URL);
    await page.click('[data-testid="test-login-button"]');
    await page.click('[data-testid="test-user-diana"]');
    await page.waitForTimeout(3000);

    // 2. Open view mode switcher
    await page.click('[data-testid="header-mode-indicator"]');
    await page.waitForTimeout(500);

    // 3. Verify Create Group CTA is visible
    await expect(page.locator('[data-testid="view-mode-create-group"]')).toBeVisible();

    // 4. Click Create Group → navigates to Settings > Groups
    await page.click('[data-testid="view-mode-create-group"]');
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="grupos-view"]')).toBeVisible();
});
```

#### Selection Behavior (AC: #3)
```typescript
test('selecting a group closes switcher and shows checkmark', async ({ page }) => {
    // 1. Login as Alice
    // 2. Open view mode switcher
    // 3. Click on a group option
    const groupOption = page.locator('[data-testid^="view-mode-option-group-"]').first();
    await groupOption.click();

    // 4. Verify: Switcher closes
    await expect(page.locator('[data-testid="view-mode-switcher"]')).not.toBeVisible({ timeout: 2000 });

    // 5. Re-open switcher, verify checkmark on selected group
    await page.click('[data-testid="header-mode-indicator"]');
    await expect(groupOption.locator('[data-testid="view-mode-checkmark"]')).toBeVisible();
});
```

#### Keyboard Navigation (AC: #4)
```typescript
test('keyboard navigation works in view mode switcher', async ({ page }) => {
    // 1. Login as Alice
    // 2. Open view mode switcher
    await page.click('[data-testid="header-mode-indicator"]');

    // 3. Test Escape closes switcher
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="view-mode-switcher"]')).not.toBeVisible();

    // 4. Re-open and test Tab navigation
    await page.click('[data-testid="header-mode-indicator"]');
    await page.keyboard.press('Tab');
    // Verify focus moves to first option

    // 5. Test Enter to select
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="view-mode-switcher"]')).not.toBeVisible();
});
```

### Running Staging E2E Tests

```bash
# Run view mode switcher tests
npm run staging:test -- tests/e2e/staging/view-mode-switcher.spec.ts

# Run all staging E2E tests
npm run staging:test
```

### Test Data Testids Reference

| Element | data-testid |
|---------|-------------|
| Header mode indicator | `header-mode-indicator` |
| View mode switcher container | `view-mode-switcher` |
| Personal option | `view-mode-option-personal` |
| Group option | `view-mode-option-group-{groupId}` |
| Create group CTA | `view-mode-create-group` |
| Selection checkmark | `view-mode-checkmark` |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101) with ECC Orchestration

### Debug Log References

- ECC Planner: Implementation plan created with 6 phases, 17 steps
- ECC TDD Guide: 40 tests written following RED-GREEN-REFACTOR cycle
- ECC Code Reviewer: Score 8.5/10 - APPROVED with recommendations
- ECC Security Reviewer: Score 9/10 - No CRITICAL/HIGH issues

### Completion Notes List

1. Removed "Coming soon" placeholder section completely
2. Implemented group list rendering with member count display
3. Added "Create Group" button that opens CreateGroupDialog (not Settings navigation)
4. Implemented full keyboard navigation (Arrow Up/Down, Enter, Space, Escape)
5. Updated accessibility: role="listbox", role="option", aria-selected
6. All 40 tests passing with 94.73% statement coverage

### Review Recommendations (deferred to tech debt)

- HIGH: Consider ref-based event handler pattern for keyboard listener (~30 min)
- MEDIUM: Add focus trap for modal-like component (~1-2 hrs)
- MEDIUM: Clear optionRefs when groups change (~15 min)
- MEDIUM: Add runtime schema validation with Zod (store-level)

### File List

| File | Change Type |
|------|-------------|
| `src/features/shared-groups/components/ViewModeSwitcher.tsx` | Modified |
| `tests/unit/features/shared-groups/components/ViewModeSwitcher.test.tsx` | Modified |

---

## Senior Developer Review (ECC)

**Review Date:** 2026-02-04
**ECC Agents Used:** code-reviewer, security-reviewer, architect, tdd-guide (parallel execution)
**Review Type:** ECC Parallel Code Review (4 agents simultaneous)

### Scores

| Category | Score | Status |
|----------|-------|--------|
| Code Quality | 8/10 | ⚠️ Changes Requested |
| Security | 10/10 | ✅ Approved |
| Architecture | 10/10 | ✅ Approved |
| Testing | 8.5/10 | ✅ Approved |
| **Overall** | **9.1/10** | **⚠️ Changes Requested** |

### Key Findings

**Security:** No vulnerabilities. React JSX auto-escapes content. No hardcoded secrets.

**Architecture:** 100% compliant with FSD patterns. Files in correct locations. Zustand integration exemplary.

**Code Quality:** 2 HIGH issues identified:
1. Stale refs array not cleaned when groups change
2. Missing aria-activedescendant for screen reader focus tracking

**Testing:** ~85% coverage. All 4 ACs tested. Minor gaps in edge case coverage.

### Outcome

- **Action Items Added:** 9 (2 HIGH, 4 MEDIUM, 3 LOW)
- **Blocking Issues:** 2 HIGH priority items must be fixed before merge
- **Next Steps:** Address HIGH priority items, then proceed to Story 14d-v2-1-10c

---

## Senior Developer Review #2 (ECC)

**Review Date:** 2026-02-04
**ECC Agents Used:** code-reviewer, security-reviewer, architect, tdd-guide (parallel execution)
**Review Type:** ECC Parallel Code Review (4 agents simultaneous)
**Post-Action-Items:** All 9 items from Review #1 addressed

### Scores

| Category | Score | Status |
|----------|-------|--------|
| Code Quality | 8/10 | ✅ Approved |
| Security | 10/10 | ✅ Approved |
| Architecture | 10/10 | ✅ Approved |
| Testing | 9.5/10 | ✅ Approved |
| **Overall** | **9.4/10** | **✅ APPROVED** |

### Key Findings

**Security:** No vulnerabilities. Risk Level: LOW. XSS prevented via React JSX auto-escaping.

**Architecture:** 100% file location compliance. 92% pattern compliance. ALIGNED with FSD patterns.

**Code Quality:** 0 HIGH, 3 MEDIUM (performance optimizations), 5 LOW. All previous action items resolved.

**Testing:** 97.64% statement coverage, 100% line coverage. All 40 tests passing. All 4 ACs tested.

### Outcome

- **Recommendation:** ✅ APPROVED - Ready for merge
- **MEDIUM Items:** Deferred to tech debt stories (performance optimization)
- **Next Steps:** Story ready for merge, proceed to Story 14d-v2-1-10c

### Tech Debt Stories Created

| TD Story | Description | Priority |
|----------|-------------|----------|
| [TD-14d-22](./TD-14d-22-updategroupdata-validation.md) | updateGroupData validation enhancement | LOW |
| [TD-14d-26](./TD-14d-26-viewmodeswitcher-performance.md) | ViewModeSwitcher performance optimization (React.memo, stable handlers) | LOW |

> **Note:** TD-14d-24 (code quality) and TD-14d-25 (test quality) were created from Review #1 and are now COMPLETE.

