# Story 10.1: Insight Engine Core

**Epic:** Epic 10 - Foundation + Engagement & Insight Engine
**Status:** Draft
**Story Points:** 5
**Dependencies:** Story 10.0 (Foundation Sprint)

---

## User Story

As a **user**,
I want **the app to generate personalized insights about my spending patterns**,
So that **I can understand my financial habits without needing analyst skills**.

---

## Acceptance Criteria

- [ ] **AC #1:** Insight Engine service created with 5 MVP insight types
- [ ] **AC #2:** Frequency insights work: "3ra boleta de restaurante esta semana"
- [ ] **AC #3:** Merchant concentration insights work: "40% de tu gasto es en Líder"
- [ ] **AC #4:** Category growth insights work: "Restaurante subió 40% vs mes pasado"
- [ ] **AC #5:** Improvement insights work: "¡Gastaste 15% menos en X!"
- [ ] **AC #6:** Milestone insights work: "¡Primer mes completo!"
- [ ] **AC #7:** Insights respect minimum data point requirements
- [ ] **AC #8:** Confidence scoring selects most relevant insight
- [ ] **AC #9:** Insights are localized (Spanish/English based on app language)
- [ ] **AC #10:** Insight generation completes in <500ms

---

## Tasks / Subtasks

### Task 1: Create Insight Engine Service Structure (1h)
- [ ] Create `src/services/insightEngine.ts`
- [ ] Define TypeScript interfaces:
  ```typescript
  type InsightType = 'frequency' | 'merchant_concentration' | 'category_growth' | 'improvement' | 'milestone';

  interface Insight {
    type: InsightType;
    message: string;
    messageKey: string; // for i18n
    emoji: string;
    confidence: number;
    priority: number;
    dataPoints: number;
    metadata?: Record<string, any>;
  }

  interface InsightContext {
    currentTransaction?: Transaction;
    allTransactions: Transaction[];
    userHistory: TransactionHistory;
    locale: string;
  }
  ```
- [ ] Create InsightEngine class with modular rule system

### Task 2: Implement Frequency Insight (1h)
- [ ] Detect category repeat patterns within current week
- [ ] Implement `generateFrequencyInsight(context)`
- [ ] Return ordinal format: "3ra boleta de X esta semana"
- [ ] Minimum data points: 2 (show on 3rd+ occurrence)
- [ ] Add Spanish ordinal helper: `getSpanishOrdinal(n)`
- [ ] Write unit tests

**Example Output:**
```typescript
{
  type: 'frequency',
  message: '3ra boleta de Restaurante esta semana',
  emoji: '🔄',
  confidence: 0.9,
  priority: 3,
  dataPoints: 3
}
```

### Task 3: Implement Merchant Concentration Insight (1h)
- [ ] Calculate merchant percentage of total spending
- [ ] Trigger when single merchant >= 35% of monthly spend
- [ ] Implement `generateMerchantConcentrationInsight(context)`
- [ ] Minimum data points: 10 transactions
- [ ] Write unit tests

**Example Output:**
```typescript
{
  type: 'merchant_concentration',
  message: 'El 40% de tu gasto es en Líder',
  emoji: '🎯',
  confidence: 0.85,
  priority: 5,
  dataPoints: 15
}
```

### Task 4: Implement Category Growth Insight (1h)
- [ ] Compare current month vs previous month by category
- [ ] Trigger when growth >= 25% increase
- [ ] Implement `generateCategoryGrowthInsight(context)`
- [ ] Minimum data points: 5 transactions per month
- [ ] Neutral framing (informational, not judgmental)
- [ ] Write unit tests

**Example Output:**
```typescript
{
  type: 'category_growth',
  message: 'Restaurante subió 40% vs mes pasado',
  emoji: '📈',
  confidence: 0.8,
  priority: 6,
  dataPoints: 12
}
```

### Task 5: Implement Improvement Insight (1h)
- [ ] Detect month-over-month decrease in category
- [ ] Trigger when decrease >= 10%
- [ ] Implement `generateImprovementInsight(context)`
- [ ] Celebratory framing (highest priority - always show wins)
- [ ] Minimum data points: 5 transactions per month
- [ ] Write unit tests

**Example Output:**
```typescript
{
  type: 'improvement',
  message: '¡Gastaste 15% menos en Restaurante que el mes pasado!',
  emoji: '🎉',
  confidence: 0.9,
  priority: 10,
  dataPoints: 10
}
```

### Task 6: Implement Milestone Insight (0.5h)
- [ ] Track user milestones:
  - First scan: "¡Primera boleta!"
  - Week complete: "¡Semana completa!"
  - Month complete: "¡Primer mes completo!"
  - 100 scans: "¡Club de los 100!"
