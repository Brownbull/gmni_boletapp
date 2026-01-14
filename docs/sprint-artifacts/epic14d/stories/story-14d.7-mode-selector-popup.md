# Story 14d.7: Implement Mode Selector Popup

**Epic:** 14d - Scan Architecture Refactor
**Points:** 5
**Priority:** HIGH
**Status:** Done
**Depends On:** Story 14d.5
**Design Reference:** [scan-mode-selector.html](../../../uxui/mockups/00_components/scan-mode-selector.html) - Style 19

## Description

Add a long-press triggered popup above the FAB that allows users to select between scan modes: single receipt, batch scan, or credit card statement (placeholder). The popup displays current credit balances and shows the credit cost for each scan mode.

## Background

Current behavior:
- Single tap → Single scan
- Long press → Batch mode (not discoverable)

New behavior:
- Single tap → Single scan (unchanged)
- Long press → Floating card popup with 3 options + credit display

**IMPORTANT: Request Precedence Rule**
See [Scan Request Lifecycle](../scan-request-lifecycle.md) for complete rules.

> If a scan request is already in progress (any state except IDLE), the mode selector MUST NOT appear. Instead, the user should be navigated to the current request view, and a toast should indicate "Tienes un escaneo en progreso".

## Selected Design: Style 19 - Card Compact + Credits

Based on mockup review, the selected design is a **floating card** with:
- Margins from screen edges (12px / `left-3 right-3`)
- Rounded corners all around (`rounded-2xl`)
- Header with credit badges showing both credit types
- Three mode options with consistent FAB-style icons

## Deliverables

### Files to Create/Update

```
src/
├── components/
│   ├── scan/
│   │   └── ScanModeSelector.tsx       # New popup component
│   │   └── index.ts                   # Export
│   └── Nav.tsx                        # FAB long-press detection
└── tests/unit/components/
    └── ScanModeSelector.test.tsx
```

## Technical Specification

### Types

```typescript
// Scan mode types (align with ScanContext)
export type ScanMode = 'single' | 'batch' | 'statement';

// Credit type used for each mode
export const SCAN_MODE_CREDIT_TYPE: Record<ScanMode, 'normal' | 'super'> = {
  single: 'normal',    // Uses 1 normal credit
  batch: 'super',      // Uses 1 super credit per receipt
  statement: 'super',  // Uses super credits (future)
};
```

### ScanModeSelector Component

