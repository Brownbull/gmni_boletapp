# Epic 8 Retrospective: Scan Testing & Tuning Infrastructure

**Date:** 2025-12-12
**Epic Duration:** 2025-12-10 to 2025-12-12 (3 days)
**Stories Completed:** 9 (8.1-8.9)
**Story Points:** ~25 points

---

## Executive Summary

Epic 8 delivered a complete developer testing infrastructure for systematically evaluating and improving receipt scan accuracy. The epic exceeded expectations by also delivering CI/CD optimizations (Story 8.9) that reduced pipeline execution time by 63%.

### Key Metrics

| Metric | Target | Achieved |
|--------|--------|----------|
| Test Images | 20+ | 38+ |
| CLI Commands | 4 | 6 (run, generate, validate, analyze, compare) |
| CI/CD Time (PR) | ~7 min | ~4 min (63% faster) |
| Prompt Versions | 1 | 2 (v2.0.0 → v2.6.0) |
| Documentation | Basic | Comprehensive (QUICKSTART, ARCHITECTURE, TOKEN-ANALYSIS) |

---

## What Went Well

### 1. Shared Prompts Architecture (Story 8.1)
- Centralized Gemini prompts between client and test harness
- Image pre-processing optimization (compression, resize)
- Clean separation of concerns with `prompts.ts` module
- Enables A/B testing of prompt versions

### 2. Test Harness CLI (Stories 8.2-8.6)
- Commander.js-based CLI with intuitive commands
- Schema validation catches test data issues early
- Detailed accuracy reporting with per-field metrics
- Fuzzy matching for merchant names (Fuse.js)

### 3. A/B Prompt Comparison (Story 8.7)
- Side-by-side comparison of prompt versions
- Token usage tracking for cost analysis
- Generated insights for prompt improvement

### 4. Comprehensive Documentation (Story 8.8)
- QUICKSTART.md: Developer onboarding in minutes
- ARCHITECTURE.md: Deep technical reference with diagrams
- TOKEN-ANALYSIS.md: Cost tracking and optimization

### 5. CI/CD Optimization (Story 8.9)
- Parallelized test jobs (unit, integration, e2e, security)
- Added Playwright and Firebase CLI caching
- Moved Lighthouse to main-only (saves ~4.5 min on PRs)
- Added workflow_dispatch for manual deployments
- Documented performance standards for future changes

---

## What Could Be Improved

### 1. API Key Security Incident
**Issue:** Firebase API key was accidentally hardcoded in `scanner.ts`
**Impact:** Google sent security notification, required key rotation
**Resolution:**
- Regenerated API key
- Updated code to use environment variables
- Created clean PR without leaked key in git history
- Closed compromised PR #43, merged clean PR #44

**Lessons Learned:**
- Always use environment variables for API keys
- GitGuardian catches keys in git history, not just current files
- When a key leaks in git history, create fresh branch rather than rewriting history

### 2. Environment Setup Friction
**Issue:** Test harness required manual environment variable setup each session
**Resolution:** Added auto-loading to `~/.bashrc` to source from `.env`
**Future:** Consider using `dotenv` package for automatic loading

### 3. Pharmacy Test Images
**Issue:** AC2 of Story 8.8 required pharmacy receipts, but none were available
**Resolution:** Compensated with other store types
**Future:** Add pharmacy receipts when available

---

## Technical Debt Identified

1. **Test Harness Unit Tests** - The CLI scripts have minimal test coverage
   - Location: `prompt-testing/scripts/__tests__/`
   - Risk: Low (developer tooling, not production code)
   - Recommendation: Add tests if CLI becomes more complex

2. **Expected.json Generation** - Still requires human review for accuracy
   - Location: `prompt-testing/test-cases/*/`
   - Risk: Medium (incorrect expected values = false metrics)
   - Recommendation: Build confidence through more human-reviewed corrections

3. **Token Cost Tracking** - Currently manual via TOKEN-ANALYSIS.md
   - Risk: Low (informational only)
   - Recommendation: Consider automated cost tracking in CI

---

## CI/CD Performance Standards (Story 8.9)

To maintain fast pipeline execution, the following standards were established:

### Time Budgets
| Job | Target | Max Allowed |
|-----|--------|-------------|
| setup | ~2 min | 3 min |
| test-unit | ~2 min | 4 min |
| test-integration | ~2 min | 4 min |
| test-e2e | ~2.5 min | 5 min |
| security | ~2 min | 3 min |
| **Total PR** | **~4-5 min** | **7 min** |

### Anti-Patterns to Avoid
- Running same tests twice (e.g., unit tests + coverage separately)
- Sequential steps that could be parallel jobs
- Installing tools that aren't cached
- Running expensive checks (Lighthouse) on every PR
- Blocking deploys on informational checks

