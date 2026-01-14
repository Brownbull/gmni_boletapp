# Story 14.33d: Celebration & Personal Records Display

## Story Info
- **Epic:** 14 - Core Implementation
- **Points:** 3
- **Priority:** Medium
- **Status:** Done
- **Created:** 2026-01-12
- **Mockup Reference:** `docs/uxui/mockups/01_views/insights.html` (VIEW 4: CELEBRATION)
- **Depends On:** Story 14.33b (View Switcher), Story 14.18 (Celebration System), Story 14.19 (Personal Records Detection)

## User Story

**As a** BoletApp user who has achieved a personal record or milestone,
**I want** to see my achievements displayed in a celebratory format with badges,
**So that** I feel recognized and motivated to continue my financial awareness journey.

## Background

Stories 14.18 and 14.19 implemented the **backend logic** for celebrations and personal records detection. This story creates the **UI layer** to display these achievements in the Insights view's "Logro" (Achievement) mode.

The mockup shows:
- A celebration card with bouncing emoji, stats, and share button
- A badge unlock notification
- Personal record display with comparison stats

## Acceptance Criteria

### AC1: Celebration Card Component
- [x] Create `CelebrationCard.tsx` component
- [x] Gradient background: `linear-gradient(135deg, var(--primary-light), #dbeafe)`
- [x] Border: 1px solid `--primary`
- [x] Border-radius: `--radius-lg`, padding: 24px
- [x] Center-aligned content

### AC2: Celebration Card Content
- [x] Large emoji (48px) with bounce animation
- [x] Title: "Nuevo Record Personal!" (20px, bold)
- [x] Subtitle: Dynamic message (e.g., "Tu semana con menos gastos en 3 meses")
- [x] Stats row with 2 metrics:
  - Value (24px, bold, `--primary`)
  - Label (11px, `--text-tertiary`)
- [x] "Compartir logro" button with share icon

### AC3: Badge Unlock Component
- [x] Create `BadgeUnlock.tsx` component
- [x] Card with `--bg-secondary` background
- [x] Header: "Insignia Desbloqueada" (uppercase, small)
- [x] Badge icon (48x48, gradient background)
- [x] Badge name and description

### AC4: Personal Records Integration
- [x] Wire to `recordsService.ts` from Story 14.19
- [x] Fetch user's personal records on view mount
- [x] Display most recent record as celebration
- [x] If no records, show encouraging message

### AC5: Animations
- [x] `@keyframes bounce` for celebration emoji (translateY -10px, 1s ease-in-out infinite)
- [x] Respect `prefers-reduced-motion`
- [x] Confetti trigger on celebration view (optional, uses 14.18 confetti util)

### AC6: Share Functionality
- [x] "Compartir logro" button triggers Web Share API (if available)
- [x] Fallback: Copy achievement text to clipboard
- [x] Share content: Title + subtitle + badge name

### AC7: Empty State
- [x] If no celebrations/records exist, show motivational message
- [x] "Sigue escaneando para desbloquear logros!"
- [x] Icon: trophy or star outline

## Technical Notes

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/insights/CelebrationCard.tsx` | Main celebration display |
| `src/components/insights/BadgeUnlock.tsx` | Badge notification card |
| `src/components/insights/CelebrationView.tsx` | Container for celebration mode |

### Files to Modify
| File | Change |
|------|--------|
| `src/views/InsightsView.tsx` | Wire celebration view mode |
| `src/components/insights/InsightsViewSwitcher.tsx` | Remove placeholder |
| `src/components/insights/index.ts` | Export new components |

### Component Interfaces
```tsx
// src/components/insights/CelebrationCard.tsx
interface CelebrationCardProps {
  emoji: string;
  title: string;
  subtitle: string;
  stats: Array<{ value: string; label: string }>;
  onShare: () => void;
  theme: string;
  t: (key: string) => string;
}

// src/components/insights/BadgeUnlock.tsx
interface BadgeUnlockProps {
  emoji: string;
  name: string;
  description: string;
  theme: string;
}

// src/components/insights/CelebrationView.tsx
interface CelebrationViewProps {
  onBack: () => void;
  theme: string;
  t: (key: string) => string;
}
```

### Badge Definitions
```typescript
// Types for badge system (from Story 14.19)
interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  condition: string; // Human-readable condition
}

