# Feature Inventory + Intent

> Section 2 of Atlas Memory
> Last Sync: 2025-12-18
> Sources: sprint-status.yaml, epics.md, PRD documents

## Core Features (Implemented)

| Feature | Purpose | Epic | Status |
|---------|---------|------|--------|
| **Receipt Scanning** | AI-powered OCR extracts transaction data from photos | Epic 1 | ✅ Done |
| **Transaction Management** | CRUD operations for transactions | Epic 1 | ✅ Done |
| **Category System** | Hierarchical: Store Category → Item Group → Subcategory | Epic 9 | ✅ Done |
| **Smart Category Learning** | Learns user preferences, auto-applies on future scans | Epic 6 | ✅ Done |
| **Merchant Learning** | Fuzzy matching for merchant name suggestions | Epic 9 | ✅ Done |
| **Subcategory Learning** | User-defined subcategory preferences | Epic 9 | ✅ Done |
| **Analytics Dashboard** | Dual-axis navigation (temporal + category) | Epic 7 | ✅ Done |
| **History Filters** | Filter by time, category, location | Epic 9 | ✅ Done |
| **Data Export** | CSV export for transactions and statistics | Epic 5 | ✅ Done |
| **PWA Installation** | Add to Home Screen support | Epic 9 | ✅ Done |
| **Push Notifications** | Firebase Cloud Messaging infrastructure | Epic 9 | ✅ Done |
| **Theme System** | Light/Dark modes, Normal/Professional color themes | Epic 7 | ✅ Done |
| **Pre-scan Options** | Currency and store type selection before scanning | Epic 9 | ✅ Done |
| **Location Display** | Country/city from receipt displayed in EditView | Epic 9 | ✅ Done |

## Current Development (Epic 10)

| Feature | Status | Purpose |
|---------|--------|---------|
| **Foundation Sprint (10.0)** | In Review | Analytics refactor, filtering service, App.tsx cleanup |
| **Insight Engine Core (10.1)** | Ready for Dev | InsightEngine service, InsightGenerator interface |
| **User Phase Detection (10.2)** | Ready for Dev | Cold-start vs data-rich user profiling |
| **Transaction Intrinsic Insights (10.3)** | Ready for Dev | 7 generators for scan-complete context |
| **Pattern Detection Insights (10.4)** | Ready for Dev | 6 generators for spending patterns |
| **Scan Complete Display (10.5)** | Ready for Dev | UI for contextual feedback after saving |

## Future Roadmap (Epics 11-16)

| Epic | Name | Focus |
|------|------|-------|
| 11 | Quick Save & Scan Optimization | <15 second scan-to-save flow |
| 12 | Batch Mode | Multi-receipt capture with parallel processing |
| 13 | Analytics UX Redesign | Animated visualizations, sparklines |
| 14 | Onboarding | <60 second time-to-value, progressive disclosure |
| 15 | Tags & Grouping | User-defined tags for project/trip tracking |
| 16 | Achievements | Ethical gamification, milestone celebration |

## Feature Dependencies

### Scan Flow Dependencies
```
Camera Capture → Gemini OCR → Merchant Mapping → Category Mapping → EditView → Save
                     ↓
              Pre-scan Options (currency, store type)
```

### Learning System Dependencies
```
User Edit → Learning Prompt → Mapping Saved → Future Scans Auto-Apply
     ↓
[Merchant | Category | Subcategory] Mappings
```

### Analytics Dependencies
```
Transactions → FilteringService → AnalyticsContext → Charts/Cards
                    ↓
         History Filters (time, category, location)
```

## Feature-to-Story Mapping

| Feature Area | Key Stories |
|--------------|-------------|
| Scanning | 1.1, 8.1-8.9, 9.1, 9.8 |
| Learning | 6.1-6.5, 9.4-9.7 |
| Analytics | 7.1-7.20 |
| Filters | 9.19 |
| Export | 5.1-5.2 |

---

## Sync Notes

- Feature inventory aligned with sprint-status.yaml as of 2025-12-18
- Epic 10 stories drafted but Foundation Sprint (10.0) in review
- All Epic 9 features deployed to production
