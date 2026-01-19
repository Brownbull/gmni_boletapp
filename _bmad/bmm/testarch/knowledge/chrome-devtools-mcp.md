# Chrome DevTools MCP Integration

## Overview

This knowledge fragment covers patterns for using Claude Code CLI's Chrome MCP tools for interactive E2E testing, visual debugging, and DevTools integration.

> **CRITICAL**: Chrome MCP tools only work in Claude Code **CLI**. They are NOT available in the VS Code extension.

---

## Environment Setup

### Prerequisites

```bash
# 1. Chrome running in WSL
google-chrome &

# 2. Claude Code CLI (not VS Code)
claude

# 3. Verify connection
/chrome  # Should show "Extension: Installed"
```

### WSL-Specific Setup

See `docs/uxui/cc_chrome/README.md` for:
- Installing Chrome in WSL
- Patching Claude Code for WSL support
- Troubleshooting native host issues

---

## Core MCP Tools

### 1. Tab Management

```
Tool: mcp__claude-in-chrome__tabs_context_mcp
Purpose: List tabs, get tabId for operations
```

**Usage Pattern:**
```
1. Get tab context at session start
2. Note the tabId for all subsequent operations
3. Create new tab if needed with createIfEmpty: true
```

### 2. Navigation

```
Tool: mcp__claude-in-chrome__navigate
Purpose: Go to URLs
Parameters:
  - url: Full URL (include http/https)
  - tabId: Target tab
```

**Best Practice:**
- Always use full URLs (http://localhost:5173, not just /path)
- Wait for navigation to complete before taking actions
- Verify page loaded by taking screenshot after navigation

### 3. Browser Actions (Computer)

```
Tool: mcp__claude-in-chrome__computer
Purpose: Screenshots, clicks, typing, scrolling
Parameters:
  - action: "screenshot" | "click" | "type" | "scroll" | "key"
  - tabId: Target tab
  - coordinate: [x, y] for click/scroll
  - text: string for type action
```

**Screenshot Pattern:**
```
action: screenshot
tabId: <tab-id>
```
Returns: Base64 image displayed inline

**Click Pattern:**
```
action: click
tabId: <tab-id>
coordinate: [x, y]  # Pixel coordinates
```

**Type Pattern:**
```
action: type
tabId: <tab-id>
text: "value to type"
```

### 4. JavaScript Execution

```
Tool: mcp__claude-in-chrome__execute_js
Purpose: Run JavaScript in page context
Parameters:
  - code: JavaScript string
  - tabId: Target tab
```

**Example Uses:**
```javascript
// Get element coordinates for clicking
const el = document.querySelector('[data-testid="btn"]');
el.getBoundingClientRect();

// Check element state
document.querySelector('[data-testid="form"]')?.checkValidity();

// Get all testable elements
Array.from(document.querySelectorAll('[data-testid]'))
  .map(e => e.getAttribute('data-testid'));
```

---

## Testing Patterns

### Pattern 1: Visual Verification

**Use Case:** Verify UI looks correct

```
1. Navigate to page
2. Take screenshot
3. Visually inspect in Claude response
4. Verify elements are present and positioned correctly
```

**Example Flow:**
```
navigate → screenshot → analyze →
  if OK: move to next test
  if NOT OK: debug with execute_js
```

### Pattern 2: Form Testing

**Use Case:** Test form submission

```
1. Navigate to form page
2. Use execute_js to find input fields:
   document.querySelectorAll('input, select, textarea')
3. Use execute_js to get element coordinates
4. Use computer action: click to focus field
5. Use computer action: type to enter value
6. Screenshot to verify input
7. Click submit button
8. Screenshot result
```

**Getting Click Coordinates:**
```javascript
// Get center of element for clicking
const el = document.querySelector('[data-testid="input"]');
const rect = el.getBoundingClientRect();
({ x: rect.left + rect.width/2, y: rect.top + rect.height/2 })
```

### Pattern 3: State Verification

**Use Case:** Verify application state after action

```javascript
// Check if logged in
!!document.querySelector('[data-testid="user-menu"]')

// Check form validation state
document.querySelector('form')?.checkValidity()

// Get current route (React Router)
window.location.pathname

// Check localStorage
JSON.parse(localStorage.getItem('user') || 'null')
```

### Pattern 4: Network Inspection

**Use Case:** Verify API calls are made

```javascript
// Get all fetch/XHR requests (requires prior setup)
performance.getEntriesByType('resource')
  .filter(r => r.initiatorType === 'fetch' || r.initiatorType === 'xmlhttprequest')
  .map(r => ({ name: r.name, duration: r.duration }))

// Check for failed requests (setup console error listener first)
window.__networkErrors || []
```

### Pattern 5: Error Detection

**Use Case:** Find JavaScript errors

```javascript
// Inject error listener (do this early in session)
window.__consoleErrors = window.__consoleErrors || [];
const origError = console.error;
console.error = (...args) => {
  window.__consoleErrors.push(args.join(' '));
  origError.apply(console, args);
};

// Later, retrieve errors
window.__consoleErrors
```

---

## Debugging Techniques

### Technique 1: Element Discovery

When you can't find an element:

```javascript
// List all data-testid elements
Array.from(document.querySelectorAll('[data-testid]'))
  .map(el => ({
    testid: el.getAttribute('data-testid'),
    tag: el.tagName,
    visible: el.offsetParent !== null
  }))

// Find elements by text content
Array.from(document.querySelectorAll('button, a, [role="button"]'))
  .filter(el => el.textContent.includes('Login'))
  .map(el => el.outerHTML.substring(0, 100))
```

### Technique 2: Visibility Debugging

When element exists but interactions fail:

```javascript
const el = document.querySelector('[data-testid="target"]');
({
  exists: !!el,
  visible: el?.offsetParent !== null,
  inViewport: (() => {
    const rect = el?.getBoundingClientRect();
    return rect && rect.top >= 0 && rect.left >= 0 &&
           rect.bottom <= window.innerHeight &&
           rect.right <= window.innerWidth;
  })(),
  disabled: el?.disabled,
  ariaHidden: el?.getAttribute('aria-hidden'),
  computedDisplay: el ? getComputedStyle(el).display : null
})
```

### Technique 3: Timing Issues

When tests are flaky due to timing:

```javascript
// Check if still loading
document.querySelector('[data-testid="loading-spinner"]') !== null

// Check if animations running
document.getAnimations().length

// Wait helper (inject once)
window.waitFor = (selector, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for ${selector}`));
    }, timeout);
  });
};
```

### Technique 4: Screenshot Comparison

For visual regression:

1. Take baseline screenshot
2. Perform action
3. Take result screenshot
4. Compare visually in Claude response
5. Document differences

---

## Anti-Patterns

### ❌ Don't: Use CSS Class Selectors

```javascript
// Bad - brittle
document.querySelector('.btn-primary')

