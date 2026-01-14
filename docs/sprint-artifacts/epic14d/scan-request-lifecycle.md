# Scan Request Lifecycle & Persistence Rules

**Epic:** 14d - Scan Architecture Refactor
**Status:** Design Specification
**Last Updated:** 2026-01-08

## Overview

This document defines the lifecycle rules for scan requests (single, batch, and future statement scans). The core principle is **request persistence with precedence** - once a scan request is initiated, it must be explicitly resolved (saved or cancelled) before any new request can begin.

## Core Principles

### 1. Request Precedence

> **A request in progress ALWAYS has precedence over any new request.**

- If a scan request exists (any state except idle), no new scan can be initiated
- Long-pressing FAB while a request is in progress should show the current request, not the mode selector
- Navigation away from scan views does NOT cancel the request

### 2. Request Persistence

> **A request persists until explicitly resolved (saved or cancelled).**

- Navigating to other views → Request persists
- Closing the app → Request persists (local storage)
- Logging out and back in → Request persists (tied to user)
- App crash/refresh → Request persists (local storage recovery)

### 3. Credit Consumption

> **Credits are consumed at the moment of API call, not at request completion.**

- Credit is reserved when scan API is called
- Credit is confirmed when API returns success
- Credit is refunded if API call fails
- Credit is NOT refunded if user cancels after successful scan

## Request Lifecycle States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SCAN REQUEST LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────┐                                                                │
│   │  IDLE   │ ← No active request. Mode selector available.                 │
│   └────┬────┘                                                                │
│        │                                                                     │
│        │ User selects mode (single/batch/statement)                         │
│        ▼                                                                     │
│   ┌─────────────┐                                                            │
│   │  CAPTURING  │ ← Images being added. No credit spent yet.                │
│   └──────┬──────┘                                                            │
│          │                                                                   │
│          │ User triggers scan (upload images to API)                         │
│          │ ★ CREDIT RESERVED at this point                                  │
│          ▼                                                                   │
│   ┌─────────────┐                                                            │
│   │  SCANNING   │ ← API call in progress. Credit reserved.                  │
│   └──────┬──────┘                                                            │
│          │                                                                   │
│          ├─── API Success ───► ┌─────────────┐                              │
│          │                     │  REVIEWING  │ ← Results ready for edit.    │
│          │                     └──────┬──────┘   Credit confirmed.          │
│          │                            │                                      │
│          │                            ├─── Save ───► ┌────────┐             │
│          │                            │              │ SAVED  │ → IDLE      │
│          │                            │              └────────┘             │
│          │                            │                                      │
│          │                            └─── Cancel ──► ┌───────────┐         │
│          │                                            │ CANCELLED │ → IDLE  │
│          │                                            └───────────┘         │
│          │                                            (with warning)         │
│          │                                                                   │
│          └─── API Failure ───► ┌─────────┐                                  │
│                                │  ERROR  │ ← Credit refunded.               │
│                                └────┬────┘                                   │
│                                     │                                        │
│                                     ├─── Retry ───► SCANNING                │
│                                     └─── Cancel ──► IDLE (no warning)       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## State Definitions

| State | Description | Credit Status | Can Navigate Away? | Can Start New Request? |
|-------|-------------|---------------|-------------------|----------------------|
| **IDLE** | No active request | None | Yes | Yes |
| **CAPTURING** | Adding images, no API call yet | None | Yes (persists) | No |
| **SCANNING** | API call in progress | Reserved | Yes (persists) | No |
| **REVIEWING** | Results ready for editing | Confirmed (spent) | Yes (persists) | No |
| **ERROR** | API call failed | Refunded | Yes (persists) | No |
| **SAVED** | Transaction saved | Spent | N/A (transitions to IDLE) | N/A |
| **CANCELLED** | User cancelled request | Spent (if was REVIEWING) | N/A (transitions to IDLE) | N/A |

## Detailed Workflow Rules

### Rule 1: Starting a New Request

```
IF current_state == IDLE:
    Show mode selector popup
    User selects mode → transition to CAPTURING
ELSE:
    Show current request (do NOT show mode selector)
    Display toast: "Tienes un escaneo en progreso"
```

### Rule 2: Credit Handling

```
ON scan API call:
    reserveCredits(1, creditType) → UI shows deducted

ON API success:
    confirmReservedCredits() → Persisted to Firestore

ON API failure:
    refundReservedCredits() → UI restored, no charge

ON user cancel (after API success):
    DO NOT refund → Credit was legitimately spent
    Show warning dialog first
```

### Rule 3: Cancellation Warning

When user attempts to cancel a request that has already consumed a credit (state = REVIEWING):

```typescript
// Cancel Warning Dialog
{
  title: "¿Cancelar escaneo?",
  message: "Ya gastaste {creditType === 'super' ? '1 súper crédito' : '1 crédito'} en este escaneo. Si cancelas, no se reembolsará.",
  actions: [
    { label: "Continuar editando", action: "dismiss" },
    { label: "Cancelar escaneo", action: "confirm", destructive: true }
  ]
}
```

### Rule 4: Navigation Behavior

