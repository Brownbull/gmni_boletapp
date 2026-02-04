# Epic 14d-v2: Architecture Alignment Plan

**Date:** 2026-02-01
**Author:** Archie (React Opinionated Architect)
**Status:** ✅ CONFIRMED - All decisions finalized (2026-02-01)

---

## Decision Summary (Quick Reference)

| # | Decision | Choice | Location |
|---|----------|--------|----------|
| 1 | ViewMode State Management | **Option A: Zustand Store** | `shared/stores/useViewModeStore.ts` |
| 2 | Feature Directory Structure | **Option A: Feature Directory** | `src/features/shared-groups/` with staged migration |
| 3 | Story 14d-v2-1.10 Handling | **Option A: Split** | 4 sub-stories (1.10a, 1.10b, 1.10c, 1.10d) |
| 4 | Architecture Alignment Timing | **Option A: New Story** | Story 14d-v2-0 (~3 points) before Epic 1 |
| 5 | Legacy Cleanup Verification | **Option A: Verify First** | 30-min inventory before 14d-v2-1.1 |

---

## Executive Summary

Epic 14e completed major architectural changes that affect how Epic 14d-v2 should be implemented. This document identifies all decision points, evaluates options, and proposes a path forward.

**Key Tension:** Epic 14d-v2 stories were written BEFORE Epic 14e established the Zustand-unified architecture. Several stories now reference patterns that contradict the established architectural decisions.

---

## Table of Contents

