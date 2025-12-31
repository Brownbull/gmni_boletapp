# Story 14.14: Session Completion Messaging

**Status:** ready-for-dev
**Points:** 2
**Epic:** 14 - Core Implementation
**Dependencies:** Story 14.1 (Animation Framework)

---

## Story

As a **user finishing a tracking session**,
I want **an encouraging wrap-up message**,
so that **I feel positive about maintaining my financial habits**.

## Acceptance Criteria

1. **SessionComplete component** displays after save + insight flow completes
2. **Encouraging messages** like "Great check-in today!" or "You've been tracking for X days!"
3. **Session summary display** showing what was accomplished
4. **Next-step suggestions** to encourage continued engagement
5. **Auto-dismiss** after 5 seconds or manual dismiss
6. **Non-intrusive** - doesn't block navigation or other actions

## Tasks / Subtasks

- [ ] Task 1: Create SessionComplete component (AC: #1)
  - [ ] Create `src/components/session/SessionComplete.tsx`
  - [ ] Card-style component with soft animation
  - [ ] Position at bottom of screen (toast-like)
  - [ ] Fade in from bottom

- [ ] Task 2: Implement message templates (AC: #2)
  - [ ] "¡Gran revisión hoy!" (Great check-in today!)
  - [ ] "¡Llevas [X] días registrando!" (You've been tracking for X days!)
  - [ ] "¡Primera boleta de la semana!" (First receipt this week!)
  - [ ] Select message based on context

- [ ] Task 3: Add session summary (AC: #3)
  - [ ] Show transaction total saved
  - [ ] Show categories touched
  - [ ] Show time spent in session
  - [ ] Brief, not overwhelming

- [ ] Task 4: Implement next-step suggestions (AC: #4)
  - [ ] "Ver tu semana" (View your week) → Analytics
  - [ ] "Escanear otra" (Scan another) → Camera
  - [ ] "Revisar historial" (Review history) → History
  - [ ] Context-aware suggestions

- [ ] Task 5: Add auto-dismiss (AC: #5)
  - [ ] 5 second timer for auto-dismiss
  - [ ] Pause timer on hover/touch
  - [ ] Manual dismiss via X button
  - [ ] Swipe down to dismiss

- [ ] Task 6: Ensure non-intrusive behavior (AC: #6)
  - [ ] Don't block screen content
  - [ ] Don't prevent navigation
  - [ ] Low z-index (below modals)
  - [ ] Gracefully handle multiple triggers

- [ ] Task 7: Write tests
  - [ ] Test message selection
  - [ ] Test auto-dismiss timing
  - [ ] Test dismiss interactions

## Dev Notes

### Message Selection Logic

```typescript
interface SessionContext {
  transactionsSaved: number;
  consecutiveDays: number;
  isFirstOfWeek: boolean;
  isPersonalRecord: boolean;
  totalAmount: number;
}

function selectMessage(context: SessionContext): string {
  // Priority order
  if (context.isPersonalRecord) {
    return '¡Récord personal alcanzado!';
  }
  if (context.isFirstOfWeek) {
    return '¡Primera boleta de la semana!';
  }
  if (context.consecutiveDays >= 7) {
    return `¡Increíble! Llevas ${context.consecutiveDays} días registrando`;
  }
  if (context.consecutiveDays >= 3) {
    return `¡Llevas ${context.consecutiveDays} días seguidos!`;
  }
  if (context.transactionsSaved > 1) {
    return `¡${context.transactionsSaved} boletas guardadas hoy!`;
  }
  return '¡Gran revisión hoy!';
}
```

### Component Interface

```typescript
interface SessionCompleteProps {
  context: SessionContext;
  onDismiss: () => void;
  onAction: (action: 'analytics' | 'scan' | 'history') => void;
}
```

### Auto-Dismiss Implementation

```typescript
const SessionComplete: React.FC<SessionCompleteProps> = ({
  context,
  onDismiss,
  onAction,
}) => {
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [isPaused, onDismiss]);

  return (
    <div
      className="session-complete"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
    >
      {/* Content */}
    </div>
  );
};
```

### Next-Step Suggestions

```typescript
function getSuggestions(context: SessionContext): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Always suggest viewing analytics if not already there
  suggestions.push({
    label: 'Ver tu semana',
    action: 'analytics',
    icon: '📊',
  });

  // Suggest scanning another if quick session
  if (context.transactionsSaved < 3) {
    suggestions.push({
      label: 'Escanear otra',
      action: 'scan',
      icon: '📷',
    });
  }

  return suggestions.slice(0, 2); // Max 2 suggestions
}
```

### Styling

```css
.session-complete {
  position: fixed;
  bottom: calc(var(--nav-height) + 16px);
  left: 16px;
  right: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-4);
  animation: slideUp 300ms ease-out;
  z-index: 50; /* Below modals (100) */
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### References

- [Source: docs/sprint-artifacts/epic14/tech-context-epic14.md#Story 14.14]
- [Source: docs/uxui/voice-tone-guidelines.md#Celebrations]
- [Source: docs/uxui/motion-design-system.md#Timing]

---

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis

### Affected Workflows

- **Quick Save Flow (#6)**: Session complete shows after save
- **Insight Generation Flow (#5)**: Appears after insight display

### Downstream Effects to Consider

- Must coordinate with InsightCard timing (appears after insight dismisses)
- Don't show on batch saves (handled by BatchInsight instead)
- Consider not showing if user immediately navigates away

### Testing Implications

- **Existing tests to verify:** Save flow tests
- **New scenarios to add:** Message selection, timing, dismiss behavior

### Workflow Chain Visualization

```
[Save] → [Insight Display] → [THIS STORY: Session Complete] → [User continues or exits]
```

---

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation_
