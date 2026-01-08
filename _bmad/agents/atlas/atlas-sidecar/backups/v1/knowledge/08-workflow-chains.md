# Workflow Chains

> Section 8 of Atlas Memory
> Last Sync: 2025-12-31
> Sources: architecture docs, story files, UX specification, Epic 14 stories

## Critical User Journeys

### 1. Scan Receipt Flow (Core Value Proposition)

```
Camera → Capture Image → Gemini OCR → Parse Response →
Apply Merchant Mapping → Apply Category Mapping →
Display EditView → User Confirms → Save Transaction
                ↓
    Pre-scan Options (currency, store type)
```

**Features Touched:** Camera, Gemini API, Mappings, EditView, Firestore
**Risk Level:** HIGH - Core feature, breaks app if fails

### 2. Analytics Navigation Flow

```
TrendsView → Select Temporal Level (Year/Quarter/Month/Week/Day) →
Select Category Level (Store/ItemGroup/Subcategory) →
View Chart (Aggregation or Comparison mode) →
Click DrillDown Card → Navigate deeper OR
Click Transaction Count → Jump to filtered History
```

**Features Touched:** AnalyticsContext, FilteringService, Charts, DrillDownCards
**Risk Level:** MEDIUM - User experience, not data integrity

### 3. Learning Flow (Category/Merchant/Subcategory)

```
User Edits Field → System Detects Change →
Show Learning Prompt ("Remember this?") →
User Confirms → Save Mapping to Firestore →
Future Scans Auto-Apply Mapping
```

**Features Touched:** EditView, Learning Prompts, Mapping Services, Scan Flow
**Risk Level:** MEDIUM - Affects future scan accuracy

### 4. History Filter Flow

```
History View → Apply Temporal Filter (Year→Quarter→Month→Week→Day) →
Apply Category Filter (Store→ItemGroup→Subcategory) →
Apply Location Filter (Country→City) →
View Filtered Transactions → Click Transaction → EditView
```

**Features Touched:** HistoryView, FilteringService, Transaction List
**Risk Level:** LOW - Read-only operations

### 5. Insight Generation Flow (Epic 10)

```
Transaction Save → [Async Side-Effect] →
generateInsightForTransaction() →
generateAllCandidates() → [12 Generators] →
selectInsight() → (Phase-Based Priority + Sprinkle) →
Display InsightCard (5s auto-dismiss) OR BuildingProfileCard (cold-start fallback)
```

**Features Touched:** InsightEngine, InsightGenerators, InsightCard, BuildingProfileCard
**Risk Level:** LOW - Async side-effect, never blocks save
**Key Constraint:** Insights never block transaction save (async fire-and-forget pattern)

### 6. Quick Save Flow (Epic 11)

```
Camera → Capture Image → Gemini OCR → Parse Response →
Apply Mappings → Calculate Confidence Score →
  IF confidence >= 85%:
    Check Trusted Merchant →
      IF trusted: Auto-Save (no UI) → Insight Generation
      ELSE: Show QuickSaveCard →
        Accept: Save → TrustMerchantPrompt → Insight Generation
        Edit: Navigate to EditView
  ELSE: Show EditView → Save → Insight Generation
```

**Features Touched:** Camera, Gemini API, Mappings, QuickSaveCard, TrustMerchantPrompt, EditView
**Risk Level:** HIGH - Core scan flow, must handle all edge cases
**Key Metric:** <15 seconds scan-to-save for high-confidence receipts

### 7. Trust Merchant Flow (Epic 11)

```
First Save (new merchant) → TrustMerchantPrompt ("Remember this store?") →
  User confirms → saveTrustedMerchant() → Stored in Firestore

Subsequent Scan (same merchant) → checkMerchantTrust() →
  IF trusted: Auto-categorize + Quick Save eligible

Settings → TrustedMerchantsList → Remove trust → removeTrustedMerchant()
```

