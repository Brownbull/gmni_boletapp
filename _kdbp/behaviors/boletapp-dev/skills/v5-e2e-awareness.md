# Skill: V5 E2E Awareness

**Value:** V5 "Easier than the receipt drawer"
**Created:** 2026-03-13 (evolved from critical-path-regression-guard)
**Origin:** Story 16-3 regression — scan happy path silently broken for 7 days

## Why This Exists

Story 16-3 changed `handleScanOverlayDismiss` to navigate to dashboard (fixing error recovery). The auto-dismiss effect in ScanOverlay also calls this handler on success, but nobody tested the success path. Scanning broke silently for every user for a week. The backend succeeded, the frontend threw users back to the dashboard.

If scanning doesn't work, V5 is dead — the receipt drawer wins.

This skill maintains awareness of E2E test coverage for V5 critical paths, suggests tests at workflow checkpoints, and tracks coverage gaps.

## Test Tiers

| Tier | Name | When to Suggest | Cost Awareness |
|------|------|----------------|----------------|
| **T1** | **Critical** | Always when trigger files change. Cannot defer without reason. | Flag if uses API credits. Make optional but explicit. |
| **T2** | **Regression** | When related files change. Suggest, don't insist. | Note cost if any. |
| **T3** | **Coverage Gap** | When review detects a user journey with no E2E coverage. Suggest creating a test. | Estimate cost of proposed test. |

## Test Registry

| Test | Tier | Trigger Files | Cost | Created | Origin |
|------|------|--------------|------|---------|--------|
| `tests/e2e/staging/scan-post-success-transition.spec.ts` | T1 | `src/features/scan/**`, `src/features/transaction-editor/hooks/useScanEventSubscription.ts`, `functions/src/analyzeReceipt.ts` | 1 scan credit (~$0.01) + staging | 2026-03-13 | Story 16-3 regression |

## Coverage Map

### Covered Paths

| User Journey | Test File | What It Validates |
|-------------|-----------|-------------------|
| Receipt scan → result UI | `scan-post-success-transition.spec.ts` | Backend succeeds → QuickSaveCard or editor appears |

### Known Gaps

| User Journey | Risk | Suggested Tier | Notes |
|-------------|------|---------------|-------|
| Statement import → consent → results | V5 critical path (new) | T1 | Create when Epic 18 statement UI lands (18-4+) |
| Scan error → retry → success | V5 recovery path | T2 | Error recovery was the 16-3 trigger |
| Batch scan → all processed → batch review | V5 multi-scan path | T2 | No coverage, lower usage frequency |
| Manual entry → save → dashboard | V5 alternative path | T3 | Low risk, simple flow |

### Gap Detection Rule

When code review identifies a user journey with state transitions and no matching
entry in Covered Paths → add to Known Gaps with suggested tier.

## When to Surface

| Workflow | Step | Action |
|----------|------|--------|
| kdbp-dev-story | [SC] Step 10 | Match `{{files_changed}}` against Test Registry triggers. Output tier-appropriate suggestions with cost. |
| kdbp-code-review | Step 08 completion | Same matching. T1 becomes "Recommend before deploy." |

## Execution (Human-Triggered)

All tests require `dev:staging` running in another terminal.

```bash
# T1: Scan happy path (costs 1 scan credit)
npx playwright test tests/e2e/staging/scan-post-success-transition.spec.ts --project=staging
```

Pass: test green + screenshot shows QuickSaveCard or transaction editor with data.
Fail: test red + screenshot shows dashboard or empty state.

## Deferral

If T1 test is flagged but human decides to skip:
- Log signal `v5-e2e-deferred` in ledger
- Must include reason (e.g., "CSS-only change, no logic affected")
- Reviewer at [EC] epic checkpoint evaluates accumulated deferrals

T2/T3 suggestions are informational — no deferral logging required.

## Maintenance

- **Bug found and fixed:** Add or update test in Registry, move from Known Gaps to Covered Paths
- **New feature adds user journey:** Add to Known Gaps with suggested tier
- **Test created:** Move from Known Gaps to Covered Paths, add to Registry
