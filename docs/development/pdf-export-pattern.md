# Multi-Page PDF Export Pattern

> **Story**: 14.16 - Weekly Report Story Format (PDF Export Enhancement)
> **Date**: 2026-01-07
> **Author**: Claude Code + Atlas Agent

## Overview

This document describes the pattern used to implement multi-page PDF export from React applications using the browser's native print dialog ("Save as PDF"). This approach solves common issues with CSS-only print styles in complex React applications.

## Problem Statement

When attempting to implement PDF export for a React overlay component, several CSS-only approaches failed:

### Failed Approaches

1. **`visibility: hidden` on body, `visibility: visible` on target**
   - Elements still occupy space even when hidden
   - Results in blank space above the visible content
   - Fixed-positioned elements remain fixed, not flowing naturally

2. **`display: none` with `:has()` selector**
   - Attempted: `body *:has([data-testid="target"]) { display: block }`
   - The `:has()` selector couldn't reliably traverse React's complex DOM tree
   - Specificity conflicts with other styles

3. **Direct styling of fixed-positioned overlays**
   - Fixed-positioned elements (`position: fixed`) don't allow content to flow across multiple pages
   - `overflow: hidden` on parent containers prevents page breaks
   - Content gets cut off at one page

### Root Cause

In React applications, overlays are often deeply nested in the component tree with fixed positioning. The print stylesheet needs to:
1. Remove fixed positioning so content flows naturally
2. Allow content to span multiple pages
3. Start from the top of the page with no blank space
4. Hide all other UI elements (navigation, headers, etc.)

## Solution: JavaScript-Based Print Container

The solution creates a dedicated print container **outside the React tree** at the `<body>` level, clones the content into it, and uses CSS to hide everything except this container during printing.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           <body>                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  <div id="root">                                         │   │
│  │    [Complex React tree with fixed-position overlays]     │   │  ← HIDDEN during print
│  │    └── ReportDetailOverlay (fixed position)              │   │
│  │        └── report-content (overflow: auto)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  <div id="print-container">                              │   │  ← VISIBLE during print
│  │    ├── .print-branding (logo + app name)                 │   │    (static position, flows naturally)
│  │    ├── .print-report-header (title + metadata)           │   │
│  │    └── [cloned report content]                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation

#### 1. JavaScript Print Handler

```typescript
// src/components/reports/ReportDetailOverlay.tsx

const handlePrintReport = (
  reportContentRef: React.RefObject<HTMLDivElement | null>,
  reportData: { fullTitle: string; transactionCount: number }
) => {
  const reportContent = reportContentRef.current;
  if (!reportContent) return;

  // 1. Create or get print container at body level
  let printContainer = document.getElementById('print-container');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    document.body.appendChild(printContainer);
  }

  // 2. Clone the report content (deep clone)
  const clone = reportContent.cloneNode(true) as HTMLElement;

  // 3. Create branding header HTML
  const brandingHtml = `
    <div class="print-branding">
      <img src="/icon.svg" alt="Gastify" />
      <span>Gastify</span>
    </div>
  `;

  // 4. Create report header HTML
  const headerHtml = `
    <div class="print-report-header">
      <h1>${reportData.fullTitle}</h1>
      <p>${reportData.transactionCount} ${reportData.transactionCount === 1 ? 'transacción' : 'transacciones'}</p>
    </div>
  `;

  // 5. Populate print container
  printContainer.innerHTML = brandingHtml + headerHtml;

  // 6. Remove any print-only elements from clone (already in container)
  const printOnlyElements = clone.querySelectorAll('[data-testid="print-app-branding"], [data-testid="print-header"]');
  printOnlyElements.forEach(el => el.remove());

  // 7. Append cloned content
  printContainer.appendChild(clone);

  // 8. Add class to body for CSS targeting
  document.body.classList.add('printing-report');

  // 9. Trigger browser print dialog
  window.print();

  // 10. Cleanup after print dialog closes
  const cleanup = () => {
    document.body.classList.remove('printing-report');
    if (printContainer) {
      printContainer.innerHTML = '';
    }
  };

  // Use afterprint event with fallback timeout
  window.addEventListener('afterprint', cleanup, { once: true });
  setTimeout(cleanup, 1000); // Fallback
};
```

#### 2. React Component Integration

```tsx
// In the component
const reportContentRef = useRef<HTMLDivElement>(null);

// Button click handler
<button
  onClick={() => handlePrintReport(reportContentRef, reportData)}
  aria-label="Descargar como PDF"
>
  <Download size={18} />
</button>

// Content container with ref
<div ref={reportContentRef} data-testid="report-content">
  {/* Report content here */}
</div>
```

