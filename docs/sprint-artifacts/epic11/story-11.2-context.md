# Story 11.2 Context: Quick Save Card Component

## Quick Reference

| Field | Value |
|-------|-------|
| Story | [story-11.2-quick-save-card.md](./story-11.2-quick-save-card.md) |
| Epic | 11 - Quick Save & Scan Flow Optimization |
| Points | 5 |
| Status | Ready for Dev |
| Depends On | 11.1, 11.5 |

## Key Files to Create

- `src/components/scan/QuickSaveCard.tsx` - Main component
- `src/utils/confidenceCheck.ts` - Confidence calculation

## Key Files to Modify

- `src/views/ScanView.tsx` - Route to QuickSaveCard
- `src/App.tsx` - State management
- `src/utils/translations.ts` - UI strings

## Architecture Alignment

- Follow Epic 10 async side-effect pattern for insight generation
- Use existing `addTransaction` service
- Integrate with InsightCard after save

## Critical Implementation Notes

1. **Confidence threshold**: 85% (configurable)
2. **Confidence calculation**: Field completeness heuristics (merchant=20, total=25, date=15, category=15, items=25)
3. **Save flow**: `addTransaction()` → `generateInsightForTransaction()` → InsightCard
4. **Never block save** - insight generation is fire-and-forget

## Component Props

```typescript
interface QuickSaveCardProps {
  transaction: Transaction;
  confidence: number;
  onSave: () => Promise<void>;
  onEdit: () => void;
  onCancel: () => void;
  theme: string;
  t: (key: string) => string;
}
```

## Test Focus

- Renders with transaction data
- Guardar button calls onSave
- Edit navigates to EditView
- Low confidence routes to EditView (parent handles)
