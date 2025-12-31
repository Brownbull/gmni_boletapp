# Critical Use Cases for E2E Testing

**Document Version:** 1.0
**Created:** 2025-12-23
**Epic:** 13 - UX Design & Mockups
**Story:** 13.1 - Critical Use Cases Document
**Purpose:** Provide E2E scenarios for Claude Code Chrome extension testing and mockup validation

---

## Overview

This document defines 8 critical user journeys that represent the core value proposition of Boletapp. Each use case is mapped to a persona from our user research and includes:

- Step-by-step flows with expected UI states
- Success metrics for validation
- Edge cases and error handling
- Claude Code Chrome extension test scenarios

### Implementation Status Legend

| Status | Meaning |
|--------|---------|
| 🟢 **CURRENT** | Feature exists in production - E2E tests can run today |
| 🟡 **FUTURE** | Epic 13-15 design - Use for mockup validation only |

### Source Documents

- [Brainstorming Session 2025-12-22](../analysis/brainstorming-session-2025-12-22.md) - UX concepts for Epics 13-15
- [UX Design Specification](../ux-design-specification.md) - Design system and personas
- [Epic 13 Definition](../sprint-artifacts/epic13/epic-13-ux-design-mockups.md) - Mockup epic scope

### Personas Summary

| Persona | Profile | Primary Need | Use Case |
|---------|---------|--------------|----------|
| New User | First-time user, no history | Quick first success | UC1 🟢 |
| María | 38, overwhelmed parent | "¿Dónde se fue la plata?" | UC2 🟡 |
| Diego | 26, young professional | Goal progress tracking | UC3 🟡 |
| Rosa | 62, abuelita | Simple, accessible summaries | UC4 🟡 |
| Tomás | 34, disciplined accountant | Pattern awareness | UC5 🟡 |
| Power User | Experienced, high volume | Efficiency at scale | UC6 🟢 |
| Returning User | Repeat merchant visitor | Seamless auto-categorization | UC7 🟢 |
| Active User | 20+ transactions, insight-ready | Discover spending patterns | UC8 🟢 |

---

## Use Case 1: First Scan Experience 🟢 CURRENT

### Persona
**New User** - First-time user with no transaction history, just installed the app

### Preconditions
- User has installed Boletapp PWA
- User has signed in with Google
- User has granted camera permissions
- User has at least 1 scan credit
- No previous transactions exist

### User Goal
Complete first receipt scan and feel successful in under 60 seconds

### Steps

| # | Action | Expected UI State | Transition |
|---|--------|-------------------|------------|
| 1 | User taps "Scan" button on Home | Camera view opens with scan overlay | Slide up modal |
| 2 | User captures receipt image | Processing overlay appears on grayed EditView | Crossfade |
| 3 | System processes receipt | Progress indicator shows "Processing receipt..." | None (overlay) |
| 4 | Processing completes | Quick Save Card appears (if confidence ≥85%) | Slide up |
| 5 | User taps "Quick Save" | Transaction saved, celebration animation plays | Fade + confetti |
| 6 | Celebration completes | Home view with first transaction visible | Slide down |

### Alternative Path: Edit Flow

| # | Action | Expected UI State | Transition |
|---|--------|-------------------|------------|
| 4a | Processing completes (confidence <85%) | EditView with progressive item reveal | Staggered fade-in |
| 5a | User reviews/edits fields | EditView with animated items | None |
| 6a | User taps "Save" | Transaction saved, insight card appears | Fade transition |

### Success Criteria
- **Time:** ≤60 seconds from scan to saved transaction
- **Taps:** ≤3 taps for Quick Save path
- **Feedback:** Clear visual confirmation of success
- **Emotion:** User feels accomplished, not confused

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Poor image quality | Error overlay: "Try again with better lighting" + retry button |
| No receipt detected | Error overlay: "No receipt found" + manual entry option |
| Network timeout | Error overlay: "Connection issue" + retry/cancel buttons |
| Zero credits | Pre-scan warning: "No credits remaining" + upgrade prompt |

### Error States

