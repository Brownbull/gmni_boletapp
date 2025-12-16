# Boletapp Epic 10 - Product Requirements Document

**Author:** Gabe
**Date:** 2025-12-16
**Version:** 1.0
**Epic:** Foundation + Engagement & Insight Engine

---

## Executive Summary

Epic 10 transforms Boletapp from a "data entry tool" into a "financial awareness companion" by implementing meaningful insight delivery at every touchpoint. The epic includes a foundational refactoring sprint to address technical debt, followed by the core Insight Engine implementation that generates contextual financial insights, weekly/monthly summaries, and ethical engagement mechanics.

**This is the differentiator** - without insights, users churn. With insights, they come back.

### What Makes This Special

The Insight Engine delivers contextual "nuggets" of financial awareness that make spending patterns tangible without requiring analyst skills. Each scan completion, weekly digest, and monthly summary provides personalized, actionable insights that transform mundane expense tracking into meaningful financial awareness.

Key differentiator: **Ethical habit formation** - celebrations for savings and under-budget months, not shame mechanics or loss aversion triggers.

---

## Project Classification

**Technical Type:** web_app (PWA)
**Domain:** fintech (expense tracking)
**Complexity:** medium
**Project Context:** Brownfield (existing codebase with 9 completed epics)

This is a feature expansion for an existing production application with:
- 977+ tests (677 unit, 300 integration)
- 31 TypeScript files across 7 logical layers
- Firebase backend (Firestore, Auth, Storage, Cloud Functions)
- Google Gemini AI integration for receipt OCR

---

## Success Criteria

### User-Facing Success
1. **Engagement Increase:** Users report the app feels more "alive" and engaging
2. **Insight Value:** 80%+ of users find at least one insight type useful
3. **Return Rate:** Users open the app to check digests (not just to scan)
4. **Time-to-Insight:** <3 seconds from scan save to insight display

### Technical Success
1. **Foundation Complete:** All Tier 1 refactoring blockers resolved
2. **Insight Coverage:** 5+ insight types generating based on user data
3. **Notification Delivery:** Push notifications working for scan complete and digests
4. **Test Coverage:** All existing tests pass + new tests for insight engine
5. **Performance:** No regression in app load time or scan processing speed

### Business Metrics
- Weekly Summary open rate: >40% of active users
- Monthly Summary engagement: >60% of active users
- User-reported satisfaction with insights: >4/5 rating

---

## Product Scope

### MVP - Minimum Viable Product (Epic 10)

**Phase 0: Foundation Sprint (~20 hours)**
- Extract `transactionQuery.ts` service (filtering logic consolidation)
- Split `computeBarData()` into 4 reusable functions
- Generalize change detection in EditView
- Extract `useLearningPhases` hook
- Refactor App.tsx state management (reduce from 21 to ~10 state variables)
- Update tests to maintain coverage

**Phase 1: Insight Engine Core**
- Insight generation engine with 7 insight types
- Scan Complete insight toast (contextual, not generic confetti)
- Weekly Summary view (Friday 7pm, configurable)
- Monthly Summary view (end-of-month celebration)
- Analytics Insight Cards (rotating insights on trends screen)
- Push notification integration for digests
- Pattern detection engine (time-of-day, weekend/weekday patterns)

### Growth Features (Post-MVP)

**Epic 11-13 (Dependent on Epic 10):**
- Quick Save flow with animated item reveal (Epic 11)
- Batch mode with batch insights (Epic 12)
- Animated visualizations and chart transitions (Epic 13)

**Post-Launch Enhancements:**
- Prediction cards ("At this rate, you'll spend $X on groceries this month")
- Trend alerts ("Spending on restaurants up 30% vs last month")
- Budget integration (if/when budgeting feature added)

### Vision (Future)

- Insight avatars with personalities
- Family insights (household combined view)
- AI-powered spending recommendations
- Natural language insight queries ("How much did I spend on coffee last month?")

---

