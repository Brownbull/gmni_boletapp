# Story 14d.9: Statement Scan Placeholder View

**Epic:** 14d - Scan Architecture Refactor
**Points:** 2
**Priority:** LOW
**Status:** Done
**Depends On:** Story 14d.7

## Description

Create a placeholder view for the credit card statement scanning feature. This view will be shown when users select "Estado de cuenta" from the mode selector, and will contain a "coming soon" message with a back button.

## Background

UX Decision: Include statement scanning in the mode selector from day one to:
1. Establish the UI pattern before the feature is built
2. Gauge user interest (analytics on how often it's tapped)
3. Prepare the architecture for easy feature addition later

## Deliverables

### Files to Create

```
src/
├── views/
│   └── StatementScanView.tsx        # Placeholder view
└── tests/unit/views/
    └── StatementScanView.test.tsx
```

## Technical Specification

### View Implementation

```typescript
// src/views/StatementScanView.tsx

import { useScan } from '../contexts/ScanContext';
import { CreditCard, ArrowLeft } from 'lucide-react';

export function StatementScanView() {
  const { reset } = useScan();

  const handleBack = () => {
    reset(); // Clears scan state, returns to idle
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Estado de Cuenta</h1>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-violet-100 rounded-full p-6 mb-6">
          <CreditCard className="w-16 h-16 text-violet-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Próximamente
        </h2>

        <p className="text-gray-600 max-w-sm mb-8">
          Pronto podrás escanear estados de cuenta de tarjetas de crédito
          y añadir transacciones automáticamente.
        </p>

        <button
          onClick={handleBack}
          className="px-6 py-3 bg-violet-600 text-white rounded-xl
                     hover:bg-violet-700 transition-colors font-medium"
        >
          Volver al inicio
        </button>
      </main>
    </div>
  );
}
```

### Routing Integration

```typescript
// In App.tsx view rendering

const renderView = () => {
  // Check if statement scan mode is active
  if (scanState.mode === 'statement' && scanState.phase !== 'idle') {
    return <StatementScanView />;
  }

  // ... other view logic
};
```

### Analytics (Optional)

```typescript
// Track when users tap on statement option
const handleStatementSelect = () => {
  // Analytics event
  trackEvent('scan_mode_selected', { mode: 'statement', feature_status: 'coming_soon' });
  startStatementScan();
};
```

## Visual Design

```
┌──────────────────────────────────────┐
│ ←  Estado de Cuenta                  │
├──────────────────────────────────────┤
│                                      │
│                                      │
│           ┌─────────────┐            │
│           │     💳      │            │
│           │   (large)   │            │
│           └─────────────┘            │
│                                      │
│           Próximamente               │
│                                      │
│     Pronto podrás escanear          │
│     estados de cuenta de            │
│     tarjetas de crédito...          │
│                                      │
│        ┌─────────────────┐           │
│        │ Volver al inicio │           │
│        └─────────────────┘           │
│                                      │
└──────────────────────────────────────┘
```

## Acceptance Criteria

### View Content

- [x] **AC1:** Header shows "Estado de Cuenta" title
- [x] **AC2:** Back button in header
- [x] **AC3:** Large credit card icon (violet theme)
- [x] **AC4:** "Próximamente" heading
- [x] **AC5:** Explanatory text in Spanish
- [x] **AC6:** "Volver al inicio" button

### Navigation

- [x] **AC7:** Back button calls `reset()` on ScanContext
- [x] **AC8:** "Volver al inicio" button also calls `reset()`
- [x] **AC9:** After reset, FAB returns to idle state
- [x] **AC10:** User returns to dashboard view

### Styling

- [x] **AC11:** Uses violet color theme (matches FAB)
- [x] **AC12:** Responsive layout
- [x] **AC13:** Matches app design language

### Testing

- [x] **AC14:** Unit tests for rendering
- [x] **AC15:** Unit tests for back button functionality
- [x] **AC16:** Snapshot test for visual consistency

## Test Cases

```typescript
describe('StatementScanView', () => {
  it('should render placeholder content');
  it('should show "Próximamente" heading');
  it('should call reset() on back button click');
  it('should call reset() on "Volver al inicio" click');
  it('should use violet color theme');
});
```

## Dependencies

- Story 14d.7: Mode Selector Popup (triggers this view)

## Blocks

- None (this is a placeholder)

## Future Considerations

When implementing actual statement scanning:
1. Replace this view with StatementCaptureView
2. Add document upload UI
3. Add statement parsing progress
4. Add transaction review UI
5. Update state machine with statement-specific states

## Notes

- Keep implementation minimal - this is just a placeholder
- Violet theme should match the FAB color for statement mode
- Consider adding email signup for feature notification (future)

---

## Dev Agent Record

### Implementation Plan
- Created StatementScanView.tsx with placeholder "coming soon" content
- Added full theme support (light/dark) using CSS variables
- Integrated with ScanContext for back button functionality (reset())
- Added view routing in App.tsx including onStatementClick handler
- Added statement-scan to View type union
- Updated TopHeader and main padding exclusions for full-screen view

### Files Created
- `src/views/StatementScanView.tsx` - Placeholder view component
- `tests/unit/views/StatementScanView.test.tsx` - Unit tests (19 tests)

### Files Modified
- `src/App.tsx` - Added import, View type, routing, Nav onStatementClick handler

### Test Results
- 22 unit tests passing (3 added during code review)
- 2 snapshot tests created
- All acceptance criteria verified via automated tests

### Completion Notes
- Implementation follows established patterns from BatchCaptureView
- Violet theme (#8b5cf6) matches FAB statement mode color
- Both back buttons call reset() which triggers AC9/AC10 behavior
- Responsive layout using Tailwind classes and CSS custom properties

### Code Review Fixes (2026-01-12)

**M2 Fix: Keyboard Accessibility**
- Added `onFocus`/`onBlur` handlers to buttons for keyboard users
- Extracted shared `getButtonHoverStyle()` helper for consistent behavior
- Added tests for focus state styling

**L1 Fix: iOS Safe Area Support**
- Added `paddingTop: 'env(safe-area-inset-top, 0px)'` to view container
- Added `paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))'` to main content
- Follows Atlas 06-lessons.md safe area pattern

**M1 Note: Analytics (Deferred)**
- Analytics tracking mentioned as "(Optional)" in story
- Not implemented - can be added when measuring feature interest becomes priority

---

*Story created by Atlas - Project Intelligence Guardian*