- [ ] Implement `generateMilestoneInsight(context)`
- [ ] Store achieved milestones in user data
- [ ] Celebratory design
- [ ] Write unit tests

### Task 7: Implement Insight Selection Logic (0.5h)
- [ ] Create `selectBestInsight(context)` function
- [ ] Filter insights by minimum data points
- [ ] Filter by confidence threshold (>0.7)
- [ ] Sort by priority (highest first)
- [ ] Return top insight or null
- [ ] Handle edge case: new user with no data

### Task 8: Implement Localization (0.5h)
- [ ] Add insight strings to `src/utils/translations.ts`
- [ ] Support dynamic values in translations
- [ ] Implement `localizeInsight(insight, locale)`
- [ ] Test English and Spanish outputs

### Task 9: Performance Optimization (0.5h)
- [ ] Profile insight generation performance
- [ ] Implement caching for repeated calculations
- [ ] Ensure <500ms for typical user data (<1000 transactions)
- [ ] Add performance logging for monitoring

### Task 10: Integration Testing (0.5h)
- [ ] Create integration tests with realistic data
- [ ] Test insight selection with multiple eligible insights
- [ ] Test edge cases (new user, power user, inactive user)
- [ ] Verify localization in both languages

---

## Technical Summary

The Insight Engine is the core differentiator for Boletapp - transforming raw expense data into meaningful, personalized insights. This implementation follows the specification in the "habits loops" research document.

**Design Principles:**
1. **Ethical Framing:** Celebrate improvements, don't shame overspending
2. **Data-Driven:** Only show insights when sufficient data exists
3. **Contextual:** Select most relevant insight based on confidence scoring
4. **Fast:** <500ms generation time for responsive UX

**Insight Priority System:**
| Priority | Type | When Shown |
|----------|------|------------|
| 10 | improvement | Always show wins first |
| 8 | milestone | Celebrate achievements |
| 6 | category_growth | Informational, neutral |
| 5 | merchant_concentration | When pattern emerges |
| 3 | frequency | Regular engagement |

---

## Project Structure Notes

- **Files to create:**
  - `src/services/insightEngine.ts`
  - `src/services/insightEngine.test.ts`
  - `src/types/insight.ts` (interfaces)

- **Files to modify:**
  - `src/utils/translations.ts` - Add insight strings

- **Expected test locations:**
  - `tests/unit/services/insightEngine.test.ts`

- **Estimated effort:** 5 story points (~8 hours)
- **Prerequisites:** Story 10.0 (transactionQuery service)

---

## Key Code References

**From habits loops.md - Insight Rules:**
```typescript
const insightRules: InsightRule[] = [
  {
    type: 'frequency',
    condition: (ctx) => ctx.categoryCountThisWeek >= 3,
    generate: (ctx) => ({
      message: `${ordinal(ctx.categoryCountThisWeek)} boleta de ${ctx.category} esta semana`,
      emoji: '🔄',
      priority: 3
    }),
    minDataPoints: 3
  },
  // ... more rules
];
```

**Existing Translation Pattern:**
```typescript
// src/utils/translations.ts
export const translations = {
  en: {
    // existing keys...
    insightFrequency: '{ordinal} {category} receipt this week',
    insightMerchantConcentration: '{percentage}% of your spending is at {merchant}',
    // ...
  },
  es: {
    insightFrequency: '{ordinal} boleta de {category} esta semana',
    insightMerchantConcentration: 'El {percentage}% de tu gasto es en {merchant}',
    // ...
  }
};
```

---

## Context References

**Tech-Spec:** [tech-spec.md](../../tech-spec.md)
**PRD:** [epic-10-prd.md](../../planning/epic-10-prd.md) - FR1-FR10
**Research:** [habits loops.md](../../uxui/research/habits%20loops.md) - Section 3.1 Insights

---

## Definition of Done

- [ ] All 10 acceptance criteria verified
- [ ] All 5 insight types generating correctly
- [ ] Unit tests for each insight type
- [ ] Integration tests passing
- [ ] Localization complete (EN/ES)
- [ ] Performance <500ms verified
- [ ] Code review approved

---

## Dev Agent Record

### Agent Model Used
<!-- Will be populated during dev-story execution -->

### Completion Notes
<!-- Will be populated during dev-story execution -->

### Files Modified
<!-- Will be populated during dev-story execution -->

### Test Results
<!-- Will be populated during dev-story execution -->

---

## Review Notes
<!-- Will be populated during code review -->

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 10 PRD |