1. [Decision Point 1: ViewMode State Management](#decision-point-1-viewmode-state-management)
2. [Decision Point 2: Feature Directory Structure](#decision-point-2-feature-directory-structure)
3. [Decision Point 3: Story Granularity](#decision-point-3-story-granularity)
4. [Decision Point 4: Context Migration Strategy](#decision-point-4-context-migration-strategy)
5. [Decision Point 5: Legacy Cleanup Scope](#decision-point-5-legacy-cleanup-scope)
6. [Story Updates Matrix](#story-updates-matrix)
7. [New Stories to Consider](#new-stories-to-consider)
8. [Implementation Sequence](#implementation-sequence)
9. [Risk Assessment](#risk-assessment)

---

## Decision Point 1: ViewMode State Management

> ✅ **CONFIRMED: Option A (Zustand Store)** - Create `useViewModeStore` in `shared/stores/useViewModeStore.ts`

### Context

Story 14d-v2-1.10 references "re-enabling ViewModeContext" but Epic 14e established ADR-018:
> "Use Zustand exclusively for client state management."

ViewMode is CLIENT STATE (not server state), so per ADR-018 it should use Zustand.

### Options

#### Option A: Create useViewModeStore (Zustand) - **RECOMMENDED**

**Approach:**
- Create new `src/shared/stores/useViewModeStore.ts`
- Delete `ViewModeContext.tsx` after migration
- Follow pattern established by `useNavigationStore`

**Pros:**
- Consistent with ADR-018 (Zustand-only for client state)
- DevTools integration for debugging
- Can access state outside React components (`getState()`)
- Follows established patterns from Epic 14e
- Simpler mental model: "Client state = Zustand"

**Cons:**
- Requires rewriting Story 14d-v2-1.10 acceptance criteria
- Need to update all `useViewMode()` consumers
- Additional migration work

**Effort:** ~4 hours for store + ~2 hours for consumer updates

---

#### Option B: Keep ViewModeContext (Pragmatic Exception)

**Approach:**
- Keep `ViewModeContext.tsx` as-is
- Un-stub the `setGroupMode` function
- Document as exception to ADR-018

**Pros:**
- Less work to update stories
- No consumer migration needed
- ViewModeContext already exists and works

**Cons:**
- Violates ADR-018 (inconsistent architecture)
- Cognitive overhead: "Why is ViewMode a Context but Navigation is Zustand?"
- No DevTools integration
- Cannot access outside React components
- Sets bad precedent for future features

**Effort:** ~1 hour to un-stub

---

#### Option C: Hybrid - Zustand Store with Context Wrapper

**Approach:**
- Create `useViewModeStore.ts` (Zustand)
- Update `ViewModeContext.tsx` to wrap the Zustand store
- Gradual migration - consumers can use either

**Pros:**
- No breaking changes to existing consumers
- Zustand benefits (DevTools, external access)
- Gradual migration path

**Cons:**
- Two APIs for same thing (confusing)
- Technical debt if wrapper never removed
- Extra abstraction layer

**Effort:** ~3 hours for hybrid + migration later

---

### Recommendation

**Option A (Zustand Store)** - Clean break, consistent architecture.

The migration effort is small (ViewModeContext has few consumers currently), and it's better to pay the cost now than maintain an exception.

---

## Decision Point 2: Feature Directory Structure

> ✅ **CONFIRMED: Option A (Feature Directory)** - Create `src/features/shared-groups/` with staged component migration

### Context

Epic 14e established feature-based directories:
```
src/features/
├── scan/
├── batch-review/
├── credit/
├── categories/
└── transaction-editor/
```

Should Epic 14d-v2 follow this pattern?

### Options

#### Option A: Create src/features/shared-groups/ - **RECOMMENDED**

**Structure:**
```
src/features/shared-groups/
├── index.ts                     # Public API
├── SharedGroupsFeature.tsx      # Feature orchestrator (Epic 2+)
├── store/
│   ├── useSharedGroupsStore.ts  # Membership, sync state
│   └── useViewModeStore.ts      # Could live here or in shared/stores
├── handlers/
│   ├── sync.ts                  # Changelog sync
│   ├── membership.ts            # Join/leave
│   └── changelog.ts             # Changelog queries
├── hooks/
│   ├── useUserSharedGroups.ts   # TanStack Query hook
│   └── useSyncStatus.ts         # Sync state hook
├── components/
│   ├── ViewModeSwitcher/        # Move from components/SharedGroups/
│   ├── SyncButton/
│   ├── GroupSelector/
│   └── MembershipManager/
└── types.ts
```

**Pros:**
- Consistent with Epic 14e architecture
- Clear ownership: "Where is shared groups code?" → `src/features/shared-groups/`
- Testability: Feature can be tested in isolation
- Future code-splitting potential

**Cons:**
- More work upfront to set up structure
- Need to move existing `src/components/SharedGroups/` components
- Some stories need path updates

**Effort:** ~2 hours for structure + component moves over multiple stories

---

#### Option B: Keep Components in src/components/SharedGroups/

**Approach:**
- Keep existing `src/components/SharedGroups/` location
- Add hooks/handlers elsewhere as needed
- No feature directory

**Pros:**
- Less upfront work
- No component moves needed
- Stories don't need path updates

**Cons:**
- Inconsistent with scan, batch-review features
- Scattered code: components in one place, hooks elsewhere, stores elsewhere
- Harder to reason about feature boundaries

**Effort:** ~0 hours upfront, but scattered architecture

---

#### Option C: Gradual Migration

**Approach:**
- Start with existing structure
- Create feature directory in later story (Epic 2 or 3)
- Move components as we touch them

**Pros:**
- Spreads effort across stories
- Can adjust structure as we learn
- No big upfront restructure

**Cons:**
- Temporary inconsistency
- Need to track what's where
- Risk of never completing migration

**Effort:** Distributed across stories

---

### Recommendation

**Option A (Feature Directory)** for new code, **Option C (Gradual)** for existing components.

Create the feature directory structure early, but don't force-move all existing components immediately. Move them as stories touch them.

---

## Decision Point 3: Story Granularity

> ✅ **CONFIRMED: Option A (Split)** - Split into 4 sub-stories aligned to workflow boundaries (1.10a, 1.10b, 1.10c, 1.10d)

### Context

Story 14d-v2-1.10 (View Mode Switcher) is large and now needs significant rework. Should we split it?

### Options

#### Option A: Split into Multiple Stories

**Proposed Split:**
1. **14d-v2-1.10a: Create useViewModeStore** (~2 points)
   - Create Zustand store
   - Add selectors
   - Add tests

2. **14d-v2-1.10b: Migrate ViewModeContext Consumers** (~2 points)
   - Update all `useViewMode()` calls
   - Delete ViewModeContext
   - Update AppProviders

3. **14d-v2-1.10c: ViewModeSwitcher UI Implementation** (~3 points)
   - Enable group list in switcher
   - Header indicator
   - Empty state

4. **14d-v2-1.10d: Data Filtering Integration** (~3 points)
   - useTransactions filtering
   - Analytics filtering
   - History filtering

**Pros:**
- Smaller, focused stories
- Easier to review
- Can parallelize some work
- Clear progress tracking

**Cons:**
- More story overhead
- Dependencies between sub-stories
- More planning/tracking

---

#### Option B: Keep as Single Story with Clear Tasks

**Approach:**
- Rewrite 14d-v2-1.10 with updated tasks
- Keep as single ~10 point story
- Clear task breakdown for sequencing

**Pros:**
- Less overhead
- All context in one place
- Simpler dependency tracking

**Cons:**
- Large story (10+ points)
- Harder to estimate accurately
- Single point of failure

---

### Recommendation

**Option A (Split)** if the story exceeds 8 points after rewrite.
**Option B (Single)** if it stays under 8 points.

Let's rewrite the story first, then decide based on final scope.

---

## Decision Point 4: Architecture Alignment Timing

> ✅ **CONFIRMED: Option A (New Story)** - Create story 14d-v2-0 (~3 points) before Epic 1 begins

### Context

Several Contexts remain that may need attention:
- `ViewModeContext` - Stubbed, needs activation (addressed above)
- `AnalyticsContext` - Active, uses server data
- `HistoryFiltersContext` - Active, uses client state
- `ThemeContext` - Active, uses client state + localStorage

### Options

#### Option A: Migrate All Client-State Contexts to Zustand - **NOT RECOMMENDED NOW**

Migrate ViewModeContext, HistoryFiltersContext, ThemeContext to Zustand.

**Pros:**
- Fully consistent architecture
- All client state in Zustand

**Cons:**
- Scope creep - not part of Epic 14d-v2
- HistoryFiltersContext and ThemeContext work fine
- Unnecessary risk

---

#### Option B: Migrate Only ViewModeContext - **RECOMMENDED**

Only migrate ViewModeContext as part of Epic 14d-v2.

**Pros:**
- Focused scope
- ViewModeContext is the one being activated
- Other contexts can be migrated later if needed

**Cons:**
- Partial consistency (acceptable)

---

#### Option C: Don't Migrate Anything

Keep ViewModeContext as Context.

**Pros:**
- Minimal change

**Cons:**
- Violates ADR-018
- See Decision Point 1

---

### Recommendation

**Option B** - Migrate only ViewModeContext. Other contexts are working and not part of this epic's scope.

---

## Decision Point 5: Legacy Cleanup Verification

> ✅ **CONFIRMED: Option A (Verify First)** - 30-minute inventory task before starting 14d-v2-1.1

### Context

Story 14d-v2-1.1 lists many files to delete, but some may already be cleaned by Epic 14c-refactor or 14e.

### Current State Analysis Needed

Before implementing 14d-v2-1.1, we need to verify which files actually exist:

| File/Directory | Listed in Story | Needs Verification |
|---------------|-----------------|-------------------|
| `src/hooks/useSharedGroupTransactions*.ts` | Delete | May already be gone |
| `src/services/sharedGroupTransactionService.ts` | Delete | Verify exists |
| `src/services/sharedGroupService.ts` | Review | May have useful CRUD |
| `src/lib/sharedGroupCache.ts` | Delete | Verify exists |
| `src/components/SharedGroups/` | Preserve shells | 30 files - need inventory |
| Cloud Functions | Undeploy | Verify deployed functions |
| `sharedGroupIds` in Transaction type | Remove | **CONFIRMED EXISTS** |

### Options

#### Option A: Verification Story First

Add a ~1 point story just to inventory what exists:
- List all shared group related files
- Document what's preserved vs deleted
- Update 14d-v2-1.1 tasks accordingly

**Pros:**
- No surprises during implementation
- Accurate task list
- Can be done quickly

**Cons:**
- Extra story overhead
- Delays starting "real" work

---

#### Option B: Verify During Implementation

Start 14d-v2-1.1 and verify as we go.

**Pros:**
- Faster start
- Less overhead

**Cons:**
- May find surprises
- Story scope may change mid-flight

---

### Recommendation

**Option A** - Quick verification task (can be done in <1 hour, doesn't need a full story).

Add a "Pre-Story Verification" task to 14d-v2-1.1 or do it as part of sprint planning.

---

## Story Updates Matrix

### Stories Requiring Updates

| Story | Change Type | Description | Priority |
|-------|-------------|-------------|----------|
| **14d-v2-1.1** | Minor | Verify file inventory, adjust paths | Medium |
| **14d-v2-1.2** | Minor | Verify Transaction type location | Low |
| **14d-v2-1.10** | **Major** | Rewrite for Zustand, consider split | **High** |
| **14d-v2-1.11** | Minor | Toggle state in Zustand | Medium |
| **14d-v2-1.12** | Minor | User preference state in Zustand | Medium |

### Stories NOT Requiring Updates

| Story | Reason |
|-------|--------|
| 14d-v2-1.3 (Changelog) | Firestore infrastructure, no state patterns |
| 14d-v2-1.4 (Create Group) | CRUD operations, no state conflicts |
| 14d-v2-1.5 (Invite) | Firebase operations |
| 14d-v2-1.6 (Accept/Decline) | Firebase operations |
| 14d-v2-1.7 (Leave/Manage) | Firebase operations |
| 14d-v2-1.8 (Cloud Function) | Server-side code |
| 14d-v2-1.9 (TTL/Offline) | Firebase config |
| 14d-v2-1.13 (Preferences Doc) | Firestore structure |
| 14d-v2-1.14 (Join Opt-in) | UI flow, uses whatever state we build |

---

## New Stories to Consider

### Option: Pre-Epic Architecture Alignment Story

**Story 14d-v2-0: Architecture Alignment** (3 points)

**Acceptance Criteria:**
1. Create `src/features/shared-groups/` directory structure
2. Create `useViewModeStore.ts` with basic structure (personal/group mode)
3. Migrate `useViewMode()` consumers to `useViewModeStore`
4. Delete `ViewModeContext.tsx`
5. Update `AppProviders.tsx`
6. All tests pass

**Pros:**
- Clean foundation before feature work
- All architecture decisions resolved upfront
- Stories can assume Zustand patterns

**Cons:**
- Adds ~3 points to epic
- Delays feature work

### Alternative: Merge into Story 14d-v2-1.1

Add architecture alignment tasks to the cleanup story:
- Task 0: Create feature directory structure
- Task 0.5: Create useViewModeStore shell

**Pros:**
- Less story overhead
- "Cleanup" includes architecture prep

**Cons:**
- Story becomes larger
- Mixed concerns (cleanup + new structure)

---

## Implementation Sequence

### Recommended Sequence

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 0: Architecture Alignment (Before Epic 1)            │
│  ─────────────────────────────────────────────────────────  │
│  • Decision review with Gabe (this document)                │
│  • Create feature directory structure                       │
│  • Create useViewModeStore.ts                               │
│  • Migrate ViewModeContext consumers                        │
│  • Delete ViewModeContext.tsx                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: Epic 1 Stories (Foundation)                       │
│  ─────────────────────────────────────────────────────────  │
│  1.1: Legacy Cleanup (verify & clean)                       │
│  1.2: Transaction Type Migration                            │
│  1.3: Changelog Infrastructure                              │
│  1.4: Create Shared Group                                   │
│       ↓ (1.4 enables 1.5-1.7)                               │
│  1.5: Invite Members                                        │
│  1.6: Accept/Decline Invitation                             │
│  1.7: Leave/Manage Group                                    │
│       ↓ (1.4-1.7 provide group CRUD)                        │
│  1.8: Cloud Function Changelog Writer                       │
│  1.9: Firestore TTL & Offline                               │
│       ↓ (infrastructure complete)                           │
│  1.10: View Mode Switcher (uses useViewModeStore)           │
│  1.11: Transaction Sharing Toggle (Group)                   │
│  1.12: User Transaction Sharing Preference                  │
│  1.13: User Group Preferences Document                      │
│  1.14: Join Flow Transaction Sharing Opt-In                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: Epic 2 Stories (Sync)                             │
│  ─────────────────────────────────────────────────────────  │
│  (Stories 2.1-2.12 as written - no major changes needed)    │
└─────────────────────────────────────────────────────────────┘
```

### Parallelization Opportunities

**Can run in parallel after 1.1 completes:**
- 1.2 (Transaction Type) ← Independent
- 1.3 (Changelog) ← Independent
- 1.4 (Create Group) ← Independent

**Sequential dependencies:**
- 1.5-1.7 require 1.4 (group CRUD needs groups to exist)
- 1.8 requires 1.2 + 1.3 (changelog writes need type + structure)
- 1.10-1.14 require 1.4-1.7 (UI needs group CRUD working)

---

## Risk Assessment

### High Risk Items

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| ViewModeStore migration breaks existing code | High | Low | Comprehensive tests, gradual migration |
| Legacy cleanup removes needed code | Medium | Medium | Verify inventory before deletion |
| Story 14d-v2-1.10 scope creep | Medium | High | Split into sub-stories if >8 points |

### Medium Risk Items

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Feature directory structure wrong | Medium | Low | Follow scan/batch-review patterns |
| Transaction type changes break existing code | Medium | Low | Add default value handling |
| Cloud Function already removed | Low | Medium | Verify before attempting undeploy |

### Low Risk Items

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Path references in stories outdated | Low | High | Update during implementation |
| Test file locations wrong | Low | Medium | Follow established test patterns |

---

## Decisions - All Confirmed ✅

> **All decisions confirmed by Gabe on 2026-02-01**

### 1. ViewMode State Management
- [x] **Option A:** Create useViewModeStore (Zustand) ✅ **SELECTED**
- [ ] ~~Option B: Keep ViewModeContext~~
- [ ] ~~Option C: Hybrid approach~~

### 2. Feature Directory Structure
- [x] **Option A:** Create src/features/shared-groups/ ✅ **SELECTED**
- [ ] ~~Option B: Keep components/SharedGroups/~~
- [ ] ~~Option C: Gradual migration~~ (staged migration incorporated into Option A)

### 3. Story 14d-v2-1.10 Handling
- [x] **Option A:** Split into 4 sub-stories ✅ **SELECTED**
  - 1.10a: Create useViewModeStore
  - 1.10b: Migrate ViewModeContext consumers
  - 1.10c: ViewModeSwitcher UI implementation
  - 1.10d: Data filtering integration
- [ ] ~~Option B: Keep as single story~~

### 4. Architecture Alignment Timing
- [x] **Option A:** Separate story 14d-v2-0 (~3 points) ✅ **SELECTED**
- [ ] ~~Option B: Merge into 14d-v2-1.1~~
- [ ] ~~Option C: Do during implementation~~

### 5. Legacy Cleanup Verification
- [x] **Option A:** 30-minute verification task before 14d-v2-1.1 ✅ **SELECTED**
- [ ] ~~Option B: Verify during implementation~~

---

## Next Steps - Implementation Plan

> **Status:** ✅ Story creation complete (2026-02-01)

### Completed Actions
1. ✅ Update this document with confirmed decisions
2. ✅ **Create story 14d-v2-0** (Architecture Alignment) - ~3 points
3. ✅ **Split story 14d-v2-1.10** into 4 sub-stories (1.10a-d)
4. ✅ Review stories 14d-v2-1.11 and 14d-v2-1.12 (no changes needed - Firestore state)

### Before Sprint Start
5. ✅ Run 30-minute verification inventory (Decision 5) - See [14d-v2-legacy-inventory.md](./14d-v2-legacy-inventory.md)
6. ✅ Update sprint-status.yaml with new story structure
7. ✅ Update epics.md with story changes

**All pre-sprint tasks complete - Epic 14d-v2 is ready for development!**

---

## Appendix: Files to Verify

### Shared Groups Components (src/components/SharedGroups/)

Need to inventory and categorize:
- Which exist?
- Which work standalone (keep)?
- Which depend on removed services (stub/delete)?

### Cloud Functions

Verify which are deployed:
```bash
firebase functions:list
```

Expected to find (may be stubbed/removed):
- `getSharedGroupTransactions`
- `memberUpdates`
- `sendSharedGroupNotification`

### Transaction Type Fields

Current (verified):
```typescript
sharedGroupIds?: string[];  // EXISTS - needs removal
deletedAt?: any;            // EXISTS - keep
_ownerId?: string;          // EXISTS - keep
```

Needed (from 14d-v2-1.2):
```typescript
sharedGroupId: string | null;  // ADD
deletedBy?: string | null;     // ADD
version?: number;              // ADD
periods?: TransactionPeriods;  // ADD
updatedAt - already exists, verify type
```

---

*Document created by Archie - React Opinionated Architect*
*Review with Gabe before proceeding with Epic 14d-v2*