#### 3. CSS Print Styles

```css
/* index.html - inside <style> tag */

@media print {
  /* Page setup */
  @page {
    size: A4;
    margin: 18mm 22mm; /* Wider margins for centered look */
  }

  /* Base setup */
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    height: auto !important;
    overflow: visible !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Hide everything except print container when class is present */
  body.printing-report > *:not(#print-container) {
    display: none !important;
  }

  /* Print container - flows naturally across pages */
  #print-container {
    display: block !important;
    position: static !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
    background: white !important;
  }

  /* Branding header */
  .print-branding {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 10pt !important;
    padding: 10pt 0 14pt 0 !important;
    margin-bottom: 12pt !important;
    border-bottom: 1.5px solid #e0e0e0 !important;
  }
  .print-branding img {
    width: 32pt !important;
    height: 32pt !important;
  }
  .print-branding span {
    font-size: 20pt !important;
    font-weight: 700 !important;
    color: #2d3a4a !important;
  }

  /* Report header */
  .print-report-header {
    text-align: center !important;
    margin-bottom: 20pt !important;
  }
  .print-report-header h1 {
    font-size: 22pt !important;
    font-weight: 700 !important;
    margin: 0 0 6pt 0 !important;
    color: black !important;
  }
  .print-report-header p {
    font-size: 12pt !important;
    color: #666 !important;
  }

  /* Content cards - prevent breaking across pages */
  #print-container [data-testid^="category-group-"],
  #print-container [data-testid^="item-group-"],
  #print-container [data-testid="hero-card"],
  #print-container [data-testid="insight-card"] {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Preserve background colors */
  #print-container * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
```

## Key Patterns & Best Practices

### 1. Body Class Toggle
Use a class on `<body>` to control print visibility. This is more reliable than complex CSS selectors.

```css
body.printing-report > *:not(#print-container) {
  display: none !important;
}
```

### 2. Static Positioning
The print container MUST use `position: static` to allow natural page flow:

```css
#print-container {
  position: static !important;
  height: auto !important;
  overflow: visible !important;
}
```

### 3. Deep Clone
Use `cloneNode(true)` for a deep clone that preserves all nested elements and their styles.

### 4. Break Control
Prevent cards/sections from being split across pages:

```css
.card {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}
```

### 5. Color Preservation
Browsers may disable background colors by default. Force them to print:

```css
-webkit-print-color-adjust: exact !important;
print-color-adjust: exact !important;
```

### 6. Cleanup
Always clean up after printing to restore the app state:

```typescript
window.addEventListener('afterprint', () => {
  document.body.classList.remove('printing-report');
  printContainer.innerHTML = '';
}, { once: true });
```

## Customization Points

### Adding Branding
Modify the `brandingHtml` template in the print handler:

```typescript
const brandingHtml = `
  <div class="print-branding">
    <img src="/your-logo.svg" alt="Company" />
    <span>Your Company Name</span>
  </div>
`;
```

### Custom Headers/Footers
The CSS `@page` rule can include margin content:

```css
@page {
  margin: 15mm 20mm;
  @bottom-center {
    content: "Page " counter(page) " of " counter(pages);
    font-size: 9pt;
  }
}
```

Note: Browser support for `@page` margin content varies.

### Font Sizing for Print
Increase font sizes for better print readability:

```css
@media print {
  #print-container {
    font-size: 11pt !important;
  }
  .print-report-header h1 {
    font-size: 22pt !important;
  }
}
```

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best "Save as PDF" experience |
| Firefox | ✅ Full | Works with print dialog |
| Safari | ✅ Full | macOS native print dialog |
| Edge | ✅ Full | Chromium-based, same as Chrome |

## Troubleshooting

### Blank Page
- Check that `body.printing-report` class is being added
- Verify `#print-container` exists and has content
- Check for CSS specificity conflicts

### Content Cut Off
- Ensure `overflow: visible` on print container
- Remove any `max-height` constraints
- Check `position: static` is applied

### Missing Background Colors
- Add `-webkit-print-color-adjust: exact` to elements
- Verify "Background graphics" option in print dialog

### Page Breaks in Wrong Places
- Add `break-inside: avoid` to card elements
- Use `break-before: auto` for section headers

## Files Reference

| File | Purpose |
|------|---------|
| `src/components/reports/ReportDetailOverlay.tsx` | handlePrintReport function |
| `index.html` | Print CSS styles (lines 594-816) |
| `public/icon.svg` | App logo for branding header |

## Related Documentation

- Atlas Architecture: `_bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md`
- Story File: `docs/sprint-artifacts/epic14/stories/story-14.16-weekly-report-story-format.md`
