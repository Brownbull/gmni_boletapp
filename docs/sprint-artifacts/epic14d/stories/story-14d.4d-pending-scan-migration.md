# Story 14d.4d: pendingScan Migration (Complex)

**Epic:** 14d - Scan Architecture Refactor
**Parent Story:** 14d.4 - Refactor Single Scan Flow
**Points:** 5
**Priority:** HIGH
**Status:** Done (2026-01-10) - Phases 1-2 complete, code review passed. AC1-2 deferred to 14d.4e.
**Depends On:** Story 14d.4c

## Description

Handle the complex `pendingScan` state migration. The `PendingScan` object is used for persistence, status tracking, and transaction storage. This requires careful mapping to the ScanContext state machine structure.

## Background

The `pendingScan` state (`PendingScan | null`) is the most complex state variable to migrate:

```typescript
interface PendingScan {
  id: string;
  userId: string;
  status: 'idle' | 'analyzing' | 'analyzed' | 'error';
  images: string[];
  analyzedTransaction: Transaction | null;
  error?: string;
  createdAt: string;
}
```

It's used for:
1. **Persistence**: `pendingScanStorage.ts` saves/loads from localStorage
2. **Status tracking**: Determines scan phase
3. **Transaction storage**: Holds analyzed transaction until saved
4. **Recovery**: Restores state after app refresh/navigation

## Current Usage Analysis

### pendingScan Setter Usages (~35 total)

| Location | Usage | Notes |
|----------|-------|-------|
| App.tsx initialization | Load from storage | Recovery flow |
| processScan start | Set status to 'analyzing' | Phase transition |
| processScan success | Set analyzedTransaction | Store result |
| processScan error | Set error, status to 'error' | Error handling |
| handleSave success | Set to null | Clear on save |
| handleCancel | Set to null | Clear on cancel |
| Navigation restore | Read and restore UI state | Recovery flow |

### Mapping to ScanContext State

| PendingScan Field | ScanContext Field | Notes |
|-------------------|-------------------|-------|
| `id` | `state.requestId` | Direct mapping |
| `userId` | `state.userId` | Direct mapping |
| `status` | `state.phase` | Map: 'analyzing'→'scanning', 'analyzed'→'reviewing' |
| `images` | `state.images` | Direct mapping |
| `analyzedTransaction` | `state.results[0]` | First result |
| `error` | `state.error` | Direct mapping |
| `createdAt` | `state.startedAt` | Timestamp |

## Deliverables

### Files to Update

```
src/
├── App.tsx                           # Add ScanContext persistence, keep pendingScan for compat
├── services/
│   └── pendingScanStorage.ts         # Update to use ScanState format
└── types/
    └── scanStateMachine.ts           # PersistedScanState, SCAN_STATE_VERSION types

tests/unit/services/
└── pendingScanStorage.test.ts        # 32 tests (14 new for 14d.4d)
```

## Technical Specification

### Storage Format Migration

```typescript
// Old format (PendingScan)
{
  id: 'scan-123',
  userId: 'user-abc',
  status: 'analyzed',
  images: ['base64...'],
  analyzedTransaction: { merchant: 'Store', ... },
  createdAt: '2026-01-09T...'
}

// New format (PersistedScanState - from scanStateMachine.ts)
{
  version: 1,
  state: {
    phase: 'reviewing',
    mode: 'single',
    requestId: 'req-123',
    userId: 'user-abc',
    images: ['base64...'],
    results: [{ merchant: 'Store', ... }],
    // ... rest of ScanState
  },
  persistedAt: 1704800000000
}
```

### Migration Strategy

1. **Read**: Check for old format, migrate to new format
2. **Write**: Always write new format
3. **Backwards compatibility**: Support reading old format for transition period

```typescript
// pendingScanStorage.ts update
export function loadPendingScan(userId: string): ScanState | null {
  const raw = localStorage.getItem(`pendingScan_${userId}`);
  if (!raw) return null;

  const data = JSON.parse(raw);

  // Check if old format (has 'status' field)
  if ('status' in data) {
    return migrateOldFormat(data);
  }

  // New format (has 'version' field)
  if (data.version === 1) {
    return data.state;
  }

  return null;
}

function migrateOldFormat(old: PendingScan): ScanState {
  return {
    phase: mapStatus(old.status),
    mode: 'single',
    requestId: old.id,
    userId: old.userId,
    images: old.images,
    results: old.analyzedTransaction ? [old.analyzedTransaction] : [],
    error: old.error || null,
    startedAt: new Date(old.createdAt).getTime(),
    // ... defaults for other fields
  };
}
```

### Recovery Flow Update

```typescript
// App.tsx - Recovery on load
useEffect(() => {
  if (user?.uid) {
    const persisted = loadPersistedScanState(user.uid);
    if (persisted) {
      // Use restoreState action
      restoreState(persisted);

      // If was in scanning phase, transition to error (interrupted)
      // This is handled by RESTORE_STATE action in reducer
    }
  }
}, [user?.uid]);
```

## Acceptance Criteria

### State Removal
- [ ] **AC1:** Remove `pendingScan` useState from App.tsx
- [ ] **AC2:** All pendingScan reads replaced with ScanContext state reads

