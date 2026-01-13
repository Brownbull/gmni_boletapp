# Story 14.33c: Airlock Sequence UI

## Story Info
- **Epic:** 14 - Core Implementation
- **Points:** 3
- **Priority:** Medium
- **Status:** Complete
- **Created:** 2026-01-12
- **Mockup Reference:** `docs/uxui/mockups/01_views/insights.html` (VIEW 3: AIRLOCK SEQUENCE)
- **Depends On:** Story 14.33b (View Switcher & Carousel Mode)

## User Story

**As a** BoletApp user,
**I want** to experience important spending insights through a playful 3-step "airlock" reveal sequence,
**So that** I'm emotionally prepared for potentially surprising information without feeling judged.

## Background

The "Airlock" is a UX pattern designed to deliver potentially sensitive insights (like unexpected spending patterns) in a non-judgmental, curiosity-driven way. It uses a 3-step progressive reveal:

| Step | Name | Emoji | Purpose |
|------|------|-------|---------|
| 1 | Curiosity Gate | `🔮` | Build anticipation: "Tengo algo que contarte..." |
| 2 | Playful Brace | `🎢` | Prepare user: "No es malo, pero puede que te sorprenda..." |
| 3 | The Reveal | `☕` | Show the insight with context and recommendation |

This pattern is referenced in the Epic 15 feature "Emotional Airlock Flow" (15.8), but the UI component is implemented here to complete the Insights view mockup.

## Acceptance Criteria

### AC1: Airlock Container Component
- [x] Create `AirlockSequence.tsx` component
- [x] Accepts an insight to reveal and callbacks for completion
- [x] Manages internal step state (1, 2, 3)
- [x] Card styling: `--bg-secondary`, `--radius-lg`, padding 24px, `--shadow-lg`

### AC2: Step 1 - Curiosity Gate
- [x] Large floating emoji (64px, `float` animation)
- [x] Title: "Tengo algo que contarte..." (20px, bold)
- [x] Subtitle: "Descubri un patron interesante en tus compras de esta semana."
- [x] Progress dots (3 dots, first active = `--primary`, 24px wide)
- [x] Primary button: "Cuentame mas" → advances to Step 2

### AC3: Step 2 - Playful Brace
- [x] Emoji: `🎢` with float animation
- [x] Title: "Preparate..."
- [x] Subtitle: "No es malo, pero puede que te sorprenda un poquito."
- [x] Progress dots (second active)
- [x] Primary button: "Estoy listo/a" → advances to Step 3
- [x] Secondary button: "Mejor despues" → closes/exits airlock

### AC4: Step 3 - The Reveal
- [x] Card gets special reveal styling: gradient background `linear-gradient(135deg, var(--warning-light), #fef9c3)`, border `--warning`
- [x] Emoji based on insight category (e.g., `☕` for coffee spending)
- [x] Title: Dynamic based on insight (e.g., "Tu cafe de la semana...")
- [x] Subtitle: Insight message with context
- [x] Recommendation box: `--bg-secondary` background with suggestion
- [x] Progress dots (third active)
- [x] Primary button: "Entendido" → closes airlock, marks as viewed

### AC5: Animation Support
- [x] `@keyframes float` animation for emojis (translateY -8px, 2s ease-in-out infinite)
- [x] Respect `prefers-reduced-motion` - disable animations
- [x] Smooth step transitions (fade or slide)

### AC6: Integration with InsightsView
- [x] When "Airlock" view is active, show AirlockSequence for eligible insight
- [x] Select insight for airlock: prioritize `QUIRKY_FIRST` insights not yet airlock-viewed
- [x] If no eligible insights, show empty state: "No hay revelaciones pendientes"
- [ ] Track airlock completion in `InsightRecord` (optional: `airlockViewedAt` field)

