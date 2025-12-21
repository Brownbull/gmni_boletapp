# Story 11.5 Context: Scan Status Clarity

## Quick Reference

| Field | Value |
|-------|-------|
| Story | [story-11.5-scan-status-clarity.md](./story-11.5-scan-status-clarity.md) |
| Epic | 11 - Quick Save & Scan Flow Optimization |
| Points | 3 |
| Status | Ready for Dev |
| Parallel | 11.1 (One Image One Transaction) |

## Key Files to Create

- `src/components/scan/ScanStatusIndicator.tsx` - Main status component
- `src/hooks/useScanState.ts` - State machine hook

## Key Files to Modify

- `src/views/ScanView.tsx` - Replace spinner with ScanStatusIndicator
- `src/services/gemini.ts` - Add progress callback for upload
- `src/utils/translations.ts` - Status strings

## Architecture Alignment

- State machine pattern for scan states
- Progressive feedback (uploading → processing → ready)
- Error recovery with retry

## State Machine

```typescript
type ScanStatus = 'idle' | 'capturing' | 'uploading' | 'processing' | 'ready' | 'error';

// Transitions:
// idle → capturing → uploading → processing → ready → [QuickSaveCard]
// Any state → error → [Retry] → uploading
```

## Critical Implementation Notes

1. **Upload state**: Show progress bar with percentage
2. **Processing state**: Skeleton loader with shimmer
3. **Ready state**: Brief checkmark (500ms) before transition
4. **Error state**: Clear message + Retry/Cancel buttons
5. **ARIA labels**: All states must be accessible

## Skeleton CSS

```css
.skeleton-shimmer {
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

## Test Focus

- All 5 states render correctly
- Progress bar shows real percentage
- Error state with retry works
- Cancel works at each state
- Screen reader announces state changes
