# Epic 12 Technical Context

**Epic:** 12 - Batch Mode
**Created:** 2025-12-22
**Status:** Ready for Implementation
**Estimated Points:** ~25 points
**Estimated Duration:** 2 weeks

---

## Executive Summary

Epic 12 transforms the receipt scanning experience for users who accumulate receipts by enabling multi-image upload with parallel processing and batch review. This epic builds directly on the batch image processing infrastructure implemented in Story 11.1, extending it with a dedicated batch capture UI, parallel processing optimization, and comprehensive batch review workflow.

**Core Innovation:** Leverage the proven sequential processing from Epic 11 and enhance it with parallel processing, pre-batch credit warnings, and a unified batch review queue that uses the QuickSaveCard pattern for individual receipt editing.

**Primary Metrics:**
- Batch upload capacity: 5-10 receipts per session
- Processing time: Parallel processing faster than sequential
- User workflow: Single "Save All" action to complete batch
- Credit transparency: Clear warning before batch processing begins

---

## Atlas Architectural Context

### Relevant ADRs

| ADR | Decision | Applies To |
|-----|----------|------------|
| ADR-015 | Client-Side Insight Engine | Batch insights generation after save |
| ADR-016 | Hybrid Storage (Firestore + localStorage) | Batch session state management |
| ADR-017 | Phase-Based Priority | Insight selection for batch summary |
| ADR-009 | Receipt Image Storage | Image handling during batch capture |

### Architectural Constraints

1. **Credit deduction after success** - Credits deducted only after each receipt successfully saves (from 11.1)
2. **Async side-effect pattern** - Insight generation must not block batch save (Epic 10 pattern)
3. **State machine for processing** - Track individual receipt status through processing lifecycle
4. **Existing service patterns** - Follow `*Service.ts` functional module pattern

### Feature Mapping

| Feature | Epic 12 Story | Dependencies |
|---------|---------------|--------------|
| Batch Capture UI | 12.1 | Camera logic from ScanView |
| Parallel Processing | 12.2 | Story 11.1 batch infrastructure |
| Batch Review Queue | 12.3 | QuickSaveCard from 11.2 |
| Credit Warning | 12.4 | Subscription/credit system |
| Batch Save & Insights | 12.5 | Epic 10 Insight Engine |

---

## Architecture Overview

### Current Batch Flow (from Epic 11)
```
Camera → Select N Images → Sequential Processing (1 by 1) →
BatchProcessingProgress → Each saves on completion →
BatchSummary (from 10.7)
```

### New Batch Mode Flow
```
Camera → Batch Capture UI (preview strip) →
Pre-batch Credit Check ("This will use X credits") →
Parallel Processing (concurrent API calls) →
Batch Review Queue (summary cards) →
  ├── Individual Edit (QuickSaveCard pattern)
  └── [Guardar Todas] → Save All → Batch Insight
```

### State Machine for Receipt Processing
```
┌─────────────┐
│   PENDING   │
└─────┬───────┘
      │ Start processing
      ▼
┌─────────────┐
│ PROCESSING  │
└─────┬───────┘
      │
      ├─── Success ───▶ ┌──────────┐
      │                 │  READY   │ (awaiting review)
      │                 └────┬─────┘
      │                      │ User saves/edits
      │                      ▼
      │                 ┌──────────┐
      │                 │  SAVED   │
      │                 └──────────┘
      │
      └─── Failure ───▶ ┌──────────┐
                        │  ERROR   │
                        └──────────┘
```

---

## Key Components

### 1. BatchCaptureUI Component

**Purpose:** Multi-image capture interface with preview strip

**Component Structure:**
```typescript
interface BatchCaptureUIProps {
  onImagesSelected: (images: string[]) => void;
  onCancel: () => void;
  maxImages: number;           // Default: 10
  theme: string;
  t: (key: string) => string;
}

interface CapturedImage {
  id: string;
  dataUrl: string;
  thumbnail: string;
  status: 'captured' | 'removed';
}
```

**UI Elements:**
- Camera viewfinder with capture button
- Horizontal thumbnail strip showing captured images
- "Capture next" button (while < maxImages)
- "Review all" button (when >= 1 image)
- Individual image remove option
- Image count indicator (e.g., "3/10")

### 2. ParallelProcessingService

**Purpose:** Process multiple images concurrently with status tracking

**Service Interface:**
```typescript
interface ProcessingJob {
  id: string;
  imageDataUrl: string;
  status: 'pending' | 'processing' | 'ready' | 'error' | 'saved';
  transaction?: Transaction;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

interface BatchProcessingState {
  jobs: ProcessingJob[];
  totalCreditsRequired: number;
  userCreditsAvailable: number;
  canProceed: boolean;
}

// Service functions
export async function processImagesInParallel(
  images: string[],
  currency: string,
  maxConcurrent?: number  // Default: 3
): Promise<ProcessingJob[]>;

export function calculateCreditsRequired(imageCount: number): number;

export function checkCreditSufficiency(
  required: number,
  available: number
): { sufficient: boolean; shortage: number };
```

