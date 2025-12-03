# Story 5.3: Subscription Tier Check Infrastructure

**Status:** done

---

## User Story

As a **developer**,
I want **a subscription check utility that can be easily updated when Epic 7 lands**,
So that **premium features can be properly gated without major refactoring later**.

---

## Acceptance Criteria

**AC #1: Subscription Tier Type Definition**
- **Given** the application needs to model subscription tiers
- **When** importing subscription types
- **Then** `SubscriptionTier` type is available: `'free' | 'basic' | 'pro' | 'max'`
- **And** type is exported from a central location for consistent usage

**AC #2: canAccessPremiumExport() Utility Function**
- **Given** a component needs to check premium export access
- **When** `canAccessPremiumExport()` is called
- **Then** it returns `true` for all users during testing phase (mock implementation)
- **And** function is pure (no side effects)
- **And** function signature is clear: `() => boolean`

**AC #3: useSubscriptionTier() React Hook**
- **Given** a React component needs subscription tier information
- **When** using `useSubscriptionTier()` hook
- **Then** it returns an object with `tier` and `canAccessPremiumExport`
- **And** `tier` returns current subscription tier ('max' during testing)
- **And** `canAccessPremiumExport` returns boolean (true during testing)
- **And** hook is stable and doesn't cause unnecessary re-renders

**AC #4: Single Point of Change Architecture**
- **Given** Epic 7 will introduce real subscription logic
- **When** subscription infrastructure is implemented
- **Then** all subscription logic is contained in one file (`src/hooks/useSubscriptionTier.ts`)
- **And** no other files need to check subscription directly (they use the hook)
- **And** updating for Epic 7 requires only changing implementation, not consumers

**AC #5: TODO Comments for Epic 7 Integration**
- **Given** the subscription module is created
- **When** reviewing the code
- **Then** clear TODO comments mark where Epic 7 integration will occur
- **And** comments specify: what to replace, expected Firestore path, data structure hints
- **And** example: `// TODO: Epic 7 - Replace with Firestore subscription lookup: users/{uid}/subscription`

**AC #6: Unit Tests for Subscription Utilities**
- **Given** the subscription infrastructure
- **When** running unit tests
- **Then** tests verify `canAccessPremiumExport()` returns `true` during testing
- **And** tests verify `useSubscriptionTier()` returns `{ tier: 'max', canAccessPremiumExport: true }`
- **And** tests document expected behavior for future Epic 7 implementation
- **And** all tests pass

---

## Implementation Details

### Tasks / Subtasks

