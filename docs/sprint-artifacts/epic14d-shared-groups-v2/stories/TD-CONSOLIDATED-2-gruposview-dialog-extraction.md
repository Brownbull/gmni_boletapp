# TD-CONSOLIDATED-2: GruposView Dialog Extraction

Status: ready-for-dev

> **Tier:** 1 - Code Bloat Prevention (MUST DO)
> **Consolidated from:** TD-14d-3
> **Priority:** HIGH
> **Estimated Effort:** 2-3 hours
> **Risk:** LOW (straightforward extraction, no logic changes)
> **Dependencies:** TD-CONSOLIDATED-1

## Story

As a **developer**,
I want **the dialog rendering in GruposView.tsx extracted to GruposViewDialogs.tsx**,
So that **GruposView.tsx stays under the 400-line guideline and is easier to maintain**.

## Problem Statement

`GruposView.tsx` is currently ~921 lines, exceeding the 400-line guideline. Lines 654-782 contain dialog rendering JSX for 6+ dialogs that can be cleanly extracted.

## Acceptance Criteria

- [ ] Extract dialog rendering to `GruposViewDialogs.tsx`
- [ ] GruposView.tsx reduced to under 400 lines
- [ ] All existing tests pass
- [ ] No visual or behavioral changes

## Cross-References

- **Original story:** [TD-14d-3](TD-ARCHIVED/TD-14d-3-gruposview-dialog-extraction.md)
- **Blocked by:** TD-CONSOLIDATED-1 (groupService modularization)
- **Source:** ECC Code Review #4 (2026-02-03) on story 14d-v2-1-7e
