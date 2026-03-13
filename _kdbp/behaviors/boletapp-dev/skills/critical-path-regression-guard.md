# Skill: Critical Path Regression Guard

**Value:** V5 "Easier than the receipt drawer"
**Created:** 2026-03-13
**Origin:** Story 16-3 regression — scan happy path silently broken for 7 days

## Why This Exists

Story 16-3 changed `handleScanOverlayDismiss` to navigate to dashboard (fixing error recovery). The auto-dismiss effect in ScanOverlay also calls this handler on success, but nobody tested the success path. Scanning broke silently for every user for a week. The backend succeeded, the frontend threw users back to the dashboard.

If scanning doesn't work, V5 is dead — the receipt drawer wins.

## Trigger

Story touches ANY of:
- `src/features/scan/**`
- `src/features/transaction-editor/hooks/useScanEventSubscription.ts`
- `functions/src/analyzeReceipt.ts`
- `functions/src/analyzeStatement.ts`

## When to Surface

| Workflow | Step | Action |
|----------|------|--------|
| kdbp-dev-story | [SC] Step 10 | Flag: "Scan files changed. Run scan happy-path E2E before marking done." |
| kdbp-code-review | Step 08 completion | Flag: "Scan files in changeset. Recommend running `scan-post-success-transition.spec.ts` before deploy." |

## Execution (Human-Triggered)

```bash
# Requires dev:staging running in another terminal
npx playwright test tests/e2e/staging/scan-post-success-transition.spec.ts --project=staging
```

Pass: test green + screenshot shows QuickSaveCard or transaction editor with data.
Fail: test red + screenshot shows dashboard or empty state.

## Deferral

If flagged but human decides to skip (e.g., change is cosmetic-only):
- Log signal `critical-path-regression-deferred` in ledger
- Must include reason (e.g., "CSS-only change, no logic affected")
- Reviewer at [EC] epic checkpoint evaluates accumulated deferrals