- [x] **Task 1: Create subscription type definitions** (AC: #1)
  - [x] Create `src/hooks/useSubscriptionTier.ts` with `SubscriptionTier` type (per single-file architecture)
  - [x] Export type: `export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'max'`
  - [x] Add type for hook return value: `SubscriptionInfo`
  - [x] No index.ts exists; types exported directly from hook file as per AC #4

- [x] **Task 2: Create useSubscriptionTier hook** (AC: #2, #3, #4, #5)
  - [x] Create `src/hooks/useSubscriptionTier.ts`
  - [x] Implement mock `useSubscriptionTier()` hook returning `{ tier: 'max', canAccessPremiumExport: true }`
  - [x] Export helper function `canAccessPremiumExport()` for non-component usage
  - [x] Add TODO comments for Epic 7 integration points:
    - Where to fetch subscription from Firestore
    - Expected data structure
    - How to handle loading/error states
  - [x] Use `useMemo` to ensure stable return object reference

- [x] **Task 3: Write unit tests** (AC: #6)
  - [x] Create `tests/unit/subscription.test.ts`
  - [x] Test: `canAccessPremiumExport()` returns `true`
  - [x] Test: `useSubscriptionTier()` returns correct structure
  - [x] Test: Hook returns stable reference (doesn't cause re-renders)
  - [x] Add comments documenting expected Epic 7 behavior for future test updates

- [x] **Task 4: Verify integration with existing code** (AC: #4)
  - [x] Ensure hook follows existing hook patterns in `src/hooks/`
  - [x] Verify exports are consistent with other hooks (useAuth, useTransactions)
  - [x] Run full test suite to ensure no regressions (124 tests pass)

---

## Dev Notes

### Technical Approach

**Hook Implementation Pattern:**
```typescript
// src/hooks/useSubscriptionTier.ts
import { useMemo } from 'react'

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'max'

export interface SubscriptionInfo {
  tier: SubscriptionTier
  canAccessPremiumExport: boolean
  // TODO: Epic 7 - Add loading and error states when implementing real subscription check
  // loading: boolean
  // error: Error | null
}

/**
 * Check if current user can access premium export features.
 *
 * TODO: Epic 7 - Replace mock implementation with actual Firestore lookup:
 * - Path: users/{uid}/subscription or users/{uid} with subscription field
 * - Check: tier === 'pro' || tier === 'max'
 * - Handle: loading state, error state, no subscription (default to 'free')
 */
export function canAccessPremiumExport(): boolean {
  // TODO: Epic 7 - Replace with actual subscription check
  return true
}

/**
 * React hook for accessing subscription tier information.
 *
 * Usage:
 * ```typescript
 * const { tier, canAccessPremiumExport } = useSubscriptionTier()
 * if (!canAccessPremiumExport) {
 *   // Show upgrade prompt
 * }
 * ```
 *
 * TODO: Epic 7 - Implement real subscription fetching:
 * - Use useAuth() to get current user UID
 * - Fetch subscription document from Firestore
 * - Return loading/error states
 * - Cache subscription data to avoid repeated queries
 */
export function useSubscriptionTier(): SubscriptionInfo {
  // TODO: Epic 7 - Replace with actual Firestore subscription lookup
  return useMemo(() => ({
    tier: 'max' as SubscriptionTier,
    canAccessPremiumExport: true,
  }), [])
}
```

### Architecture Constraints

- **Single file:** All subscription logic in `src/hooks/useSubscriptionTier.ts`
- **No Firestore queries yet:** Pure mock implementation (Epic 7 will add real queries)
- **Type-safe:** Explicit types for subscription tiers
- **Stable hook:** Use `useMemo` to prevent unnecessary re-renders
- **Forward-compatible:** Structure hook return value to include future fields (loading, error)

### Project Structure Notes

**Files to create:**
- `src/hooks/useSubscriptionTier.ts` - Main hook and utility function
- `tests/unit/subscription.test.ts` - Unit tests

**Existing patterns to follow:**
- Follow `src/hooks/useAuth.ts` pattern for hook structure
- Follow `src/hooks/useTransactions.ts` for Firestore integration patterns (reference for Epic 7)

### References

- [Source: docs/epics.md#Story-5.3] - Story definition and acceptance criteria
- [Source: docs/prd.md#FR20-FR22] - Functional requirements for subscription gating
- [Source: docs/prd.md#Dependencies] - Epic 7 dependency notes and mock approach
- [Source: src/hooks/useAuth.ts] - Hook pattern reference
- [Source: src/hooks/useTransactions.ts] - Firestore hook pattern for Epic 7 reference

### Learnings from Previous Story

**From Story 5-2-basic-data-export-settings (Status: done)**

- **Component pattern:** Story 5.2 showed how state is managed in App.tsx and passed as props - subscription hook will be consumed similarly
- **Accessibility pattern:** Story 5.2 established aria-label patterns that Story 5.4/5.5 will use with subscription gating
- **Toast system available:** `toast.info()` and `toast.success()` patterns established for future upgrade prompts
- **Translation keys:** Pattern for adding EN/ES translations established (use for upgrade prompts in 5.5)
- **Test pattern:** Integration test structure from `tests/integration/settings-export.test.tsx` shows how to test hook consumers
- **No external dependencies:** Browser APIs only per ADR-010 (relevant for keeping subscription check lightweight)

**Key files from Story 5.2 that will consume this hook:**
- Future `src/views/AnalyticsView.tsx` updates (Story 5.4/5.5) will use `useSubscriptionTier()`
- The upgrade prompt modal (Story 5.5) will conditionally render based on `canAccessPremiumExport`

[Source: docs/sprint-artifacts/epic5/5-2-basic-data-export-settings.md#Dev-Agent-Record]

---

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epic5/5-3-subscription-tier-check-infrastructure.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Implementation plan: Single-file architecture with types, utility function, and React hook in one file
- Used useMemo for stable reference to prevent re-renders
- Added comprehensive TODO comments for Epic 7 integration with Firestore paths and expected data structures

### Completion Notes List

- All 4 tasks completed successfully with all subtasks checked
- 15 new unit tests created covering all acceptance criteria
- Full test suite passes (124 unit tests)
- TypeScript type checking passes with no errors
- Hook follows existing patterns from useAuth.ts and useTransactions.ts
- Single-file architecture maintained as per AC #4

### File List

**Files Created:**
- `src/hooks/useSubscriptionTier.ts` - Main hook, utility function, and type definitions
- `tests/unit/subscription.test.ts` - 15 unit tests for subscription utilities

**Files Modified:**
- `docs/sprint-artifacts/sprint-status.yaml` - Status updated to in-progress then review
- `docs/sprint-artifacts/epic5/5-3-subscription-tier-check-infrastructure.md` - Task checkboxes and completion notes

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2025-12-02 | 1.0 | Initial story draft created by SM workflow |
| 2025-12-03 | 1.1 | Implementation complete: hook, utility, types, 15 unit tests (Dev Agent) |
| 2025-12-03 | 1.2 | Senior Developer Review notes appended - APPROVED |

---

## Senior Developer Review (AI)

### Reviewer
Gabe (AI-assisted)

### Date
2025-12-03

### Review Outcome
**APPROVE** - All acceptance criteria fully implemented with evidence, all completed tasks verified, no HIGH or MEDIUM severity findings.

### Summary
Story 5.3 implements a clean, well-documented subscription tier checking infrastructure that serves as a mock for testing while being fully prepared for Epic 7 integration. The single-file architecture (`src/hooks/useSubscriptionTier.ts`) provides excellent maintainability and follows established project patterns.

### Key Findings

**No HIGH or MEDIUM severity issues found.**

**LOW Severity (Advisory Only):**
- Note: Tech-spec suggested separate `src/utils/subscription.ts` file, but consolidating into `src/hooks/useSubscriptionTier.ts` is actually better architecture per AC #4
- Note: Tech-spec suggested `isPro` and `isMax` helper booleans in hook return; not implemented but easily added if needed

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC #1 | Subscription Tier Type Definition | IMPLEMENTED | `src/hooks/useSubscriptionTier.ts:14` - type exported correctly |
| AC #2 | canAccessPremiumExport() Utility | IMPLEMENTED | `src/hooks/useSubscriptionTier.ts:44-48` - returns true, pure function |
| AC #3 | useSubscriptionTier() React Hook | IMPLEMENTED | `src/hooks/useSubscriptionTier.ts:91-101` - returns correct structure with useMemo |
| AC #4 | Single Point of Change Architecture | IMPLEMENTED | All logic in single 102-line file |
| AC #5 | TODO Comments for Epic 7 | IMPLEMENTED | Comprehensive TODOs at lines 11-13, 19-21, 36-40, 70-87, 92-93 |
| AC #6 | Unit Tests | IMPLEMENTED | `tests/unit/subscription.test.ts` - 15 tests, all pass |

**Summary: 6 of 6 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Create subscription type definitions | Complete | VERIFIED COMPLETE | File exists with correct types |
| Task 2: Create useSubscriptionTier hook | Complete | VERIFIED COMPLETE | Hook implemented with useMemo, TODO comments |
| Task 3: Write unit tests | Complete | VERIFIED COMPLETE | 15 tests in subscription.test.ts |
| Task 4: Verify integration with existing code | Complete | VERIFIED COMPLETE | Patterns consistent, 124 tests pass |

**Summary: 4 of 4 completed tasks verified, 0 questionable, 0 falsely marked complete**

### Test Coverage and Gaps

- **Unit Tests:** 15 subscription-specific tests covering all ACs
- **Full Suite:** 124 unit tests pass
- **TypeScript:** Type checking passes with no errors
- **Pattern Coverage:** Tests verify type safety, function purity, hook stability

**No test gaps identified for this story's scope.**

### Architectural Alignment

- **ADR-011 Compliance:** Mock strategy aligns with tech-spec ADR-011
- **Hook Patterns:** Follows useAuth.ts and useTransactions.ts patterns
- **Single-File Architecture:** Exceeds tech-spec recommendation (consolidated vs. split files)
- **Epic 7 Ready:** Comprehensive TODO comments with Firestore paths and data structures

### Security Notes

- No security concerns for mock implementation
- No sensitive data exposure
- Pure functions with no external inputs
- Epic 7 will need Firestore security rules review

### Best-Practices and References

- **React Hooks:** useMemo for stable object reference - [React docs](https://react.dev/reference/react/useMemo)
- **TypeScript:** Union types for subscription tiers - type-safe patterns
- **Testing:** @testing-library/react renderHook for hook testing

### Action Items

**Code Changes Required:**
(none)

**Advisory Notes:**
- Note: Consider adding `isPro: boolean` and `isMax: boolean` helpers to hook return for convenience in Story 5.4/5.5
- Note: Epic 7 should add loading/error states as documented in TODO comments
- Note: Update CONTRIBUTING.md when Epic 7 implements real subscription logic
