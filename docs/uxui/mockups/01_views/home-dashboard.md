# Home Dashboard Design Specification

**Story:** 13.6 - Mockup Home Dashboard
**Epic:** 13 - UX Design & Mockups
**Created:** 2025-12-27
**Updated:** 2025-12-28
**Status:** Complete (Revised)
**Author:** Claude (Atlas-guided)

---

## Implementation Status Legend

| Symbol | Meaning |
|--------|---------|
| 🟡 FUTURE | Epic 14 implementation - this is a design specification |

---

## Components Used from design-system-final.html

This mockup uses the following established components:

| Component | Source Section | Lines |
|-----------|---------------|-------|
| Header Bar | "Top Bar Headers" | 4508-4570 |
| Radar Chart | "Radar Chart - Period Comparison" | 5671-5764 |
| Bottom Navigation | "Bottom Navigation" | (standard) |
| G Logo (Teal) | "App Logo & Wordmark" | 4394-4448 |

---

## Executive Summary

The Home Dashboard is the primary landing screen for Gastify users. It answers the core question every user has: **"¿Dónde se fue la plata?"** (Where did my money go?). The design uses a **Radar Chart (hexagon)** as the central visual metaphor, showing spending categories relative to budget with:
- **Budget boundary** (green dashed line) - the outer limit
- **Actual spending** (blue/red solid) - current spending polygon

**Primary Persona:** María (38, overwhelmed parent) - Opens app wondering where money went, should answer this within 10 seconds.

**Mockup File:** [home-dashboard.html](./home-dashboard.html)

---

## Screen States

### 1. Default State (Healthy)

The user is within budget. Polygon inner shape is smaller than the budget boundary.

**Visual Treatment:**
- Polygon breathes slowly (3s cycle) - calm, organic feel
- Lava colors (orange/yellow gradient) contained within green boundary
- Total amount displayed prominently in center
- Subtext: "Dentro del presupuesto"

**Components Visible:**
- Greeting header with user name
- Period selector (e.g., "Esta semana")
- Dynamic Spending Polygon (5 vertices for 5 categories)
- Today's Insight Card
- Recent Transactions list (3-5 items)
- Bottom Navigation

### 2. Overspending State

The user has exceeded budget in one or more categories. Inner polygon exceeds the budget boundary.

**Visual Treatment:**
- Polygon breathes faster (2s cycle) - urgency without alarm
- Inner polygon extends BEYOND the outer budget boundary
- Hotter lava colors (deeper red gradient)
- Category labels highlight exceeded areas with ↑ indicator
- Center background turns warning amber
- Subtext: "Sobre el presupuesto"

**Components Visible:**
- Same layout as default
- Warning-styled Insight Card with "Intentional?" pattern
- Visual emphasis on exceeded categories

### 3. Empty State (New User)

First-time user with no transaction history.

**Visual Treatment:**
- No polygon displayed
- Centered empty state illustration
- Welcoming message: "Tu primera boleta te espera"
- Prominent CTA button: "Escanear boleta"
- Simplified navigation

---

## Component Specifications

### Radar Chart (from design-system-final.html)

The central visual element representing spending distribution across categories. Uses the established **Radar Chart - Period Comparison** component pattern.

#### Geometry

