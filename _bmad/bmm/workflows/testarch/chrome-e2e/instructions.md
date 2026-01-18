# Chrome E2E Testing Workflow

**Workflow ID**: `testarch-chrome-e2e`
**Version**: 1.0 (BMad v6)

---

## Overview

Interactive end-to-end testing using Claude Code CLI with Chrome MCP tools. This workflow enables:

- **Visual inspection** of application UI with real screenshots
- **DevTools integration** for network monitoring, console logs, performance
- **Real browser automation** - clicking, typing, navigating
- **Interactive debugging** - pause, inspect, retry failed steps

> **CRITICAL**: This workflow only works in **Claude Code CLI** (terminal). It does NOT work in the VS Code extension.

---

## Prerequisites

Before starting this workflow, verify:

### 1. Environment Setup

```bash
# Chrome must be running in WSL
google-chrome &

# Start Claude Code CLI (NOT VS Code extension)
claude
```

### 2. Extension Verification

Run `/chrome` in Claude Code CLI and verify:
- ✅ Extension: Installed
- ✅ Status: Connected

If not connected, see troubleshooting in `docs/uxui/cc_chrome/README.md`.

### 3. Application Running

```bash
# Start your dev server (in a separate terminal)
npm run dev
```

Verify the application is accessible at your configured `base_url` (default: `http://localhost:5173`).

---

## Step 1: Initialize Chrome Session

### Actions

1. **Get tab context**

   Use `mcp__claude-in-chrome__tabs_context_mcp` to:
   - List available tabs
   - Create a new tab if needed
   - Note the `tabId` for subsequent operations

2. **Navigate to application**

   Use `mcp__claude-in-chrome__navigate` to go to your application's base URL.

3. **Take baseline screenshot**

   Use `mcp__claude-in-chrome__computer` with `action: screenshot` to capture the initial state.

### Expected Output

- Tab ID captured
- Application loaded
- Baseline screenshot taken

---

## Step 2: Visual Inspection Mode

### Actions

Choose an inspection mode based on your testing goal:

#### Mode A: Exploratory Testing

1. **Navigate through the application**
   - Click on elements using `mcp__claude-in-chrome__computer` with `action: click`
   - Fill forms using `action: type`
   - Take screenshots at each significant state

2. **Document findings**
   - Note visual inconsistencies
   - Capture error states
   - Record unexpected behaviors

#### Mode B: Acceptance Criteria Verification

1. **Load the story/AC**
   - Read the story markdown file
   - Extract acceptance criteria

2. **Verify each criterion visually**
   - Navigate to relevant screen
   - Perform required actions
   - Screenshot the result
   - Mark AC as PASS/FAIL

#### Mode C: Regression Testing

1. **Follow a predefined test script**
   - Execute steps sequentially
   - Compare screenshots to baseline
   - Report deviations

---

## Step 3: DevTools Integration

### Network Monitoring

Use `mcp__claude-in-chrome__execute_js` to access DevTools functionality:

```javascript
// Capture network requests
performance.getEntriesByType('resource')
```

### Console Log Capture

```javascript
// Get console errors (inject listener earlier)
window.__consoleErrors || []
```

### Performance Metrics

```javascript
// Get performance timing
JSON.stringify(performance.timing)
```

### DOM Inspection

```javascript
// Query elements
document.querySelectorAll('[data-testid]').length

// Check element visibility
document.querySelector('[data-testid="submit-btn"]')?.offsetParent !== null
```

---

## Step 4: Interactive Debugging

### Pause and Inspect

When a test fails or unexpected behavior occurs:

1. **Take a screenshot** - Capture current state
2. **Execute diagnostic JS** - Check DOM, console, network
3. **Modify and retry** - Adjust approach based on findings

### Common Debug Scenarios

#### Scenario: Element Not Found

```javascript
// Debug: List all data-testid attributes
Array.from(document.querySelectorAll('[data-testid]'))
  .map(el => el.getAttribute('data-testid'))
```

#### Scenario: Click Not Working

```javascript
// Debug: Check element state
const el = document.querySelector('[data-testid="target"]');
({
  exists: !!el,
  visible: el?.offsetParent !== null,
  disabled: el?.disabled,
  rect: el?.getBoundingClientRect()
})
```

#### Scenario: Form Submission Fails