```typescript
// src/components/scan/ScanModeSelector.tsx

import { Camera, Layers, CreditCard, Zap, Clock } from 'lucide-react';
import { useUserCredits } from '../../hooks/useUserCredits';
import { useScan } from '../../contexts/ScanContext';
import { useTranslation } from '../../hooks/useTranslation';

interface ScanModeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCAN_MODES = [
  {
    id: 'single' as const,
    icon: Camera,
    labelKey: 'scan.mode.single',
    descriptionKey: 'scan.mode.single.desc',
    creditType: 'normal' as const,
    creditCost: 1,
    gradient: 'from-emerald-600 to-emerald-700', // Primary green
    disabled: false,
  },
  {
    id: 'batch' as const,
    icon: Layers,
    labelKey: 'scan.mode.batch',
    descriptionKey: 'scan.mode.batch.desc',
    creditType: 'super' as const,
    creditCost: 1, // Per receipt
    gradient: 'from-amber-400 to-amber-500',
    disabled: false,
  },
  {
    id: 'statement' as const,
    icon: CreditCard,
    labelKey: 'scan.mode.statement',
    descriptionKey: 'scan.mode.statement.desc',
    creditType: 'super' as const,
    creditCost: 1,
    gradient: 'from-violet-400 to-violet-600',
    disabled: false, // Enabled but shows placeholder
  },
] as const;

export function ScanModeSelector({ isOpen, onClose }: ScanModeSelectorProps) {
  const { credits } = useUserCredits();
  const { startSingleScan, startBatchScan, startStatementScan } = useScan();
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleSelect = (modeId: typeof SCAN_MODES[number]['id']) => {
    switch (modeId) {
      case 'single':
        startSingleScan();
        break;
      case 'batch':
        startBatchScan();
        break;
      case 'statement':
        startStatementScan();
        break;
    }
    onClose();
  };

  // Format credits for display (e.g., 1000 → "1K")
  const formatCredits = (n: number): string => {
    if (n >= 1000) return `${Math.floor(n / 1000)}K`;
    return n.toString();
  };

  return (
    <>
      {/* Backdrop - semi-transparent */}
      <div
        className="fixed inset-0 z-[90] bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Card */}
      <div
        className="fixed z-[95] bottom-[72px] left-3 right-3
                   rounded-2xl shadow-2xl border overflow-hidden
                   bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        role="menu"
        aria-label={t('scan.mode.selector.title')}
      >
        {/* Header with credits */}
        <div className="flex items-center justify-between px-4 py-2 border-b
                        bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t('scan.mode.selector.title')}
          </span>

          {/* Credit badges */}
          <div className="flex items-center gap-2">
            {/* Super credits (lightning bolt) */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full
                           bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700">
              <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" fill="currentColor" />
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                {formatCredits(credits.superRemaining)}
              </span>
            </div>

            {/* Normal credits (clock/circle) */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full
                           bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
              <Clock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">
                {formatCredits(credits.remaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Mode options */}
        <div className="p-3 space-y-2">
          {SCAN_MODES.map((mode) => {
            const Icon = mode.icon;
            const hasCredits = mode.creditType === 'super'
              ? credits.superRemaining >= mode.creditCost
              : credits.remaining >= mode.creditCost;

            return (
              <button
                key={mode.id}
                className={`w-full flex items-center gap-3 p-3 rounded-xl
                           transition-transform hover:scale-[1.01]
                           bg-gray-50 dark:bg-gray-900
                           ${mode.id === 'statement' ? 'opacity-80' : ''}
                           ${!hasCredits && mode.id !== 'statement' ? 'opacity-50' : ''}`}
                onClick={() => handleSelect(mode.id)}
                disabled={!hasCredits && mode.id !== 'statement'}
                role="menuitem"
              >
                {/* Mode icon with gradient background */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center
                               shadow-sm bg-gradient-to-br ${mode.gradient}`}>
                  <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>

                {/* Label and description */}
                <div className="flex-1 text-left">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    {t(mode.labelKey)}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    {t(mode.descriptionKey)}
                  </div>
                </div>

                {/* Credit cost badge */}
                {mode.id === 'statement' ? (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full
                                  bg-emerald-100 dark:bg-emerald-900/30
                                  text-emerald-700 dark:text-emerald-400">
                    {t('common.soon')}
                  </span>
                ) : mode.creditType === 'super' ? (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full
                                 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700">
                    <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" fill="currentColor" />
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                      1 super
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full
                                 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                    <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                      {t('scan.mode.credit', { count: mode.creditCost })}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
```

### FAB Long Press Detection (Nav.tsx updates)

```typescript
// In Nav.tsx - Update the FAB button section

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner'; // or your toast library
import { ScanModeSelector } from './scan/ScanModeSelector';
import { useScanRequest } from '../../contexts/ScanRequestContext';

const LONG_PRESS_DURATION = 500; // ms

function ScanFAB() {
  const [showModeSelector, setShowModeSelector] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const didLongPress = useRef(false);
  const navigate = useNavigate();

  // Get current request state from context
  const { state: requestState, startSingleScan } = useScanRequest();
  const hasActiveRequest = requestState !== 'idle';

  const handlePointerDown = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;

      // ★ REQUEST PRECEDENCE: If request in progress, navigate to it instead
      if (hasActiveRequest) {
        toast.info('Tienes un escaneo en progreso');
        navigate('/scan'); // Navigate to current request
        return;
      }

      setShowModeSelector(true);
      // Optional: Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, LONG_PRESS_DURATION);
  }, [hasActiveRequest, navigate]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // If not a long press, handle tap
    if (!didLongPress.current && !showModeSelector) {
      // ★ REQUEST PRECEDENCE: If request in progress, navigate to it instead
      if (hasActiveRequest) {
        navigate('/scan');
        return;
      }
      startSingleScan();
    }
  }, [showModeSelector, hasActiveRequest, startSingleScan, navigate]);

  const handlePointerLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <>
      <button
        className="fab-button ..."
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerCancel}
        aria-label="Escanear recibo"
        aria-haspopup="menu"
        aria-expanded={showModeSelector}
      >
        {/* FAB icon - changes based on current mode/state (Story 14d.8) */}
      </button>

      {/* Only show mode selector if NO active request */}
      <ScanModeSelector
        isOpen={showModeSelector && !hasActiveRequest}
        onClose={() => setShowModeSelector(false)}
      />
    </>
  );
}
```

### Translation Keys

```typescript
// Add to translations.ts