### Key Files
- `.github/workflows/test.yml` - Parallel workflow architecture
- `docs/ci-cd/README.md` - Full documentation and standards

---

## Key Decisions Made

### 1. Shared Prompts Location
**Decision:** Place prompts in `src/config/prompts.ts` (client-side)
**Rationale:** Client already has Firebase/Gemini dependencies; test harness imports from here
**Trade-off:** Test harness depends on client code (acceptable for DRY)

### 2. CLI Framework Choice
**Decision:** Commander.js for test harness CLI
**Rationale:** Well-documented, TypeScript support, familiar API
**Alternative Considered:** yargs (more complex)

### 3. Fuzzy Matching Threshold
**Decision:** 0.6 similarity threshold for merchant matching
**Rationale:** Balances false positives vs false negatives for Chilean merchants
**Future:** May need tuning based on accuracy data

### 4. Parallel CI Jobs
**Decision:** Split single test job into 4 parallel jobs
**Rationale:** ~63% time reduction for PR checks
**Trade-off:** More GitHub Actions minutes (acceptable for speed)

### 5. Lighthouse on Main Only
**Decision:** Skip Lighthouse on PRs, run only on main push
**Rationale:** Lighthouse is informational (warn mode), adds 4.5 min to pipeline
**Trade-off:** Performance regressions not caught until main (acceptable risk)

---

## Metrics & Outcomes

### Test Harness Capabilities
- **Run tests:** `npm run test:scan -- --limit=N`
- **Generate expected:** `npm run test:scan:generate -- path/to/image.jpg`
- **Validate data:** `npm run test:scan:validate`
- **Analyze results:** `npm run test:scan:analyze -- path/to/results.json`
- **Compare prompts:** `npm run test:scan:compare -- --prompt-a=v1 --prompt-b=v2`

### Test Data Coverage
| Store Type | Images |
|------------|--------|
| Supermarket | 15+ |
| Restaurant | 5+ |
| Gas Station | 3+ |
| Convenience | 3+ |
| International (Paris, London) | 4+ |
| Other | 8+ |

### CI/CD Improvement
| Metric | Before | After |
|--------|--------|-------|
| PR Check Time | ~11 min | ~4 min |
| Main Push Time | ~11 min | ~7 min |
| Cache Savings | 0s | ~50s |
| Lighthouse on PR | Yes | No |

---

## Recommendations for Future Epics

### 1. Continue Using Test Harness
- Run `npm run test:scan` before and after prompt changes
- Track accuracy trends over time
- Add test images for edge cases as discovered

### 2. Maintain CI/CD Standards
- Review CI time after adding new tests
- Keep PR checks under 7 min max
- Use main-only jobs for expensive checks

### 3. Security Practices
- Never hardcode API keys (use environment variables)
- Check `.env.example` is up-to-date
- Run `gitleaks` locally before pushing

### 4. Documentation Updates
- Update QUICKSTART.md when adding CLI features
- Update CI/CD README when modifying workflow
- Keep TOKEN-ANALYSIS.md current with prompt changes

---

## Story Summary

| Story | Points | Status | Key Deliverable |
|-------|--------|--------|-----------------|
| 8.1 | 3 | Done | Shared prompts library + image pre-processing |
| 8.2 | 2 | Done | Test data JSON schema and directory structure |
| 8.3 | 3 | Done | CLI framework with commander.js |
| 8.4 | 3 | Done | Result comparison engine with fuzzy matching |
| 8.5 | 2 | Done | Accuracy metrics and reporting |
| 8.6 | 2 | Done | Generate and validate commands |
| 8.7 | 3 | Done | A/B prompt comparison analysis |
| 8.8 | 3 | Done | 38+ test images + comprehensive docs |
| 8.9 | 3 | Done | CI/CD parallel jobs, caching, 63% faster |

---

## Appendix: Key File Locations

### Test Harness
- `prompt-testing/scripts/` - CLI implementation
- `prompt-testing/test-cases/` - Test images and expected.json
- `prompt-testing/QUICKSTART.md` - Developer guide
- `prompt-testing/ARCHITECTURE.md` - Technical reference

### Shared Code
- `src/config/prompts.ts` - Centralized Gemini prompts
- `src/config/prompts/` - Modular prompt components

### CI/CD
- `.github/workflows/test.yml` - Parallel workflow
- `docs/ci-cd/README.md` - Standards and documentation

### Security Reference
- `.env` - Local API keys (gitignored)
- `firebase functions:config` - Production Gemini key

---

**Retrospective Completed:** 2025-12-12
**Next Epic:** Epic 9 (UX Redesign) - Backlog