| Error | UI Treatment | Recovery Path |
|-------|--------------|---------------|
| Camera permission denied | Modal explaining why camera needed + link to settings | User grants permission |
| API rate limit | "Too many scans, try again in 1 minute" | Wait and retry |
| Gemini API failure | "Processing failed" + retry/manual entry options | Retry or manual |

### Chrome Extension Test Scenario

```gherkin
Feature: First Scan Experience

  Background:
    Given user is signed in with no transaction history
    And user has camera permissions granted
    And user has at least 1 scan credit

  Scenario: Quick Save path for high-confidence receipt
    When user taps the Scan button
    Then camera view should open with scan overlay
    When user captures a clear supermarket receipt
    Then processing overlay should appear within 500ms
    And progress indicator should show "Processing..."
    When processing completes with confidence >= 85%
    Then Quick Save Card should slide up
    And merchant name should be visible
    And total amount should be visible
    When user taps Quick Save
    Then celebration animation should play
    And transaction should be saved to Firestore
    And Home view should show the new transaction

  Scenario: Edit path for low-confidence receipt
    When user captures a blurry receipt
    And processing completes with confidence < 85%
    Then EditView should appear with items revealed progressively
    And animation should respect prefers-reduced-motion

  Scenario: Error recovery for poor image
    When user captures an image with no receipt detected
    Then error overlay should appear with "No receipt found"
    And retry button should be visible
    And manual entry button should be visible
```

---

## Use Case 2: Weekly Health Check 🟡 FUTURE

> **Implementation Note:** This use case describes the Epic 13-15 UX redesign with breathing polygon and story cards. Use for mockup validation only - E2E tests cannot run against current implementation.

### Persona
**María** - 38, part-time worker, manages household budget, often wonders "¿Dónde se fue la plata?"

### Preconditions
- User has 10+ transactions over past 4 weeks
- User has at least 3 spending categories with data
- Weekly summary is available (minimum 3 transactions this week)
- App has not been opened for 2+ days

### User Goal
Quickly understand spending patterns without complex analysis

### Steps

| # | Action | Expected UI State | Transition |
|---|--------|-------------------|------------|
| 1 | User opens app | Home view with breathing polygon visible | Fade in + breathe |
| 2 | User views polygon | Polygon shows 3-6 vertices based on top categories | Breathing animation |
| 3 | User taps polygon center | Weekly summary story cards appear | Slide up |
| 4 | User swipes through cards | Card 1: Total spent, Card 2-5: Category breakdowns | Horizontal swipe |
| 5 | User sees "Restaurants up 23%" | "Intentional?" prompt appears | Slide in |
| 6 | User taps "Birthday dinner" | Response recorded, positive acknowledgment | Fade out |
| 7 | User continues swiping | Remaining cards shown | Horizontal swipe |
| 8 | User reaches last card | "Your week at a glance" summary | None |

### Success Criteria
- **Time:** Answers "where did my money go?" in ≤10 seconds
- **Clarity:** Each category change understood without percentages
- **Emotion:** Feels informed, not judged
- **Agency:** Can mark spending as intentional

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No data this week | "No transactions this week" card with gentle prompt to scan |
| Only 1-2 categories | Polygon shows triangle/square, simplified summary |
| All categories unchanged | "Steady week!" positive message instead of changes |
| Extreme outlier (10x normal) | Emotional Airlock pattern triggered instead |

### Error States

| Error | UI Treatment | Recovery Path |
|-------|--------------|---------------|
| Data load failure | Polygon shows loading shimmer, retry after 3s | Auto-retry |
| Partial data | Show available data, note "Some transactions loading" | Continue updating |

### Chrome Extension Test Scenario

