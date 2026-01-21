# Story 14d.10: State Machine Persistence

**Epic:** 14d - Scan Architecture Refactor
**Points:** 3
**Priority:** MEDIUM
**Status:** OBSOLETE - Superseded by Stories 14d.4d + 14d.5e
**Depends On:** Story 14d.5

---

## ⚠️ OBSOLETE NOTICE (2026-01-12)

**This story has been superseded** by Stories 14d.4d (Pending Scan Migration) and 14d.5e (Batch Persistence Migration).

### What Was Already Implemented

| Requirement | Implementation | Story |
|-------------|----------------|-------|
| State persists to localStorage | `savePersistedScanState()` | 14d.4d |
| Idle state clears persistence | Returns early if `state === null` | 14d.4d |
| State restored on reload | `loadPersistedScanState()` + migration | 14d.4d |
| Version number for migrations | `SCAN_STATE_VERSION = 1` | 14d.4d |
| Error handling | Try/catch + quota fallback | 14d.4d |
| pendingScanStorage deprecated | Now uses `PersistedScanState` format | 14d.4d |
| pendingBatchStorage deprecated | `loadAndMigrateLegacyBatch()` migrates | 14d.5e |
| No duplicate persistence | Unified single key per user | 14d.5e |

### Why 24-Hour Staleness Was NOT Implemented

The architecture decision (ADR-020 Scan State Machine) explicitly states:

> **Persistence: No expiration** - User never loses work

This was a deliberate design choice. Implementing staleness would be a **regression** - users would lose work they currently preserve.

### Files That Implemented This

- `src/services/pendingScanStorage.ts` - Full persistence with version, migration, error handling
- `src/types/scanStateMachine.ts` - `PersistedScanState` interface, `SCAN_STATE_VERSION`
- `src/hooks/useScanStateMachine.ts` - `RESTORE_STATE` action handler

### Recommendation

Close this story as "done (superseded)" - all essential functionality exists.

---

## Original Story Content (for reference)

## Description

Persist the scan state machine to localStorage for crash recovery. If the app is closed or crashes during a scan, the user can resume where they left off.

## Background

Existing persistence services:
- `pendingScanStorage.ts` - Single scan persistence
- `pendingBatchStorage.ts` - Batch scan persistence

This story integrates state machine persistence with these existing services or replaces them with unified persistence.

## Deliverables

### Files to Create/Update

```
src/
├── services/
│   └── scanStatePersistence.ts     # New unified persistence
├── hooks/
│   └── useScanStateMachine.ts      # Add persistence
└── tests/unit/services/
    └── scanStatePersistence.test.ts
```

## Technical Specification

### Persistence Service

```typescript
// src/services/scanStatePersistence.ts

import type { ScanState } from '../types/scanStateMachine';

const STORAGE_KEY = 'boletapp_scan_state';
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

interface PersistedScanState {
  state: ScanState;
  timestamp: number;
  version: number; // For migration handling
}

const CURRENT_VERSION = 1;

export function saveScanState(state: ScanState): void {
  // Don't persist idle state
  if (state.phase === 'idle') {
    clearScanState();
    return;
  }

  const persisted: PersistedScanState = {
    state,
    timestamp: Date.now(),
    version: CURRENT_VERSION,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch (error) {
    console.warn('Failed to persist scan state:', error);
  }
}

export function loadScanState(): ScanState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const persisted: PersistedScanState = JSON.parse(raw);

    // Check version
    if (persisted.version !== CURRENT_VERSION) {
      console.log('Scan state version mismatch, clearing');
      clearScanState();
      return null;
    }

    // Check staleness
    const age = Date.now() - persisted.timestamp;
    if (age > STALE_THRESHOLD_MS) {
      console.log('Scan state is stale, clearing');
      clearScanState();
      return null;
    }

    return persisted.state;
  } catch (error) {
    console.warn('Failed to load scan state:', error);
    clearScanState();
    return null;
  }
}

export function clearScanState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear scan state:', error);
  }
}

export function hasPendingScanState(): boolean {
  const state = loadScanState();
  return state !== null && state.phase !== 'idle';
}
```

### Hook Integration

