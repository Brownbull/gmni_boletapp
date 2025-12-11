# Prompt Deployment Guide

How to create, test, and deploy new Gemini prompts to production.

## Overview

The prompts library uses a **single-line deployment** model:
1. Create new prompt version in a separate file
2. Test with the test harness (A/B comparison)
3. Change `ACTIVE_PROMPT` to point to the new version
4. Deploy Cloud Function

## Step 1: Create a New Prompt Version

### File Template

Create a new file: `shared/prompts/v{N}-{description}.ts`

```typescript
/**
 * Shared Prompts Library - V{N} {Description}
 *
 * What's new in this version:
 * - Feature 1
 * - Feature 2
 */

import type { PromptConfig } from './types';
import { STORE_CATEGORY_LIST, ITEM_CATEGORY_LIST, DATE_INSTRUCTIONS } from './base';

function buildPrompt(): string {
  return `Your prompt here with {{currency}} and {{date}} placeholders...`;
}

export const PROMPT_V{N}: PromptConfig = {
  id: 'v{n}-{slug}',              // e.g., 'v3-few-shot'
  name: 'Human Readable Name',
  description: 'What makes this version different',
  version: '{N}.0.0',
  createdAt: '2025-MM-DD',
  prompt: buildPrompt(),
};
```

### Naming Conventions

| Field | Convention | Example |
|-------|------------|---------|
| File | `v{N}-{slug}.ts` | `v3-few-shot-examples.ts` |
| ID | `v{n}-{slug}` | `v3-few-shot` |
| Version | Semver | `3.0.0` |

### Template Variables

Always include these placeholders (the system replaces them at runtime):

| Variable | Replaced With | Example |
|----------|---------------|---------|
| `{{currency}}` | Currency code from settings | `CLP`, `USD` |
| `{{date}}` | Today's date | `2025-12-11` |
| `{{receiptType}}` | (V2+) Receipt type hint | `supermarket`, `auto` |

## Step 2: Register the Prompt

Edit `shared/prompts/index.ts`:

```typescript
// 1. Add import
import { PROMPT_V3 } from './v3-few-shot-examples';

// 2. Add to registry
const PROMPT_REGISTRY: Map<string, PromptConfig> = new Map([
  [PROMPT_V1.id, PROMPT_V1],
  [PROMPT_V2.id, PROMPT_V2],
  [PROMPT_V3.id, PROMPT_V3],  // <-- Add here
]);

// 3. Re-export (optional, for direct access)
export { PROMPT_V3 } from './v3-few-shot-examples';
```

## Step 3: Add Unit Tests

Add tests to `shared/prompts/__tests__/index.test.ts`:

```typescript
describe('PROMPT_V3', () => {
  it('should have correct id', () => {
    expect(PROMPT_V3.id).toBe('v3-few-shot');
  });

  it('should be registered', () => {
    expect(getPrompt('v3-few-shot')).toBe(PROMPT_V3);
  });

  it('should contain required placeholders', () => {
    expect(PROMPT_V3.prompt).toContain('{{currency}}');
    expect(PROMPT_V3.prompt).toContain('{{date}}');
  });
});
```

Run tests:
```bash
npm run test:unit -- shared/prompts
```

## Step 4: A/B Test with Test Harness

Once the test harness is ready (Epic 8.3+):

```bash
# Compare new prompt against current production
npm run test:scan -- --compare=v1-original,v3-few-shot

# Run new prompt against specific test cases
npm run test:scan -- --prompt=v3-few-shot --type=supermarket

# Full comparison with all test images
npm run test:scan -- --compare=v1-original,v3-few-shot --limit=all
```

### Interpreting Results

The test harness will show:
- **Per-field accuracy**: total, date, merchant, items
- **Weighted composite score**: Overall accuracy percentage
- **Failure patterns**: Common issues with each prompt
- **Side-by-side comparison**: Where V3 improved or regressed

## Step 5: Deploy to Production

### Pre-deployment Checklist

- [ ] All unit tests pass (`npm run test:quick`)
- [ ] A/B testing shows improvement (or acceptable parity)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Reviewed with team (if applicable)

### Deploy Steps

1. **Update ACTIVE_PROMPT** in `shared/prompts/index.ts`:

```typescript
// Change this single line:
export const ACTIVE_PROMPT: PromptConfig = PROMPT_V3;  // was PROMPT_V1
```

2. **Verify compilation**:
```bash
npm run type-check
cd functions && npx tsc --noEmit
```

3. **Deploy Cloud Function**:
```bash
firebase deploy --only functions
```

4. **Verify in production**:
- Scan a test receipt in the app
- Check Firebase Functions logs for errors
- Verify extraction quality matches A/B test results

### Rollback

If issues occur in production:

```typescript
// Revert to previous prompt
export const ACTIVE_PROMPT: PromptConfig = PROMPT_V1;  // rollback
```

Then redeploy:
```bash
firebase deploy --only functions
```

## Prompt Version History

| Version | Date | Description | Status |
|---------|------|-------------|--------|
| v1-original | 2025-12-11 | Baseline Chilean receipt prompt | **ACTIVE** |
| v2-multi-currency-types | 2025-12-11 | Multi-currency + receipt type hints | Testing |

## Best Practices

### DO

- Keep prompts focused and concise
- Include all categories in the prompt (use `STORE_CATEGORY_LIST`, `ITEM_CATEGORY_LIST`)
- Test with diverse receipt types before deploying
- Document what changed and why
- Use semantic versioning

### DON'T

- Deploy without A/B testing
- Remove required placeholders (`{{currency}}`, `{{date}}`)
- Make breaking changes to JSON output format without client updates
- Delete old prompt versions (keep for comparison/rollback)

## Troubleshooting

### "Prompt not found" error
- Verify prompt is registered in `PROMPT_REGISTRY`
- Check the ID matches exactly (case-sensitive)

### Cloud Function fails to deploy
- Run `cd functions && npx tsc` to check for TypeScript errors
- Verify `functions/tsconfig.json` includes `../shared`

### Extraction quality degraded
- Compare with previous prompt using test harness
- Check if new prompt instructions conflict
- Review specific failure cases in test results

## Related Files

- `shared/prompts/index.ts` - Main exports, change ACTIVE_PROMPT here
- `functions/src/analyzeReceipt.ts` - Cloud Function that uses prompts
- `functions/tsconfig.json` - Must include `../shared` in paths