```gherkin
Feature: Weekly Health Check

  Background:
    Given María has 15 transactions across 4 categories this month
    And restaurant spending increased 23% from last week

  Scenario: Quick health check with intentional prompt
    When María opens the app after 3 days
    Then breathing polygon should be visible with 4 vertices
    And polygon should have subtle breathing animation
    When María taps the polygon center
    Then weekly summary story should slide up
    And first card should show total spent this week
    When María swipes to second card
    Then card should show "Restaurants up 23%"
    And simple arrow ↑ should be visible
    When María sees "Intentional?" prompt
    Then options should include "Birthday dinner" or similar
    When María taps "Birthday dinner"
    Then positive acknowledgment should appear
    And response should be recorded in analytics

  Scenario: Polygon adapts to category count
    Given user only has 3 spending categories
    Then polygon should display as triangle
    And each vertex should be tappable for drill-down

  Scenario: Steady week messaging
    Given all categories are within 5% of last week
    Then summary should show "Steady week!" message
    And no "Intentional?" prompts should appear
```

---

## Use Case 3: Goal Progress 🟡 FUTURE

> **Implementation Note:** Goals/Savings GPS is planned for Epic 15 (Advanced Features). Use for mockup validation only.

### Persona
**Diego** - 26, software developer, earns well but doesn't save, wants to save for Japan trip

### Preconditions
- User has created a goal: "🗾 Japan Trip" for $2,000,000 CLP
- User has 8+ weeks of transaction history
- Goal has been active for 2+ weeks
- User made progress since last check

### User Goal
See tangible progress toward goal without complex math

### Steps

| # | Action | Expected UI State | Transition |
|---|--------|-------------------|------------|
| 1 | User navigates to Goals tab | Goals list with GPS visualization | Slide left |
| 2 | User sees "🗾 Japan Trip" card | GPS shows current position on path | Fade in |
| 3 | User views ETA | "Arriving by: April 2026" displayed | None |
| 4 | User sees progress update | "3 days closer this week!" toast | Slide in bottom |
| 5 | User taps goal card | Detailed GPS view opens | Slide up |
| 6 | User views alternate routes | "Save 10% more = 2 months sooner" shown | Fade in |
| 7 | User sees trade-off insight | "This week's coffee: 1 day further from Tokyo" | Slide in |
| 8 | User swipes insight away | Insight dismissed, main GPS view | Swipe out |

### Success Criteria
- **Clarity:** ETA understood without mental math
- **Motivation:** Feels encouraged by "3 days closer"
- **Trade-off visibility:** Understands choices without guilt
- **Emotion:** Motivated, not anxious

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No progress this week | "Stay the course - every week counts" encouragement |
| Moved backward | "Slight detour" messaging, not "you failed" |
| Goal nearly complete | Celebration sequence, "Almost there!" |
| New goal, no data | "Tracking started! Check back next week" |

### Error States

| Error | UI Treatment | Recovery Path |
|-------|--------------|---------------|
| Goal calculation failure | Show last known state, background retry | Auto-updates |
| Network unavailable | Show cached progress, note "Offline mode" | Sync when online |

### Chrome Extension Test Scenario

```gherkin
Feature: Goal Progress

  Background:
    Given Diego has a goal "Japan Trip" for $2,000,000 CLP
    And goal has been active for 3 weeks
    And Diego saved $50,000 CLP this week

  Scenario: View goal progress with GPS visualization
    When Diego navigates to Goals tab
    Then "Japan Trip" card should be visible with GPS
    And ETA should show realistic arrival date
    And progress toast should show "3 days closer this week!"
    When Diego taps the goal card
    Then detailed GPS view should open
    And current position marker should be visible
    And progress percentage should be accurate

  Scenario: View trade-off insight
    When Diego views goal detail
    Then alternate routes section should be visible
    And "Save 10% more = 2 months sooner" should appear
    When trade-off insight appears
    Then it should reference specific spending (e.g., coffee)
    And should show equivalent goal days

  Scenario: Setback handling
    Given Diego overspent by $30,000 CLP this week
    When Diego views goal progress
    Then message should be "Slight detour - happens to everyone"
    And should NOT use negative language like "failed" or "lost"
```

---

## Use Case 4: Simple Summary 🟡 FUTURE

> **Implementation Note:** Arrow-based summary view is planned for Epic 13-14. Use for mockup validation only.

### Persona
**Rosa** - 62, abuelita, 40 years of paper ledgers, grandson taught her the app

### Preconditions
- User has 5+ transactions this week
- User has used app for 2+ weeks
- Weekly data is available for comparison
- App language set to Spanish