## Domain-Specific Requirements

### Fintech Considerations

**Data Privacy:**
- All financial data stored locally in user's Firestore collection
- No cross-user data sharing for insights
- Insights computed client-side or in user-scoped cloud functions

**Accuracy:**
- Insight calculations must match Analytics totals exactly
- No approximations or estimates in financial summaries
- Clear indication of data completeness (e.g., "Based on 47 receipts this month")

**Ethical Design (from research docs):**
- NO streaks that shame users for missing days
- NO "you're falling behind" messaging
- NO loss aversion triggers
- YES: Celebrate savings, consistency, and discovery
- YES: Positive framing ("You saved $X" not "You overspent $Y")

---

## User Experience Principles

### Visual Personality
- **Warm and encouraging** - Latin American fintech patterns (Nubank, Tenpo inspiration)
- **Celebratory without being excessive** - Confetti for under-budget months, not every save
- **Progressive disclosure** - Start simple, reveal depth as user engages

### Key Interactions

**Scan Complete Flow:**
1. User saves scanned receipt
2. Brief processing indicator (if insight requires calculation)
3. Toast appears with contextual insight + total saved
4. Toast auto-dismisses after 4 seconds OR user taps to dismiss
5. User can tap toast to see more details (optional)

**Weekly Summary Flow:**
1. Friday 7pm push notification (opt-in): "Tu resumen semanal está listo"
2. User opens app → Summary view appears
3. Shows: period, total, top 5 categories, comparison to last week
4. "Ver más" button → Analytics drill-down for that week
5. Dismiss → Returns to normal app state

**Monthly Summary Flow:**
1. End-of-month push notification: "¡Mes completo! Mira tu resumen"
2. Summary view with celebration animation (if under budget or improved)
3. Month-over-month comparison with trend arrows
4. Category breakdown with highlights (biggest increase/decrease)
5. "Ver más" → Full monthly analytics

---

## Functional Requirements

### Insight Engine (Core System)

**FR1:** System can generate `frequency` insights ("3ra boleta de restaurante esta semana")
**FR2:** System can generate `merchant_concentration` insights ("40% de tu gasto es en Líder")
**FR3:** System can generate `day_pattern` insights ("Gastas 3x más los fines de semana")
**FR4:** System can generate `time_pattern` insights ("Compras de noche cuestan 25% más")
**FR5:** System can generate `category_growth` insights ("Restaurante subió 40% vs mes pasado")
**FR6:** System can generate `improvement` insights ("¡Gastaste 15% menos en X!")
**FR7:** System can generate `milestone` insights ("¡Primer mes completo!")
**FR8:** System can select most relevant insight based on confidence scoring
**FR9:** System enforces minimum data point requirements per insight type
**FR10:** System can combine multiple insight types when relevant

### Scan Complete Insights

**FR11:** Users see contextual insight toast after every successful scan save
**FR12:** Toast displays: insight text, total amount saved, dismiss action
**FR13:** Toast auto-dismisses after configurable timeout (default 4s)
**FR14:** Users can tap toast for more detail (optional expansion)
**FR15:** System prioritizes insights: new merchant → biggest purchase → repeat category → merchant total
**FR16:** System falls back to generic positive message if no specific insight available

### Weekly Summary

**FR17:** Users can view weekly spending summary in-app
**FR18:** Weekly summary shows: period dates, total spending, comparison to prior week
**FR19:** Weekly summary shows top 5 categories with amounts
**FR20:** Users can navigate from weekly summary to detailed analytics for that period
**FR21:** Users can dismiss weekly summary to return to normal app state
**FR22:** System tracks when user has viewed weekly summary (for notification logic)

### Monthly Summary

**FR23:** Users can view monthly spending summary in-app
**FR24:** Monthly summary shows: total spending, month-over-month change with trend indicator
**FR25:** Monthly summary shows category breakdown with change indicators (↑↓)
**FR26:** Monthly summary celebrates under-budget or improved months with appropriate animation
**FR27:** Users can navigate from monthly summary to detailed analytics for that period
**FR28:** System tracks monthly summary view completion

