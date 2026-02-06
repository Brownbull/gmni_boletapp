# Tech Debt Story TD-14d-53: Create Centralized Logging Utility

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-11c
> **Priority:** LOW (code organization)
> **Estimated Effort:** M (2-4 hours)
> **Risk:** MEDIUM (affects many files)

## Story

As a **developer**,
I want **a centralized logging utility instead of scattered `import.meta.env.DEV` checks**,
So that **logging patterns are consistent and can be easily configured**.

## Problem Statement

The codebase uses inline DEV checks for logging:

**Current Pattern (GruposView.tsx:486-488):**
```typescript
if (import.meta.env.DEV) {
    console.error('[GruposView] Toggle transaction sharing failed:', err);
}
```

This pattern is scattered across multiple files and has drawbacks:
- Inconsistent log formatting
- No centralized control over log levels
- No easy way to enable/disable categories
- Production accidentally leaks logs if check is forgotten

## Acceptance Criteria

- [ ] AC1: Create `src/utils/logger.ts` with log level support
- [ ] AC2: Logger automatically suppresses in production
- [ ] AC3: Logger supports categories (e.g., `[GruposView]`, `[groupService]`)
- [ ] AC4: Migrate at least 3 existing inline DEV checks to use logger
- [ ] AC5: Document usage pattern in code comments

## Tasks / Subtasks

- [ ] 1.1 Create logger utility with `debug`, `info`, `warn`, `error` levels
- [ ] 1.2 Add category/namespace support
- [ ] 1.3 Migrate GruposView.tsx inline checks
- [ ] 1.4 Migrate groupService.ts inline checks
- [ ] 1.5 Add unit tests for logger
- [ ] 1.6 Document usage pattern

## Dev Notes

### Proposed Implementation

```typescript
// src/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const currentLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'error';

export function createLogger(namespace: string) {
    const log = (level: LogLevel, ...args: unknown[]) => {
        if (LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]) {
            const prefix = `[${namespace}]`;
            console[level](prefix, ...args);
        }
    };

    return {
        debug: (...args: unknown[]) => log('debug', ...args),
        info: (...args: unknown[]) => log('info', ...args),
        warn: (...args: unknown[]) => log('warn', ...args),
        error: (...args: unknown[]) => log('error', ...args),
    };
}

// Usage
const logger = createLogger('GruposView');
logger.error('Toggle transaction sharing failed:', err);
```

### Migration Example

```typescript
// Before
if (import.meta.env.DEV) {
    console.error('[GruposView] Toggle transaction sharing failed:', err);
}

// After
import { createLogger } from '@/utils/logger';
const logger = createLogger('GruposView');
// ...
logger.error('Toggle transaction sharing failed:', err);
```

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Merge conflict risk | Medium (touches many files) | Low |
| Consistency benefit | High | Debt accumulates |
| Effort | 2-4 hours | Increases with codebase size |

**Recommendation:** Address as a focused refactoring story, not incrementally

### Related Stories

- **TD-14d-46**: Production Audit Logging (separate concern - persistent logging)

### References

- [14d-v2-1-11c](./14d-v2-1-11c-ui-components-integration.md) - Source story
