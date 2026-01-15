# Story 14c.8: Auto-Tag on Scan

Status: ready-for-dev

## Story

As a user scanning receipts while in group view mode,
I want new transactions to be automatically tagged to the active group,
so that I don't have to manually tag each scanned receipt.

## Acceptance Criteria

1. **AC1: Auto-Tag When in Group View Mode**
   - Given I am in a shared group view mode
   - When I scan a new receipt
   - Then the resulting transaction is automatically pre-tagged to the active group
   - And `sharedGroupIds` includes the active group's ID

2. **AC2: User Can Remove Tag Before Saving**
   - Given a scanned transaction is pre-tagged to the active group
   - When I view/edit the transaction before saving
   - Then I can remove the group tag if desired
   - And the transaction can be saved without the group tag

3. **AC3: Works for Both Single and Batch Scans**
   - Given I'm in group view mode
   - When I scan a single receipt
   - Then it is auto-tagged to the active group
   - When I scan multiple receipts in batch mode
   - Then all receipts are auto-tagged to the active group

4. **AC4: Visual Indicator of Auto-Tag**
   - Given I scan a receipt in group view mode
   - When viewing the scan result
   - Then I see an indicator "Will be shared to [Group Name]"
   - And the indicator appears near the group tag field
   - And the group's icon/color is shown

## Tasks / Subtasks