## Technical Notes

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/insights/AirlockSequence.tsx` | 3-step reveal component |
| `src/components/insights/AirlockStep.tsx` | Individual step layout (optional) |

### Files to Modify
| File | Change |
|------|--------|
| `src/views/InsightsView.tsx` | Wire airlock view mode |
| `src/components/insights/InsightsViewSwitcher.tsx` | Remove placeholder for airlock |

### Component Interface
```tsx
// src/components/insights/AirlockSequence.tsx
interface AirlockSequenceProps {
  insight: InsightRecord;
  onComplete: () => void;
  onDismiss: () => void;
  theme: string;
  t: (key: string) => string;
}

// Internal state
type AirlockStep = 1 | 2 | 3;
```

### Step Configuration
```typescript
const airlockSteps: Record<AirlockStep, {
  emoji: string;
  titleKey: string;
  subtitleKey: string;
  primaryButtonKey: string;
  secondaryButtonKey?: string;
}> = {
  1: {
    emoji: '🔮',
    titleKey: 'airlockCuriosityTitle',
    subtitleKey: 'airlockCuriositySubtitle',
    primaryButtonKey: 'tellMeMore',
  },
  2: {
    emoji: '🎢',
    titleKey: 'airlockBraceTitle',
    subtitleKey: 'airlockBraceSubtitle',
    primaryButtonKey: 'imReady',
    secondaryButtonKey: 'maybeLater',
  },
  3: {
    emoji: '', // Dynamic based on insight
    titleKey: '', // Dynamic
    subtitleKey: '', // Dynamic
    primaryButtonKey: 'understood',
  },
};
```

### Float Animation CSS
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.airlock-emoji {
  font-size: 64px;
  animation: float 2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .airlock-emoji {
    animation: none;
  }
}
```

### Insight Emoji Mapping
```typescript
const insightEmojiMap: Record<string, string> = {
  coffee_spending: '☕',
  night_snacker: '🌙',
  weekend_shopper: '🛒',
  merchant_frequency: '🏪',
  category_dominance: '📊',
  default: '💡',
};

function getInsightEmoji(insightId: string): string {
  return insightEmojiMap[insightId] || insightEmojiMap.default;
}
```

## Testing Requirements

### Unit Tests
- [x] `AirlockSequence.test.tsx`: Renders Step 1 by default
- [x] `AirlockSequence.test.tsx`: "Cuentame mas" advances to Step 2
- [x] `AirlockSequence.test.tsx`: "Estoy listo/a" advances to Step 3
- [x] `AirlockSequence.test.tsx`: "Mejor despues" calls onDismiss
- [x] `AirlockSequence.test.tsx`: "Entendido" calls onComplete
- [x] Progress dots show correct active state per step

### Accessibility Tests
- [x] All buttons have minimum 44px touch target
- [x] Progress dots have aria-label for screen readers
- [x] Animations respect prefers-reduced-motion

### Visual Tests
- [ ] Each step matches mockup styling
- [ ] Reveal card has correct gradient background
- [ ] Float animation is smooth (manual verification)

## Translations Required

```typescript
// Add to translations.ts
{
  airlockCuriosityTitle: 'Tengo algo que contarte...',
  airlockCuriositySubtitle: 'Descubri un patron interesante en tus compras de esta semana.',
  airlockBraceTitle: 'Preparate...',
  airlockBraceSubtitle: 'No es malo, pero puede que te sorprenda un poquito.',
  tellMeMore: 'Cuentame mas',
  imReady: 'Estoy listo/a',
  maybeLater: 'Mejor despues',
  understood: 'Entendido',
  noPendingReveals: 'No hay revelaciones pendientes',
  ifYouReduce: 'Si reduces a la mitad:',
}
```

## Out of Scope
- Backend logic for generating airlock-worthy insights (Epic 15)
- Out-of-character detection algorithm (Story 15.7)
- Goal connection ("3 days from Tokyo") (Story 15.4)

## Dependencies
- Story 14.33b: View Switcher & Carousel Mode (provides view infrastructure)

## Definition of Done
- [x] All acceptance criteria met
- [x] 3-step sequence works end-to-end
- [x] Animations respect reduced motion
- [x] Unit tests passing (33 tests)
- [ ] Visual comparison with mockup approved
- [ ] Code review passed
