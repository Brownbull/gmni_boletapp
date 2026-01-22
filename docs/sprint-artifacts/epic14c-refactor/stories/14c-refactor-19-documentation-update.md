# Story 14c-refactor.19: Documentation Update

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **architecture documentation updated to reflect the refactored codebase**,
So that **future development has accurate reference material, new developers can onboard efficiently, and Epic 14d has a clean foundation**.

## Acceptance Criteria

### Core Documentation Updates

1. **Given** significant architecture changes were made in Epic 14c-refactor
   **When** this story is completed
   **Then:**
   - `docs/architecture/architecture.md` is updated with:
     - New App.tsx structure diagram showing component composition
     - Context provider hierarchy (AppProviders composition)
     - Reference to extracted hooks in `src/hooks/app/`
   - All architecture diagrams reflect current state

2. **Given** context providers were extracted in Story 14c-refactor.9
   **When** this story is completed
   **Then:**
   - Create or update section in `docs/architecture/architecture.md` documenting:
     - `AuthContext` - responsibilities and usage
     - `NavigationContext` - responsibilities and usage
     - `ThemeContext` - responsibilities and usage
     - `NotificationContext` - responsibilities and usage
     - `AppStateContext` - responsibilities and usage
     - `ScanContext` (PRESERVED from Epic 14d-old) - reference existing docs
   - Provider composition order documented with rationale

3. **Given** caching was simplified to React Query only
   **When** this story is completed
   **Then:**
   - Update `docs/architecture/react-query-caching.md`:
     - Remove references to IndexedDB caching for transactions
     - Remove references to localStorage transaction caching
     - Document simplified caching architecture
     - Update Firestore offline persistence section
   - Query configuration documented (staleTime, cacheTime)

### Summary Document

4. **Given** this epic made multiple architectural changes
   **When** this story is completed
   **Then:**
   - Create `docs/architecture/epic-14c-refactor-summary.md` containing:
     - Executive summary of changes
     - What was removed (shared groups backend, IndexedDB cache, etc.)
     - What was refactored (App.tsx, contexts, hooks)
     - New file structure with directory tree
     - Key decisions made and rationale
     - Lessons learned (link to retrospective)
     - Migration notes for any breaking changes

5. **Given** the README.md may reference outdated architecture
   **When** reviewing documentation
   **Then:**
   - Review and update `README.md` if it references:
     - Old App.tsx structure
     - Shared groups features (update to "Coming Soon")
     - Outdated context providers
   - Keep README changes minimal (point to architecture docs for details)

### Archive Old Documentation

6. **Given** shared groups documentation is now obsolete
   **When** this story is completed
   **Then:**
   - Move to `docs/archive/epic-14c-shared-groups/`:
     - `docs/architecture/shared-groups-architecture.md`
     - `docs/architecture/real-time-sync-patterns.md`
     - `docs/architecture/shared-group-sync-v2.md`
   - Add header note to archived files: "Archived [date] - Epic 14c reverted. See Epic 14d for replacement."
   - Remove from any documentation indexes

### Brainstorming Document

7. **Given** a brainstorming session was held on 2026-01-21
   **When** this story is completed
   **Then:**
   - Verify `docs/analysis/brainstorming-session-2026-01-21.md` is complete
   - Link brainstorming document from epic summary
   - Extract key decisions into epic summary document

### Source Tree Analysis

8. **Given** source tree structure changed significantly
   **When** this story is completed
   **Then:**
   - Update `docs/architecture/source-tree-analysis.md` with:
     - New `src/contexts/` directory structure
     - New `src/hooks/app/` directory structure
     - New `src/components/App/` directory structure
     - Updated line counts for App.tsx (target: ~300 lines or document actual)

### Cross-Reference Verification

9. **Given** multiple documents may reference each other
   **When** this story is completed
   **Then:**
   - Verify all internal documentation links are valid
   - Update any broken links to point to new locations
   - Remove links to deleted/archived documents or update to archive path

## Tasks / Subtasks

### Task 1: Update Main Architecture Document (AC: #1, #2)

- [ ] 1.1 Read current `docs/architecture/architecture.md`
- [ ] 1.2 Add section "## App Component Architecture"
  - [ ] 1.2.1 Add App.tsx structure diagram (text-based)
  - [ ] 1.2.2 Document component composition pattern
- [ ] 1.3 Add section "## Context Provider Hierarchy"
  - [ ] 1.3.1 Document each context purpose and responsibilities
  - [ ] 1.3.2 Show provider composition order with code example
  - [ ] 1.3.3 Document view-scoped vs app-scoped providers decision
- [ ] 1.4 Reference `src/hooks/app/` directory for app-level hooks

### Task 2: Update Caching Documentation (AC: #3)

- [ ] 2.1 Read current `docs/architecture/react-query-caching.md`
- [ ] 2.2 Remove or update IndexedDB caching references
- [ ] 2.3 Remove or update localStorage caching references
- [ ] 2.4 Document simplified architecture:
  - [ ] React Query as single cache layer
  - [ ] Firestore offline persistence for offline support
  - [ ] Query configuration (staleTime: 5min, gcTime: 30min)