### User Goal
Understand spending changes in simple, familiar terms

### Steps

| # | Action | Expected UI State | Transition |
|---|--------|-------------------|------------|
| 1 | User opens app | Home view with simple summary card | Fade in |
| 2 | User views summary | Arrow indicators: ↑↓→ for each category | None |
| 3 | User sees "Carnes ↑" | "Carnes subió harto" message | Highlight animation |
| 4 | User taps category | Simple explanation appears | Expand animation |
| 5 | User reads explanation | "Gastaste más en carnes. ¿Asado familiar?" | None |
| 6 | User confirms understanding | Taps anywhere to dismiss | Fade out |
| 7 | User views next category | Same simple pattern continues | None |

### Success Criteria
- **Comprehension:** Understands without asking grandson for help
- **Language:** Colloquial Chilean Spanish ("harto" not "significativamente")
- **Simplicity:** No percentages, no charts
- **Speed:** Under 5 seconds per category understanding

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No change in category | "→ Igual que siempre" (same as always) |
| First week of data | "Tu primera semana - ¡bienvenida!" with no comparisons |
| Single transaction only | Summary skipped, show individual transaction |
| All categories up | Friendly acknowledgment, not alarming |

### Error States

| Error | UI Treatment | Recovery Path |
|-------|--------------|---------------|
| Summary calculation fails | Show simple transaction list instead | Manual summary |
| Font too small | Respect system font scaling | Already handled |

### Chrome Extension Test Scenario

```gherkin
Feature: Simple Summary

  Background:
    Given Rosa has 8 transactions this week
    And "Carnes" category increased 35% from last week
    And "Verduras" category stayed the same
    And app language is Spanish

  Scenario: View simple arrow summary
    When Rosa opens the app
    Then simple summary card should be visible
    And arrow indicators ↑↓→ should be shown
    And "Carnes" should show ↑ arrow
    And "Verduras" should show → arrow

  Scenario: Understand colloquial explanation
    When Rosa sees "Carnes ↑" indicator
    And Rosa taps the category
    Then explanation should say "Carnes subió harto"
    And should NOT use percentage like "35%"
    And should include playful guess "¿Asado familiar?"

  Scenario: Accessible font sizing
    Given Rosa has increased system font size to 150%
    Then all text should scale appropriately
    And arrows should remain clear and large
```

---

## Use Case 5: Out-of-Character Alert 🟡 FUTURE

> **Implementation Note:** Emotional Airlock pattern and out-of-character detection are planned for Epic 15 (Advanced Features). Use for mockup validation only.

### Persona
**Tomás** - 34, disciplined accountant, 8 months of history, drifting without realizing

### Preconditions
- User has 8+ months of transaction history
- User has established spending patterns
- Current spending deviates significantly from pattern (>50%)
- Deviation is in a category user normally controls well

### User Goal
Become aware of pattern change without feeling attacked

### Steps

| # | Action | Expected UI State | Transition |
|---|--------|-------------------|------------|
| 1 | User opens app | Normal home view appears briefly | Fade in |
| 2 | System detects pattern deviation | Airlock Step 1 overlay appears | Gentle fade |
| 3 | User reads curiosity fact | "¿Sabías que el 73% de las personas..." | None |
| 4 | User taps to continue | Airlock Step 2 appears | Crossfade |
| 5 | User reads playful brace | "Los pulpos tienen 3 corazones..." | None |
| 6 | User taps to continue | Airlock Step 3: The Reveal | Crossfade |
| 7 | User sees "Tu Espejo Honesto" | Pattern deviation shown clearly | Expand animation |
| 8 | User sees response options | "Fue intencional" / "No me había dado cuenta" | Slide in |
| 9 | User taps response | Acknowledgment, returns to home | Fade out |

### Success Criteria
- **Awareness:** User understands the pattern change
- **Safety:** User doesn't feel judged or attacked
- **Preparation:** Emotional Airlock reduces defensiveness
- **Agency:** User chooses how to interpret the data

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| User skips airlock | "Skip" option available, goes directly to reveal |
| Multiple patterns detected | Show most significant one only, queue others |
| Pattern already acknowledged | Don't show same alert twice in 7 days |
| Positive deviation (spending down) | Different flow: celebration, not airlock |

