# Architectural Decisions & Patterns

> Section 4 of Atlas Memory
> Last Sync: 2025-12-19
> Sources: architecture.md, ADRs, tech-spec documents

## Tech Stack

<!-- Synced from: architecture/architecture.md -->

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 18 + TypeScript + Vite | PWA with mobile-first design |
| Styling | Tailwind CSS + CSS Custom Properties | Runtime theme switching |
| State | React Context | Analytics navigation, auth |
| Backend | Firebase (Auth, Firestore, Storage, Functions) | Serverless architecture |
| AI/ML | Google Gemini 2.0 Flash | Receipt OCR via Cloud Function |
| Testing | Vitest (unit/integration) + Playwright (E2E) | 84%+ coverage |
| CI/CD | GitHub Actions → Firebase Hosting | Auto-deploy on main merge |

## System Boundaries

### In Scope (Client)
- Receipt image capture and display
- Transaction CRUD UI
- Analytics visualization
- Learning prompt UI
- User preferences

### In Scope (Backend)
- Firebase Auth (Google sign-in)
- Firestore (transactions, mappings)
- Cloud Storage (receipt images)
- Cloud Functions (Gemini API proxy)

### External Dependencies
- Google Gemini 2.0 Flash API
- Firebase services
- Mercado Pago (future - payments)

## Data Model

```
users/{userId}/
  transactions/{transactionId}    - Individual transactions
  categoryMappings/{mappingId}    - Learned category preferences
  merchantMappings/{mappingId}    - Learned merchant preferences
  subcategoryMappings/{mappingId} - Learned subcategory preferences
  userInsightProfile              - User phase and insight state (Epic 10)
```

## Architectural Decisions (ADRs)

| ADR | Decision | Rationale | Status |
|-----|----------|-----------|--------|
| ADR-010 | React Context for Analytics State | Clean separation, hook patterns | Active |
| ADR-011 | Chart Registry Pattern | Extensible chart type system | Active |
| ADR-012 | Month-Aligned Weeks | Simpler date math, better financial UX | Active |
| ADR-015 | Client-Side Insight Engine | No Cloud Functions dependency for insights | Active (Epic 10) |
| ADR-016 | Hybrid Insight Storage | Local-first with Firestore backup | Active (Epic 10) |
| ADR-017 | Phase-Based Priority | Different insights for cold-start vs data-rich | Active (Epic 10) |

## Security Rules Pattern

<!-- Synced from: architecture.md -->

- All user data scoped by `request.auth.uid == userId`
- Unauthenticated access denied
- Cross-user access impossible by design
- Data isolation enforced at Firestore level

## Key Patterns Adopted

### State Management
- React Context for global state (analytics, auth)
- Local component state for UI interactions
- Firestore for persistence

### Error Handling
- Try/catch with user-friendly error messages
- Loading states during async operations
- Graceful degradation for offline

### Code Organization
```
src/
├── components/   # Reusable UI components
├── views/        # Page-level components
├── services/     # Firebase, Gemini API
├── hooks/        # Custom React hooks
├── types/        # TypeScript interfaces
├── utils/        # Pure utility functions
└── config/       # Constants, prompts
```

## Data Flows

### Receipt Scan Flow
```
Camera → Image Capture → Base64 Encode →
Cloud Function → Gemini API → Parse Response →
Apply Mappings → Display in EditView → Save to Firestore
```

### Analytics Data Flow
```
Firestore Query → FilteringService → AnalyticsContext →
Chart Components → User Interaction → Drill-down/Navigation
```

### Insight Generation Flow (Epic 10)
```
Transaction Save → [Async Side-Effect] →
generateInsightForTransaction() →
generateAllCandidates() → [12 Generators] → selectInsight() →
Display InsightCard (or BuildingProfileCard Fallback)
```

**UI Components (Story 10.6):**
- `InsightCard` - Displays insight with icon, title, message; auto-dismiss 5s; manual dismiss
- `BuildingProfileCard` - Fallback for cold-start users without enough data
- `useInsightProfile` - Hook for Firestore profile and local cache management
- CSS animations: `animate-slide-up`, `animate-fade-out` (respects prefers-reduced-motion)

