This is a super common issue with PWAs! The problem comes from a few sources:

**Why this happens:**

1. **Different aspect ratios** — iPhone 12 is 390×844 (19.5:9), S23 is ~360×780 depending on display settings (taller and narrower in CSS pixels)
2. **`100vh` lies on mobile** — it doesn't account for browser chrome, navigation bars, or the PWA's own status bar
3. **Fixed pixel values** — anything hardcoded won't adapt
4. **Chrome DevTools vs real devices** — the simulator doesn't perfectly replicate real viewport behavior

**Practical fixes:**

### 1. Use dynamic viewport units
```css
/* Instead of */
height: 100vh;

/* Use */
height: 100dvh; /* dynamic viewport height - adjusts for browser UI */
min-height: 100svh; /* small viewport - most conservative */
```

### 2. Make your layout flexible
```css
.screen-container {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden; /* prevent page scroll */
}

.header { flex-shrink: 0; }
.content { flex: 1; overflow-y: auto; } /* scrollable content area */
.footer { flex-shrink: 0; }
```

### 3. Use relative sizing for spacing
```css
/* Instead of fixed padding */
padding: 24px;

/* Use clamp or viewport-relative */
padding: clamp(12px, 3vw, 24px);
gap: min(16px, 2vh);
```

### 4. Set a CSS custom property for safe area
```css
:root {
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}

.bottom-nav {
  padding-bottom: calc(12px + var(--safe-bottom));
}
```

### 5. Quick debug trick
Add this temporarily to see what's overflowing:
```css
* { outline: 1px solid red; }
```

---

## Critical Lessons Learned (NitoAgua Implementation)

### What the research missed:

**1. `min-h-dvh` doesn't prevent scrolling on content-heavy pages**
- `min-h-dvh` sets MINIMUM height, not maximum
- If content exceeds viewport, page will still scroll
- Landing pages with multiple sections (hero, benefits, footer) often exceed viewport on smaller phones

**2. Horizontal layouts save more vertical space than reducing padding**
```css
/* Instead of vertical list */
.benefits { flex-direction: column; gap: 16px; }

/* Use horizontal compact layout */
.benefits {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
```

**3. Orphaned flex children don't work**
```jsx
// BAD - flex-1 has no flex parent
function FallbackComponent() {
  return <div className="flex-1 flex items-center...">...</div>;
}

// GOOD - use min-h-dvh directly
function FallbackComponent() {
  return <div className="min-h-dvh flex items-center...">...</div>;
}
```

**4. Content reduction may be necessary**
- Remove redundant sections (e.g., trust indicators if benefits cover same info)
- Shorten text labels ("Proveedores verificados" → "Verificados")
- Reduce icon sizes (w-10 h-10 → w-9 h-9)
- Compact footer into single row instead of stacked

**5. Test on real devices, not just Chrome DevTools**
- DevTools doesn't perfectly replicate:
  - Android PWA status bar height
  - Samsung browser toolbar behavior
  - Dynamic keyboard appearing/disappearing
- Real Galaxy S23 has different behavior than "Samsung Galaxy S20 Ultra" preset

### Specific Tailwind patterns:

```css
/* Global safe area support */
.safe-area-bottom {
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
}

/* Dynamic viewport height (Tailwind arbitrary value) */
min-h-[100dvh]  /* or add to tailwind.config.ts */

/* Fallback for Safari < 15.4 */
min-h-screen md:min-h-dvh  /* graceful degradation */
```

### When scrolling is acceptable:
- Request history (many items)
- Admin lists/tables
- Forms with many fields
- Detailed timelines

### When scrolling should be avoided:
- Landing/home screens
- Status screens
- Empty states
- Login/register forms

---