- [ ] 2.5 Add "Simplified Caching (Epic 14c-refactor)" section header

### Task 3: Create Epic Summary Document (AC: #4)

- [ ] 3.1 Create `docs/architecture/epic-14c-refactor-summary.md`
- [ ] 3.2 Write executive summary (2-3 paragraphs)
- [ ] 3.3 Document what was removed:
  - [ ] Cloud Functions (getSharedGroupTransactions, sendSharedGroupNotification)
  - [ ] Services (sharedGroupTransactionService, sharedGroupCache)
  - [ ] Hooks (useSharedGroupTransactions)
  - [ ] IndexedDB cache layer
  - [ ] View mode persistence layers
- [ ] 3.4 Document what was refactored:
  - [ ] App.tsx decomposition (contexts, hooks, components)
  - [ ] Provider composition
  - [ ] Security rules simplification
- [ ] 3.5 Add new file structure directory tree
- [ ] 3.6 Document key decisions:
  - [ ] Shell & Stub approach for UI
  - [ ] React Query only caching
  - [ ] View-scoped vs app-scoped providers
- [ ] 3.7 Add lessons learned with link to retrospective
- [ ] 3.8 Add migration notes (none expected - internal refactor)

### Task 4: Update README (AC: #5)

- [ ] 4.1 Read current `README.md`
- [ ] 4.2 Check for outdated architecture references
- [ ] 4.3 Update shared groups references to "Coming Soon"
- [ ] 4.4 Ensure links to architecture docs are current
- [ ] 4.5 Keep changes minimal (detailed docs live in docs/)

### Task 5: Archive Shared Groups Documentation (AC: #6)

- [ ] 5.1 Create `docs/archive/epic-14c-shared-groups/` directory
- [ ] 5.2 Move `docs/architecture/shared-groups-architecture.md`
- [ ] 5.3 Move `docs/architecture/real-time-sync-patterns.md`
- [ ] 5.4 Move `docs/architecture/shared-group-sync-v2.md`
- [ ] 5.5 Add archive header note to each moved file:
  ```markdown
  > **ARCHIVED:** 2026-01-XX - Epic 14c (Shared Groups) was reverted.
  > This document is preserved for historical reference.
  > See Epic 14d-refactor for the cleanup, and Epic 14d (future) for replacement implementation.
  ```
- [ ] 5.6 Update any documentation indexes that reference these files

### Task 6: Verify Brainstorming Document (AC: #7)

- [ ] 6.1 Read `docs/analysis/brainstorming-session-2026-01-21.md`
- [ ] 6.2 Verify document is complete with all sections
- [ ] 6.3 Link from epic summary document
- [ ] 6.4 Extract any missing key decisions into summary

### Task 7: Update Source Tree Analysis (AC: #8)

- [ ] 7.1 Read current `docs/architecture/source-tree-analysis.md`
- [ ] 7.2 Add or update `src/contexts/` directory section:
  - [ ] List all context files with purposes
- [ ] 7.3 Add or update `src/hooks/app/` directory section:
  - [ ] List all app-level hooks with purposes
- [ ] 7.4 Add or update `src/components/App/` directory section:
  - [ ] List all App components with purposes
- [ ] 7.5 Update App.tsx line count (check actual with `wc -l`)
- [ ] 7.6 Note any components marked "Coming Soon"

### Task 8: Cross-Reference Verification (AC: #9)

- [ ] 8.1 Search for broken links in `docs/architecture/`:
  ```bash
  grep -r "](../" docs/architecture/ | grep -v archive
  ```
- [ ] 8.2 Verify each internal link resolves
- [ ] 8.3 Update links to archived files
- [ ] 8.4 Check Atlas memory references are still valid
- [ ] 8.5 Verify tech-context document links

### Task 9: Final Review

- [ ] 9.1 Read through all updated documents
- [ ] 9.2 Check for consistency in terminology
- [ ] 9.3 Verify dates are accurate
- [ ] 9.4 Spell check documentation
- [ ] 9.5 Run `npm run typecheck` to ensure no code issues
- [ ] 9.6 Update completion notes

## Dev Notes

### Documentation Files Inventory

**Files to UPDATE:**

| File | Updates Needed |
|------|----------------|
| `docs/architecture/architecture.md` | App structure, context hierarchy |
| `docs/architecture/react-query-caching.md` | Remove IndexedDB/localStorage refs |
| `docs/architecture/source-tree-analysis.md` | New directory structure |
| `README.md` | Shared groups → "Coming Soon" |

**Files to CREATE:**

| File | Content |
|------|---------|
| `docs/architecture/epic-14c-refactor-summary.md` | Epic summary, decisions, lessons |

**Files to ARCHIVE:**