### Analytics Insight Cards

**FR29:** Users see rotating insight cards on Analytics screen
**FR30:** Insight cards show personalized insights based on viewed time period
**FR31:** Users can dismiss insight cards (remembers dismissal per insight type)
**FR32:** System refreshes insight cards when analytics data changes

### Push Notifications

**FR33:** Users can opt-in/out of push notifications in Settings
**FR34:** System sends push notification when scan processing completes (if app backgrounded)
**FR35:** System sends weekly digest notification (opt-in, default Friday 7pm)
**FR36:** System sends monthly milestone notification (opt-in)
**FR37:** Push notifications deep-link to relevant app view
**FR38:** System respects device notification settings

### Pattern Detection

**FR39:** System detects time-of-day spending patterns (morning/afternoon/evening/night)
**FR40:** System detects day-of-week patterns (weekday vs weekend)
**FR41:** System detects spending velocity changes (acceleration/deceleration)
**FR42:** System requires minimum data points before generating pattern insights (configurable)

### Foundation (Refactoring)

**FR43:** Transaction filtering logic consolidated in reusable service
**FR44:** Analytics aggregation functions separated into composable units
**FR45:** App state management simplified with reduced state variable count
**FR46:** Learning prompt orchestration extracted into reusable hook
**FR47:** Change detection generalized for reuse in Tags/Groups features

---

## Non-Functional Requirements

### Performance

**NFR1:** Insight generation completes in <500ms for typical user data (<1000 transactions)
**NFR2:** Weekly/Monthly summary views load in <1s
**NFR3:** Push notification delivery within 30 seconds of trigger event
**NFR4:** No regression in app initial load time (current baseline: <3s)
**NFR5:** Insight cards don't block main thread or cause jank

### Security

**NFR6:** All insight data computed from user's own transaction data only
**NFR7:** Push notification tokens stored securely in user's Firestore document
**NFR8:** No financial data included in push notification payloads (only triggers)
**NFR9:** Insight engine respects existing Firestore security rules

### Scalability

**NFR10:** Insight engine scales linearly with transaction count (O(n) or better)
**NFR11:** Pattern detection algorithms handle 5+ years of transaction data
**NFR12:** Weekly/Monthly summaries don't recompute on every view (caching strategy)

### Accessibility

**NFR13:** Insight toasts meet WCAG 2.1 AA contrast requirements
**NFR14:** Summary views navigable via keyboard
**NFR15:** Push notifications include text content (not just actions)
**NFR16:** Animation respects `prefers-reduced-motion` setting

---

## Technical Dependencies

### Internal Dependencies
- Epic 9 completed (PWA push notification infrastructure from story 9-18)
- Existing Analytics Context and state management
- Existing transaction data model and Firestore service

### External Dependencies
- Firebase Cloud Messaging (FCM) for push notifications
- Service Worker (existing from PWA setup)

### Research Documents (Input)
- [habits loops.md](../uxui/research/habits%20loops.md) - Insight Engine specification
- [good habits.md](../uxui/research/good%20habits.md) - Ethical animation patterns
- [some ui options.md](../uxui/research/some%20ui%20options.md) - UI component specifications
- [reddit_post.md](../uxui/research/reddit_post.md) - Engagement lessons learned

---

## Story Map