**Features Touched:** TrustMerchantPrompt, merchantTrustService, TrustedMerchantsList
**Risk Level:** MEDIUM - Affects future scan behavior
**User Control:** Can always remove trust from Settings

### 8. Insight History Flow (Epic 10a)

```
InsightsView → Browse InsightRecords (paginated) →
Click Insight → InsightDetailModal →
  View Transaction: Navigate to EditView with transactionId
  Close: Return to list
```

**Features Touched:** InsightsView, InsightDetailModal, InsightRecord, EditView
**Risk Level:** LOW - Read-only browsing

### 9. Batch Processing Flow (Epic 12)

```
BatchCaptureUI → Capture/Select multiple images (max 10) →
  "Procesar lote" button →
BatchProcessingView →
  Process images in parallel (max 3 concurrent) →
  Track individual statuses (pending → processing → ready/error) →
  Error isolation (one failure doesn't block others) →
  Cancel available (stops pending, completes in-progress) →
  Retry available for failed images →
  Collect all results →
Batch Review Queue (Story 12.3)
```

**Features Touched:** BatchCaptureUI, BatchProcessingView, batchProcessingService, useBatchProcessing
**Risk Level:** MEDIUM - Extends core scan flow with parallel capability
**Key Constraint:** Background processing continues even if app loses focus (implicit via async/await)
**Performance:** 5 images sequential ~25s → parallel ~10s (2 batches of 3, 2)

## Workflow Dependencies

| Workflow | Depends On | Enables |
|----------|------------|---------|
| Scan Receipt | Auth, Gemini API | Analytics, Learning, Insights |
| Learning | Scan Receipt (edits) | Future Scans (auto-apply) |
| Analytics | Transactions (saved) | Insights, Export |
| History Filters | Transactions (saved) | Transaction Lookup |
| Export | Transactions (saved) | External Use |
| Insight Generation | Transaction Save | User Engagement |
| Quick Save | Scan Receipt, Mappings | Faster Saves |
| Trust Merchant | Quick Save (prompt) | Future Auto-Saves |
| Insight History | Insight Generation | Insight Browse |
| Batch Processing | Auth, Gemini API, Credits | Batch Review Queue, Analytics |

## Critical Paths

1. **Auth → Scan → Save** - Must work for any value
2. **Save → Analytics** - Must aggregate correctly
3. **Edit → Learn → Auto-apply** - Must remember preferences
4. **Save → Insight → Display** - Must not block save (async)
5. **Scan → Confidence Check → Quick Save** - Must handle edge cases gracefully
6. **Trust → Auto-categorize → Auto-save** - Must respect user preferences

## Impact Matrix

| Feature Changed | Affects Workflows |
|-----------------|-------------------|
| Gemini Prompt | Scan Receipt, Learning, Batch Processing |
| Transaction Type | All workflows |
| FilteringService | Analytics, History |
| EditView | Scan Receipt, Learning, Quick Save |
| Mapping Services | Learning, Scan Receipt, Quick Save |
| AnalyticsContext | Analytics |
| InsightEngine | Insight Generation, Insight History |
| QuickSaveCard | Quick Save, Trust Merchant |
| merchantTrustService | Trust Merchant, Quick Save |
| Confidence Scoring | Quick Save eligibility |
| batchProcessingService | Batch Processing |
| useBatchProcessing | Batch Processing |
| creditService | Batch Processing (Story 12.4) |

## Edge Cases by Workflow

### Scan Receipt
- Image quality too low for OCR
- Receipt in unsupported format
- Multi-currency receipt
- Receipt without total
- Partial receipt (torn/cut off)

### Learning
- Conflicting mappings (same item, different categories)
- User changes mind (edit existing mapping)
- Fuzzy match threshold edge cases

### Analytics
- Empty data state (no transactions)
- Single transaction (no comparison possible)
- Transactions spanning year boundaries
- Different currencies in same period

