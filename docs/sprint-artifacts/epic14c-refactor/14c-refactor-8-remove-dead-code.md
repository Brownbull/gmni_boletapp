# Story 14c-refactor.8: Remove Dead Code

Status: ready-for-dev

## Story

As a **developer**,
I want **dead code related to shared groups removed from the codebase**,
So that **the codebase is clean, maintainable, and doesn't contain unused utilities**.

## Acceptance Criteria

1. **Given** `memberUpdateDetection.ts` exists but is no longer used
   **When** this story is completed
   **Then:**
   - `src/utils/memberUpdateDetection.ts` is deleted
   - All imports are removed
   - No TypeScript errors

2. **Given** various shared group related code may be orphaned
   **When** this story is completed
   **Then:**
   - All unused imports related to shared groups are removed
   - Any orphaned type exports are cleaned up
   - Dead code in `App.tsx` related to shared groups is removed

3. **Given** old migration scripts or archived code may exist
   **When** this story is completed
   **Then:**
   - Old migration scripts are archived or deleted
   - Any `TODO: delete` comments are addressed
   - Code comments referencing deleted features are updated

4. **Given** the codebase after cleanup
   **When** a developer reads the code
   **Then:**
   - No confusing references to "shared groups" remain in active code
   - Comments are accurate and up-to-date
   - Build succeeds with no unused variable warnings

## Tasks / Subtasks

- [ ] Task 1: Delete memberUpdateDetection.ts (AC: #1)
  - [ ] Delete `src/utils/memberUpdateDetection.ts`
  - [ ] Remove imports from App.tsx
  - [ ] Remove any useRef storing MemberUpdatesMap

- [ ] Task 2: Clean up App.tsx (AC: #2)
  - [ ] Remove unused shared group imports
  - [ ] Remove commented-out shared group code
  - [ ] Remove any orphaned state variables
  - [ ] Update comments referencing shared groups

- [ ] Task 3: Clean up type files (AC: #2)
  - [ ] Review `src/types/sharedGroup.ts` - keep for now (types may be needed)
  - [ ] Review any unused type imports in other files
  - [ ] Remove orphaned re-exports

- [ ] Task 4: Search for orphaned imports (AC: #2)
  - [ ] Search for `from '.*sharedGroup'` patterns
  - [ ] Search for `from '.*SharedGroup'` patterns
  - [ ] Remove any imports that are no longer needed

- [ ] Task 5: Archive old migration scripts (AC: #3)
  - [ ] Check `scripts/` for old shared group migrations
  - [ ] Move to `scripts/_archive/` or delete
  - [ ] Update any references

- [ ] Task 6: Clean up TODO comments (AC: #3)
  - [ ] Search for `TODO.*delete` comments
  - [ ] Address each TODO or update comment
  - [ ] Search for `TODO.*shared` or `FIXME.*shared`

- [ ] Task 7: Final verification (AC: #4)
  - [ ] Run `npm run build`
  - [ ] Run `npm run lint` (fix unused variable warnings)
  - [ ] Search codebase for "sharedGroup" references
  - [ ] Ensure no confusing dead code remains

## Dev Notes

### Files to Delete

- `src/utils/memberUpdateDetection.ts` (~178 lines) - Cross-user sync detection

### Files to Review for Cleanup

- `src/App.tsx` - Main app file, may have orphaned imports/state
- `src/types/sharedGroup.ts` - Keep for now (types still used by stubs)
- `src/contexts/ViewModeContext.tsx` - May have shared group references
- `src/lib/queryKeys.ts` - May have shared group query keys

### Search Patterns

```bash
# Find all shared group references
grep -r "sharedGroup" src/ --include="*.ts" --include="*.tsx"
grep -r "SharedGroup" src/ --include="*.ts" --include="*.tsx"

# Find TODO comments
grep -r "TODO.*delete" src/ --include="*.ts" --include="*.tsx"
grep -r "TODO.*shared" src/ --include="*.ts" --include="*.tsx"

# Find unused imports (TypeScript will catch these)
npm run build
```

### Dead Code Identification

Code is "dead" if:
1. It's never imported/called
2. It's only used by other dead code
3. It references deleted files/functions

### Preservation List

Keep these even though they reference shared groups:
- `src/types/sharedGroup.ts` - Types still needed by stubs
- Stubbed services/hooks - They return empty but are still imported
- `ViewModeContext.tsx` - Still used (defaults to Personal mode)

### App.tsx Cleanup Checklist

Based on previous story work, App.tsx may have:
- [ ] Removed: `useNotificationDeltaFetch` import and call
- [ ] Removed: `detectMemberUpdates` useEffect block
- [ ] Removed: `MemberUpdatesMap` import
- [ ] Check for: Any remaining `sharedGroup*` state variables
- [ ] Check for: Commented-out shared group code

### Testing Standards

- Run `npm run build` - should have no errors
- Run `npm run lint` - should have no unused variable warnings
- Run `npm run test:quick` - all passing tests should still pass

### Dependencies

- **Depends on:** Stories 14c-refactor.5 (UI cleanup should be done first)
- **Blocks:** None (this is the final Part 1 story)

### References

- [Source: docs/sprint-artifacts/epic-14c-retro-2026-01-20.md] - Retrospective
- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md#Story-14c.8] - Story definition
- [Source: src/utils/memberUpdateDetection.ts] - Primary file to delete

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-21)

### Affected Workflows

- None directly - this is cleanup of already-disabled code

### Downstream Effects to Consider

- Deleting `memberUpdateDetection.ts` removes cross-user sync detection
- This is fine because shared groups feature is disabled
- No runtime impact (function was already not being called)

### Important Note

This story is the "cleanup sweep" after the feature is disabled. It should be straightforward since:
1. Services are stubbed (Story 14c-refactor.2)
2. Hooks are stubbed (Story 14c-refactor.3)
3. UI shows placeholders (Story 14c-refactor.5)

### Code Hygiene Benefits

- Reduces bundle size (deleted code not shipped)
- Reduces cognitive load (less code to understand)
- Reduces lint warnings (no unused variables)
- Cleaner git history (dead code removed in dedicated story)

### Workflow Chain Visualization

```
[SEARCH: Find all shared group references]
  ↓
[ANALYZE: Determine if code is dead]
  ↓
[DELETE: Remove dead code files]
  ↓
[CLEAN: Remove orphaned imports]
  ↓
[VERIFY: Build + lint passes]
```

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

(To be filled during implementation - files deleted/modified)