```
Epic 10: Foundation + Engagement & Insight Engine (~35 points)
│
├── Story 10.0: Foundation Sprint (8 points) ⭐ PREREQUISITE
│   Dependencies: None
│   Deliverable: Refactored analytics, filtering service, App.tsx state cleanup
│
├── Story 10.1: Insight Engine Core (5 points)
│   Dependencies: Story 10.0
│   Deliverable: Insight generation service with 7 insight types
│
├── Story 10.2: Scan Complete Insights (3 points)
│   Dependencies: Story 10.1
│   Deliverable: Contextual insight toast after every save
│
├── Story 10.3: Weekly Summary View (5 points)
│   Dependencies: Story 10.1
│   Deliverable: In-app weekly digest with comparison data
│
├── Story 10.4: Monthly Summary View (5 points)
│   Dependencies: Story 10.1
│   Deliverable: Monthly celebration + comprehensive breakdown
│
├── Story 10.5: Analytics Insight Cards (3 points)
│   Dependencies: Story 10.1
│   Deliverable: Rotating insight cards on Analytics screen
│
├── Story 10.6: Push Notification Integration (3 points)
│   Dependencies: Stories 10.2, 10.3, 10.4 + Epic 9 PWA notifications
│   Deliverable: Scan complete + digest notifications
│
├── Story 10.7: Pattern Detection Engine (3 points)
│   Dependencies: Story 10.1
│   Deliverable: Time-of-day, weekend/weekday, velocity patterns
│
└── Story 10.99: Epic Release Deployment (2 points)
    Dependencies: All previous stories
    Deliverable: Production deployment, E2E verification
```

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Insight engine performance with large datasets | Medium | High | Implement pagination/sampling for >1000 transactions |
| Push notifications fail on certain devices | Medium | Medium | Graceful degradation to in-app notifications |
| Refactoring introduces regressions | Medium | High | High test coverage, incremental PRs, staging validation |
| Users find insights intrusive | Low | Medium | Dismissible toasts, opt-out settings, A/B testing |
| Insight accuracy doesn't match analytics | Medium | High | Shared calculation functions, automated tests |

---

## Design Decisions (Resolved)

### Weekly Summary Timing
**Decision:** Friday 7pm fixed (simpler MVP) with dedicated home screen section.
- Push notification triggers weekly summary availability
- Home screen shows **Reports Section** with FIFO order (most recent on top)
- Visual indicator for new/unseen reports
- Maximum 5 reports displayed, with "View All" option
- Reports marked as "seen" after user views them

### Insight Language
**Decision:** Follow app language setting (English/Spanish)
- All insight text localized based on user's language preference
- Same insight engine, different string resources

### Notification Strategy
**Decision:** Notifications only for meaningful events:
- New reports available (weekly/monthly summaries)
- Patterns detected (significant spending changes)
- Scan/batch scan completed and ready for review
- **NO:** Generic engagement notifications, "we miss you" spam

### Insight Caching Strategy
**Decision:** Weekly batch cache with on-save trigger
- Weekly insights computed every Friday (before weekly summary notification)
- Scan Complete insights computed immediately on save (single insight, not full recalc)
- Monthly insights computed at end of month
- No full recalculation between scheduled times (performance-friendly)

### Insight Types - MVP vs Deferred
**MVP (5 core types in Story 10.1):**
- `frequency` - "3ra boleta de restaurante esta semana"
- `merchant_concentration` - "40% de tu gasto es en Líder"
- `category_growth` - "Restaurante subió 40% vs mes pasado"
- `improvement` - "¡Gastaste 15% menos en X!"
- `milestone` - "¡Primer mes completo!"

**Deferred to Story 10.7 (Pattern Detection):**
- `day_pattern` - "Gastas 3x más los fines de semana"
- `time_pattern` - "Compras de noche cuestan 25% más"

---

## Next Steps

1. **Architecture Review:** Architect reviews foundation sprint scope and technical approach
2. **UX Design:** UX Designer creates mockups for insight toasts, summary views, and insight cards
3. **Story Breakdown:** Scrum Master creates detailed stories with acceptance criteria
4. **Sprint Planning:** Team commits to Epic 10 sprint with foundation sprint as first week

---

_This PRD captures the essence of Epic 10 - transforming Boletapp from a data entry tool into a financial awareness companion through meaningful, ethical insight delivery._

_Created through collaborative discovery between Gabe and the BMAD PM Agent (John)._