| Action | Current State | Behavior |
|--------|---------------|----------|
| Press Back | CAPTURING | Show cancel dialog (no credit warning) |
| Press Back | SCANNING | Block navigation, show "Procesando..." |
| Press Back | REVIEWING | Show cancel dialog WITH credit warning |
| Press Back | ERROR | Allow back, offer retry |
| Navigate to other tab | Any active | Allow, request persists |
| Return to scan tab | Any active | Show current request |
| Long-press FAB | Any active | Show current request, NOT mode selector |

### Rule 5: Persistence Requirements

**Local Storage (IndexedDB/localStorage):**
```typescript
interface PersistedScanRequest {
  id: string;
  userId: string;
  mode: 'single' | 'batch' | 'statement';
  state: ScanRequestState;
  images: string[];  // Base64 or blob URLs
  result: Transaction | null;
  creditType: 'normal' | 'super';
  creditSpent: boolean;  // True after successful API call
  createdAt: string;
  updatedAt: string;
}
```

**Recovery on App Load:**
```typescript
ON app_load:
    persistedRequest = loadFromStorage(userId)
    IF persistedRequest exists:
        restoreState(persistedRequest)
        IF state == SCANNING:
            // Was interrupted during API call
            transition to ERROR with message "Escaneo interrumpido"
            refundReservedCredits()
```

### Rule 6: Save Requirements

A request can ONLY be saved when:

```typescript
function canSave(request: ScanRequest): boolean {
  // Must have at least one item
  if (!request.result?.items?.length) return false;

  // At least one item must have non-zero price
  const hasValidItem = request.result.items.some(
    item => item.price > 0
  );
  if (!hasValidItem) return false;

  // Transaction total must be non-zero
  if (request.result.total <= 0) return false;

  return true;
}
```

## Batch Mode Specific Rules

For batch mode, the lifecycle applies to the ENTIRE batch, not individual receipts:

```
BATCH REQUEST LIFECYCLE:
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  IDLE → CAPTURING (adding multiple images)                   │
│           │                                                  │
│           │ "Procesar lote" button                          │
│           ▼                                                  │
│       SCANNING (all images processed sequentially)           │
│           │ ★ 1 SUPER CREDIT per image                      │
│           ▼                                                  │
│       REVIEWING (batch summary view)                         │
│           │                                                  │
│           ├── Save All → SAVED (creates N transactions)     │
│           ├── Save Some → Partial save (rest cancelled)     │
│           └── Cancel All → CANCELLED (with warning)         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Batch Credit Warning:**
```typescript
{
  title: "¿Cancelar lote?",
  message: "Ya gastaste {count} súper créditos en este lote. Si cancelas, no se reembolsarán.",
  actions: [
    { label: "Continuar editando", action: "dismiss" },
    { label: "Cancelar lote", action: "confirm", destructive: true }
  ]
}
```

## UI Indicators

### FAB States When Request Active

| Request State | FAB Appearance | FAB Tap Action |
|---------------|----------------|----------------|
| CAPTURING | Mode color + pulse | Go to capture view |
| SCANNING | Mode color + shine animation | Go to progress view |
| REVIEWING | Mode color + badge with count | Go to review view |
| ERROR | Red + alert icon | Go to error view |

### Navigation Badge

When navigating away from an active request, show a badge on the scan tab:

```
[Home]  [Scan •]  [Insights]  [Settings]
              ↑
        Badge indicates active request
```

## Implementation Checklist

### State Machine (Story 14d.1)
- [ ] Define all states and transitions
- [ ] Implement state persistence to local storage
- [ ] Handle app crash/refresh recovery

### Context Provider (Story 14d.2)
- [ ] Expose request state globally
- [ ] Integrate with useUserCredits for reservation flow
- [ ] Handle navigation blocking

### Mode Selector (Story 14d.7)
- [ ] Block mode selector when request active
- [ ] Show "request in progress" toast
- [ ] Navigate to current request instead

### Cancel Dialog (Story 14d.6)
- [ ] Implement credit warning variant
- [ ] Different messaging for single vs batch
- [ ] Track cancelled requests for analytics

### Persistence (Story 14d.10)
- [ ] Implement IndexedDB storage
- [ ] Recovery logic on app load
- [ ] Cleanup on successful save/cancel

## Design Decisions (Confirmed 2026-01-08)

### Offline Handling
**Decision: Error immediately**
- If user goes offline during SCANNING state, transition to ERROR immediately
- Refund the reserved credit
- User can retry when back online
- Rationale: Simple, predictable, no ambiguity about credit state

### Request Expiration
**Decision: No expiration**
- Requests persist forever until explicitly resolved (saved or cancelled)
- Rationale: User should never lose work or credits due to time passing
- Note: Consider adding "stale request" cleanup in future if storage becomes an issue

### Multi-Device Sync
**Decision: Deferred**
- For MVP, requests are local to the device
- Future consideration: Sync via Firestore for cross-device continuity

---

*This specification ensures scan requests are never lost and credits are handled fairly.*
*Design decisions confirmed by product owner on 2026-01-08.*
