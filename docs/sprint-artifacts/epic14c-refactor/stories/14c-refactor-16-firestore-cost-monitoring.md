# Story 14c-refactor.16: Firestore Cost Monitoring Setup

Status: ready-for-dev

## Story

As a **product owner**,
I want **Firestore cost monitoring dashboards and alerts configured**,
So that **we can detect cost issues before Epic 14d launch and prevent cost explosions like we experienced in Epic 14c**.

## Background

During Epic 14c (Shared Groups), Firestore costs spiked from ~$1/week to ~$19/week due to:
- Unlimited listeners fetching entire collections
- Full refetch fallback strategies when delta sync failed
- Multi-layer caching synchronization issues

Stories 14.25-14.27 addressed the immediate issues, but no proactive monitoring was implemented. This story establishes that monitoring infrastructure.

## Acceptance Criteria

### Core Requirements (from epics.md)

1. **AC1:** Firebase Console budget alert configured at 50% of monthly budget
2. **AC2:** Firebase Console budget alert configured at 80% of monthly budget
3. **AC3:** Firebase Console budget alert configured at 100% of monthly budget
4. **AC4:** Google Cloud Monitoring dashboard created showing daily read operations
5. **AC5:** Google Cloud Monitoring dashboard created showing daily write operations
6. **AC6:** Google Cloud Monitoring dashboard created showing daily delete operations
7. **AC7:** Google Cloud Monitoring dashboard showing storage usage
8. **AC8:** Document monitoring setup in `docs/operations/cost-monitoring.md`
9. **AC9:** Alerts send email to project owner

### Atlas-Enhanced Requirements

10. **AC10:** Document alert thresholds and rationale (why 50/80/100%)
11. **AC11:** Include baseline costs from Epic 14 optimization ($1/week target) for comparison
12. **AC12:** Add runbook section explaining what to do when alerts fire

## Tasks / Subtasks