- [ ] Task 1: Integrate ViewMode into Scan Flow (AC: #1)
  - [ ] 1.1 Access `ViewModeContext` in scan result processing
  - [ ] 1.2 Check if `mode === 'group'` and `groupId` exists
  - [ ] 1.3 Pre-populate `sharedGroupIds: [groupId]` on scan result
  - [ ] 1.4 Ensure this happens before QuickSave or Edit view

- [ ] Task 2: Update Scan Result Processing (AC: #1, #3)
  - [ ] 2.1 Modify single scan result handling to include group tag
  - [ ] 2.2 Modify batch scan result handling to include group tag for all items
  - [ ] 2.3 Pass group info through the scan state machine

- [ ] Task 3: Show Auto-Tag Indicator (AC: #4)
  - [ ] 3.1 Create `AutoTagIndicator.tsx` component
  - [ ] 3.2 Display in QuickSaveCard when group is pre-tagged
  - [ ] 3.3 Display in Edit view when group is pre-tagged
  - [ ] 3.4 Show group icon, name, and color
  - [ ] 3.5 Add "Will be shared to" label

- [ ] Task 4: Allow Tag Removal (AC: #2)
  - [ ] 4.1 Ensure group tag can be removed via group selector
  - [ ] 4.2 Update transaction state when tag is removed
  - [ ] 4.3 Save respects the modified (or empty) group tags

- [ ] Task 5: Update Batch Mode Flow (AC: #3)
  - [ ] 5.1 Apply group tag to all batch scan results
  - [ ] 5.2 Show indicator in batch review queue
  - [ ] 5.3 Allow per-item tag removal if needed
  - [ ] 5.4 Batch save includes group tags for all items

- [ ] Task 6: i18n Translations
  - [ ] 6.1 Add "Will be shared to [Group]" string
  - [ ] 6.2 Add accessibility labels for auto-tag indicator

- [ ] Task 7: Component Tests
  - [ ] 7.1 Test auto-tag applied in group view mode
  - [ ] 7.2 Test no auto-tag in personal view mode
  - [ ] 7.3 Test tag can be removed before save
  - [ ] 7.4 Test batch mode applies tag to all items

## Dev Notes

### Architecture Context

**Integration Point:** This story connects ViewModeContext (14c.4) with the scan flow (existing Epic 14d state machine).

**Flow:**
```
User in Group View → Scans Receipt → Scan Result → Pre-tagged → QuickSave/Edit → Save
                       ↓
             ViewModeContext.groupId
                       ↓
             sharedGroupIds: [groupId]
```

### Existing Code to Leverage

**ViewModeContext:** From Story 14c.4
- `useViewMode()` hook
- `mode: 'personal' | 'group'`
- `groupId?: string`

**Scan State Machine:** From Epic 14d
- `ScanContext` and `useScanStateMachine`
- `SCAN_COMPLETE` action with transaction data
- `BATCH_COMPLETE` action with multiple results

**QuickSaveCard:** `src/components/scan/QuickSaveCard.tsx`
- Displays scan result summary
- "Save" button handling

### Project Structure Notes

**New files to create:**
```
src/
├── components/
│   └── shared-groups/
│       └── AutoTagIndicator.tsx    # "Will be shared to" display
```

**Files to modify:**
```
src/contexts/ScanContext.tsx        # Access ViewModeContext for auto-tag
src/components/scan/QuickSaveCard.tsx # Show AutoTagIndicator
src/components/scan/BatchReviewQueue.tsx # Show indicator per item
src/hooks/useScanStateMachine.ts    # Include groupId in scan result
```

### Auto-Tag Implementation

```typescript
// In scan result processing (e.g., useScanStateMachine or ScanContext)
import { useViewMode } from '@/contexts/ViewModeContext';

function processScanResult(geminiResult: GeminiScanResult): Transaction {
  const { mode, groupId } = useViewMode();

  const transaction: Partial<Transaction> = {
    // ... existing scan result mapping
    merchant: geminiResult.merchant,
    total: geminiResult.total,
    date: geminiResult.date,
    items: geminiResult.items,
    // Auto-tag if in group mode
    sharedGroupIds: mode === 'group' && groupId ? [groupId] : [],
  };

  return transaction;
}
```

### AutoTagIndicator Component

```typescript
// src/components/shared-groups/AutoTagIndicator.tsx
interface AutoTagIndicatorProps {
  groupId: string;
  onRemove?: () => void;
  showRemove?: boolean;
}

export function AutoTagIndicator({ groupId, onRemove, showRemove = true }: AutoTagIndicatorProps) {
  const { data: group } = useSharedGroup(groupId);

  if (!group) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg text-sm">
      <span
        className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs"
        style={{ backgroundColor: group.color }}
      >
        {group.icon || '👥'}
      </span>
      <span className="text-green-800">
        {t('willBeSharedTo')} <strong>{group.name}</strong>
      </span>
      {showRemove && onRemove && (
        <button
          onClick={onRemove}
          className="ml-auto text-green-600 hover:text-green-800"
          aria-label={t('removeTag')}
        >
          ✕
        </button>
      )}
    </div>
  );
}
```

### QuickSaveCard Integration

```typescript
// In QuickSaveCard.tsx
function QuickSaveCard({ transaction, onSave }: QuickSaveCardProps) {
  const hasGroupTag = transaction.sharedGroupIds && transaction.sharedGroupIds.length > 0;

  return (
    <div className="quick-save-card">
      {/* ... existing content (merchant, total, items preview) ... */}

      {/* Auto-tag indicator */}
      {hasGroupTag && (
        <AutoTagIndicator
          groupId={transaction.sharedGroupIds[0]}
          onRemove={() => handleRemoveGroupTag()}
          showRemove={true}
        />
      )}

      {/* Save button */}
      <Button onClick={onSave}>{t('save')}</Button>
    </div>
  );
}
```

### Batch Mode Integration

```typescript
// When processing batch results
function processBatchResults(results: GeminiScanResult[]): Transaction[] {
  const { mode, groupId } = useViewMode();

  return results.map(result => ({
    ...mapGeminiToTransaction(result),
    sharedGroupIds: mode === 'group' && groupId ? [groupId] : [],
  }));
}

// In BatchReviewQueue, show indicator per item
function BatchReviewItem({ transaction, index }: BatchReviewItemProps) {
  return (
    <div className="batch-item">
      {/* ... item content ... */}

      {transaction.sharedGroupIds?.length > 0 && (
        <AutoTagIndicator
          groupId={transaction.sharedGroupIds[0]}
          showRemove={false}  // Remove via edit flow
        />
      )}
    </div>
  );
}
```

### UX Considerations

**Discoverability:**
- Indicator should be noticeable but not intrusive
- Green color suggests "sharing" action
- Clear group icon/name for identification

**Control:**
- User can always remove tag before saving
- Tag removal should be easy (one tap)
- No auto-tag surprises - indicator makes it clear

**Consistency:**
- Same indicator in QuickSave, Edit view, and Batch review
- Matches visual style of group selector in 14c.7

### Edge Cases

**No Group Selected:**
- If in personal mode, no auto-tag applied
- `sharedGroupIds` remains empty or undefined

**Group Deleted While Scanning:**
- If group was deleted mid-scan, auto-tag fails gracefully
- Indicator shows error state or falls back to no tag

**Already Has Other Group Tags:**
- If editing existing transaction with tags
- Auto-tag adds to existing tags (up to 5 limit)

### References

- [Epic 14C Architecture]: docs/sprint-artifacts/epic14/epic-14c-household-sharing.md
- [Brainstorming - Scan in Group Mode]: docs/analysis/brainstorming-session-2026-01-15.md#category-3-uiux-edge-cases
- [Story 14c.4 - View Mode]: docs/sprint-artifacts/epic14c/14c-4-view-mode-switcher.md
- [Story 14c.7 - Tag Transactions]: docs/sprint-artifacts/epic14c/14c-7-tag-transactions-to-groups.md
- [Epic 14d - Scan Architecture]: docs/sprint-artifacts/epic14d/epic-14d-scan-architecture-refactor.md

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Completion Notes List

### File List