### Error States

| Error | UI Treatment | Recovery Path |
|-------|--------------|---------------|
| Pattern detection fails | No alert shown, continue to home | Silent failure |
| User dismisses mid-flow | Save progress, show option to resume later | Resume option |

### Chrome Extension Test Scenario

```gherkin
Feature: Out-of-Character Alert

  Background:
    Given Tomás has 8 months of transaction history
    And Tomás normally spends $50,000/week on dining
    And this week Tomás spent $150,000 on dining (3x normal)

  Scenario: Emotional Airlock full flow
    When Tomás opens the app
    Then Airlock Step 1 should appear
    And should show normalizing statistic about spending blindspots
    When Tomás taps to continue
    Then Airlock Step 2 should appear
    And should show playful/absurdist fact (octopus hearts)
    When Tomás taps to continue
    Then Airlock Step 3 should appear
    And should show "Tu Espejo Honesto" framing
    And should display the spending deviation clearly
    And should offer "Fue intencional" and "No me había dado cuenta"
    When Tomás taps "Fue intencional"
    Then acknowledgment should appear
    And response should be recorded
    And home view should resume

  Scenario: Skip airlock option
    When Tomás sees Airlock Step 1
    And taps "Skip" button
    Then Airlock Step 3 (reveal) should appear directly
    And airlock preference should be saved for future

  Scenario: Non-judgmental language
    Then NO message should use words like "overspent", "bad", "failed"
    And all messages should use observational language
    And "different" should be used instead of "wrong"
```

---

## Use Case 6: Batch Scan Session 🟢 CURRENT

### Persona
**Power User** - Experienced user, scans multiple receipts from weekly shopping trip

### Preconditions
- User has 5 receipts to scan
- User has 5+ scan credits
- User is familiar with the app flow
- User values efficiency over review

### User Goal
Scan and save 5 receipts in under 3 minutes

### Steps

| # | Action | Expected UI State | Transition |
|---|--------|-------------------|------------|
| 1 | User taps gallery icon OR long-presses scan button | Batch capture UI appears | Slide up |
| 2 | User selects/captures multiple images | Thumbnails appear in preview grid | Add animation |
| 3 | User captures receipts 2-5 | Thumbnails accumulate (max 10) | Add animations |
| 4 | User taps "Procesar lote" | Parallel processing view appears | Crossfade |
| 5 | Processing runs (3 concurrent max) | Progress bars for each receipt | Real-time updates |
| 6 | Processing completes | Batch summary card appears | Slide up |
| 7 | User reviews summary | 5 transactions listed with confidence indicators | None |
| 8 | User taps "Save All" | All transactions saved | Progress animation |
| 9 | Aggregate insight appears | "5 receipts totaling $X - your biggest category was Y" | Slide in |
| 10 | User dismisses insight | Home view with 5 new transactions | Fade out |

### Success Criteria
- **Time:** ≤3 minutes for 5 receipts (36 seconds average per receipt)
- **Efficiency:** Single "Save All" action for batch
- **Feedback:** Aggregate insight rewards the effort
- **Accuracy:** 90%+ receipts saved without manual edit

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| 1 receipt fails processing | Show in summary with "Edit Required" badge |
| Credit warning mid-batch | "2 credits remaining" warning before continuing |
| All receipts low confidence | Summary shows all as "Review Suggested" |
| User cancels mid-capture | Confirm dialog, option to save captured so far |

### Error States

| Error | UI Treatment | Recovery Path |
|-------|--------------|---------------|
| Processing timeout | Show partial results, retry option for failed | Individual retry |
| All processing fails | Error summary, option to retry all or switch to single | Retry or single mode |
| Save All fails | Retry button, individual save fallback | Retry or save one by one |

### Chrome Extension Test Scenario

