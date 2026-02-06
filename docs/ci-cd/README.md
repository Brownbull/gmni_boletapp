# CI/CD & Deployment Documentation

Documentation for the Boletapp CI/CD pipeline and deployment processes.

## Guides

| Document | Description |
|----------|-------------|
| [CI/CD Guide](./ci-cd-guide.md) | Pipeline overview, workflow setup, local testing, log reading, best practices |
| [Deployment Guide](./deployment-guide.md) | Firebase Hosting & Cloud Functions deployment, rollback, environment variables |
| [Debugging Guide](./debugging-guide.md) | Troubleshooting CI failures with `act`, common issues and resolutions |
| [Branching Strategy](./branching-strategy.md) | Branch naming, merge flow, release process |
| [Deployment Story Template](./deployment-story-template.md) | Template for creating deployment/release stories |

## Quick Start

### Run Tests Locally

```bash
npm run test:quick         # TypeScript + parallel unit tests (~35s)
npm run test:story         # Quick + integration tests (~2min)
npm run test:sprint        # Full suite: unit + integration + E2E (~5min)
```

### Deploy to Production

On merge to `main`, GitHub Actions automatically deploys. For manual deployment:

```bash
npm run build
firebase deploy --only hosting,functions
```

### View CI Results

- **GitHub Actions:** https://github.com/Brownbull/gmni_boletapp/actions
- **CLI:** `gh run list --limit 5`
- **Failed logs:** `gh run view <run-id> --log-failed`

## Current Status

- **Workflow:** `.github/workflows/test.yml` (v4.0 - parallel architecture)
- **Execution time:** ~4-5 min (PR) / ~7 min (main with Lighthouse)
- **Total tests:** 950+ automated tests
- **Coverage thresholds:** 45% lines, 30% branches, 25% functions, 40% statements

## Tools

- GitHub Actions, Vitest, React Testing Library, Playwright
- @axe-core/playwright, playwright-lighthouse
- @vitest/coverage-v8, Firebase Emulators

---

**Last Updated:** 2026-02-05