**Generators (Stories 10.3 & 10.4):**
- Transaction-intrinsic (10.3): `biggest_item`, `item_count`, `unusual_hour`, `weekend_warrior`, `new_merchant`, `new_city`, `category_variety`
- Pattern detection (10.4): `merchant_frequency`, `category_trend`, `day_pattern`, `spending_velocity`, `time_pattern`
- **Default Time Skip (post-10.6 fix)**: Time-based generators (`unusual_hour`, `time_pattern`) skip DEFAULT_TIME ("04:04") sentinel value since it indicates "time not available" rather than actual extracted time

**Precomputed Aggregates (Story 10.4):**
- `computeAggregates()` - merchantVisits, categoryTotals
- Stored in LocalInsightCache for O(1) lookups
- Helpers: `getMerchantVisitCount()`, `getCategoryTotal()`

**Selection Algorithm (Story 10.5):**
- `getInsightPriority()` - Returns category priority order based on phase + sprinkle
- `selectInsight()` - Full selection with cooldown filtering, phase priority, category grouping
- `incrementScanCounter()` - Weekday/weekend counters with weekly reset
- `maybeResetCounters()` - Auto-reset on cache retrieval if 7+ days elapsed

**Selection Logic (ADR-017):**
- WEEK_1: 100% QUIRKY_FIRST
- WEEKS_2_3: 66% CELEBRATORY / 33% ACTIONABLE (same weekday/weekend)
- MATURE weekday: 66% ACTIONABLE / 33% CELEBRATORY
- MATURE weekend: 66% CELEBRATORY / 33% ACTIONABLE
- Sprinkle: `scanCounter % 3 === 0` triggers minority type

---

## Code Review Learnings

### Story 10a.1 - Home Screen Consolidation (2025-12-20)

**Pattern Adoption:**
- HistoryFiltersContext reuse: Same filter context for HistoryView and DashboardView
- Component sharing: HistoryFilterBar, TransactionThumbnail, ImageViewer across views
- Service reuse: getDuplicateIds(), filterTransactionsByHistoryFilters()

**Technical Decisions:**
- Session-scoped filter state (filters reset when view unmounts - intentional)
- Page size 10 hardcoded in DashboardView (could use ITEMS_PER_PAGE constant)
- Backward compatibility: onTriggerScan prop kept but unused (prefixed with _)

### Story 11.1 - One Image = One Transaction (2025-12-21)

**Pattern Adoption:**
- Sequential API calls: Process each image individually to maintain 1:1 image-to-transaction mapping
- Modal overlay pattern: BatchUploadPreview and BatchProcessingProgress use fixed modal overlays
- Fire-and-forget for mapping updates: incrementMappingUsage calls are non-blocking

**Technical Decisions:**
- Credit deduction after save: Credits deducted only after successful Firestore save (prevents lost credits on API failure)
- Batch complete delay: 500ms delay before showing BatchSummary (BATCH_COMPLETE_DELAY_MS constant)
- Image removal UX: When removing images leaves 1, automatically switch to single-image flow

**Coverage Notes:**
- Tests added: 30 tests across BatchUploadPreview.test.tsx (16) and BatchProcessingProgress.test.tsx (14)
- Coverage gap: Missing integration test for full processBatchImages flow

---

## Sync Notes

- Architecture stable since Epic 7
- Epic 10 introduces client-side insight engine (ADRs 15-17)
- Security rules pattern consistently applied
- Story 10.3 established generator registry pattern with `canGenerate/generate` interface
- Story 10.4 added 5 pattern detection generators with precomputed aggregates (2025-12-18)
- Story 10.5 implemented full selection algorithm with phase-based priority and sprinkle distribution (2025-12-19)
- Story 10.6 added InsightCard UI layer with async side-effect pattern in App.tsx save flow (2025-12-19)
- Story 10a.1 unified Dashboard+History into consolidated Home view with shared filter context (2025-12-20)
- Story 11.1 added batch image processing with sequential API calls and credit-after-save pattern (2025-12-21)