```gherkin
Feature: Batch Scan Session

  Background:
    Given Power User has 10 scan credits
    And Power User has 5 receipts ready

  Scenario: Complete batch scan flow
    When user taps gallery icon OR long-presses scan button
    Then batch capture UI should appear
    When user selects 5 images from gallery
    Then 5 thumbnails should appear in preview grid
    And each image should add with animation
    When user taps "Procesar lote"
    Then parallel processing view should appear
    And progress should show individual receipt status
    And max 3 receipts should process concurrently
    When all processing completes
    Then batch summary should appear
    And all 5 transactions should be listed
    And confidence indicators should be visible

  Scenario: Save all with aggregate insight
    When user taps "Save All" on batch summary
    Then all 5 transactions should save to Firestore
    And aggregate insight should appear
    And insight should mention total amount
    And insight should highlight biggest category
    When user dismisses insight
    Then Home view should show 5 new transactions

  Scenario: Partial failure handling
    Given receipt #3 fails processing due to poor image
    When processing completes
    Then summary should show 4 ready + 1 "Edit Required"
    And user should be able to fix failed receipt
    Or user should be able to save the 4 successful ones

  Scenario: Credit warning during capture
    Given user has 3 credits remaining
    When user captures receipt #3
    Then warning should appear "2 credits remaining"
    And user should be able to continue or stop
```

---

## Use Case 7: Trust Merchant (Repeat Visit) 🟢 CURRENT

### Persona
**Returning User** - User who has scanned from this merchant before and trusted it

### Preconditions
- User has previously saved a transaction from "Supermercado Líder"
- User confirmed "Remember this store?" prompt on first visit
- User has at least 1 scan credit

### User Goal
Experience seamless auto-categorization for trusted merchants

### Steps

| # | Action | Expected UI State | Transition |
|---|--------|-------------------|------------|
| 1 | User scans receipt from trusted merchant | Processing overlay appears | Crossfade |
| 2 | Processing completes | Quick Save Card shows with pre-filled category | Slide up |
| 3 | User sees "Supermercado Líder - Supermercado" | Category auto-applied from trust | None |
| 4 | User taps "Quick Save" | Transaction saved with trusted category | Fade + success |
| 5 | No trust prompt shown | (Merchant already trusted) | N/A |

### Alternative Path: First Visit Trust Prompt

| # | Action | Expected UI State | Transition |
|---|--------|-------------------|------------|
| 1 | User saves transaction from NEW merchant | Transaction saved | Success animation |
| 2 | TrustMerchantPrompt appears | "¿Recordar esta tienda?" with merchant name | Slide up |
| 3 | User taps "Sí, recordar" | Merchant saved to trusted list | Fade out |
| 4 | Future scans auto-categorize | Quick Save eligible with pre-filled category | N/A |

### Success Criteria
- **Speed:** Repeat visits save faster than first visit
- **Accuracy:** Trusted category applied correctly
- **Control:** User can remove trust from Settings anytime

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Merchant name variation (case/spacing) | Fuzzy match to existing trust |
| User removed trust, scans again | Treat as new merchant, show trust prompt |
| Multiple merchants with similar names | Exact match required for trust |

### Error States

| Error | UI Treatment | Recovery Path |
|-------|--------------|---------------|
| Trust save fails | Silent failure, no trust saved | Prompt again on next save |
| Trust lookup fails | Fall back to no auto-category | Normal Quick Save flow |

### Chrome Extension Test Scenario

```gherkin
Feature: Trust Merchant

  Background:
    Given user has trusted "Supermercado Líder" with category "Supermercado"
    And user has 1 scan credit

  Scenario: Auto-categorize trusted merchant
    When user scans a receipt from "Supermercado Líder"
    And processing completes with confidence >= 85%
    Then Quick Save Card should appear
    And category should be pre-filled as "Supermercado"
    And no trust prompt should appear after save

  Scenario: First visit trust prompt
    Given user has NOT trusted "Farmacia Cruz Verde"
    When user saves a transaction from "Farmacia Cruz Verde"
    Then TrustMerchantPrompt should appear
    And should ask "¿Recordar esta tienda?"
    When user taps "Sí, recordar"
    Then merchant should be added to trusted list
    And future scans should auto-categorize

  Scenario: Remove trust from settings
    When user navigates to Settings
    And opens Trusted Merchants list
    Then "Supermercado Líder" should be visible
    When user taps remove on "Supermercado Líder"
    Then merchant should be removed from trusted list
    And next scan should show trust prompt again
```

