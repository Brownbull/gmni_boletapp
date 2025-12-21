# Story 11.1 Context: One Image = One Transaction

## Quick Reference

| Field | Value |
|-------|-------|
| Story | [story-11.1-one-image-one-transaction.md](./story-11.1-one-image-one-transaction.md) |
| Epic | 11 - Quick Save & Scan Flow Optimization |
| Points | 5 |
| Status | Ready for Dev |
| Parallel | 11.5 (Scan Status Clarity) |

## Key Files to Modify

- `src/views/ScanView.tsx` - Main refactor target
- `src/utils/translations.ts` - Add new UI strings

## Architecture Alignment

- Follows existing ScanView patterns
- Backward compatible with existing multi-image transactions
- Foundation for Stories 11.2 and 11.5

## Critical Implementation Notes

1. Keep `imageUrls: string[]` in Transaction type for backward compat
2. Single image capture but array storage (single-element array)
3. Simplify state management in ScanView
4. Remove "Add another image" UI elements

## Test Focus

- Single image capture enforced
- Existing multi-image transactions still display
- Cancel flow returns to previous view

## Related Patterns from Codebase

- Look at existing camera permission handling in ScanView
- Follow existing error handling patterns
