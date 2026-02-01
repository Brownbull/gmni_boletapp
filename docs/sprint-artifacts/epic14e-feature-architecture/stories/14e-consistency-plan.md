# Epic 14e Consistency Completion Plan

## Overview

**Created:** 2026-02-01
**Author:** Archie (React Opinionated Architect)
**Triggered by:** Post-epic consistency audit
**Goal:** Full Zustand consistency across all components that manage state
**Status:** REVISED AFTER ADVERSARIAL REVIEW

---

## Adversarial Review Summary (2026-02-01)

An adversarial review was conducted to challenge the original 14-point plan. The review examined actual code to determine if proposed changes were necessary or over-engineering.

### Original Plan: 14 points across 4 stories
### Revised Plan: 2 points, 1 story

| Story | Original | Verdict | Revised | Rationale |
|-------|----------|---------|---------|-----------|
| 14e-45: Mapping Store | 5 pts | **REJECTED** | 0 pts | Local useState is correct - components never open simultaneously |
| 14e-46: Toast/Notification | 5 pts | **REJECTED** | 0 pts | Contexts serve different purposes (not duplicates) |
| 14e-47: Navigation Cleanup | 2 pts | **APPROVED** | 2 pts | Actual duplication - store is superset of context |
| 14e-48: Animation Review | 2 pts | **REJECTED** | 0 pts | Animation state should be local - just document |

---

## Adversarial Findings Detail

### Story 14e-45: Mapping Store - REJECTED

**Evidence Against Migration:**
1. Components exist in accordion sections - only ONE can be expanded at a time
2. No cross-component coordination needed
3. Modal state (`deleteTarget`, `editTarget`) SHOULD be local - resets on unmount is correct behavior
4. Moving to Zustand would add complexity with zero benefit

**Conclusion:** Local useState is the CORRECT pattern here. This would be over-engineering.

---

### Story 14e-46: Toast/Notification - REJECTED

**Critical Finding - These Serve DIFFERENT Purposes:**

- `AppStateContext`: Transient UI state (toasts, operation flags like `wiping`, `exporting`)
- `NotificationContext`: **Persistent Firestore notifications** with CRUD operations

**Evidence:**
- Consumer count is only 2 each (underutilized, not overlapping)
- NotificationContext wraps Firestore subscription hook

**Conclusion:** They're NOT duplicates. No merge needed.

---

### Story 14e-47: Navigation Cleanup - APPROVED

**Evidence of Actual Duplication:**

`NavigationContext` provides:
- view, previousView, settingsSubview, setView, goBack

`useNavigationStore` provides:
- **ALL of the above** PLUS scrollPositions, historyFilters, analyticsState

**Smoking Gun:** Some files import BOTH contexts.

**Conclusion:** Store is a superset. Delete the context, migrate consumers.

---

### Story 14e-48: Animation Review - REJECTED

**Evidence Animation State Should Stay Local:**
- `isExiting` controls CSS animation class - only meaningful within component lifecycle
- `isPaused` is hover/touch timer state - component-specific
- Plan itself acknowledged this was likely appropriate

**Conclusion:** Don't allocate 2 points to document a non-change. Add note during 14e-45 story.

---

## Approved Stories

### Story 14e-45: NavigationContext Deletion (2 pts)

> Note: Renumbered from 14e-47 to 14e-45 since it's the only story proceeding.

**Problem:** `NavigationContext` and `useNavigationStore` are duplicates. The Zustand store is a superset.

**Solution:** Delete NavigationContext entirely, migrate all consumers to useNavigationStore.

**Consumers to Migrate:**
- App.tsx
- viewRenderers.tsx
- InsightsView.tsx
- BatchCaptureView.tsx
- ReportsView.tsx

**Files to modify:**
- Delete: `src/contexts/NavigationContext.tsx`
- Modify: All consumers listed above
- Verify: `useNavigationStore` exports compatible `useNavigation` hook

**Documentation Update (included in story):**
- Add "Local State Patterns" section to architecture-decision.md
- Document when useState is appropriate:
  - Animation state (isExiting, isPaused)
  - Modal gate state (deleteTarget, editTarget)
  - Isolated component forms

**Acceptance Criteria:**
- [ ] NavigationContext.tsx deleted
- [ ] All 5 consumers migrated to useNavigationStore
- [ ] No functionality regression
- [ ] Build and tests pass
- [ ] "Local State Patterns" documented in architecture-decision.md

---

## Stories NOT Proceeding

The following stories were rejected after adversarial review:

| Original ID | Name | Reason Rejected |
|-------------|------|-----------------|
| 14e-45 | Mapping Editor Store | Local useState is correct pattern |
| 14e-46 | Toast/Notification Store | Contexts serve different purposes |
| 14e-48 | Animation State Review | Animation state should be local |

These are documented here for future reference if questions arise about why they weren't implemented.

---

## Final Metrics

| Metric | Before | After |
|--------|--------|-------|
| Zustand Stores | 7 | 7 (unchanged) |
| Context Providers | 11 | 10 (-1 NavigationContext) |
| Story Points | 14 (proposed) | 2 (actual) |

---

## Lessons Learned

1. **Adversarial review saves time** - Challenging assumptions before implementation prevented 12 points of unnecessary work.

2. **Local state is often correct** - Not everything needs Zustand. Modal gate state and animation state are appropriately local when:
   - Components don't share state
   - Components aren't rendered simultaneously
   - State reset on unmount is correct behavior

3. **Similar names ≠ duplicate functionality** - AppStateContext and NotificationContext sound similar but serve completely different purposes.

---

## Next Steps

1. ~~Gabe to approve this plan~~ APPROVED (revised scope)
2. Create story file for 14e-45 (NavigationContext Deletion)
3. Implement story
4. Update sprint-status.yaml

---

**Plan Status:** APPROVED - REVISED SCOPE (2 pts)
