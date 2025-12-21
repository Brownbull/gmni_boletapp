# Epic 11 Technical Context

**Epic:** 11 - Quick Save & Scan Flow Optimization
**Created:** 2025-12-21
**Status:** Ready for Implementation
**Estimated Points:** ~22 points
**Estimated Duration:** 2 weeks

---

## Executive Summary

Epic 11 transforms the scan-to-save experience from a 42-74 second flow into a <15 second Quick Save flow for 90% of users. The key insight is that most users don't need to edit AI-extracted data - they just want to confirm and move on.

**Core Innovation:** Trust-based automation that learns from user behavior. After 3+ successful scans from a merchant without edits, the system suggests auto-save for that merchant.

**Primary Metrics:**
- Scan-to-save time: <15 seconds for 90% of scans
- Edit rate: <10% of scans require editing
- User satisfaction: "I just want to save and go" flow achieved

---

## Atlas Architectural Context

### Relevant ADRs

| ADR | Decision | Applies To |
|-----|----------|------------|
| ADR-015 | Client-Side Insight Engine | Insight display after Quick Save |
| ADR-016 | Hybrid Storage (Firestore + localStorage) | Merchant trust data storage |
| ADR-017 | Phase-Based Priority | Insight selection post-save |
| ADR-009 | Receipt Image Storage | Image processing during scan |

### Architectural Constraints

1. **Save flow must remain non-blocking** - All UI enhancements are overlays, not blockers
2. **Insight Engine integration** - Quick Save must trigger insight generation (Epic 10 pattern)
3. **Existing service patterns** - Follow `*Service.ts` functional module pattern
4. **Mobile-first UX** - Touch targets 44px minimum, thumb-friendly zones

### Feature Mapping

| Feature | Epic 11 Story | Dependencies |
|---------|---------------|--------------|
| Quick Save Card | 11.2 | Transaction type, Insight Engine |
| Trust Merchant | 11.4 | Firestore, merchantMappingService |
| Scan Status | 11.5 | ScanView, gemini.ts |
| One Image Flow | 11.1 | ScanView camera logic |
| Item Reveal | 11.3 | QuickSaveCard animation |

---

## Architecture Overview

### Current Scan Flow (42-74 seconds)
```
Camera → Capture Image(s) → Upload to Gemini → Processing →
EditView (full form) → User reviews all fields → Save →
Success toast → InsightCard
```

### New Quick Save Flow (<15 seconds)
```
Camera → Capture Image → Upload to Gemini → Processing →
QuickSaveCard (summary view) →
  ├── [Guardar] → Save → InsightCard (done!)
  └── [Editar] → EditView → Save → InsightCard
```

### Trust Merchant Flow (5 seconds for trusted)
```
Camera → Capture Image → Upload →
TrustMerchantCard ("¿Guardar automáticamente?") →
  ├── [Sí, confío] → Auto-save → InsightCard
  └── [Ver detalles] → QuickSaveCard → ...
```

---

## Key Components

### 1. QuickSaveCard Component

**Purpose:** Summary view showing extracted data with Accept/Edit choice

**Component Structure:**
```typescript
interface QuickSaveCardProps {
  transaction: Transaction;
  confidence: number;          // Gemini extraction confidence
  onSave: () => Promise<void>;
  onEdit: () => void;
  onCancel: () => void;
  theme: string;
  t: (key: string) => string;
}
```

**Display Fields:**
- Merchant name (with alias if learned)
- Total amount (formatted with currency)
- Item count (e.g., "5 items")
- Store category (with icon)
- Date (relative if today/yesterday)

**Confidence Threshold:**
- Show QuickSaveCard when confidence ≥ 85%
- Fall back to EditView when confidence < 85%

### 2. TrustMerchantCard Component

**Purpose:** Suggest auto-save after repeated successful scans

**Component Structure:**
```typescript
interface TrustMerchantCardProps {
  merchant: string;
  visitCount: number;          // Times scanned without edit
  editRate: number;            // % of times user edited
  onTrust: () => Promise<void>;
  onDecline: () => void;
  theme: string;
  t: (key: string) => string;
}
```

**Trust Criteria:**
- 3+ scans from same merchant
- <10% edit rate for that merchant
- User hasn't previously declined trust for this merchant

### 3. ScanStatusIndicator Component

**Purpose:** Clear visual feedback during scan processing

**States:**
```typescript
type ScanStatus =
  | 'idle'
  | 'capturing'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'error';

interface ScanStatusIndicatorProps {
  status: ScanStatus;
  progress?: number;           // 0-100 for uploading
  errorMessage?: string;
  onRetry?: () => void;
}
```

### 4. AnimatedItemReveal Component

**Purpose:** Progressive item appearance animation

**Animation Spec:**
- Items appear one by one with 100ms stagger
- Slide-up + fade-in effect
- Total animation time: items.length * 100ms, max 1000ms
- Respects `prefers-reduced-motion`

---

## Data Model Extensions

### MerchantTrustRecord (New)

**Firestore Path:** `users/{userId}/merchantTrust/{merchantId}`

