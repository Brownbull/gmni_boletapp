# Tech Debt Story TD-16-7: Staging Deployment Hardening

Status: done

> **Source:** KDBP Code Review (2026-03-07) on story 16-9-staging-deployment
> **Priority:** LOW | **Estimated Effort:** 2 pts

## Story
As a **developer**, I want **staging deployment CI and Firestore rules hardened**, so that **secrets handling follows best practices and the deployment pipeline is more robust**.

## Acceptance Criteria
- AC-1: CI workflow uses workload identity federation or env-var-based FIREBASE_TOKEN instead of `--token` CLI flag
- AC-2: Smoke test verifies deployed version (e.g., meta tag or `/version.json` endpoint)
- AC-3: Staging Firestore rules scope wildcard `/{document=**}` to explicit sub-collections or add per-collection validation

## Tasks

### Task 1: Migrate CI auth from --token to env var or workload identity (2 subtasks)
- [x] 1.1: Replace `--token "${{ secrets.FIREBASE_TOKEN }}"` with `FIREBASE_TOKEN` env var on the job (suppresses deprecation warnings)
- [x] 1.2: Evaluate `google-github-actions/auth@v2` with workload identity federation as future upgrade

### Task 2: Add version verification to smoke test (2 subtasks)
- [x] 2.1: Add build-time version stamp (e.g., meta tag or `/version.json` with commit SHA)
- [x] 2.2: Update `smoke-test-staging.sh` and CI smoke step to verify correct version deployed

### Task 3: Scope staging Firestore wildcard rules (1 subtask)
- [x] 3.1: Replace `/{document=**}` with explicit sub-collection matches (transactions, preferences, etc.) with per-collection validation

## Dev Notes
- Source story: [16-9-staging-deployment](./16-9-staging-deployment.md)
- Review findings: #3 (--token deprecation), #6 (wildcard rules scope), #12 (smoke test version)
- Files affected: `.github/workflows/deploy-staging.yml`, `scripts/smoke-test-staging.sh`, `firestore.staging.rules`
- Task 1.1 is the quickest win — just move token to env var
- Task 3 requires understanding all current and planned sub-collections under user path
- 12 sub-collections matched from `src/lib/firestorePaths.ts`: transactions, merchant_mappings, category_mappings, subcategory_mappings, item_name_mappings, trusted_merchants, airlocks, personalRecords, notifications, preferences, credits, insightProfile
- `hasValidFieldBounds` only applied to transactions (was no-op on other collections — checks merchant/total fields only)

## Senior Developer Review (KDBP)
- **Date:** 2026-03-07
- **Agents:** code-reviewer, security-reviewer (STANDARD classification)
- **Score:** 8.9/10 | **Outcome:** APPROVE
- **Quick fixes applied (4):** double curl consolidation, Vite assumption comment, branch guard restrict to develop, python3 dependency comment
- **Deferred (2):** mapping field validation + hasValidFieldBounds scope — already tracked as accepted design (TD-15b-11, TD-15b-12, TD-15b-13)

<!-- CITED: L2-001 (git staging), L2-004 (TOCTOU/auth patterns) -->
<!-- ORDERING: clean -->