// Good - stable
document.querySelector('[data-testid="submit-btn"]')
```

### ❌ Don't: Hardcode Coordinates

```javascript
// Bad - breaks on different viewports
action: click, coordinate: [500, 300]

// Good - calculate from element
const rect = el.getBoundingClientRect();
coordinate: [rect.left + rect.width/2, rect.top + rect.height/2]
```

### ❌ Don't: Skip Error Checking

```javascript
// Bad - assumes element exists
document.querySelector('[data-testid="x"]').click()

// Good - verify first
const el = document.querySelector('[data-testid="x"]');
if (!el) throw new Error('Element not found');
el.click();
```

### ❌ Don't: Forget to Clean Up

After testing:
- Log out if logged in
- Clear localStorage/sessionStorage if modified
- Reset application state

---

## Session Workflow

### Quick Test Session

```
1. /chrome (verify connected)
2. tabs_context_mcp → get tabId
3. navigate to app
4. screenshot (verify loaded)
5. perform test actions
6. screenshot results
7. document findings
```

### Full E2E Session

```
1. /chrome (verify connected)
2. tabs_context_mcp → get tabId
3. navigate to app
4. screenshot (baseline)
5. execute_js: inject error listeners
6. For each user flow:
   a. Navigate to starting point
   b. Perform actions (click, type)
   c. Screenshot each significant state
   d. Verify with execute_js
   e. Check for errors
7. Document all findings
8. Generate Playwright tests from successful flows
9. Clean up session
```

---

## Integration with Playwright

After Chrome MCP testing, convert to Playwright:

### From Chrome Session:
```
navigate("http://localhost:5173/login")
execute_js: get coordinates for email input
click at [x, y]
type "test@example.com"
screenshot
```

### To Playwright Test:
```typescript
test('login flow', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await expect(page.locator('[data-testid="email-input"]'))
    .toHaveValue('test@example.com');
});
```

### Key Translations

| Chrome MCP | Playwright |
|------------|------------|
| `navigate` | `page.goto()` |
| `computer action: click` | `page.click()` |
| `computer action: type` | `page.fill()` |
| `computer action: screenshot` | `page.screenshot()` |
| `execute_js` | `page.evaluate()` |

---

## Troubleshooting Reference

| Issue | Check | Solution |
|-------|-------|----------|
| Tools not available | VS Code extension? | Use CLI instead |
| Extension not connected | `/chrome` status | Reconnect or restart |
| Screenshots empty | Chrome minimized? | Restore window |
| Clicks don't work | Coordinates correct? | Use execute_js to get rect |
| Navigation timeout | Dev server running? | Start with `npm run dev` |
| JS execution fails | Syntax error? | Test in browser DevTools first |

---

## Related Knowledge Fragments

- `network-first.md` - Network interception patterns
- `selector-resilience.md` - Stable selector strategies
- `timing-debugging.md` - Race condition fixes
- `visual-debugging.md` - Trace viewer and artifacts