**Concurrency Control:**
- Default max concurrent: 3 (configurable)
- Use Promise pool pattern to limit concurrent API calls
- Track individual job progress for UI updates

### 3. BatchReviewQueue Component

**Purpose:** Display all processed receipts for review before batch save

**Component Structure:**
```typescript
interface BatchReviewQueueProps {
  jobs: ProcessingJob[];
  onEditReceipt: (jobId: string) => void;
  onRemoveReceipt: (jobId: string) => void;
  onSaveAll: () => Promise<void>;
  onCancel: () => void;
  theme: string;
  t: (key: string) => string;
}
```

**Display Elements:**
- Summary header (X receipts, $Y total)
- Scrollable list of receipt cards (QuickSaveCard pattern)
- Visual indicators for receipts needing review (low confidence, missing fields)
- Individual "Edit" and "Remove" actions per card
- "Save All" primary button
- "Cancel Batch" secondary button

### 4. CreditWarningModal Component

**Purpose:** Pre-batch credit disclosure and confirmation

**Component Structure:**
```typescript
interface CreditWarningModalProps {
  creditsRequired: number;
  creditsAvailable: number;
  receiptCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  theme: string;
  t: (key: string) => string;
}
```

**Display Logic:**
- Show when creditsRequired > 0
- Warning state when creditsAvailable < creditsRequired
- Block proceed if insufficient credits
- Option to upgrade or reduce batch size

### 5. BatchInsightCard Component

**Purpose:** Aggregate insight display after batch save

**Component Structure:**
```typescript
interface BatchInsightCardProps {
  transactions: Transaction[];
  totalAmount: number;
  receiptCount: number;
  insight: Insight | null;
  onDismiss: () => void;
  onSilence: (hours: number) => void;
  theme: string;
  t: (key: string) => string;
}
```

**Insight Types for Batch:**
- Total spending in batch
- Comparison to weekly/monthly average
- Category distribution in batch
- Top merchant in batch

---

## Data Model Extensions

### BatchSession State (localStorage)

**Key:** `boletapp_batch_session`

```typescript
interface BatchSession {
  id: string;                           // UUID for session
  startedAt: string;                    // ISO timestamp
  jobs: ProcessingJob[];
  creditsUsed: number;
  status: 'capturing' | 'processing' | 'reviewing' | 'saving' | 'complete';
}
```

### ProcessingJob (in-memory during session)

```typescript
interface ProcessingJob {
  id: string;                           // UUID
  imageDataUrl: string;                 // Base64 image
  status: ProcessingStatus;
  transaction?: Transaction;            // Extracted data
  confidence?: number;                  // Extraction confidence
  needsReview: boolean;                 // Flag for low confidence
  error?: string;
  processingTimeMs?: number;
}

type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'error'
  | 'saved';
```

---