### Persistence Migration
- [x] **AC3:** `pendingScanStorage.ts` updated to save ScanState format (2026-01-10)
- [x] **AC4:** Backwards compatibility: old PendingScan format auto-migrated (2026-01-10)
- [x] **AC5:** Recovery on app load works correctly (2026-01-10)

### Integration
- [x] **AC6:** Scan state persists across navigation (via ScanContext persistence effect)
- [x] **AC7:** Scan state persists across page refresh (new format with versioning)
- [x] **AC8:** Scan state recovers after app crash (RESTORE_STATE action)

### Testing
- [x] **AC9:** Persistence tests pass (32 tests in pendingScanStorage.test.ts)
- [x] **AC10:** Recovery tests pass
- [x] **AC11:** Migration tests pass (old format → new format)
- [x] **AC12:** Manual test: refresh during scan shows appropriate message (toast) - NOTE: Full recovery requires Epic 16

## Implementation Progress (2026-01-10)

### Phase 1: Storage Migration (COMPLETE)
- [x] Updated `pendingScanStorage.ts` with new ScanState format
- [x] Added backwards compatibility migration for old PendingScan format
- [x] New API: `savePersistedScanState`, `loadPersistedScanState`, `clearPersistedScanState`
- [x] Legacy API maintained for transition: `savePendingScan`, `loadPendingScan`, etc.
- [x] 32 unit tests passing (14 new for 14d.4d)

### Phase 2: App.tsx Integration (COMPLETE)
- [x] Added ScanContext persistence effect (saves scanState on change)
- [x] Updated load effect to use `loadPersistedScanState` + `restoreState`
- [x] Parallel persistence: both ScanContext and legacy pendingScan saved

### Phase 3: Full Migration (PENDING)
- [ ] Remove pendingScan useState (~35 usages to migrate)
- [ ] Replace all pendingScan reads with ScanContext reads
- [ ] This phase deferred to avoid regression risk

### Decision: Phased Approach
The full removal of `pendingScan` (AC1, AC2) involves ~35 setter usages throughout App.tsx.
To minimize regression risk, this is implemented as a **parallel system**:
1. ScanContext state is now the primary persistence mechanism
2. Legacy pendingScan is kept for backwards compatibility
3. Full removal can be done incrementally in follow-up work

### Known Limitation: Interrupted Scans Cannot Be Recovered
**Issue discovered during QA testing (2026-01-10):**

When a user refreshes or leaves the app during an active scan (while Gemini API call is in progress), the scan is lost. This is a fundamental limitation of the client-side architecture:

- Scan API calls happen in the browser
- If browser closes/refreshes, the API call is terminated
- No server-side process to continue the scan
- User must retry (credit is not charged for interrupted scans)

**Accepted behavior:**
- Interrupted scans show toast: "Escaneo interrumpido. Intenta de nuevo."
- Storage is cleared to prevent confusion
- User can retry immediately
- This is acceptable for MVP - backend scan queue would be significant additional work

## Test Cases

```typescript
describe('pendingScan migration', () => {
  describe('storage format', () => {
    it('should read old PendingScan format and migrate');
    it('should write new PersistedScanState format');
    it('should handle missing/corrupted data gracefully');
  });

  describe('recovery', () => {
    it('should restore reviewing phase after refresh');
    it('should transition interrupted scanning to error');
    it('should clear storage after successful save');
  });
});
```

## Code Review (2026-01-10)

**Reviewer:** Atlas-enhanced adversarial code review

**Result:** ✅ PASSED with minor fixes applied

### Issues Fixed During Review

| Issue | Severity | Fix |
|-------|----------|-----|
| Console warning not DEV-gated | MEDIUM | Wrapped in `import.meta.env.DEV` at pendingScanStorage.ts:204 |
| Redundant `clearPendingScan` calls | LOW | Removed duplicate calls in App.tsx recovery flow |
| Incomplete test assertion | LOW | Fixed test at pendingScanStorage.test.ts:111 |
| Wrong file in deliverables | LOW | Updated to reference scanStateMachine.ts instead of scan.ts |
| Missing test file in deliverables | MEDIUM | Added tests/unit/services/pendingScanStorage.test.ts |

### Code Review Learnings

**Pattern Adoption:**
- Parallel persistence pattern: ScanContext + legacy pendingScan for safe migration
- Version field in PersistedScanState enables future schema migrations
- `@deprecated` annotations guide developers to new API

**Technical Decisions:**
- Phased approach: Phases 1-2 complete, Phase 3 deferred to minimize regression risk
- Recovery flow shows toast for interrupted scans (acceptable limitation for MVP)
- Legacy API maintained for backwards compatibility during migration

**Atlas Validation:**
- ✅ Follows State Machine pattern (ADR-020)
- ✅ Uses localStorage per-user keys correctly
- ✅ No architectural drift detected

## Notes

- This is the final sub-story of 14d.4
- After this, Story 14d.4 is complete
- pendingScan was the most coupled state variable - removal simplifies App.tsx significantly
- Consider deprecation warning in old format reader for eventual removal

---

*Sub-story created for incremental migration of Story 14d.4*
