# Pipeline Registry

> **Purpose:** Single source of truth for async pipeline definitions.
> **Used by:** TDD agent integration seam check (Pattern 9), classification force-include, dev-story completion.
> **Update:** Add new pipelines here when they are implemented. All workflow steps load this file.

## Known Async Pipelines

Each pipeline is listed with its components in execution order. The TDD agent checks whether a story touches any component and verifies integration test coverage for the seams between them.

### Receipt Scan Pipeline
```
queueScanFromImages (client, src/features/scan/)
  → processReceiptScan (CF, functions/src/)
  → Firestore pendingScans/{id} (write)
  → usePendingScan onSnapshot (client, src/hooks/)
  → UI result display (client, src/features/scan/)
```

### Statement Scan Pipeline
```
queueStatementScan (client, src/features/scan/)
  → processStatementScan (CF, functions/src/)
  → Firestore statementScans/{id} (write)
  → client listener (src/hooks/)
```

### Event Bus (mitt)
```
mitt emitter (any feature)
  → mitt handler (any feature)
Cross-feature events use src/utils/eventBus.ts
```

## Pipeline File Patterns

Used by classification force-include to detect when tdd-guide should be added:
- `functions/**` — Cloud Functions (any pipeline backend)
- `src/hooks/use*Scan*` — Scan listeners
- `src/hooks/use*Pending*` — Pending scan listeners
- `src/hooks/use*Event*` — Event bus hooks
- `src/stores/*scan*` — Scan state stores
- `src/utils/eventBus*` — Event bus core