---

## Use Case 8: Insight Discovery 🟢 CURRENT

### Persona
**Active User** - User with 20+ transactions who receives insights after scans

### Preconditions
- User has 20+ transactions over 2+ weeks
- User has built an insight profile (past cold-start phase)
- Insight cooldowns allow new insight display

### User Goal
Discover interesting patterns about spending habits

### Steps

| # | Action | Expected UI State | Transition |
|---|--------|-------------------|------------|
| 1 | User saves a transaction | Transaction saved, InsightCard appears | Slide up |
| 2 | User sees insight | "New merchant! First time at Café Altura" | Auto-dismiss 5s |
| 3 | User taps insight (optional) | Insight detail or dismisses | Fade out |
| 4 | User navigates to Insights tab | InsightsView with history | Slide left |
| 5 | User browses past insights | Paginated list of InsightRecords | Scroll |
| 6 | User taps an insight | InsightDetailModal opens | Slide up |
| 7 | User taps "View Transaction" | Navigate to EditView with transaction | Slide right |

### Success Criteria
- **Relevance:** Insights feel personalized, not random
- **Non-blocking:** Insights never block transaction save (async)
- **Discoverability:** User finds Insights tab and browses history
- **Emotion:** User feels curious, not overwhelmed

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Cold-start user (< 5 transactions) | BuildingProfileCard shown instead of insight |
| All insights on cooldown | No insight shown, silent skip |
| Time-based insight with DEFAULT_TIME | Generator skipped (sentinel value) |
| Duplicate transaction detected | Insight may reference pattern, not new |

### Error States

| Error | UI Treatment | Recovery Path |
|-------|--------------|---------------|
| Insight generation fails | No insight shown, silent failure | Transaction still saved |
| Insight history load fails | Empty state with retry button | Pull to refresh |

### Chrome Extension Test Scenario

```gherkin
Feature: Insight Discovery

  Background:
    Given user has 25 transactions over 3 weeks
    And user has built an insight profile

  Scenario: Receive insight after save
    When user saves a new transaction
    Then InsightCard should appear within 2 seconds
    And insight should be relevant to the transaction
    And card should auto-dismiss after 5 seconds
    And transaction should be saved regardless of insight

  Scenario: Browse insight history
    When user navigates to Insights tab
    Then InsightsView should show past insights
    And insights should be paginated
    When user taps an insight
    Then InsightDetailModal should open
    And "View Transaction" button should be visible
    When user taps "View Transaction"
    Then should navigate to EditView with that transaction

  Scenario: Cold-start fallback
    Given user has only 3 transactions
    When user saves a new transaction
    Then BuildingProfileCard should appear
    And should say "Building your profile..."
    And should indicate progress toward insights

  Scenario: Reduced motion support
    Given user has prefers-reduced-motion enabled
    When InsightCard appears
    Then should use opacity transition only
    And should NOT use slide animation
```

---

## Appendix A: UI State Reference

### Common UI States

| State | Visual Treatment | Accessibility |
|-------|------------------|---------------|
| Loading | Shimmer animation on content area | aria-busy="true" |
| Empty | Friendly illustration + CTA | Clear action label |
| Error | Red accent, error icon, retry button | role="alert" |
| Success | Green accent, check animation | Celebration sound (optional) |
| Processing | Overlay with progress indicator | aria-live="polite" updates |

### Transition Timing

| Transition Type | Duration | Easing |
|-----------------|----------|--------|
| Page slide | 200-300ms | ease-out |
| Modal appear | 200ms | ease-out |
| Modal dismiss | 150ms | ease-in |
| Card expand | 250ms | ease-out |
| Fade | 150ms | linear |
| Celebration | 500-1000ms | spring |

### Reduced Motion Fallbacks