const badges: Badge[] = [
  {
    id: 'elite_saver',
    emoji: '💎',
    name: 'Ahorrador Elite',
    description: '3 semanas bajo presupuesto',
    condition: 'under_budget_3_weeks',
  },
  {
    id: 'first_hundred',
    emoji: '🏆',
    name: 'Centenario',
    description: '100 boletas escaneadas',
    condition: 'scan_count_100',
  },
  {
    id: 'lowest_week',
    emoji: '🌟',
    name: 'Semana Record',
    description: 'Tu semana con menos gastos',
    condition: 'lowest_spending_week',
  },
];
```

### Bounce Animation CSS
```css
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.celebration-emoji {
  font-size: 48px;
  animation: bounce 1s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .celebration-emoji {
    animation: none;
  }
}
```

### Web Share API Integration
```typescript
async function shareAchievement(title: string, text: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  } else {
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(`${title}\n${text}`);
    // Show toast: "Copiado al portapapeles"
  }
}
```

### Personal Record Data Structure
```typescript
// From recordsService.ts (Story 14.19)
interface PersonalRecord {
  type: 'lowest_week' | 'lowest_month' | 'streak' | 'milestone';
  value: number;
  previousValue?: number;
  achievedAt: Timestamp;
  comparison?: string; // e.g., "-23% vs promedio"
}
```

## Testing Requirements

### Unit Tests
- [x] `CelebrationCard.test.tsx`: Renders all props correctly (15 tests)
- [x] `CelebrationCard.test.tsx`: Share button calls onShare
- [x] `BadgeUnlock.test.tsx`: Displays badge info correctly (17 tests)
- [x] `CelebrationView.test.tsx`: Empty state when no records (17 tests)
- [x] `CelebrationView.test.tsx`: Displays record when available

### Integration Tests
- [x] Fetches personal records from recordsService
- [x] Confetti triggers on celebration view (if enabled)
- [x] Share API is called with correct content

### Accessibility Tests
- [x] Share button has aria-label
- [x] Stats have proper semantic markup
- [x] Animations respect prefers-reduced-motion

## Translations Required

```typescript
// Add to translations.ts
{
  newPersonalRecord: 'Nuevo Record Personal!',
  shareAchievement: 'Compartir logro',
  badgeUnlocked: 'Insignia Desbloqueada',
  keepScanning: 'Sigue escaneando para desbloquear logros!',
  thisWeek: 'Esta semana',
  vsAverage: 'vs promedio',
  copiedToClipboard: 'Copiado al portapapeles',
  eliteSaver: 'Ahorrador Elite',
  weeksUnderBudget: 'semanas bajo presupuesto',
}
```

## Out of Scope
- Badge persistence system (beyond what 14.19 provides)
- Social media-specific sharing (Instagram stories, etc.)
- Gamification achievements beyond personal records

## Dependencies
- Story 14.33b: View Switcher & Carousel Mode (provides view infrastructure)
- Story 14.18: Celebration System (confetti utility)
- Story 14.19: Personal Records Detection (recordsService)

## Definition of Done
- [x] All acceptance criteria met
- [x] Celebration card displays with correct styling
- [x] Badge unlock shows when applicable
- [x] Share functionality works (Web Share or clipboard)
- [x] Empty state displays appropriately
- [x] Unit tests passing (49 tests: 15 + 17 + 17)
- [ ] Visual comparison with mockup approved
- [ ] Code review passed

## Implementation Notes

### Files Created
| File | Purpose |
|------|---------|
| `src/components/insights/CelebrationCard.tsx` | Main celebration display with gradient, stats, share |
| `src/components/insights/BadgeUnlock.tsx` | Badge notification card with gradient icon |
| `src/components/insights/CelebrationView.tsx` | Container integrating recordsService, confetti |
| `tests/unit/components/insights/CelebrationCard.test.tsx` | 15 unit tests |
| `tests/unit/components/insights/BadgeUnlock.test.tsx` | 17 unit tests |
| `tests/unit/components/insights/CelebrationView.test.tsx` | 17 unit tests |

### Files Modified
| File | Change |
|------|--------|
| `src/views/InsightsView.tsx` | Replaced placeholder with CelebrationView |
| `src/components/insights/index.ts` | Added barrel exports |
| `src/utils/translations.ts` | Added 21 new translation keys (EN + ES)

### Completed: 2026-01-12