// Spanish
'scan.mode.selector.title': 'MODO DE ESCANEO',
'scan.mode.single': 'Escaneo único',
'scan.mode.single.desc': 'Un recibo a la vez',
'scan.mode.batch': 'Escaneo múltiple',
'scan.mode.batch.desc': 'Varios recibos a la vez',
'scan.mode.statement': 'Estado de cuenta',
'scan.mode.statement.desc': 'Próximamente',
'scan.mode.credit': '{{count}} crédito',
'scan.mode.credit_plural': '{{count}} créditos',
'common.soon': 'Pronto',

// English
'scan.mode.selector.title': 'SCAN MODE',
'scan.mode.single': 'Single scan',
'scan.mode.single.desc': 'One receipt at a time',
'scan.mode.batch': 'Batch scan',
'scan.mode.batch.desc': 'Multiple receipts at once',
'scan.mode.statement': 'Bank statement',
'scan.mode.statement.desc': 'Coming soon',
'scan.mode.credit': '{{count}} credit',
'scan.mode.credit_plural': '{{count}} credits',
'common.soon': 'Soon',
```

## Visual Design Reference

```
┌──────────────────────────────────────────────────┐
│  MODO DE ESCANEO              ⚡ 96    ◷ 1K     │  ← Header with credits
├──────────────────────────────────────────────────┤
│  ┌─────────┐                                     │
│  │  📷     │  Escaneo único          1 crédito  │  ← Single scan (green)
│  │ (green) │  Un recibo a la vez                │
│  └─────────┘                                     │
├──────────────────────────────────────────────────┤
│  ┌─────────┐                                     │
│  │  📚     │  Escaneo múltiple       ⚡ 1 super │  ← Batch scan (amber)
│  │ (amber) │  Varios recibos a la vez           │
│  └─────────┘                                     │
├──────────────────────────────────────────────────┤
│  ┌─────────┐                                     │
│  │  💳     │  Estado de cuenta          Pronto  │  ← Statement (violet, dimmed)
│  │(violet) │  Próximamente                      │
│  └─────────┘                                     │
└──────────────────────────────────────────────────┘
                        ▲
                   [Camera FAB]
