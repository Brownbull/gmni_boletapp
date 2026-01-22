# NitoAgua Progressive Web App Standards

> **Purpose**: Directives and patterns for building a well-structured, mobile-first Progressive Web App.
> **Version**: 1.0.0
> **Last Updated**: 2025-12-22

---

## Table of Contents

1. [Viewport & Screen Adaptability](#1-viewport--screen-adaptability)
2. [Layout Patterns](#2-layout-patterns)
3. [Safe Area Handling](#3-safe-area-handling)
4. [Bottom Navigation](#4-bottom-navigation)
5. [Font & Typography](#5-font--typography)
6. [PWA Configuration](#6-pwa-configuration)
7. [Service Worker](#7-service-worker)
8. [Testing Requirements](#8-testing-requirements)

---

## 1. Viewport & Screen Adaptability

### Dynamic Viewport Units (REQUIRED)

Use dynamic viewport units instead of fixed `vh`:

```css
/* WRONG - doesn't account for browser chrome */
min-height: 100vh;

/* CORRECT - adjusts for browser UI */
min-height: 100dvh;
```

**Tailwind Classes:**
- `min-h-dvh` - Dynamic minimum height (content can scroll if needed)
- `h-dvh` - Fixed dynamic height (content constrained to viewport)
- `min-h-svh` - Small viewport (most conservative)
- `min-h-lvh` - Large viewport (assumes browser UI hidden)

### When to Use Each

| Scenario | Class | Rationale |
|----------|-------|-----------|
| Landing pages | `h-dvh` | Must fit viewport exactly |
| Status screens | `min-h-dvh` | Should fit, allow scroll if needed |
| Forms | `min-h-dvh` | May need scroll for keyboard |
| Lists/History | `min-h-dvh` | Content naturally scrolls |
| Auth pages | `h-dvh` + `overflow-y-auto` | Fixed container, internal scroll |

### Layout Structure

For screens that should NOT scroll:

```jsx
<div className="h-dvh flex flex-col overflow-hidden">
  <header className="shrink-0">...</header>
  <main className="flex-1 flex flex-col justify-center overflow-y-auto">...</main>
  <footer className="shrink-0">...</footer>
</div>
```

**Key Points:**
- Use `shrink-0` on header/footer to prevent collapse
- Use `flex-1` on main content to fill remaining space
- Use `overflow-hidden` on container to prevent page scroll
- Use `overflow-y-auto` on scrollable sections for internal scrolling

---

## 2. Layout Patterns

### Flex Container Pattern

```jsx
// CORRECT - Fixed height container with flexible content
<div className="h-dvh flex flex-col overflow-hidden">
  <div className="shrink-0">{/* Fixed header */}</div>
  <div className="flex-1 overflow-y-auto">{/* Scrollable content */}</div>
  <div className="shrink-0">{/* Fixed footer/nav */}</div>
</div>
```

### AVOID: Orphaned Flex Children

```jsx
// BAD - flex-1 has no flex parent
function Component() {
  return <div className="flex-1 flex items-center...">...</div>;
}

// GOOD - use min-h-dvh directly
function Component() {
  return <div className="min-h-dvh flex items-center...">...</div>;
}
```

### AVOID: Spacer Divs

```jsx
// BAD - spacer pushes content off screen
<main className="flex-1 flex flex-col">
  <div className="flex-1" /> {/* Spacer - AVOID */}
  <Content />
  <div className="flex-1" /> {/* Spacer - AVOID */}
</main>

// GOOD - use justify-center instead
<main className="flex-1 flex flex-col justify-center">
  <Content />
</main>
```

### Horizontal Layouts Save Vertical Space

```jsx
// VERTICAL - uses more space
<div className="flex flex-col gap-4">
  <Feature icon="..." label="Feature 1" />
  <Feature icon="..." label="Feature 2" />
  <Feature icon="..." label="Feature 3" />
</div>

// HORIZONTAL - compact
<div className="flex justify-between gap-2">
  <Feature icon="..." label="F1" />
  <Feature icon="..." label="F2" />
  <Feature icon="..." label="F3" />
</div>
```

---

## 3. Safe Area Handling

### CSS Variables (in globals.css)

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
}
```

### Utility Classes

```css
/* Safe area with base padding */
.safe-area-bottom {
  padding-bottom: calc(0.5rem + var(--safe-bottom));
}

.safe-area-top {
  padding-top: calc(0.5rem + var(--safe-top));
}

/* Safe area only (no extra padding) */
.pb-safe {
  padding-bottom: var(--safe-bottom);
}

.pt-safe {
  padding-top: var(--safe-top);
}
```

### Usage

```jsx
// Bottom navigation - use pb-safe for minimal extra space
<nav className="fixed bottom-0 ... pb-safe">...</nav>

// Pages with bottom nav - add padding to clear nav
<div className="pb-20">...</div>  // 80px to clear 64px nav + margin
```

---

## 4. Bottom Navigation

### Structure (Icon-Only Design)

```jsx
<nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white pb-safe">
  <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-4">
    {/* Icon buttons */}
    <Link
      href="/path"
      className={cn(
        "flex items-center justify-center w-12 h-12 rounded-full transition-colors",
        isActive ? "text-[#0077B6] bg-[#CAF0F8]" : "text-gray-400"
      )}
      aria-label="Label for accessibility"
    >
      <Icon className="w-6 h-6" />
    </Link>

    {/* Center FAB (elevated) */}
    <button
      className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg -mt-4"
      style={{ background: "linear-gradient(135deg, #0077B6 0%, #005f8f 100%)" }}
      aria-label="Primary action"
    >
      <ActionIcon className="w-7 h-7" />
    </button>

    {/* More icon buttons */}
  </div>
</nav>
```

### Key Specifications

| Element | Size | Notes |
|---------|------|-------|
| Nav height | `h-16` (64px) | Plus safe area |
| Icon buttons | `w-12 h-12` | 48px circular |
| Icons | `w-6 h-6` | 24px |
| Center FAB | `w-14 h-14` | 56px, elevated with `-mt-4` |
| FAB icon | `w-7 h-7` | 28px |

### Active State

```jsx
// Active: primary color with accent background
isActive ? "text-[#0077B6] bg-[#CAF0F8]" : "text-gray-400"
```

### Accessibility

- Always include `aria-label` for icon-only buttons
- Use semantic `<Link>` for navigation, `<button>` for actions
- Badge with `aria-label` for notification count

---

## 5. Font & Typography

### Font Family

```css
--font-sans: var(--font-poppins), -apple-system, BlinkMacSystemFont, ...;
--font-logo: var(--font-pacifico), cursive;
```

### Compact Size Guidelines

For settings/detail screens, use compact sizes:

| Element | Standard | Compact |
|---------|----------|---------|
| Section icon | `w-5 h-5` | `w-4 h-4` |
| Section title | `font-semibold` | `text-sm font-semibold` |
| Description | `text-sm` | `text-xs` |
| Button text | `text-sm` | `text-xs` |
| Badge text | `text-xs` | `text-[11px]` |

### Form Compaction (for tight screens)

| Element | Before | After |
|---------|--------|-------|
| Input height | default | `h-9` |
| Button height | default | `h-8` or `h-9` |
| Form spacing | `space-y-4` | `space-y-2.5` |
| Label spacing | `space-y-2` | `space-y-1` |

---

## 6. PWA Configuration

### manifest.json

```json
{
  "name": "NitoAgua - Agua a tu puerta",
  "short_name": "nitoagua",
  "display": "standalone",
  "start_url": "/",
  "theme_color": "#0077B6",
  "background_color": "#CAF0F8",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### next.config.ts

```ts
import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
};

export default nextConfig;
```

---

## 7. Service Worker

### Version Management

```javascript
// sw.js
const SW_VERSION = "1.0.0";  // Update with each deploy
const CACHE_NAME = `nitoagua-v${SW_VERSION}`;
```

### Update Strategy

1. Service worker detects new version on registration check
2. New SW installs in background (waiting state)
3. App detects `updatefound` event, shows "Update Available" button
4. User clicks update → `skipWaiting()` → page reloads with new version

### Cache Strategy

- **Static assets**: Cache-first (images, fonts, icons)
- **API routes**: Network-first with cache fallback
- **Pages**: Network-first for fresh content

---

## 8. Testing Requirements

### Target Viewports

| Device | CSS Pixels | Priority |
|--------|------------|----------|
| Galaxy S23 | 360×780 | HIGH - Android target |
| iPhone SE | 375×667 | HIGH - Smallest common |
| iPhone 12/13/14 | 390×844 | MEDIUM - iOS standard |
| Pixel 7 | 412×915 | LOW - Large Android |

### Screens That Must NOT Scroll

- Consumer Home
- Login/Register (content area may scroll internally)
- Request Status (core info visible)
- Provider Empty States

### Screens That MAY Scroll

- Request History (list)
- Admin tables/lists
- Provider Earnings breakdown
- Long forms

### Real Device Testing (Required)

Chrome DevTools doesn't perfectly replicate:
- Android PWA status bar height
- Samsung browser toolbar behavior
- Keyboard appearing/disappearing
- Safe area insets on notched devices

**Recommended**: Android Studio emulator with Play Store device (Pixel 7 or similar)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-22 | Initial standards from Story 10-7 learnings |

---

## Related Documents

- [Story 10-7: Mobile Screen Adaptability](../sprint-artifacts/epic10/10-7-mobile-screen-adaptability.md)
- [UX Research: Screen Adapt](../ux-audit/research/screen%20adapt.md)
