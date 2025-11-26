# Performance Baselines & Monitoring

**Story:** 3.6 - Performance Baselines & Lighthouse CI
**Epic:** 3 - Production-Grade Quality & Testing Completion
**Last Updated:** 2025-11-25
**Baseline Environment:** GitHub Actions CI (Ubuntu latest, Node 20)

## Overview

This document establishes performance baselines for Boletapp using Lighthouse CI. These baselines serve as benchmarks for detecting performance regressions in the CI/CD pipeline.

## Performance Target Scores

| Category | Target Score | Warn Threshold | Rationale |
|----------|--------------|----------------|-----------|
| Performance | 90+ | 80 | Industry standard for "fast" web apps |
| Accessibility | 90+ | 85 | WCAG AA compliance indicator |
| Best Practices | 90+ | 85 | Security and modern web standards |
| SEO | 90+ | 85 | Search engine discoverability |

## Core Web Vitals Targets

| Metric | Target | Good | Needs Improvement | Poor |
|--------|--------|------|-------------------|------|
| Largest Contentful Paint (LCP) | <2.5s | ≤2.5s | 2.5s-4.0s | >4.0s |
| First Input Delay (FID) | <100ms | ≤100ms | 100-300ms | >300ms |
| Cumulative Layout Shift (CLS) | <0.1 | ≤0.1 | 0.1-0.25 | >0.25 |

## Page Load Metrics Targets

| Metric | Target | Description |
|--------|--------|-------------|
| First Contentful Paint (FCP) | <1.5s | Time to first content render |
| Time to Interactive (TTI) | <3.0s | Time until fully interactive |
| Speed Index | <3.0s | Visual completeness speed |
| Total Blocking Time (TBT) | <200ms | Total time main thread was blocked |

## View-Specific Baselines

Baselines are established from CI environment runs to ensure consistency across developers.

### Login View (Unauthenticated)

| Metric | Baseline | Target | Notes |
|--------|----------|--------|-------|
| Performance | TBD | 90+ | First load, no auth overhead |
| Accessibility | TBD | 90+ | Simple login UI |
| Best Practices | TBD | 90+ | Minimal JS bundle |
| SEO | TBD | 90+ | Single page app |
| FCP | TBD | <1.5s | Initial paint |
| LCP | TBD | <2.5s | Login button/branding |
| CLS | TBD | <0.1 | Static layout |

### Dashboard View (Authenticated)

| Metric | Baseline | Target | Notes |
|--------|----------|--------|-------|
| Performance | TBD | 90+ | Main app view |
| Accessibility | TBD | 90+ | Navigation + content |
| Best Practices | TBD | 90+ | Firebase integration |
| SEO | TBD | 90+ | SPA with routing |
| FCP | TBD | <1.5s | After auth complete |
| LCP | TBD | <2.5s | Chart/summary widgets |
| CLS | TBD | <0.1 | Dynamic data load |

### Scan View (Authenticated)

| Metric | Baseline | Target | Notes |
|--------|----------|--------|-------|
| Performance | TBD | 80+ | Camera/scanner integration |
| Accessibility | TBD | 90+ | Camera UI accessible |
| Best Practices | TBD | 90+ | Media permissions |
| SEO | TBD | 90+ | App route |

### Trends View (Authenticated)

| Metric | Baseline | Target | Notes |
|--------|----------|--------|-------|
| Performance | TBD | 85+ | Chart rendering |
| Accessibility | TBD | 90+ | Chart accessibility |
| Best Practices | TBD | 90+ | Data visualization |
| SEO | TBD | 90+ | App route |

### History View (Authenticated)

| Metric | Baseline | Target | Notes |
|--------|----------|--------|-------|
| Performance | TBD | 85+ | List rendering |
| Accessibility | TBD | 90+ | Table/list accessibility |
| Best Practices | TBD | 90+ | Pagination/filtering |
| SEO | TBD | 90+ | App route |

### Settings View (Authenticated)

| Metric | Baseline | Target | Notes |
|--------|----------|--------|-------|
| Performance | TBD | 90+ | Simple form UI |
| Accessibility | TBD | 90+ | Form accessibility |
| Best Practices | TBD | 90+ | User preferences |
| SEO | TBD | 90+ | App route |

## Bundle Size Baseline

| Asset | Baseline Size | Threshold | Notes |
|-------|---------------|-----------|-------|
| Main JS Bundle | 637 KB | 700 KB (+10%) | Vite production build |
| CSS | ~10 KB | 50 KB | Tailwind purged styles |
| Total dist/ | ~650 KB | 750 KB | All static assets |

**Build Output:**
```
dist/index.html                  0.46 kB │ gzip:   0.30 kB
dist/assets/index-[hash].js    637.18 kB │ gzip: 164.93 kB
```

## How to Run Lighthouse Locally

### Full Lighthouse CI Audit

```bash
# Build the application first
npm run build

# Run Lighthouse CI (uses lighthouserc.json config)
npm run lighthouse
```

### Playwright-Lighthouse Tests

```bash
# Start Firebase emulators (for authentication)
npm run emulators &

# Run Lighthouse tests on all views
npm run test:lighthouse
```

### Individual View Audit (Chrome DevTools)

1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select categories: Performance, Accessibility, Best Practices, SEO
4. Select device: Desktop
5. Click "Analyze page load"

## Viewing Lighthouse Reports

### GitHub Actions

1. Navigate to the workflow run in GitHub Actions
2. Scroll to "Artifacts" section
3. Download "lighthouse-reports" artifact
4. Open HTML reports in browser

### Local Reports

Reports are saved to `lighthouse-reports/` directory:
- `lighthouse-login.html` - Login view report
- `lighthouse-dashboard.html` - Dashboard view report
- `lighthouse-scan.html` - Scan view report
- `lighthouse-trends.html` - Trends view report
- `lighthouse-history.html` - History view report
- `lighthouse-settings.html` - Settings view report

## Performance Budget Guidelines

### Adding New Dependencies

Before adding a new npm dependency:
1. Check bundlephobia.com for package size
2. Verify bundle size stays under 700KB threshold
3. Consider lazy loading for large dependencies
4. Use dynamic imports for route-specific code

### Performance Regression Response

If Lighthouse scores drop below thresholds:

1. **Identify the cause:**
   - Check recent commits for bundle size changes
   - Review Lighthouse report for specific audit failures
   - Compare with baseline metrics

2. **Evaluate severity:**
   - Critical: Performance score dropped >20 points
   - Warning: Performance score dropped 10-20 points
   - Minor: Performance score dropped <10 points

3. **Response actions:**
   - Critical: Block merge, fix immediately
   - Warning: Document in PR, plan fix for next sprint
   - Minor: Document and monitor

### Common Performance Improvements

| Issue | Solution |
|-------|----------|
| Large bundle size | Code splitting, tree shaking, lazy loading |
| Slow LCP | Optimize images, preload critical resources |
| High CLS | Set explicit dimensions on images/embeds |
| Long TBT | Defer non-critical JS, use web workers |
| Low accessibility | Add ARIA labels, fix color contrast |

## Monitoring Schedule

- **Every PR:** Lighthouse CI runs automatically
- **Every merge to main:** Full performance audit
- **Weekly:** Review Lighthouse trends in CI artifacts
- **Monthly:** Update baseline values if improvements made

## References

- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring Calculator](https://googlechrome.github.io/lighthouse/scorecalc/)
- [Tech Spec: Phase 4 Performance Monitoring](../sprint-artifacts/epic3/epic-3-tech-spec.md)