```typescript
interface MerchantTrustRecord {
  merchantName: string;           // Normalized merchant name
  scanCount: number;              // Total scans
  editCount: number;              // Times user edited
  lastScanned: Timestamp;
  trusted: boolean;               // User confirmed trust
  declinedAt?: Timestamp;         // User declined trust prompt
}
```

**Storage Strategy:**
- **Firestore**: MerchantTrustRecord (persists across devices)
- **localStorage**: Quick lookup cache for trusted merchants

### Scan Confidence Metadata

**Extend Transaction type (optional field):**
```typescript
interface Transaction {
  // ... existing fields
  extractionConfidence?: number;  // 0-100, from Gemini response
}
```

---

## File Impact Analysis

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/scan/QuickSaveCard.tsx` | NEW | Quick save summary card |
| `src/components/scan/TrustMerchantCard.tsx` | NEW | Trust merchant prompt |
| `src/components/scan/ScanStatusIndicator.tsx` | NEW | Status progression UI |
| `src/components/scan/AnimatedItemReveal.tsx` | NEW | Item list animation |
| `src/services/merchantTrustService.ts` | NEW | Trust CRUD operations |
| `src/views/ScanView.tsx` | MAJOR REFACTOR | Flow logic, single image |
| `src/services/gemini.ts` | MINOR | Return confidence score |
| `src/types/transaction.ts` | MINOR | Add extractionConfidence |
| `src/utils/translations.ts` | MINOR | Add new UI strings |
| `src/App.tsx` | MINOR | Update View type if needed |

---

## Story Breakdown

### Story 11.1: One Image = One Transaction (3 points)

**Goal:** Simplify assumption to one receipt per scan

**Acceptance Criteria:**
- [ ] Remove multi-image capture complexity from ScanView
- [ ] Single image capture with clear "Take Photo" / "Upload" buttons
- [ ] Clear messaging if user tries to add more images
- [ ] Existing multi-image receipts still displayable (backward compatible)

**Implementation Notes:**
- Modify `ScanView.tsx` to enforce single image
- Keep `imageUrls: string[]` in Transaction for backward compatibility
- Add UI guidance: "Scan one receipt at a time"

### Story 11.2: Quick Save Card Component (5 points)

**Goal:** Summary view with Accept/Edit choice

**Acceptance Criteria:**
- [ ] QuickSaveCard shows: merchant, total, item count, category
- [ ] "Guardar" button (primary, prominent)
- [ ] "Editar" button (secondary, smaller)
- [ ] Shows only when confidence ≥ 85%
- [ ] Falls back to EditView when confidence < 85%
- [ ] Integrates with InsightCard after save (Epic 10 pattern)

**Implementation Notes:**
- Create `src/components/scan/QuickSaveCard.tsx`
- Follow existing Card component styling patterns
- Use existing `addTransaction` flow for save
- Trigger `generateInsightForTransaction` after save

### Story 11.3: Animated Item Reveal (3 points)

**Goal:** Progressive item appearance for delight

**Acceptance Criteria:**
- [ ] Items appear one-by-one with 100ms stagger
- [ ] Slide-up + fade-in animation
- [ ] Max 10 items animated (rest appear immediately)
- [ ] Respects `prefers-reduced-motion` media query
- [ ] Total animation ≤ 1 second

**Implementation Notes:**
- Create `src/components/scan/AnimatedItemReveal.tsx`
- Use CSS animations or framer-motion (evaluate bundle size)
- Add animation constants to `src/config/constants.ts`

### Story 11.4: Trust Merchant System (5 points)

**Goal:** Track merchant edit rates and suggest auto-save

**Acceptance Criteria:**
- [ ] Track scan count per merchant (Firestore)
- [ ] Track edit count per merchant
- [ ] Show trust prompt after 3+ scans with <10% edit rate
- [ ] "Confiar en {merchant}" dialog with explanation
- [ ] Trusted merchants skip to QuickSaveCard
- [ ] User can decline (don't ask again for this merchant)
- [ ] Trust setting visible in Settings → Merchant Mappings

**Implementation Notes:**
- Create `src/services/merchantTrustService.ts`
- Create Firestore collection `merchantTrust`
- Add Firestore security rules for merchantTrust
- Create `TrustMerchantCard.tsx` component

### Story 11.5: Scan Status Clarity (3 points)

**Goal:** Clear processing states during scan

**Acceptance Criteria:**
- [ ] "Uploading..." with progress indicator
- [ ] "Procesando..." with spinner
- [ ] "Listo!" brief success state
- [ ] Error state with retry button
- [ ] Skeleton loading during AI processing
- [ ] All states are accessible (ARIA labels)

**Implementation Notes:**
- Create `src/components/scan/ScanStatusIndicator.tsx`
- Integrate with existing ScanView loading states
- Use consistent icon set (Lucide)

### Story 11.99: Epic Release Deployment (2 points)

**Goal:** Production deployment and verification

**Acceptance Criteria:**
- [ ] All stories pass code review
- [ ] E2E tests cover Quick Save flow
- [ ] Firestore rules updated for merchantTrust
- [ ] Deploy to staging, verify
- [ ] Deploy to production
- [ ] Update sprint-status.yaml to completed

---

## Atlas Feature Traceability

### Features Covered

| Feature | Story | AC Mapping |
|---------|-------|------------|
| One Image = One Transaction | 11.1 | PRD: "Simplify scan flow" |
| Quick Save Card | 11.2 | PRD: "Accept vs Edit choice" |
| Animated Item Reveal | 11.3 | PRD: "Items appearing one by one" |
| Trust Merchant System | 11.4 | PRD: "Suggest auto-save after 3 scans" |
| Scan Status Clarity | 11.5 | PRD: "Clear states: Uploading → Processing → Ready → Saved" |

### Coverage Gaps

| Gap | Reason | Resolution |
|-----|--------|------------|
| AI confidence from Gemini | Gemini doesn't return explicit confidence | Use heuristics: field completeness, item count validation |
| Batch mode integration | Out of scope for Epic 11 | Deferred to Epic 12 |
| Push notifications | Out of scope for Epic 11 | Uses existing InsightCard (Epic 10) |

### Dependencies

| Dependency | Status | Required By |
|------------|--------|-------------|
| Epic 10 (Insight Engine) | COMPLETE | Story 11.2 (insight after save) |
| Merchant Mapping Service | EXISTS | Story 11.4 (trust extends mappings) |
| Transaction type | EXISTS | Story 11.2 (QuickSaveCard display) |
| ScanView camera logic | EXISTS | Story 11.1 (simplify) |

---

## Testing Strategy

### Unit Tests

| Component/Service | Test Cases |
|-------------------|------------|
| QuickSaveCard | Renders merchant, total, items; buttons work |
| TrustMerchantCard | Shows count, edit rate; accept/decline flow |
| ScanStatusIndicator | All states render correctly |
| AnimatedItemReveal | Animation timing, reduced motion |
| merchantTrustService | CRUD operations, trust calculation |

### Integration Tests

| Flow | Test Cases |
|------|------------|
| Quick Save | Scan → QuickSaveCard → Save → InsightCard |
| Edit Flow | Scan → QuickSaveCard → Edit → EditView → Save |
| Trust Flow | 3rd scan → Trust prompt → Accept → Auto-save on 4th |
| Error Flow | Scan → Error → Retry → Success |

### E2E Tests

| Scenario | Steps |
|----------|-------|
| New user quick save | Login → Scan → Quick Save → Verify in History |
| Build trust | 3 scans same merchant → Trust prompt appears |
| Low confidence | Mock low confidence → EditView shown |

---

## Performance Considerations

### Performance Budget

| Metric | Target | Current Baseline |
|--------|--------|------------------|
| Quick Save render | <100ms | N/A (new) |
| Item animation total | <1000ms | N/A (new) |
| Trust check | <50ms | N/A (new) |
| Scan-to-card | <3s | 5-10s (Gemini API) |

### Optimization Strategies

1. **Preload QuickSaveCard** - Render skeleton while Gemini processes
2. **Cache merchant trust** - localStorage for fast lookup
3. **Memoize animations** - Prevent re-renders during animation
4. **Lazy load EditView** - Only load if user clicks "Editar"

---

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Gemini confidence unreliable | Medium | Medium | Use heuristics (field completeness) as fallback |
| Animation performance on low-end devices | Low | Medium | Respect reduced-motion, cap at 10 items |
| Trust prompt annoying | Medium | Low | One-time decline option, subtle UI |
| Single image too restrictive | Low | Medium | Clear UX, batch mode in Epic 12 |

---

## Implementation Order

1. **Story 11.1** (3 pts) - One Image = One Transaction (foundation)
2. **Story 11.5** (3 pts) - Scan Status Clarity (can parallel with 11.1)
3. **Story 11.2** (5 pts) - Quick Save Card (main component)
4. **Story 11.3** (3 pts) - Animated Item Reveal (depends on 11.2)
5. **Story 11.4** (5 pts) - Trust Merchant System (depends on 11.2)
6. **Story 11.99** (2 pts) - Epic Release Deployment

**Suggested Parallelization:**
- Stories 11.1 + 11.5 can run in parallel (different focus areas)
- Stories 11.3 + 11.4 can run in parallel (both depend on 11.2)

---

## Historical Lessons Applied

From Atlas `06-lessons.md`:

| Lesson | Application in Epic 11 |
|--------|------------------------|
| "Architecture decisions before UX changes" | This tech context before implementation |
| "Defensive Firestore reads" | Apply to merchantTrustService |
| "Async side-effect pattern" | Trust tracking doesn't block save |
| "Insight generation MUST NOT block save" | Quick Save inherits Epic 10 pattern |
| "High velocity achievable with good planning" | Detailed story breakdown enables parallel work |

---

## Related Documents

- [Epic Definition](../../planning/epics.md#epic-11-quick-save--scan-flow-optimization)
- [Epic 10 Architecture](../epic10/architecture-epic10-insight-engine.md)
- [UX Design Specification](../../ux-design-specification.md)
- [Atlas Architecture](../../_bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md)

---

_Generated by Atlas Epic Tech Context Workflow_
_Date: 2025-12-21_
_For: Gabe_