- [ ] **Task 1: Firebase Budget Configuration** (AC: #1, #2, #3, #9)
  - [ ] 1.1: Navigate to Firebase Console → Project Settings → Usage and billing
  - [ ] 1.2: Enable budget monitoring if not already enabled
  - [ ] 1.3: Set monthly budget threshold (recommend starting with $10/month for beta)
  - [ ] 1.4: Configure 50% alert ($5 threshold)
  - [ ] 1.5: Configure 80% alert ($8 threshold)
  - [ ] 1.6: Configure 100% alert ($10 threshold)
  - [ ] 1.7: Verify email recipient is project owner email
  - [ ] 1.8: Test alert by triggering a low-threshold test (optional)

- [ ] **Task 2: Google Cloud Monitoring Dashboard** (AC: #4, #5, #6, #7)
  - [ ] 2.1: Navigate to Google Cloud Console → Monitoring → Dashboards
  - [ ] 2.2: Create new custom dashboard "BoletApp Firestore Operations"
  - [ ] 2.3: Add chart: Daily Document Reads (metric: `firestore.googleapis.com/document/read_count`)
  - [ ] 2.4: Add chart: Daily Document Writes (metric: `firestore.googleapis.com/document/write_count`)
  - [ ] 2.5: Add chart: Daily Document Deletes (metric: `firestore.googleapis.com/document/delete_count`)
  - [ ] 2.6: Add chart: Storage Size (metric: `firestore.googleapis.com/storage/size`)
  - [ ] 2.7: Configure time range (default: last 30 days)
  - [ ] 2.8: Add comparison line showing previous period for trend analysis

- [ ] **Task 3: Documentation** (AC: #8, #10, #11, #12)
  - [ ] 3.1: Create `docs/operations/cost-monitoring.md`
  - [ ] 3.2: Document budget configuration steps (reproducible)
  - [ ] 3.3: Document dashboard metrics and what they mean
  - [ ] 3.4: Document alert thresholds rationale:
    - 50%: Early warning, investigate if trending
    - 80%: Action required, review recent deployments
    - 100%: Critical, may need to disable features
  - [ ] 3.5: Include baseline reference: $1/week after Epic 14 optimization
  - [ ] 3.6: Write runbook section:
    - What to check when alert fires
    - How to identify problematic queries
    - How to roll back if needed

- [ ] **Task 4: Verification** (AC: All)
  - [ ] 4.1: Screenshot dashboard and verify all charts render data
  - [ ] 4.2: Verify alert emails are correctly configured
  - [ ] 4.3: Commit documentation
  - [ ] 4.4: Verify monitoring dashboard is accessible to team members

## Dev Notes

### Cost History (Reference)

| Period | Weekly Cost | Status | Cause |
|--------|-------------|--------|-------|
| Pre-Epic 14 | ~$3-5/week | Normal | Various listener patterns |
| Epic 14c (Shared Groups) | ~$19/week | **SPIKE** | Unlimited listeners + full refetch |
| Post-Story 14.25-14.27 | ~$1/week | Optimized | `LISTENER_LIMITS` constant |

### Budget Recommendations

For a beta product with ~50 active users:
- **Monthly Budget:** $10-20/month
- **Alert Thresholds:** 50% / 80% / 100% of monthly budget
- **Cost Target:** < $5/week sustained

### Firestore Pricing Reference (2026)

| Operation | Price (nam5 region) |
|-----------|---------------------|
| Document reads | $0.06 / 100,000 |
| Document writes | $0.18 / 100,000 |
| Document deletes | $0.02 / 100,000 |
| Storage | $0.18 / GB / month |

### Google Cloud Monitoring Metrics

| Metric | Description |
|--------|-------------|
| `firestore.googleapis.com/document/read_count` | Total document reads |
| `firestore.googleapis.com/document/write_count` | Total document writes |
| `firestore.googleapis.com/document/delete_count` | Total document deletes |
| `firestore.googleapis.com/storage/size` | Total storage in bytes |

### No Code Changes Required

This story is purely infrastructure/configuration. No application code changes needed.

### References

- [Source: docs/sprint-artifacts/epic14c-refactor/tech-context-epic14c-refactor.md#Cost-Monitoring-Setup] - Epic context
- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md#Story-14c.16] - Original story definition
- [Source: Atlas 06-lessons.md] - Cost monitoring gap identified as lesson learned
- [Source: Atlas 04-architecture.md#Firestore-Cost-Optimization] - LISTENER_LIMITS pattern

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows

**None directly affected.** This is an infrastructure/observability story that:
- Does NOT change application code
- Does NOT modify user-facing features
- Does NOT affect any critical paths (Auth → Scan → Save, etc.)

### Downstream Effects to Consider

- **Proactive Detection:** Enables detection of cost issues BEFORE they become critical
- **Epic 14d Readiness:** Provides monitoring infrastructure for Shared Groups v2 launch
- **Operational Visibility:** Team can track cost trends over time

### Testing Implications

- **Existing tests to verify:** None - no code changes
- **New scenarios to add:** None - infrastructure only
- **Manual verification:** Dashboard renders data, alerts configured correctly

### Workflow Chain Visualization

```
[Firebase Operations] → [Cloud Monitoring Metrics] → [Dashboard Visualization]
                                                            ↓
[Budget Threshold Exceeded] → [Alert Email] → [Team Investigation]
                                                            ↓
                                              [Runbook: Cost Incident Response]
```

### Atlas Historical Lessons Applied

From `06-lessons.md`:

| Lesson | Application in This Story |
|--------|---------------------------|
| **Cost Monitoring Gap** | This story directly addresses the gap |
| **Full Refetch = Cost Bomb** | Dashboard will help detect this pattern |
| **LISTENER_LIMITS Pattern** | Baseline reference for expected costs |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Story creation

### Completion Notes List

_To be filled during implementation_

### File List

**To Create:**
- `docs/operations/cost-monitoring.md`

**To Modify:**
- None (no code changes)

**To Delete:**
- None