```javascript
// Debug: Check form validation
const form = document.querySelector('form');
form?.checkValidity()
```

---

## Step 5: Test Generation

After interactive testing, generate Playwright test files:

### Actions

1. **Analyze recorded interactions**
   - Review screenshots taken
   - Note successful action sequences
   - Identify stable selectors

2. **Generate test file**

   Create `tests/e2e/{feature}.spec.ts`:

   ```typescript
   import { test, expect } from '@playwright/test';

   test.describe('Feature Name', () => {
     test('should perform action successfully', async ({ page }) => {
       await page.goto('/');

       // Actions derived from Chrome session
       await page.click('[data-testid="button"]');
       await page.fill('[data-testid="input"]', 'value');

       // Assertions based on visual verification
       await expect(page.locator('[data-testid="result"]')).toBeVisible();
     });
   });
   ```

3. **Run generated tests**

   ```bash
   npx playwright test tests/e2e/{feature}.spec.ts
   ```

---

## Chrome MCP Tools Reference

### `mcp__claude-in-chrome__tabs_context_mcp`

Get available browser tabs.

```
Parameters:
- createIfEmpty: boolean - Create new tab if none exist
```

### `mcp__claude-in-chrome__navigate`

Navigate to a URL.

```
Parameters:
- url: string - Full URL to navigate to
- tabId: number - Target tab ID
```

### `mcp__claude-in-chrome__computer`

Perform browser actions.

```
Parameters:
- action: "screenshot" | "click" | "type" | "scroll" | "key"
- tabId: number - Target tab ID
- coordinate: [x, y] - For click actions
- text: string - For type actions
```

### `mcp__claude-in-chrome__execute_js`

Execute JavaScript in page context.

```
Parameters:
- code: string - JavaScript code to execute
- tabId: number - Target tab ID
```

---

## Session Modes

### Mode: Quick Check

Fast visual verification of a single feature.

1. Navigate to feature
2. Take screenshot
3. Verify visually
4. Done

### Mode: Full E2E Session

Comprehensive testing session.

1. Initialize Chrome
2. Test all user flows
3. Capture screenshots at each step
4. Generate test files
5. Run Playwright tests
6. Document findings

### Mode: Debug Session

Investigate a specific issue.

1. Navigate to problem area
2. Use DevTools integration
3. Inspect DOM/Network/Console
4. Identify root cause
5. Document fix

---

## Best Practices

### 1. Always Use data-testid Selectors

```javascript
// Good
document.querySelector('[data-testid="login-button"]')

// Avoid
document.querySelector('.btn.primary.large')
```

### 2. Wait for Stability

Before taking screenshots or asserting:
- Wait for network idle
- Wait for animations to complete
- Verify element is interactable

### 3. Document Your Session

Create a session log with:
- Timestamp
- Actions performed
- Screenshots taken
- Issues found
- Tests generated

### 4. Clean Up State

After testing:
- Log out if logged in
- Clear local storage if needed
- Reset to clean state for next session

---

## Troubleshooting

### Chrome MCP Tools Not Available

**Symptom**: Claude says "I cannot take screenshots" or doesn't recognize Chrome tools.

**Solution**:
1. Ensure you're using Claude Code **CLI** (not VS Code extension)
2. Run `/chrome` to verify extension is connected
3. Restart Claude Code if needed

### Screenshots Are Black or Empty

**Symptom**: Screenshots capture but show nothing.

**Solution**:
1. Verify Chrome window is visible (not minimized)
2. Wait for page to fully load before screenshot
3. Check if content is rendered (not just loading spinner)

### Click Actions Don't Work

**Symptom**: Click command succeeds but nothing happens.

**Solution**:
1. Verify coordinates are correct
2. Check if element is obscured by overlay/modal
3. Try clicking by executing JS: `document.querySelector('[data-testid="x"]').click()`

### Navigation Timeout

**Symptom**: Navigate command times out.

**Solution**:
1. Verify dev server is running
2. Check URL is correct (http vs https)
3. Ensure no auth redirects blocking access

---

## Output

After completing this workflow, you should have:

1. **Session Log** - Record of all actions and findings
2. **Screenshots** - Visual evidence of application states
3. **Generated Tests** - Playwright test files based on session
4. **Issues Found** - Documented bugs or inconsistencies

Save the session summary to: `{output_folder}/chrome-e2e-session-{date}.md`