## File Impact Analysis

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/batch/BatchCaptureUI.tsx` | NEW | Multi-image capture with preview strip |
| `src/components/batch/BatchReviewQueue.tsx` | NEW | Review queue with summary cards |
| `src/components/batch/CreditWarningModal.tsx` | NEW | Pre-batch credit check modal |
| `src/components/batch/BatchInsightCard.tsx` | NEW | Batch completion insight |
| `src/components/batch/index.ts` | NEW | Barrel exports |
| `src/services/parallelProcessingService.ts` | NEW | Concurrent processing logic |
| `src/hooks/useBatchSession.ts` | EXTEND | Add parallel processing support |
| `src/App.tsx` | MODIFY | Integrate batch mode flow |
| `src/views/ScanView.tsx` | MODIFY | Add batch capture mode toggle |
| `src/utils/translations.ts` | MODIFY | Add batch mode UI strings |
| `src/services/insightEngineService.ts` | EXTEND | Add batch insight generators |

---

## Story Breakdown

### Story 12.1: Batch Capture UI (5 points)

**Goal:** Multi-image capture interface with preview strip

**Acceptance Criteria:**
- [ ] Camera view with "Capture" button
- [ ] Horizontal thumbnail strip of captured images
- [ ] "Capture next" / "Review all" buttons
- [ ] Individual image remove option (tap to remove)
- [ ] Image count indicator (X/10)
- [ ] Maximum 10 images per batch enforced
- [ ] Smooth transitions between capture and preview
- [ ] Dark mode support

**Implementation Notes:**
- Create `src/components/batch/BatchCaptureUI.tsx`
- Reuse camera logic from existing ScanView
- Store images in component state during capture phase
- Thumbnail generation for preview strip

### Story 12.2: Parallel Processing Service (5 points)

**Goal:** Concurrent image processing with status tracking

**Acceptance Criteria:**
- [ ] Process up to 3 images concurrently (configurable)
- [ ] Individual job status tracking (pending → processing → ready/error)
- [ ] Progress events for UI updates
- [ ] Continue processing if individual image fails
- [ ] Processing time tracking per job
- [ ] Confidence score extraction from Gemini response
- [ ] Flag low-confidence extractions for review

**Implementation Notes:**
- Create `src/services/parallelProcessingService.ts`
- Use Promise pool pattern (p-limit or custom)
- Leverage existing `analyzeReceipt()` function
- Emit progress events via callback or observable pattern

### Story 12.3: Batch Review Queue (5 points)

**Goal:** Summary cards with individual edit capability

**Acceptance Criteria:**
- [ ] Summary header: X receipts, $Y total
- [ ] Scrollable card list using QuickSaveCard pattern
- [ ] Visual indicator for low-confidence receipts (yellow border)
- [ ] Individual "Edit" button → opens receipt in edit mode
- [ ] Individual "Remove" button → removes from batch
- [ ] "Save All" primary action
- [ ] "Cancel Batch" with confirmation
- [ ] Real-time total update when receipts edited/removed

**Implementation Notes:**
- Create `src/components/batch/BatchReviewQueue.tsx`
- Reuse QuickSaveCard component from Epic 11
- Integrate with EditView for individual edits
- Track edited state per receipt

### Story 12.4: Credit Warning System (3 points)

**Goal:** Pre-batch credit check and warning display

**Acceptance Criteria:**
- [ ] Calculate credits required before processing
- [ ] Show modal: "This batch will use X credits. You have Y remaining."
- [ ] Proceed button enabled only if sufficient credits
- [ ] Warning state when credits low (Y < X)
- [ ] Option to reduce batch size
- [ ] Link to upgrade/purchase credits
- [ ] Credit deduction after each successful save (not upfront)

**Implementation Notes:**
- Create `src/components/batch/CreditWarningModal.tsx`
- Integrate with existing credit/subscription system
- Deduction timing follows 11.1 pattern (after save success)

### Story 12.5: Batch Save & Insights (3 points)

**Goal:** Save all receipts with aggregate insight display

**Acceptance Criteria:**
- [ ] "Save All" saves each ready receipt to Firestore
- [ ] Progress indicator during batch save
- [ ] Credit deduction after each successful save
- [ ] Aggregate insight generated for batch
- [ ] BatchInsightCard shows total, receipt count, top insight
- [ ] Comparison to weekly average (if data available)
- [ ] "Silenciar 4h" option for insights
- [ ] Redirect to Home after dismissing insight

**Implementation Notes:**
- Extend `src/services/insightEngineService.ts` with batch generators
- Create `src/components/batch/BatchInsightCard.tsx`
- Use existing async side-effect pattern from Epic 10

### Story 12.99: Epic Release Deployment (2 points)

**Goal:** Production deployment and verification

**Acceptance Criteria:**
- [ ] All stories pass code review
- [ ] Unit tests cover all new components
- [ ] Integration tests cover batch flow
- [ ] E2E test: capture 3 images → process → review → save all
- [ ] Deploy to staging, verify
- [ ] Deploy to production
- [ ] Update sprint-status.yaml to completed
- [ ] Atlas knowledge update with lessons learned

---

## Atlas Feature Traceability

### Features Covered

| Feature | Story | AC Mapping |
|---------|-------|------------|
| Batch Capture UI | 12.1 | PRD: "Multi-image capture/upload UI" |
| Parallel Processing | 12.2 | PRD: "Process multiple images simultaneously" |
| Batch Review Queue | 12.3 | PRD: "Summary cards for all receipts" |
| Credit Warning System | 12.4 | PRD: "Pre-batch warning about credit usage" |
| Batch Save & Insights | 12.5 | PRD: "Aggregate insight for the batch" |

### Coverage Gaps

| Gap | Reason | Resolution |
|-----|--------|------------|
| Card statement scanning | Complex multi-charge extraction | Deferred to Epic F3 |
| Batch editing (bulk actions) | Scope creep risk | Future enhancement |
| Background processing | Requires service worker complexity | Future enhancement |

### Dependencies

| Dependency | Status | Required By |
|------------|--------|-------------|
| Epic 11 Story 11.1 (Batch Processing) | COMPLETE | Story 12.2 (leverage infrastructure) |
| Epic 11 Story 11.2 (QuickSaveCard) | COMPLETE | Story 12.3 (reuse pattern) |
| Epic 10 (Insight Engine) | COMPLETE | Story 12.5 (batch insights) |
| Credit/Subscription System | EXISTS | Story 12.4 (credit check) |

---

## Testing Strategy

### Unit Tests

| Component/Service | Test Cases |
|-------------------|------------|
| BatchCaptureUI | Image capture, preview strip, max limit enforcement |
| ParallelProcessingService | Concurrency control, error handling, status tracking |
| BatchReviewQueue | Card display, edit/remove actions, total calculation |
| CreditWarningModal | Sufficient/insufficient states, action buttons |
| BatchInsightCard | Insight display, silence action |

### Integration Tests

| Flow | Test Cases |
|------|------------|
| Capture Flow | Select multiple images → preview strip updates |
| Processing Flow | Start batch → parallel processing → all complete |
| Review Flow | Edit receipt → save → total updates |
| Credit Flow | Check credits → warning → proceed/block |
| Save Flow | Save all → credit deduction → insight display |

### E2E Tests

| Scenario | Steps |
|----------|-------|
| Happy path | Capture 3 → Process → Review → Save All → Insight |
| Partial failure | Capture 5, 1 fails → Review 4 → Save All |
| Credit insufficient | Capture 5, only 3 credits → Warning → Cancel |
| Individual edit | Capture 3 → Edit 1 → Save All |

---

## Performance Considerations

### Performance Budget

| Metric | Target | Notes |
|--------|--------|-------|
| Parallel processing | 3 concurrent max | Avoid API rate limits |
| Total batch time | < 30s for 5 receipts | vs ~50s sequential |
| UI responsiveness | No blocking during processing | Status updates via events |
| Memory usage | < 50MB for 10 images | Thumbnail compression |

### Optimization Strategies

1. **Parallel processing cap** - Limit to 3 concurrent to avoid API throttling
2. **Thumbnail generation** - Show compressed thumbnails, not full images
3. **Progressive loading** - Display cards as they complete, not all at once
4. **Memory cleanup** - Release image data after save
5. **Lazy edit view** - Only load full edit UI when user clicks "Edit"

---

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API rate limiting | Medium | High | Cap concurrent requests at 3 |
| Memory pressure on mobile | Medium | Medium | Compress thumbnails, cleanup after save |
| Partial batch failure confusing | Low | Medium | Clear status per receipt, allow individual retry |
| Credit calculation mismatch | Low | High | Validate credit count before and after |
| Long processing perceived as hung | Medium | Medium | Real-time progress updates per receipt |

---

## Implementation Order

1. **Story 12.1** (5 pts) - Batch Capture UI (foundation)
2. **Story 12.4** (3 pts) - Credit Warning System (gate before processing)
3. **Story 12.2** (5 pts) - Parallel Processing Service (core logic)
4. **Story 12.3** (5 pts) - Batch Review Queue (depends on 12.2)
5. **Story 12.5** (3 pts) - Batch Save & Insights (depends on 12.3)
6. **Story 12.99** (2 pts) - Epic Release Deployment

**Suggested Parallelization:**
- Stories 12.1 + 12.4 can run in parallel (capture UI + credit warning are independent)
- Story 12.2 depends on 12.1 (needs images from capture)
- Stories 12.3 + 12.5 can be partially parallelized (insight card independent of review queue)

---

## Historical Lessons Applied

From Atlas `06-lessons.md`:

| Lesson | Application in Epic 12 |
|--------|------------------------|
| "Credit deduction after success" (11.1) | Credits deducted per receipt after save, not upfront |
| "Async side-effect pattern" (10.x) | Batch insight generation doesn't block save |
| "State machine for complex flows" | ProcessingJob status transitions clearly defined |
| "Defensive error handling" | Partial failures continue batch, clear error display |
| "Architecture decisions before UX changes" | This tech context before implementation |

From Story 11.1 Implementation:

| Learning | Application in Epic 12 |
|----------|------------------------|
| Sequential processing works reliably | Extend with parallel option, cap concurrency |
| BatchProcessingProgress pattern | Reuse for parallel processing status display |
| Cancel with partial save | Apply same pattern to batch review |
| Redirect to Home after complete | Apply to batch save completion |

---

## Related Documents

- [Epic Definition](../../planning/epics.md#epic-12-batch-mode)
- [Epic 11 Tech Context](../epic11/tech-context-epic11.md)
- [Story 11.1 Implementation](../epic11/story-11.1-one-image-one-transaction.md)
- [Epic 10 Architecture](../epic10/architecture-epic10-insight-engine.md)
- [Atlas Architecture](../../_bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md)

---

_Generated by Atlas Epic Tech Context Workflow_
_Date: 2025-12-22_
_For: Gabe_