| Current Location | Archive Location |
|------------------|------------------|
| `docs/architecture/shared-groups-architecture.md` | `docs/archive/epic-14c-shared-groups/` |
| `docs/architecture/real-time-sync-patterns.md` | `docs/archive/epic-14c-shared-groups/` |
| `docs/architecture/shared-group-sync-v2.md` | `docs/archive/epic-14c-shared-groups/` |

### New File Structure Reference

From completed stories (14c-refactor.9-11), the new structure is:

```
src/
├── contexts/
│   ├── AuthContext.tsx           # (14c-refactor.9)
│   ├── NavigationContext.tsx     # (14c-refactor.9)
│   ├── ThemeContext.tsx          # (14c-refactor.9)
│   ├── NotificationContext.tsx   # (14c-refactor.9)
│   ├── AppStateContext.tsx       # (14c-refactor.9)
│   ├── ScanContext.tsx           # (PRESERVED - Epic 14d-old)
│   └── ViewModeContext.tsx       # (Existing)
├── hooks/
│   └── app/
│       ├── useAppInitialization.ts   # (14c-refactor.10)
│       ├── useDeepLinking.ts         # (14c-refactor.10)
│       ├── useAppPushNotifications.ts # (14c-refactor.10)
│       ├── useOnlineStatus.ts        # (14c-refactor.10)
│       └── useAppLifecycle.ts        # (14c-refactor.10)
├── components/
│   └── App/
│       ├── AppProviders.tsx      # (14c-refactor.11)
│       ├── AppRoutes.tsx         # (14c-refactor.11)
│       ├── AppLayout.tsx         # (14c-refactor.11)
│       ├── AppErrorBoundary.tsx  # (14c-refactor.11)
│       ├── AppMainContent.tsx    # (14c-refactor.11)
│       └── types.ts              # (14c-refactor.11)
└── App.tsx                       # Composition root (~300 lines target)
```

### Provider Composition Order

Document this order with rationale:

```tsx
<QueryClientProvider>      {/* React Query - outermost for all data */}
  <AuthProvider>           {/* Auth state - needed by most providers */}
    <ThemeProvider>        {/* Theme - visual, doesn't need auth */}
      <ScanProvider>       {/* Scan state - needs auth for user.uid */}
        <NavigationProvider>  {/* Navigation - independent */}
          <AppStateProvider>  {/* App lifecycle - innermost */}
            <NotificationProvider> {/* Notifications */}
              {children}
            </NotificationProvider>
          </AppStateProvider>
        </NavigationProvider>
      </ScanProvider>
    </ThemeProvider>
  </AuthProvider>
</QueryClientProvider>
```

### Key Decisions to Document

1. **Shell & Stub Approach:** Keep UI components as disabled placeholders with "Coming Soon" tooltips
2. **React Query Only:** Removed IndexedDB and localStorage caching for transactions
3. **Provider Scoping:** AnalyticsProvider and HistoryFiltersProvider are view-scoped (prevent re-renders)
4. **ScanContext Preserved:** Epic 14d-old scan refactor was kept intact

### References

- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md#Story-14c.19] - Story definition
- [Source: docs/sprint-artifacts/epic14c-refactor/tech-context-epic14c-refactor.md] - Technical context
- [Source: docs/sprint-artifacts/epic-14c-retro-2026-01-20.md] - Retrospective with lessons learned
- [Source: docs/analysis/brainstorming-session-2026-01-21.md] - Brainstorming decisions
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/02-features.md] - Atlas feature inventory

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis (2026-01-21)

### Affected Workflows

- **No workflow impacts detected** - This is a documentation-only story that does not modify code

### Downstream Effects to Consider

- Future developers will use these documents for onboarding
- Epic 14d (Shared Groups v2) will reference these documents for baseline understanding
- Architecture decisions documented here will guide future implementation choices

### Testing Implications

- **Existing tests to verify:** None (documentation only)
- **New scenarios to add:** None (documentation only)
- **Validation:** Review all updated documents for accuracy and completeness

### Workflow Chain Visualization

```
[Epic 14c-refactor Stories] → Code Changes Complete → [THIS STORY: Document changes]
                                                               ↓
                                                    [Epic 14d Planning] ← References docs
                                                               ↓
                                                    [New Developer Onboarding] ← Uses docs
```

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**To Update:**
- `docs/architecture/architecture.md`
- `docs/architecture/react-query-caching.md`
- `docs/architecture/source-tree-analysis.md`
- `README.md`

**To Create:**
- `docs/architecture/epic-14c-refactor-summary.md`
- `docs/archive/epic-14c-shared-groups/` (directory)

**To Move:**
- `docs/architecture/shared-groups-architecture.md` → `docs/archive/epic-14c-shared-groups/`
- `docs/architecture/real-time-sync-patterns.md` → `docs/archive/epic-14c-shared-groups/`
- `docs/architecture/shared-group-sync-v2.md` → `docs/archive/epic-14c-shared-groups/`
