# Workflow Chains

> Section 8 of Atlas Memory
> Last Sync: 2026-01-10
> Last Optimized: 2026-01-10 (Generation 3)
> Sources: architecture docs, story files, UX specification

## Critical User Journeys

### 1. Scan Receipt Flow (Core)
```
Camera → Gemini OCR → Apply Mappings → Currency Check → EditView → Save
```
**Risk:** HIGH | **Features:** Camera, Gemini API, Mappings, EditView, Firestore

### 2. Quick Save Flow (Epic 11)
```
Scan → Apply Mappings → Confidence Check (85%) →
  ≥85%: Check Trusted → Auto-Save OR QuickSaveCard
  <85%: EditView → Save
```
**Risk:** HIGH | **Features:** QuickSaveCard, TrustMerchant, Confidence Scoring

### 3. Batch Processing Flow (Epic 12)
```
BatchCapture → Select images (max 10) → Process parallel (max 3 concurrent) →
  Error isolation (one failure doesn't block) → Batch Review Queue
```
**Risk:** MEDIUM | **Features:** batchProcessingService, useBatchProcessing

### 4. Analytics Navigation Flow
```
TrendsView → Temporal Level → Category Level → Chart View →
  DrillDown Card → deeper OR Transaction Count → filtered History
```
**Risk:** MEDIUM | **Features:** AnalyticsContext, FilteringService, Charts

### 5. Learning Flow
```
User Edits Field → Show Learning Prompt → User Confirms →
  Save Mapping → Future Scans Auto-Apply
```
**Risk:** MEDIUM | **Features:** EditView, Learning Prompts, Mapping Services

### 6. History Filter Flow
```
History View → Temporal Filter → Category Filter → Location Filter →
  View Transactions → Click → EditView
```
**Risk:** LOW | **Features:** HistoryView, FilteringService

### 7. Insight Generation Flow (Epic 10)
```
Transaction Save → [Async Side-Effect] → 12 Generators →
  Phase-Based Selection → InsightCard OR BuildingProfileCard
```
**Risk:** LOW | **Key:** Never blocks save (async fire-and-forget)

### 8. Trust Merchant Flow (Epic 11)
```
First Save → TrustMerchantPrompt → Confirm → Stored
Second Scan → checkMerchantTrust() → Auto-categorize
Settings → TrustedMerchantsList → Remove trust
```
**Risk:** MEDIUM | **User Control:** Can remove from Settings

---

## Epic 14d Workflow Chains (Scan Refactor)

### 9. Scan Request Lifecycle
```
IDLE → Long-press FAB → Mode Selector → Create ScanRequest → CAPTURING
CAPTURING → Add images → [No credit] → Process → Reserve credit → SCANNING
SCANNING → API call → Success → Confirm credit → REVIEWING
                    → Failure → Refund credit → ERROR
REVIEWING → Save (item>0, total>0) → SAVED → IDLE
          → Cancel → Warning → CANCELLED → IDLE
```

**Key Rule: REQUEST PRECEDENCE**
- If state != IDLE, block ALL new scan requests
- FAB tap → Navigate to current request + toast

### 10. Mode Selector Popup
```
IDLE + Long-press FAB → Show Mode Selector →
  📷 Single (green) → 1 normal credit
  📚 Batch (amber) → 1 super credit
  💳 Statement (violet) → "Pronto" badge
```

**Reference:** `docs/sprint-artifacts/epic14d/scan-request-lifecycle.md`

---

## Workflow Dependencies

| Workflow | Depends On | Enables |
|----------|------------|---------|
| Scan Receipt | Auth, Gemini API | Analytics, Learning, Insights |
| Learning | Scan Receipt (edits) | Future Scans (auto-apply) |
| Analytics | Transactions (saved) | Insights, Export |
| Quick Save | Scan Receipt, Mappings | Faster Saves |
| Trust Merchant | Quick Save (prompt) | Future Auto-Saves |
| Batch Processing | Auth, Gemini API, Credits | Batch Review, Analytics |

## Impact Matrix

| Feature Changed | Affects |
|-----------------|---------|
| Gemini Prompt | Scan, Learning, Batch |
| Transaction Type | All workflows |
| FilteringService | Analytics, History |
| EditView | Scan, Learning, Quick Save |
| Mapping Services | Learning, Scan, Quick Save |
| InsightEngine | Insight Generation |
| batchProcessingService | Batch Processing |
| creditService | Batch Processing |

## Critical Paths

1. **Auth → Scan → Save** - Must work for any value
2. **Save → Analytics** - Must aggregate correctly
3. **Edit → Learn → Auto-apply** - Must remember preferences
4. **Save → Insight → Display** - Must not block save
5. **Trust → Auto-categorize → Auto-save** - Must respect preferences

---

## Edge Cases Summary

### Scan Receipt
- Low image quality, unsupported format, multi-currency, no total, partial receipt

### Learning
- Conflicting mappings, user changes mind, fuzzy match edge cases

### Analytics
- Empty data, single transaction, year boundaries, different currencies

### Quick Save
- Exactly 85% confidence, missing fields, trusted merchant with changed category

### Batch Processing
- All images fail, cancel mid-batch, retry failures, network disconnect

---

## Sync Notes

- Generation 3: Consolidated verbose workflow details
- Detailed edge cases available in story files
- Epic 14d workflow chains added for scan refactor
