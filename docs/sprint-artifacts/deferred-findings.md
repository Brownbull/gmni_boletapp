# Deferred Findings Backlog

> Items identified during code review but deferred beyond the current epic.
> Grouped by product stage. Review during epic planning for future epics.

---

## PROD Backlog

### [PROD] Cloud Function Rate Limiter Hardening

- **Source:** 18-1-statement-scan-spike review (2026-03-12)
- **Finding:** In-memory rate limiting in Cloud Functions has three weaknesses:
  1. Not durable across cold starts — each instance has its own Map
  2. No upper bound on Map size — memory leak under sustained diverse-user load
  3. `analyzeStatement` and `analyzeReceipt` have independent Maps — user can bypass per-function limits by alternating callables
- **Files:** `functions/src/analyzeStatement.ts`, `functions/src/analyzeReceipt.ts`
- **Stage:** PROD — Required for production readiness under real user load, not for feature function
- **Estimated effort:** 3-5 points (evaluate Firestore-based rate limiting, shared limiter module, or Firebase Extensions)