All animations must respect `prefers-reduced-motion: reduce`:
- Breathing animations → Static state
- Slide transitions → Fade transitions
- Stagger reveals → Immediate reveal
- Celebration animations → Simple opacity change

---

## Appendix B: Success Metrics Summary

| Use Case | Primary Metric | Target | Status |
|----------|----------------|--------|--------|
| UC1: First Scan | Time to saved transaction | ≤60 seconds | 🟢 Testable |
| UC2: Weekly Health | Time to answer "where did money go?" | ≤10 seconds | 🟡 Future |
| UC3: Goal Progress | User feels motivated | Qualitative survey | 🟡 Future |
| UC4: Simple Summary | Understands without help | No support requests | 🟡 Future |
| UC5: Out-of-Character | Feels informed not judged | Qualitative survey | 🟡 Future |
| UC6: Batch Scan | Time for 5 receipts | ≤3 minutes | 🟢 Testable |
| UC7: Trust Merchant | Repeat visit faster than first | < first visit time | 🟢 Testable |
| UC8: Insight Discovery | Insights feel personalized | Qualitative + analytics | 🟢 Testable |

---

## Appendix C: Persona Quick Reference

### New User
- **Goal:** First success
- **Anxiety:** "Is this app complicated?"
- **Need:** Clear guidance, quick win

### María (Overwhelmed Parent)
- **Goal:** Understand spending patterns
- **Anxiety:** "Am I bad with money?"
- **Need:** Non-judgmental answers

### Diego (Young Professional)
- **Goal:** Reach savings goal
- **Anxiety:** "Can I actually save?"
- **Need:** Tangible progress visibility

### Rosa (Abuelita)
- **Goal:** Stay independent
- **Anxiety:** "Is technology too hard for me?"
- **Need:** Simple, familiar patterns

### Tomás (Disciplined Accountant)
- **Goal:** Stay on track
- **Anxiety:** "Am I drifting without noticing?"
- **Need:** Honest feedback without shame

### Power User
- **Goal:** Maximum efficiency
- **Anxiety:** "Is this app slowing me down?"
- **Need:** Batch operations, minimal friction

### Returning User
- **Goal:** Frictionless repeat experience
- **Anxiety:** "Do I have to categorize everything again?"
- **Need:** Auto-recognition of trusted merchants

### Active User
- **Goal:** Understand spending patterns
- **Anxiety:** "Am I missing something?"
- **Need:** Relevant, timely insights

---

## Appendix D: Currency & Locale Standards

### Currency Formatting (CLP - Chilean Pesos)

| Format | Example | Usage |
|--------|---------|-------|
| Display format | `$123.456` | All UI displays |
| Thousands separator | `.` (period) | Always use for readability |
| Decimal separator | `,` (comma) | Only if showing centavos |
| No centavos | `$50.000` not `$50.000,00` | CLP rarely uses decimals |

### Language Standards

| Context | Language | Notes |
|---------|----------|-------|
| UI text | Chilean Spanish | Colloquial where appropriate |
| Error messages | Chilean Spanish | Clear, friendly tone |
| Insights | Chilean Spanish | Use "harto" not "mucho", "subió" not "incrementó" |
| Technical logs | English | For developer debugging |

### Chilean Spanish Colloquialisms

| Standard | Chilean | Use in |
|----------|---------|--------|
| Mucho/muy | Harto | UC4 summaries |
| Incrementó | Subió | Trend descriptions |
| Disminuyó | Bajó | Trend descriptions |
| Igual | Igual nomás | Steady state |
| Dinero | Plata | Casual references |

### Locale Settings

- **Timezone:** America/Santiago (UTC-3 / UTC-4 DST)
- **Date format:** DD/MM/YYYY (e.g., 23/12/2025)
- **Time format:** 24-hour (e.g., 14:30)
- **Week start:** Monday

---

## Document History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-12-23 | 1.0 | Claude + Gabe | Initial document creation |
| 2025-12-23 | 1.1 | Atlas Code Review | Added status legend, UC7, UC8, locale appendix |

---

_This document serves as the foundation for E2E testing with Claude Code Chrome extension and validates UX mockups against real user scenarios._