```

## Acceptance Criteria

### Long Press Detection

- [ ] **AC1:** Long press (500ms) on FAB shows popup (when IDLE)
- [ ] **AC2:** Single tap triggers single scan when IDLE (no popup)
- [ ] **AC3:** Pointer leave during press cancels long press
- [ ] **AC4:** Works on both touch and mouse devices
- [ ] **AC5:** Haptic feedback on long press trigger (if supported)

### Request Precedence (Critical)

- [ ] **AC-RP1:** If request state != IDLE, long-press navigates to current request instead of showing mode selector
- [ ] **AC-RP2:** If request state != IDLE, single-tap navigates to current request instead of starting new scan
- [ ] **AC-RP3:** Toast "Tienes un escaneo en progreso" shown when blocked by active request
- [ ] **AC-RP4:** Mode selector NEVER appears when there is an active request

### Popup Appearance

- [ ] **AC6:** Popup appears as floating card with 12px margins from edges
- [ ] **AC7:** Popup has rounded corners all around (`rounded-2xl`)
- [ ] **AC8:** Popup positioned above FAB (`bottom-[72px]`)
- [ ] **AC9:** Semi-transparent backdrop behind popup

### Credit Display

- [ ] **AC10:** Header shows super credits with lightning bolt icon (amber)
- [ ] **AC11:** Header shows normal credits with clock icon
- [ ] **AC12:** Credits formatted with "K" suffix for 1000+ (e.g., "1K")
- [ ] **AC13:** Credit values update in real-time from useUserCredits hook

### Mode Options

- [ ] **AC14:** Three options displayed: single, batch, statement
- [ ] **AC15:** Icons match FAB icons (Camera, Layers, CreditCard from lucide-react)
- [ ] **AC16:** Icons have gradient backgrounds matching mode colors:
  - Single: Green gradient (`emerald-600` to `emerald-700`)
  - Batch: Amber gradient (`amber-400` to `amber-500`)
  - Statement: Violet gradient (`violet-400` to `violet-600`)
- [ ] **AC17:** Each option shows credit cost badge on right side
- [ ] **AC18:** Statement option shows "Pronto" badge instead of credit cost

### Selection Behavior

- [ ] **AC19:** Clicking single option triggers startSingleScan()
- [ ] **AC20:** Clicking batch option triggers startBatchScan()
- [ ] **AC21:** Clicking statement option triggers startStatementScan()
- [ ] **AC22:** Popup dismisses after selection
- [ ] **AC23:** Clicking backdrop dismisses popup
- [ ] **AC24:** Escape key dismisses popup
- [ ] **AC25:** Options with insufficient credits are disabled (opacity-50)

### Accessibility

- [ ] **AC26:** Popup has `role="menu"`
- [ ] **AC27:** Options have `role="menuitem"`
- [ ] **AC28:** FAB has `aria-haspopup="menu"` and `aria-expanded`
- [ ] **AC29:** Focus management (focus first enabled option on open)
- [ ] **AC30:** Keyboard navigation (arrow keys, enter, escape)

### Dark Mode

- [ ] **AC31:** All colors adapt to dark mode using dark: variants
- [ ] **AC32:** Gradients remain consistent across themes

### Testing

- [ ] **AC33:** Unit tests for long press detection logic
- [ ] **AC34:** Unit tests for popup rendering with credits
- [ ] **AC35:** Unit tests for mode selection callbacks
- [ ] **AC36:** Unit tests for credit insufficiency states
- [ ] **AC37:** Accessibility audit passes

## Test Cases

```typescript
describe('ScanModeSelector', () => {
  describe('request precedence', () => {
    it('should NOT show popup when request state is CAPTURING');
    it('should NOT show popup when request state is SCANNING');
    it('should NOT show popup when request state is REVIEWING');
    it('should NOT show popup when request state is ERROR');
    it('should navigate to /scan when tapping FAB with active request');
    it('should navigate to /scan when long-pressing FAB with active request');
    it('should show toast "Tienes un escaneo en progreso" when blocked');
    it('should show popup only when request state is IDLE');
  });

  describe('long press (when IDLE)', () => {
    it('should show popup after 500ms press');
    it('should not show popup on quick tap (<500ms)');
    it('should trigger single scan on quick tap');
    it('should cancel on pointer leave before 500ms');
    it('should trigger haptic feedback on long press');
  });

  describe('credits display', () => {
    it('should display super credits with lightning icon');
    it('should display normal credits with clock icon');
    it('should format 1000+ as "K" (e.g., 1500 → "1K")');
    it('should show 0 when no credits remaining');
  });

  describe('mode options', () => {
    it('should render three mode options');
    it('should show correct icons for each mode');
    it('should show credit cost for single and batch');
    it('should show "Pronto" for statement mode');
    it('should disable options when insufficient credits');
  });

  describe('selection', () => {
    it('should call startSingleScan when single selected');
    it('should call startBatchScan when batch selected');
    it('should call startStatementScan when statement selected');
    it('should close popup after selection');
  });

  describe('dismissal', () => {
    it('should close on backdrop click');
    it('should close on escape key');
    it('should not close on popup content click');
  });

  describe('accessibility', () => {
    it('should have proper ARIA roles');
    it('should support keyboard navigation');
    it('should manage focus correctly');
  });
});
```

## Dependencies

- Story 14d.1: Scan State Machine Hook (provides request state)
- Story 14d.2: Scan Context Provider (provides `useScanRequest`)
- Story 14d.5: Batch Scan Refactor (batch mode must work)
- `useUserCredits` hook (existing)
- [Scan Request Lifecycle](../scan-request-lifecycle.md) - Defines precedence rules

## Blocks

- Story 14d.8: FAB Visual States (uses same icons/colors)

## Implementation Notes

1. **Icon consistency**: Use the same Lucide icons (Camera, Layers, CreditCard) that will be used in the FAB for Story 14d.8
2. **Gradient colors**: Match the FAB gradient colors exactly for visual consistency
3. **Credit types**: Single scan uses normal credits, batch/statement use super credits
4. **Statement placeholder**: Enabled in UI but triggers placeholder view (Story 14d.9)
5. **Animation**: Consider adding `animate-in slide-in-from-bottom-2` for smooth entry

## Design System Alignment

- Uses existing theme variables (`bg-gray-50`, `dark:bg-gray-900`, etc.)
- Follows existing button patterns from the codebase
- Credit badge styling matches the FAB badges from the mockup
- Rounded corners and shadows consistent with app design language

---

*Story updated with tech-spec based on Style 19 (Card Compact + Credits) mockup selection*
*Design reference: docs/uxui/mockups/00_components/scan-mode-selector.html*

---

## Implementation Notes (2026-01-12)

### Files Created/Modified

**New Files:**
- `src/components/scan/ScanModeSelector.tsx` - Mode selector popup component with all UI, accessibility, and keyboard navigation
- `tests/unit/components/scan/ScanModeSelector.test.tsx` - 31 unit tests covering credits display, mode options, selection, dismissal, accessibility

**Modified Files:**
- `src/components/Nav.tsx` - Added mode selector integration with long-press detection and request precedence
- `src/components/scan/index.ts` - Export ScanModeSelector and types
- `src/utils/translations.ts` - Added translation keys for EN and ES
- `tests/unit/components/Nav.test.tsx` - Added 27 tests for Story 14d.7, updated 6 Story 12.1 tests

### Acceptance Criteria Coverage

All acceptance criteria implemented:
- ✅ AC1-5: Long press detection (500ms threshold, haptic feedback, pointer leave cancellation)
- ✅ AC-RP1-4: Request precedence (navigate to active request, toast message, never show popup when active)
- ✅ AC6-9: Popup appearance (floating card, margins, rounded corners, backdrop)
- ✅ AC10-13: Credit display (super with lightning, normal with clock, K suffix formatting)
- ✅ AC14-18: Mode options (3 options, gradient icons, credit cost badges, "Soon" for statement)
- ✅ AC19-25: Selection behavior (callbacks, dismiss on selection/backdrop/escape, credit insufficiency)
- ✅ AC26-30: Accessibility (role="menu", menuitem, aria-haspopup, focus management, keyboard nav)
- ✅ AC31-32: Dark mode support
- ✅ AC33-37: Tests (113 total tests pass)

### Architecture Notes

- ScanModeSelector is a pure presentational component - receives credits via props from Nav
- Nav.tsx owns the showModeSelector state and handles all FAB interactions
- Request precedence check uses `hasActiveRequest` from `useScanOptional()` context
- Mode selection triggers parent callbacks (onScanClick, onBatchClick, onStatementClick)
- Statement mode is enabled in UI but requires placeholder view (Story 14d.9)

### Test Coverage

- ScanModeSelector.test.tsx: 31 tests
- Nav.test.tsx (Story 14d.7 section): 27 tests
- All 113 tests pass

### Breaking Changes

- Story 12.1 behavior updated: long-press now opens mode selector instead of directly calling onBatchClick
- Batch mode is now accessed through mode selector popup (user selects "Batch scan" option)
- Nav.tsx props updated: added `onStatementClick` and `onShowToast` optional props