### Quick Save (Epic 11)
- Confidence exactly at threshold (85%)
- Missing required fields but high confidence otherwise
- Trusted merchant with changed category mapping
- Network error during auto-save

### Trust Merchant (Epic 11)
- Merchant name variations (case, spacing)
- User removes trust then scans again
- Multiple merchants with similar names

### Insight Generation (Epic 10)
- Cold-start user (no transaction history)
- All generators return null (fallback to BuildingProfileCard)
- Time-based insights with DEFAULT_TIME sentinel
- Duplicate transaction detected

### Batch Processing (Epic 12)
- All images fail processing (batch with only errors)
- User cancels mid-batch (some complete, some pending)
- Retry fails multiple times
- Network disconnection during parallel processing
- Browser throttles background tab (processing continues but slower)
- Insufficient credits for full batch (handled by Story 12.4)

---

## Epic 14 Workflow Chains (Planned)

### 10. Animation Flow (Epic 14.1-14.2)

```
App Mount → AnimationContext Provider →
  useBreathing hook (3s cycle) → breathingPhase value →
  Components subscribe → Apply scale/opacity transforms
```

**Features Touched:** AnimationContext, useBreathing, all animated components
**Risk Level:** LOW - Visual enhancement, no data impact
**Key Constraint:** Must respect prefers-reduced-motion

### 11. Dynamic Polygon Flow (Epic 14.5-14.7)

```
TrendsView Mount → Fetch category aggregates →
  Calculate polygon vertices (3-6 based on data) →
  DynamicPolygon component renders →
    Breathing mode: scale/opacity animation
    Interactive mode: touch to expand category
  Budget overlay: outer polygon shows limits (future)
```

**Features Touched:** TrendsView, DynamicPolygon, AnimationContext
**Risk Level:** LOW - New visualization component, opt-in
**Key Constraint:** Polygon vertices calculated from actual spending data

### 12. Celebration Trigger Flow (Epic 14.12-14.13)

```
Transaction Save → Check for achievements →
  Personal Record? → RecordsService.detectRecords() →
    Record found → triggerCelebration(PRESETS.personalRecord) →
      Confetti animation + Haptic feedback + Optional sound
    No record → Standard quickSave celebration
```

**Features Touched:** CelebrationTrigger, RecordsService, confetti.ts
**Risk Level:** LOW - Post-save side effect
**Key Constraint:** Celebration cooldown (max 1 per session for records)

### 13. Weekly Report Flow (Epic 14.10)

```
ReportsView → Generate weekly cards →
  ReportCarousel → Swipe navigation →
    Summary card → Category cards → Trend cards
  Progress dots show position
```

**Features Touched:** ReportCarousel, ReportCard, TrendArrow
**Risk Level:** LOW - New view, read-only
**Key Constraint:** Rosa-friendly language, large readable numbers

### 14. Intentional Prompt Flow (Epic 14.11)

```
Insight Generation → Pattern detected (>30% increase) →
  shouldShowIntentionalPrompt() →
    True → Show IntentionalPrompt dialog →
      "Fue intencional" or "No me había dado cuenta" →
      Store response → Profile learning
    False → Skip prompt
```

**Features Touched:** IntentionalPrompt, InsightEngine, user profile
**Risk Level:** LOW - Optional prompt, non-blocking
**Key Constraint:** Non-judgmental language only

---

## Sync Notes

- Workflow chains mapped from architecture and story documentation
- Impact matrix helps identify downstream effects of changes
- Edge cases compiled from retrospectives and bug fixes
- Epic 10 added Insight Generation flow with async side-effect pattern
- Epic 10a added Insight History flow with modal navigation
- Epic 11 added Quick Save and Trust Merchant flows
- Combined retrospective: docs/sprint-artifacts/epic10-11-retro-2025-12-22.md
- Epic 12 Story 12.2 added Batch Processing Flow with parallel execution (2025-12-22)
- **Epic 14 workflow chains planned (2025-12-31)**: Animation, Polygon, Celebration, Reports, Intentional flows
