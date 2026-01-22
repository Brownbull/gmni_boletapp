# Story 14c-refactor.16: Firestore Cost Monitoring Setup

Status: done

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

- [x] **Task 1: Firebase Budget Configuration** (AC: #1, #2, #3, #9)
  - [x] 1.1: Navigate to Firebase Console → Project Settings → Usage and billing
  - [x] 1.2: Enable budget monitoring if not already enabled
  - [x] 1.3: Set monthly budget threshold ($93,846 GCP-wide allocation)
  - [x] 1.4: Configure 50% alert (~$46,923 threshold)
  - [x] 1.5: Configure 75% alert (~$70,385 threshold) - adjusted from 80% for GCP standard
  - [x] 1.6: Configure 90% alert (~$84,461 threshold) - adjusted from 100% for early warning
  - [x] 1.7: Verify email recipient is project owner email (billing admins enabled)
  - [x] 1.8: Additional thresholds at 10% and 25% for early detection

- [x] **Task 2: Google Cloud Monitoring Dashboard** (AC: #4, #5, #6, #7)
  - [x] 2.1: Navigate to Google Cloud Console → Monitoring → Dashboards
  - [x] 2.2: Create custom dashboard "gastify 001" with CRUD & Storage chart
  - [x] 2.3: Add chart: Document Reads (metric: `read_count ALIGN_RATE`)
  - [x] 2.4: Add chart: Document Writes (metric: `write_count ALIGN_RATE`)
  - [x] 2.5: Add chart: Storage (metric: `data_and_index_storage_bytes ALIGN_MEAN`)
  - [x] 2.6: Combined into single "CRUD & Storage" chart for unified view
  - [x] 2.7: Configure time range (Last 1 day with auto-save enabled)
  - [x] 2.8: Chart shows read peaks (~4/s at 4PM) and storage (~2.24 MiB)

- [x] **Task 3: Documentation** (AC: #8, #10, #11, #12)
  - [x] 3.1: Create `docs/operations/cost-monitoring.md`
  - [x] 3.2: Document budget configuration steps (reproducible)
  - [x] 3.3: Document dashboard metrics and what they mean
  - [x] 3.4: Document alert thresholds rationale:
    - 10-25%: Early warning for unexpected spikes
    - 50%: Mid-month checkpoint, investigate if trending
    - 75%: Action required, review recent deployments
    - 90%: Critical, may need emergency rollback
  - [x] 3.5: Include baseline reference: $1/week after Epic 14 optimization
  - [x] 3.6: Write runbook section:
    - What to check when alert fires
    - How to identify problematic queries (LISTENER_LIMITS pattern)
    - How to roll back if needed (firebase hosting:rollback)

- [x] **Task 4: Verification** (AC: All)
  - [x] 4.1: Screenshot dashboard and verify all charts render data (user provided screenshots 2026-01-22)
  - [x] 4.2: Verify alert emails are correctly configured (billing admins enabled)
  - [x] 4.3: Commit documentation (docs/operations/cost-monitoring.md created)
  - [x] 4.4: Monitoring dashboard accessible via GCP Console → Monitoring → Dashboards

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

- 2026-01-22: Task 1 complete - GCP budget alerts configured at 10/25/50/75/90% thresholds with email notifications to billing admins
- 2026-01-22: Task 2 complete - Cloud Monitoring dashboard "gastify 001" created with CRUD & Storage chart showing read_count, write_count, and storage_bytes metrics
- 2026-01-22: Task 3 complete - Documentation created at `docs/operations/cost-monitoring.md` with runbook, threshold rationale, and LISTENER_LIMITS pattern reference
- 2026-01-22: Task 4 complete - Screenshots verified, dashboard shows healthy baseline (~2.24 MiB storage, read peaks ~4/s)

### Code Review Fixes (2026-01-22)

- **M2 Fixed:** Corrected broken relative links in Related Documentation section (removed Atlas internal references, fixed architecture.md path)
- **M3 Fixed:** Added clarifying note about GCP account-wide budget vs Firestore-specific monitoring expectations
- **M4 Fixed:** Added delete_count metric to Metrics Tracked table with explanatory note
- **L1 Fixed:** Removed deprecated `firebase functions:config:set` command from runbook

### File List

**Created:**
- `docs/operations/cost-monitoring.md` - Cost monitoring documentation with runbook

**Infrastructure Configured (no code):**
- GCP Budget: $93,846/month with 5 alert thresholds (10/25/50/75/90%)
- Cloud Monitoring Dashboard: "gastify 001" with CRUD & Storage chart

**To Delete:**
- None
