# Workflow Chains

> Section 8 of Atlas Memory
> Last Sync: 2025-12-18
> Sources: architecture docs, story files, UX specification

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

## Workflow Dependencies

| Workflow | Depends On | Enables |
|----------|------------|---------|
| Scan Receipt | Auth, Gemini API | Analytics, Learning |
| Learning | Scan Receipt (edits) | Future Scans (auto-apply) |
| Analytics | Transactions (saved) | Insights, Export |
| History Filters | Transactions (saved) | Transaction Lookup |
| Export | Transactions (saved) | External Use |

## Critical Paths

1. **Auth → Scan → Save** - Must work for any value
2. **Save → Analytics** - Must aggregate correctly
3. **Edit → Learn → Auto-apply** - Must remember preferences

## Impact Matrix

| Feature Changed | Affects Workflows |
|-----------------|-------------------|
| Gemini Prompt | Scan Receipt, Learning |
| Transaction Type | All workflows |
| FilteringService | Analytics, History |
| EditView | Scan Receipt, Learning |
| Mapping Services | Learning, Scan Receipt |
| AnalyticsContext | Analytics |

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

---

## Sync Notes

- Workflow chains mapped from architecture and story documentation
- Impact matrix helps identify downstream effects of changes
- Edge cases compiled from retrospectives and bug fixes