```typescript
// src/hooks/useScanStateMachine.ts

import { useReducer, useEffect, useRef } from 'react';
import {
  saveScanState,
  loadScanState,
  clearScanState,
} from '../services/scanStatePersistence';

export function useScanStateMachine() {
  // Load initial state from persistence
  const getInitialState = (): ScanState => {
    const persisted = loadScanState();
    if (persisted) {
      console.log('Restored scan state from persistence');
      return persisted;
    }
    return initialState;
  };

  const [state, dispatch] = useReducer(scanReducer, undefined, getInitialState);

  // Track if this is the first render
  const isFirstRender = useRef(true);

  // Persist on state change (skip first render to avoid double-save)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    saveScanState(state);
  }, [state]);

  // ... rest of hook
}
```

### Recovery UI (Optional Enhancement)

```typescript
// In App.tsx or ScanContext

function ScanRecoveryPrompt() {
  const { state, reset } = useScan();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show prompt if we loaded persisted state
    if (state.phase !== 'idle' && state.startedAt) {
      const age = Date.now() - state.startedAt;
      if (age > 5000) { // More than 5 seconds old = recovered state
        setShowPrompt(true);
      }
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 m-4 max-w-sm">
        <h2 className="text-lg font-semibold mb-2">
          Escaneo en Progreso
        </h2>
        <p className="text-gray-600 mb-4">
          Encontramos un escaneo sin terminar. ¿Quieres continuar?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => { reset(); setShowPrompt(false); }}
            className="flex-1 py-2 border rounded-lg"
          >
            Descartar
          </button>
          <button
            onClick={() => setShowPrompt(false)}
            className="flex-1 py-2 bg-primary text-white rounded-lg"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Acceptance Criteria

### Persistence

- [ ] **AC1:** State persists to localStorage on change
- [ ] **AC2:** Idle state clears persistence
- [ ] **AC3:** State restored on app reload
- [ ] **AC4:** Version number for future migrations

### Staleness Handling

- [ ] **AC5:** State older than 24 hours is cleared
- [ ] **AC6:** Timestamp stored with state
- [ ] **AC7:** Stale check on load

### Error Handling

- [ ] **AC8:** Graceful handling of localStorage errors
- [ ] **AC9:** Corrupted data cleared safely
- [ ] **AC10:** Version mismatch cleared

### Integration

- [ ] **AC11:** Existing pendingScanStorage deprecated or removed
- [ ] **AC12:** Existing pendingBatchStorage deprecated or removed
- [ ] **AC13:** No duplicate persistence

### Testing

- [ ] **AC14:** Unit tests for save/load/clear
- [ ] **AC15:** Unit tests for staleness
- [ ] **AC16:** Integration test for recovery flow

## Test Cases

```typescript
describe('scanStatePersistence', () => {
  describe('saveScanState', () => {
    it('should save state to localStorage');
    it('should clear storage for idle state');
    it('should include timestamp and version');
  });

  describe('loadScanState', () => {
    it('should load persisted state');
    it('should return null if no persisted state');
    it('should clear stale state (>24h)');
    it('should clear version mismatch');
    it('should handle corrupted data');
  });

  describe('hook integration', () => {
    it('should initialize with persisted state');
    it('should save on state change');
    it('should not save on first render');
  });
});
```

## Migration Notes

### From Old Persistence Services

```typescript
// In App.tsx startup, migrate old data
useEffect(() => {
  // Check for old persistence format
  const oldSingleScan = localStorage.getItem('boletapp_pending_scan');
  const oldBatchScan = localStorage.getItem('boletapp_pending_batch');

  if (oldSingleScan || oldBatchScan) {
    // Migrate or clear old data
    localStorage.removeItem('boletapp_pending_scan');
    localStorage.removeItem('boletapp_pending_batch');
  }
}, []);
```

## Dependencies

- Story 14d.5: Batch Scan Refactor (all scan types must be migrated)

## Blocks

- Story 14d.11: App.tsx Cleanup (removes old persistence)

## Notes

- Keep persistence lightweight - don't persist large images (use refs)
- Consider IndexedDB for image persistence if needed
- Recovery prompt is optional UX enhancement

---

*Story created by Atlas - Project Intelligence Guardian*
