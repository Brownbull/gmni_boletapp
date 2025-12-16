# Story 10.2 Context: Scan Complete Insights

**Purpose:** This document aggregates all relevant codebase context for implementing the Scan Complete Insight Toast.

---

## Target Files to Create

| File | Purpose |
|------|---------|
| `src/components/ScanCompleteToast.tsx` | Toast component with insight |
| `src/hooks/useInsightToast.ts` | Toast state management |

---

## Current Save Flow

**Save Handler Location:**
```
Location: /home/khujta/projects/bmad/boletapp/src/App.tsx (lines 414-437)

Current flow:
1. User clicks Save in EditView
2. saveTransaction() called
3. Firestore write (optimistic)
4. Navigate to dashboard
5. Clear pendingScan state
6. Show generic toast (optional)

Insert insight generation:
- After step 2, before step 3
- Generate insight from InsightEngine
- Show ScanCompleteToast instead of generic toast
```

**Current Toast Implementation:**
```typescript
// App.tsx line 102
const [toastMessage, setToastMessage] = useState<string | null>(null);

// Usage pattern
setToastMessage('Transaction saved');
setTimeout(() => setToastMessage(null), 3000);
```

---

## EditView Save Button Location

**Save Button:**
```
Location: /home/khujta/projects/bmad/boletapp/src/views/EditView.tsx

The save action is triggered from EditView and handled by App.tsx
via the onSave prop passed to EditView.

Pattern:
<EditView
  onSave={(transaction) => saveTransaction(transaction)}
  ...
/>
```

---

## Insight Priority for Scan Complete

From habits loops.md research:

| Priority | Condition | Message Template |
|----------|-----------|------------------|
| 1 | New merchant (first time) | "Primera boleta de {merchant}. Categorizado como {category}" |
| 2 | Biggest purchase this week | "Es tu compra más grande de la semana" |
| 3 | Repeat category same day | "{ordinal} boleta de {category} hoy" |
| 4 | Known merchant | "Llevas {monthTotal} en {merchant} este mes" |
| 5 | Default | "Guardado en {category}" |

---

## Toast Component Design

**Layout:**
```
┌─────────────────────────────────────────┐
│  ✓ Guardado                      $24.990│
│                                         │
│  🔄 3ra boleta de Restaurante esta sem. │
│                                         │
│     [Ver más]              [Cerrar]     │
└─────────────────────────────────────────┘
```

**Positioning:**
- Bottom of screen, 16px margin
- Width: 90% (max 400px)
- Z-index above other content

---

## Existing Component Patterns

**Toast-like Components:**
```
Location: Check for existing toast/notification patterns in:
- src/components/ - Any notification components
- Tailwind classes for positioning

Common pattern:
fixed bottom-4 left-1/2 -translate-x-1/2
bg-white dark:bg-gray-800
shadow-lg rounded-lg p-4
```

**Animation Pattern:**
```css
/* Enter */
@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Exit */
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
```

---

## Translation Strings to Add

```typescript
// src/utils/translations.ts

// English
scanCompleteSaved: 'Saved',
scanCompleteViewMore: 'View more',
scanCompleteClose: 'Close',
insightNewMerchant: 'First receipt from {merchant}. Categorized as {category}',
insightBiggestPurchase: 'This is your biggest purchase this week',
insightRepeatCategory: '{ordinal} {category} receipt today',
insightMerchantRunningTotal: 'You\'ve spent {total} at {merchant} this month',
insightDefaultSaved: 'Saved to {category}',

// Spanish
scanCompleteSaved: 'Guardado',
scanCompleteViewMore: 'Ver más',
scanCompleteClose: 'Cerrar',
insightNewMerchant: 'Primera boleta de {merchant}. Categorizado como {category}',
insightBiggestPurchase: 'Es tu compra más grande de la semana',
insightRepeatCategory: '{ordinal} boleta de {category} hoy',
insightMerchantRunningTotal: 'Llevas {total} en {merchant} este mes',
insightDefaultSaved: 'Guardado en {category}',
```

---

## Insight Engine Integration

```typescript
// In saveTransaction handler (App.tsx)

import { selectBestInsight } from './services/insightEngine';

const saveTransaction = async (transaction: Transaction) => {
  // Save to Firestore
  await addTransaction(db, user.uid, appId, transaction);

  // Generate insight
  const insight = selectBestInsight({
    currentTransaction: transaction,
    allTransactions: transactions,
    locale: lang
  });

  // Show toast with insight
  showInsightToast({
    transaction,
    insight,
    onViewMore: () => navigateToAnalytics(),
    onClose: () => hideToast()
  });

  // Navigate to dashboard
  setView('dashboard');
};
```

---

## Accessibility Requirements

```typescript
// ScanCompleteToast.tsx

<div
  role="alert"
  aria-live="polite"
  className="..."
>
  {/* Content */}
</div>

// Keyboard support
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [onClose]);

// Reduced motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

---

## State Hook Pattern

```typescript
// src/hooks/useInsightToast.ts

interface ToastData {
  transaction: Transaction;
  insight: Insight | null;
  amount: number;
}

interface UseInsightToastReturn {
  isVisible: boolean;
  toastData: ToastData | null;
  showToast: (data: ToastData) => void;
  hideToast: () => void;
}

export function useInsightToast(autoDismissMs = 4000): UseInsightToastReturn {
  const [isVisible, setIsVisible] = useState(false);
  const [toastData, setToastData] = useState<ToastData | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showToast = (data: ToastData) => {
    setToastData(data);
    setIsVisible(true);

    // Auto-dismiss
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, autoDismissMs);
  };

  const hideToast = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  return { isVisible, toastData, showToast, hideToast };
}
```

---

## Fallback Messages

When no specific insight is available:

```typescript
const fallbackMessages = [
  { key: 'insightDefaultSaved', emoji: '✓', params: { category } },
  { key: 'transactionSaved', emoji: '✓', params: {} },
];

// Rotate or randomly select for variety
const fallback = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
```

---

## Testing Considerations

```typescript
// tests/unit/components/ScanCompleteToast.test.tsx

describe('ScanCompleteToast', () => {
  it('displays transaction total', () => {...});
  it('displays insight message when available', () => {...});
  it('displays fallback when no insight', () => {...});
  it('auto-dismisses after 4 seconds', () => {...});
  it('dismisses on close button click', () => {...});
  it('dismisses on Escape key', () => {...});
  it('respects prefers-reduced-motion', () => {...});
});
```
