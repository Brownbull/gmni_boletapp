# Story 14c-refactor.32a: BatchReviewView Interface Rename

Status: done

> **Split from:** Story 14c-refactor.32 (atlas-story-sizing workflow, 2026-01-23)
> **Split strategy:** by_phase (interface -> hook -> integration)
> **Related stories:** 32b (hook expansion), 32c (integration verification)

## Story

As a **developer maintaining App.tsx**,
I want **BatchReviewViewProps interface property names aligned with useBatchReviewViewProps hook output**,
So that **the hook can be spread directly without manual prop mapping**.

## Background

### The Problem

BatchReviewView's props interface uses names that don't match the hook output, requiring manual mapping in App.tsx.

### Current State

Props interface may use different names than what useBatchReviewViewProps returns.

### Target State

Interface property names match hook output keys 1:1.

## Acceptance Criteria

1. **Given** BatchReviewViewProps interface exists
   **When** this story is completed
   **Then:**
   - All interface property names match useBatchReviewViewProps return object keys
   - No functionality changes - only naming alignment

2. **Given** the interface is renamed
   **When** TypeScript compiles
   **Then:**
   - All type errors are resolved within BatchReviewView.tsx
   - Component still receives same data (values unchanged, only names)

## Tasks / Subtasks

### Task 1: Audit and Rename BatchReviewViewProps Interface (AC: 1, 2)

- [x] 1.1 Open `src/views/BatchReviewView.tsx`
- [x] 1.2 Document all props in current interface
- [x] 1.3 Compare with `useBatchReviewViewProps` return type
- [x] 1.4 Rename interface properties to match hook output names → **NO RENAMING NEEDED - names already aligned**

## Dev Notes

### Estimation

- **Points:** 2 pts
- **Risk:** LOW - Interface rename only, no logic changes

### Dependencies

- **Requires:** Story 29 (hooks integrated) - DONE
- **Blocks:** Story 32b (hook expansion needs aligned interface)

### Pattern Reference

Following the same approach as:
- Story 30a (HistoryView interface rename)
- Story 31a (TrendsView interface rename)

### Testing Notes

- TypeScript compilation is the primary verification
- Existing tests should continue to pass
- No new tests needed for interface rename

## References

- [Split from: 14c-refactor-32-batchreviewview-props-alignment.md]
- [Source: src/views/BatchReviewView.tsx]
- [Source: src/hooks/app/useBatchReviewViewProps.ts]

## Dev Agent Record

### Implementation Date
2026-01-23

### Implementation Plan
1. Audit BatchReviewViewProps interface in BatchReviewView.tsx
2. Compare data prop names with useBatchReviewViewProps hook return type
3. Identify any naming mismatches requiring renaming

### Completion Notes

**Finding: No Renaming Required - Names Already Aligned**

The data props in `BatchReviewViewProps` interface already match `useBatchReviewViewProps` return object keys 1:1:

| Interface Prop | Hook Return Prop | Status |
|---------------|------------------|--------|
| `processingResults` | `processingResults` | ✅ Aligned |
| `imageDataUrls` | `imageDataUrls` | ✅ Aligned |
| `theme` | `theme` | ✅ Aligned |
| `currency` | `currency` | ✅ Aligned |
| `t` | `t` | ✅ Aligned |
| `processingState` | `processingState` | ✅ Aligned |
| `credits` | `credits` | ✅ Aligned |

**Handler Props (not in hook by design):**
- `onEditReceipt`, `onCancel`, `onSaveComplete`, `saveTransaction` - from App.tsx inline handlers
- `onBack`, `onCreditInfoClick` - @deprecated (Story 14c-refactor.27), now sourced from ViewHandlersContext

No code changes were needed. AC1 and AC2 are satisfied because the names already match.

### Debug Log
- Loaded BatchReviewView.tsx (611 lines)
- Loaded useBatchReviewViewProps.ts (196 lines)
- Compared BatchReviewViewProps interface (lines 57-96) with BatchReviewViewDataProps (lines 92-114)
- Verified App.tsx usage (lines 3533-3554) shows hook already being used correctly
- TypeScript compilation verified: `npx tsc --noEmit` passes cleanly

## File List

**Modified:**
- None - No code changes required (names already aligned)

> **Note:** Git shows `BatchReviewView.tsx` modified, but those changes are from Story 14c-refactor.27 (ViewHandlersContext migration), not this story. Interface renaming was not needed.