| Property | Value | Notes |
|----------|-------|-------|
| Vertices | 6 (hexagon) | Fixed 6 categories per design system |
| SVG ViewBox | 200x200 | Standard from design-system-final.html |
| Budget (Outer) | Dashed stroke | Green (#22c55e), 2px stroke, stroke-dasharray="4 2" |
| Actual (Inner) | Solid fill + stroke | Blue/Red, fill-opacity 0.2, 2px stroke |
| Grid Rings | 4 concentric hexagons | var(--border-light), 1px stroke |

#### Color States

| State | Actual Line | Fill | Points |
|-------|-------------|------|--------|
| Healthy | var(--primary) #2563eb | fill-opacity="0.2" | r="4" |
| Overspend | var(--error) #ef4444 | fill-opacity="0.2" | r="4-5" |
| Budget | var(--success) #22c55e | fill-opacity="0.1" | - |

#### Breathing Animation

Per motion-design-system.md Section 3.1:

```css
@keyframes breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.02);
    opacity: 1;
  }
}

.polygon-breathing {
  animation: breathe 3s ease-in-out infinite;
  transform-origin: center center;
  will-change: transform, opacity;
}

/* Faster breathing for overspend */
.polygon-breathing-fast {
  animation: breathe-fast 2s ease-in-out infinite;
}
```

#### Reduced Motion Fallback

```css
@media (prefers-reduced-motion: reduce) {
  .polygon-breathing,
  .polygon-breathing-fast {
    animation: none;
    transform: scale(1);
    opacity: 1;
  }
}
```

### Category Labels

Positioned around the polygon perimeter, one per vertex.

| Property | Value |
|----------|-------|
| Font Size | 11px |
| Font Weight | 600 |
| Color | var(--text-secondary) |
| Emoji Size | 18px |
| Hover Effect | scale(1.1), color: primary |

**Label Positioning (5-vertex example):**
- Top center: Supermercado 🛒
- Top right: Restaurantes 🍽️
- Bottom right: Transporte 🚗
- Bottom left: Salud 💊
- Top left: Entretención 🎬

### Polygon Center

Interactive center area showing period total.

| Property | Value |
|----------|-------|
| Padding | 16px |
| Border Radius | 12px |
| Hover Background | rgba(255,255,255,0.8) |

**Typography:**
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Label ("Esta semana") | 11px | 400 | --text-tertiary |
| Amount ($185.400) | 28px | 700 | --text-primary |
| Subtext | 12px | 400 | --text-secondary |

---

### Today's Insight Card

Single most relevant insight for the user.

| Property | Value |
|----------|-------|
| Background | var(--bg-secondary) |
| Border Radius | 12px |
| Padding | 16px |
| Shadow | shadow-sm |
| Border Left | 4px solid primary (or warning) |

**Layout:**
```
[Icon 36x36] [Content Area]
              Title (14px/600)
              Message (13px/400)
              Action link (12px/500)
```

**States:**
- **Normal**: Blue left border, lightbulb icon
- **Warning**: Orange left border, warning icon

**Voice & Tone:**
Per voice-tone-guidelines.md:
- Normal: "Restaurantes subió 23%" (observational)
- Warning: "La vida sigue. Diciembre es caro para todos." (normalizing)
- Action: "Fue intencional | No me había dado cuenta" (non-judgmental options)

---

### Recent Transactions

Preview of 3-5 most recent transactions.

**Section Header:**
| Element | Style |
|---------|-------|
| Title | 16px/600, --text-primary |
| Link ("Ver todas") | 13px/500, --primary |

**Transaction Item:**
Per design-system-reference.md:

```css
.transaction-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 12px;
}
```

| Element | Size | Weight |
|---------|------|--------|
| Thumbnail | 44x44px | - |
| Merchant | 14px | 600 |
| Category Badge | 11px | 600 |
| Amount | 15px | 700 |
| Date | 11px | 400 |

**Amount Colors:**
- Expense: var(--error) (#ef4444)
- Income: var(--success) (#22c55e)

---

### Bottom Navigation

Per design-system-reference.md (Spanish labels required):

| Tab | Icon | Label | Active State |
|-----|------|-------|--------------|
| Home | home | Inicio | Primary color stroke |
| Analytics | analytics | Analíticas | - |
| Scan (center) | camera | - | Floating FAB |
| Ideas | ideas | Ideas | - |
| Settings | settings | Ajustes | - |

**Scan Button (FAB):**
| Property | Value |
|----------|-------|
| Size | 52x52px |
| Border Radius | 50% |
| Background | gradient (primary → #3d8b6e) |
| Margin Top | -56px (floats above nav) |
| Shadow | 0 4px 16px rgba(74,158,126,0.4) |
| Icon | CAMERA (not scan/barcode) |

---

## Empty State

For new users with no transactions.

**Layout:**
```
[Illustration 160x160]
Title: "Tu primera boleta te espera"
Message: "Escanea una boleta para comenzar..."
[CTA Button with camera icon]
```

**CTA Button:**
| Property | Value |
|----------|-------|
| Padding | 14px 28px |
| Border Radius | full |
| Background | Primary gradient |
| Font | 15px/600 white |
| Shadow | Primary shadow |

---

## Interaction Patterns

### Polygon Interactions

| Action | Result |
|--------|--------|
| Tap category label | Navigate to category drill-down |
| Tap polygon center | Open weekly summary story |
| Long press polygon | Show tooltip with exact values |

### Card Interactions

| Action | Result |
|--------|--------|
| Tap insight card | Expand or navigate to detail |
| Swipe insight card | Dismiss |
| Tap transaction | Navigate to transaction detail |

### Navigation

| Action | Result |
|--------|--------|
| Tap "Ver todas" | Navigate to History view |
| Tap Scan FAB | Open camera capture |
| Tap Analytics | Navigate to Analytics |

---

## Responsive Considerations

| Viewport | Adjustment |
|----------|------------|
| < 375px | Reduce polygon to 200x200px |
| > 414px | Increase spacing, larger fonts |
| Safe areas | Bottom nav respects safe-area-inset |

---

## Accessibility

### Required ARIA

```html
<nav role="navigation" aria-label="Navegación principal">
  <div role="tablist">
    <button role="tab" aria-selected="true">Inicio</button>
    ...
  </div>
</nav>
```

### Motion Preferences

All breathing animations must respect `prefers-reduced-motion`:
- Polygon: Static at opacity 1
- Card hovers: Immediate (no transition)
- Stagger reveals: Immediate reveal

### Touch Targets

| Element | Minimum Size |
|---------|--------------|
| Nav items | 44x44px |
| Scan FAB | 52x52px |
| Category labels | 44x44px tap area |
| Cards | Full card tappable |

---

## Use Case Mapping

| Use Case | This Screen's Role |
|----------|-------------------|
| UC1: First Scan | Empty state → Scan → Return with data |
| UC2: Weekly Health Check | Primary dashboard for María persona |
| UC6: Batch Scan | Shows aggregate results after batch |
| UC8: Insight Discovery | Displays today's insight card |

---

## Persona Validation: María

Per use-cases-e2e.md UC2 (Weekly Health Check):

| Criterion | Validation |
|-----------|------------|
| Answer "¿Dónde se fue la plata?" in <10s | ✅ Polygon shows category breakdown at glance |
| Non-judgmental messaging | ✅ "La vida sigue" not "You overspent" |
| Clear visual hierarchy | ✅ Total → Polygon → Insight → Transactions |
| Intentional/Accidental pattern | ✅ Response options on overspend insight |

---

## File References

| File | Purpose |
|------|---------|
| [home-dashboard.html](./home-dashboard.html) | Interactive mockup with all 3 states |
| [design-system-reference.md](./00_components/design-system-reference.md) | Component patterns |
| [motion-design-system.md](../motion-design-system.md) | Animation specifications |
| [voice-tone-guidelines.md](../voice-tone-guidelines.md) | Messaging patterns |

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-27 | 1.0 | Initial specification from Atlas-guided workflow |
| 2025-12-28 | 2.0 | **REVISED**: Now uses components from design-system-final.html (Header Bar, Radar Chart, Bottom Nav). Fixed workflow compliance issue. |

---

_This specification defines the Home Dashboard screen for Epic 14 implementation. All components follow the Gastify design system and motion patterns._
