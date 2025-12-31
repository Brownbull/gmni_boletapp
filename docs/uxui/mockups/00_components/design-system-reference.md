# Gastify Design System Reference

> **Generated from:** design-system-final.html
> **Size Target:** <4000 tokens
> **Purpose:** Compact reference for AI agents building screen mockups
> **Last Updated:** 2025-12-28

---

## Implementation Status Legend

| Symbol | Meaning |
|--------|---------|
| 🟢 CURRENT | Implemented in production codebase |
| 🟡 FUTURE | Planned for Epic 14-15 implementation |

**Note:** All components in this reference are 🟡 FUTURE (Epic 14) - this is a design specification, not existing code.

---

## Use Case Mapping

| Component | Use Cases (from Story 13.1) |
|-----------|----------------------------|
| Bottom Nav | UC1, UC2, UC3, UC4, UC5, UC6, UC7, UC8 (all screens) |
| Transaction Item | UC1 (First Receipt), UC3 (Batch Capture), UC6 (Weekly Report) |
| Cards | UC2 (Weekly Health Check), UC4 (Out-of-Character) |
| Category Badges | UC1, UC3, UC5 (Insight Discovery) |
| Buttons | UC1 (Save), UC3 (Batch actions) |
| Tree Map | UC2 (Weekly Health Check), UC5 (Insight Discovery) |
| Radar Chart | UC2 (Weekly Health Check), UC6 (Weekly Report) |
| Bump Chart | UC5 (Insight Discovery), UC6 (Weekly Report) |
| Category Ticker | UC2 (Weekly Health Check), UC5 (Insight Discovery) |
| Sankey Diagram | UC2 (Weekly Health Check), UC5 (Insight Discovery), UC7 (Analytics) |

---

## Themes & Fonts

| Theme | CSS Selector | Primary Color |
|-------|--------------|---------------|
| Professional | `[data-theme="professional"]` | #2563eb |
| Mono | `[data-theme="mono"]` | #18181b |
| Ni No Kuni | `[data-theme="ninokuni"]` | #4a7c59 |

| Font | CSS Selector | Use |
|------|--------------|-----|
| Outfit | `[data-font="outfit"]` | Default, modern |
| Space Grotesk | `[data-font="space-grotesk"]` | Alternative, technical |

---

## Design Tokens

### Colors (CSS Variables Only)

```css
/* Primary Palette */
--primary: #2563eb;
--primary-hover: #1d4ed8;
--primary-light: #dbeafe;
--primary-dark: #1e40af;

/* Secondary */
--secondary: #64748b;
--secondary-light: #f1f5f9;
--accent: #0ea5e9;

/* Backgrounds */
--bg-primary: #f8fafc;
--bg-secondary: #ffffff;
--bg-tertiary: #f1f5f9;
--bg-inverse: #0f172a;

/* Text */
--text-primary: #0f172a;
--text-secondary: #475569;
--text-tertiary: #94a3b8;
--text-inverse: #f8fafc;

/* Borders */
--border-light: #e2e8f0;
--border-medium: #cbd5e1;
--border-dark: #94a3b8;

/* Semantic */
--success: #22c55e;
--success-light: #dcfce7;
--warning: #f59e0b;
--warning-light: #fef3c7;
--error: #ef4444;
--error-light: #fee2e2;
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

### Spacing

```css
--space-1: 4px;  --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
--space-5: 20px; --space-6: 24px;  --space-8: 32px;  --space-10: 40px;
```

### Border Radii

```css
--radius-sm: 6px;   --radius-md: 10px;  --radius-lg: 12px;
--radius-xl: 16px;  --radius-2xl: 20px; --radius-full: 9999px;
```

### Typography

```css
--font-family: 'Outfit', ui-sans-serif, system-ui, sans-serif;
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
--transition-slow: 300ms ease;
--transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Navigation Components

### Header Bar (Required on All Screens)

Circular G Logo (left) + "Gastify" wordmark (center) + hamburger menu (right). Uses justify-content: space-between layout.

```html
<div class="header-bar">
  <!-- Left: Circular G Logo -->
  <div class="g-logo-circle">
    <span class="g-logo-letter">G</span>
  </div>
  <!-- Center: Gastify Wordmark -->
  <span class="header-wordmark">Gastify</span>
  <!-- Right: Hamburger Menu -->
  <button class="header-menu">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" stroke-width="2">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  </button>
</div>
```

```css
.header-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 16px 12px; background: var(--bg-primary);
}
/* Circular G Logo */
.g-logo-circle {
  width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(135deg, #4a9e7e 0%, #3d8b6e 100%);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.g-logo-letter {
  color: white; font-weight: 700; font-size: 16px;
  font-family: 'Baloo 2', sans-serif;
}
/* Centered Wordmark */
.header-wordmark {
  font-family: 'Baloo 2', sans-serif; font-size: 24px;
  font-weight: 700; color: var(--text-primary);
}
/* Menu Button */
.header-menu {
  width: 36px; height: 36px; border-radius: var(--radius-md);
  background: var(--bg-secondary); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
```

### Analytics Header (Analytics Screen Only)

Title with period selector dropdown and filter button. Replaces Header Bar on Analytics screen.

```html
<div class="analytics-header">
  <!-- Left: Title -->
  <span class="analytics-title">Analíticas</span>
  <!-- Right: Period Selector + Filter -->
  <div class="analytics-controls">
    <!-- Period Dropdown -->
    <button class="period-dropdown">
      <span>Este mes</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </button>
    <!-- Filter Button -->
    <button class="filter-btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" stroke-width="2">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
    </button>
  </div>
</div>
```

```css
.analytics-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px; background: var(--bg-primary);
}
.analytics-title {
  font-size: 24px; font-weight: 700; color: var(--text-primary);
}
.analytics-controls {
  display: flex; align-items: center; gap: 8px;
}
.period-dropdown {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; background: var(--bg-secondary);
  border: none; border-radius: var(--radius-full);
  font-size: 14px; font-weight: 500; color: var(--text-primary);
  cursor: pointer;
}
.filter-btn {
  width: 36px; height: 36px; border: none;
  background: var(--bg-secondary); border-radius: var(--radius-full);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
```

---

### Bottom Nav (Spanish Labels Required)

```html
<div class="bottom-nav">
  <div class="nav-item active">
    <svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
    <span>Inicio</span>
  </div>
  <div class="nav-item">
    <svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
    <span>Analíticas</span>
  </div>
  <div class="scan-center">
    <div class="scan-btn">
      <!-- CAMERA ICON (NOT scan) -->
      <svg viewBox="0 0 24 24">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
        <circle cx="12" cy="13" r="3"/>
      </svg>
    </div>
  </div>
  <div class="nav-item">
    <svg viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
    <span>Ideas</span>
  </div>
  <div class="nav-item">
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m17.07-7.07l-1.41 1.41M6.34 17.66l-1.41 1.41m12.73 0l-1.41-1.41M6.34 6.34L4.93 4.93"/></svg>
    <span>Ajustes</span>
  </div>
</div>
```

```css
.bottom-nav {
  display: flex; align-items: flex-end; justify-content: space-around;
  padding: 8px 12px 12px; background: var(--bg-secondary);
  border-top: 1px solid var(--border-light);
}
.nav-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 6px 10px; cursor: pointer;
}
.nav-item svg { width: 24px; height: 24px; stroke: var(--text-tertiary); fill: none; stroke-width: 1.8; }
.nav-item span { font-size: 10px; color: var(--text-tertiary); font-weight: 500; }
.nav-item.active svg { stroke: var(--primary); }
.nav-item.active span { color: var(--primary); font-weight: 600; }

/* CRITICAL: Scan center button position */
.scan-center { margin-top: -56px; padding: 0; }
.scan-btn {
  width: 52px; height: 52px; border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, #3d8b6e 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(74, 158, 126, 0.4);
}
.scan-btn svg { width: 24px; height: 24px; stroke: white; fill: none; stroke-width: 2; }
```

---

## Cards

### Card Flat

```html
<div class="card-flat">
  <div class="card-header">
    <div class="card-icon">🛒</div>
    <div class="card-info">
      <h4>Supermercado</h4>
      <p>12 transacciones</p>
    </div>
  </div>
  <div class="card-amount">$45.200</div>
</div>
```

```css
.card-flat {
  background: var(--bg-secondary); border: 1px solid var(--border-light);
  border-radius: var(--radius-lg); padding: 16px;
}
.card-header { display: flex; align-items: center; gap: 12px; }
.card-icon {
  width: 40px; height: 40px; background: var(--primary-light);
  border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;
}
.card-amount { font-size: 20px; font-weight: 700; color: var(--text-primary); }
```

### Card Elevated

```css
.card-elevated {
  background: var(--bg-secondary); box-shadow: var(--shadow-md);
  border-radius: var(--radius-lg); padding: 16px;
}
```

---

## Radar Chart (Period Comparison)

Hexagon chart for spending vs budget. From design-system-final.html lines 5671-5764.

```html
<div class="radar-chart-container">
  <svg class="radar-chart" viewBox="0 0 200 200">
    <!-- Grid rings (4 concentric hexagons) -->
    <polygon class="radar-grid" points="..." />
    <!-- Budget boundary (green dashed) -->
    <polygon class="radar-budget" points="100,20 170,47 170,127 100,154 30,127 30,47" />
    <!-- Actual spending (blue/red solid) -->
    <polygon class="radar-actual" points="100,45 145,65 140,110 100,125 55,105 60,60" />
    <!-- Data points -->
    <circle class="radar-point" cx="100" cy="45" r="4" />
    <!-- Category labels positioned around perimeter -->
  </svg>
  <div class="radar-center">
    <div class="radar-label">Esta semana</div>
    <div class="radar-amount">$185.400</div>
    <div class="radar-status">Dentro del presupuesto</div>
  </div>
</div>
```

```css
.radar-chart-container { position: relative; width: 280px; height: 280px; }
.radar-chart { width: 100%; height: 100%; }

/* Grid rings */
.radar-grid {
  fill: none; stroke: var(--border-light); stroke-width: 1;
}

/* Budget boundary (green dashed) */
.radar-budget {
  fill: var(--success); fill-opacity: 0.1;
  stroke: var(--success); stroke-width: 2;
  stroke-dasharray: 4 2;
}

/* Actual spending - Healthy (blue) */
.radar-actual {
  fill: var(--primary); fill-opacity: 0.2;
  stroke: var(--primary); stroke-width: 2;
}

/* Actual spending - Overspend (red) */
.radar-actual.overspend {
  fill: var(--error); fill-opacity: 0.2;
  stroke: var(--error); stroke-width: 2;
}

/* Data points */
.radar-point { fill: var(--primary); }
.radar-point.overspend { fill: var(--error); }

/* Center display */
.radar-center {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); text-align: center;
}
.radar-label { font-size: 11px; color: var(--text-tertiary); }
.radar-amount { font-size: 28px; font-weight: 700; color: var(--text-primary); }
.radar-status { font-size: 12px; color: var(--text-secondary); }
.radar-status.warning { color: var(--warning); }

/* Breathing animation (3s healthy, 2s overspend) */
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.02); opacity: 1; }
}
.radar-actual { animation: breathe 3s ease-in-out infinite; transform-origin: center; }
.radar-actual.overspend { animation-duration: 2s; }

@media (prefers-reduced-motion: reduce) {
  .radar-actual { animation: none; }
}
```

---

## Tree Map (Category Distribution)

Grid-based visualization showing spending distribution by category. Largest category spans full left column.

```html
<div class="treemap-card">
  <div class="treemap-header">
    <span class="treemap-title">Distribución de Gastos</span>
    <!-- Month Selector Dropdown -->
    <div style="position: relative;">
      <div class="treemap-month-pill" id="treemap-month-pill">
        <span id="treemap-month-text">Diciembre</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
      <div id="treemap-month-dropdown" class="month-dropdown">
        <div class="treemap-month-option" data-value="01">Enero</div>
        <!-- ... more months ... -->
        <div class="treemap-month-option selected" data-value="12">Diciembre</div>
      </div>
    </div>
  </div>
  <div class="treemap-grid">
    <!-- Largest category spans full left column -->
    <div class="treemap-cell supermercado">
      <div>
        <div class="treemap-cell-label">Supermercado</div>
        <div class="treemap-cell-count">18 compras</div>
      </div>
      <div>
        <div class="treemap-cell-value">$216.8k</div>
        <div class="treemap-cell-percent">40%</div>
      </div>
    </div>
    <!-- Smaller categories stack on right column -->
    <div class="treemap-cell restaurantes">
      <div class="treemap-cell-label">Restaurantes</div>
      <div>
        <div class="treemap-cell-value">$162.6k</div>
        <div class="treemap-cell-percent">30%</div>
      </div>
    </div>
    <div class="treemap-cell transporte">
      <div class="treemap-cell-label">Transporte</div>
      <div>
        <div class="treemap-cell-value">$108k</div>
        <div class="treemap-cell-percent">20%</div>
      </div>
    </div>
    <div class="treemap-cell otro">
      <div class="treemap-cell-label">Otro</div>
      <div>
        <div class="treemap-cell-value">$54k</div>
        <div class="treemap-cell-percent">10%</div>
      </div>
    </div>
  </div>
  <div class="treemap-footer">
    <span class="treemap-total-label">Total del mes</span>
    <span class="treemap-total-value">$542.000</span>
  </div>
</div>
```

```css
.treemap-card {
  background: var(--bg-secondary); border-radius: var(--radius-lg);
  padding: 16px; border: 1px solid var(--border-light);
}
.treemap-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px;
}
.treemap-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }

/* Month Selector Pill */
.treemap-month-pill {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: var(--radius-full);
  font-size: 12px; font-weight: 500;
  background: var(--primary-light); color: var(--primary);
  cursor: pointer;
}

/* Grid Layout - 2 columns, 3 rows */
.treemap-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 4px; height: 200px;
}
.treemap-cell {
  border-radius: var(--radius-md); padding: 10px;
  display: flex; flex-direction: column; justify-content: space-between;
  position: relative; overflow: hidden; min-height: 0;
}

/* Position cells - largest spans full left column */
.treemap-cell.supermercado { grid-row: 1 / 4; grid-column: 1; background: var(--primary); }
.treemap-cell.restaurantes { grid-row: 1 / 2; grid-column: 2; background: #f59e0b; }
.treemap-cell.transporte { grid-row: 2 / 3; grid-column: 2; background: #8b5cf6; }
.treemap-cell.otro { grid-row: 3 / 4; grid-column: 2; background: #9ca3af; }

/* Cell Typography */
.treemap-cell-label {
  font-size: 12px; font-weight: 600; color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.treemap-cell-count { font-size: 10px; color: rgba(255,255,255,0.8); }
.treemap-cell-value {
  font-size: 20px; font-weight: 700; color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.treemap-cell-percent { font-size: 11px; color: rgba(255,255,255,0.8); }

/* Footer */
.treemap-footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 12px; padding-top: 12px;
  border-top: 1px solid var(--border-light);
}
.treemap-total-label { font-size: 12px; color: var(--text-tertiary); }
.treemap-total-value { font-size: 18px; font-weight: 700; color: var(--text-primary); }
```

---

## Transaction Item

Uses receipt icon with category badge overlay. Merchant and amount on same row.

```html
<div class="transaction-item">
  <div class="transaction-thumb">
    <div class="receipt-icon">
      <svg viewBox="0 0 22 26">
        <path d="M3 1v24l1.5-1 1.5 1 1.5-1 1.5 1 1.5-1 1.5 1 1.5-1 1.5 1 1.5-1 1.5 1 1.5-1 1.5 1V1l-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1z"/>
        <path d="M6 7h10M6 11h7M6 15h4" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="category-badge-icon groceries">🛒</div>
  </div>
  <div class="transaction-content">
    <div class="transaction-header">
      <div class="transaction-merchant">Lider</div>
      <div class="transaction-amount">$45.990</div>
    </div>
    <div class="transaction-meta">
      <span class="meta-pill">Hoy, 14:30</span>
      <span class="meta-pill">Las Condes</span>
      <span class="category-badge groceries">Supermercado</span>
    </div>
  </div>
</div>
```

```css
.transaction-item {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 12px; background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

/* Receipt icon with category badge overlay */
.transaction-thumb { position: relative; flex-shrink: 0; }
.transaction-thumb .receipt-icon {
  width: 40px; height: 46px; border-radius: 6px;
  background: linear-gradient(135deg, #fafaf8 0%, #f0ede4 100%);
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--border-light);
}
.transaction-thumb .receipt-icon svg {
  width: 18px; height: 22px; stroke: #9ca3af; fill: none;
  stroke-width: 1.2; opacity: 0.7;
}
.transaction-thumb .category-badge-icon {
  position: absolute; bottom: -3px; right: -3px;
  width: 18px; height: 18px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; border: 2px solid var(--bg-secondary);
}
.category-badge-icon.groceries { background: #dcfce7; }
.category-badge-icon.restaurant { background: #fee2e2; }
.category-badge-icon.transport { background: #dbeafe; }

/* Merchant + Amount on same row */
.transaction-header {
  display: flex; justify-content: space-between;
  align-items: flex-start; margin-bottom: 4px;
}
.transaction-merchant { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.transaction-amount { font-size: 14px; font-weight: 600; color: var(--text-primary); }

/* Meta pills */
.meta-pill {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 3px 6px; background: var(--bg-tertiary);
  border-radius: var(--radius-full); font-size: 10px; color: var(--text-secondary);
}
```

---

## Category Badges

```css
.category-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: var(--radius-full);
  font-size: 11px; font-weight: 600;
}
.category-badge.groceries { background: #dcfce7; color: #15803d; }
.category-badge.restaurant { background: #fef3c7; color: #b45309; }
.category-badge.transport { background: #dbeafe; color: #1d4ed8; }
.category-badge.health { background: #fce7f3; color: #be185d; }
.category-badge.entertainment { background: #ede9fe; color: #7c3aed; }
```

---

## Buttons

```html
<button class="btn btn-soft">Guardar</button>
<button class="btn btn-pill">Escanear</button>
<button class="btn-icon"><svg>...</svg></button>
```

```css
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 8px; padding: 12px 24px; font-size: 14px; font-weight: 600;
  border-radius: var(--radius-md); cursor: pointer; border: none;
}
.btn-soft { background: var(--primary-light); color: var(--primary); }
.btn-soft:hover { background: var(--primary); color: white; }
.btn-pill { background: var(--primary); color: white; border-radius: var(--radius-full); }
.btn-icon {
  width: 44px; height: 44px; padding: 0; background: var(--bg-tertiary);
  color: var(--text-secondary); border-radius: var(--radius-md);
}
```

---

## Canonical Icons

| Name | SVG Path |
|------|----------|
| home | `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>` |
| analytics | `<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>` |
| camera | `<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>` |
| ideas | `<path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>` |
| settings | `<circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m17.07-7.07l-1.41 1.41M6.34 17.66l-1.41 1.41m12.73 0l-1.41-1.41M6.34 6.34L4.93 4.93"/>` |
| check | `<path d="M20 6L9 17l-5-5"/>` |
| x | `<path d="M18 6L6 18"/><path d="m6 6 12 12"/>` |
| plus | `<path d="M12 5v14"/><path d="M5 12h14"/>` |
| search | `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>` |
| chevron-right | `<path d="M9 18l6-6-6-6"/>` |

---

## Prescriptive Validation Rules

### MUST Follow

1. **Spanish Navigation Labels**: `Inicio | Analíticas | [Camera] | Ideas | Ajustes`
2. **Camera Icon for Center Button**: Use camera SVG path (NOT scan/barcode icon)
3. **CSS Variables Only**: Never use hardcoded hex colors
4. **Scan Button Position**: `.scan-center { margin-top: -56px; }` (NOT -32px)
5. **Font Family**: Use `var(--font-family)` for all text

### MUST NOT

1. **No Hardcoded Colors**: `color: #0d9488;` is FORBIDDEN
2. **No English Labels**: Nav must be in Spanish
3. **No Scan Icon**: Center button is CAMERA, not barcode/scan
4. **No Wrong Positioning**: Scan button margin-top must be -56px

### Correct vs Incorrect

```css
/* CORRECT */
color: var(--primary);
background: var(--bg-secondary);
.scan-center { margin-top: -56px; }

/* FORBIDDEN */
color: #0d9488;
background: #f8fafc;
.scan-center { margin-top: -32px; }
```

---

## Phone Frame (Mockup Container)

```css
.phone-frame {
  width: 375px; min-height: 667px; max-height: 812px;
  background: #1e293b; border-radius: 54px; padding: 14px;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25),
    inset 0 0 0 2px #334155, inset 0 0 0 4px #475569;
}
.phone-screen {
  width: 100%; height: 100%; min-height: 639px;
  background: var(--bg-primary); border-radius: 44px;
  overflow: hidden; overflow-y: auto;
}
.phone-content { padding: 60px 16px 24px 16px; }
```

---

## Accessibility Requirements

### Reduced Motion (Required)
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### ARIA for Navigation
```html
<nav role="navigation" aria-label="Navegación principal">
  <div role="tablist">
    <button role="tab" aria-selected="true">Inicio</button>
    <!-- ... -->
  </div>
</nav>
```

---

## Bump Chart (Category Rankings)

Shows how category rankings change over time periods.

```html
<div class="bump-chart-card">
  <div class="chart-header">
    <span class="chart-title">Ranking de Categorías</span>
    <span class="chart-period">Últimos 6 meses</span>
  </div>
  <div class="bump-chart-wrapper">
    <!-- Y-axis labels -->
    <div class="bump-y-axis">
      <span>#1</span><span>#2</span><span>#3</span><span>#4</span>
    </div>
    <svg viewBox="0 0 280 120" class="bump-chart">
      <!-- Grid lines -->
      <line x1="0" y1="15" x2="280" y2="15" stroke="var(--border-light)"/>
      <line x1="0" y1="45" x2="280" y2="45" stroke="var(--border-light)"/>
      <line x1="0" y1="75" x2="280" y2="75" stroke="var(--border-light)"/>
      <line x1="0" y1="105" x2="280" y2="105" stroke="var(--border-light)"/>
      <!-- Category lines with data points -->
      <polyline fill="none" stroke="var(--primary)" stroke-width="3" points="0,15 56,15 112,45 168,15 224,15 280,15"/>
      <polyline fill="none" stroke="#f59e0b" stroke-width="3" points="0,45 56,45 112,15 168,45 224,45 280,45"/>
      <!-- Data points -->
      <circle cx="280" cy="15" r="6" fill="var(--primary)" stroke="white" stroke-width="2"/>
    </svg>
    <!-- X-axis (months) -->
    <div class="bump-x-axis">
      <span>Jul</span><span>Ago</span><span>Sep</span><span>Oct</span><span>Nov</span><span class="current">Dic</span>
    </div>
  </div>
  <!-- Legend -->
  <div class="bump-legend">
    <span class="legend-item" style="background: var(--primary-light); color: var(--primary);">Supermercado #1</span>
    <span class="legend-item" style="background: #fef3c7; color: #b45309;">Restaurantes #2</span>
  </div>
</div>
```

```css
.bump-chart-card {
  background: var(--bg-secondary); border-radius: var(--radius-lg);
  padding: 20px; border: 1px solid var(--border-light);
}
.chart-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
.chart-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.chart-period { font-size: 12px; color: var(--text-tertiary); }
.bump-y-axis { font-size: 10px; color: var(--text-tertiary); }
.bump-x-axis { display: flex; justify-content: space-between; font-size: 10px; color: var(--text-tertiary); }
.bump-x-axis .current { font-weight: 600; color: var(--primary); }
.bump-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-light); }
.legend-item { padding: 6px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 500; }
```

---

## Category Ticker (Stock Style)

Stock-ticker inspired view with mini sparklines. Green = spending down (good), Red = spending up (caution).

```html
<div class="ticker-card">
  <div class="ticker-header">
    <span class="ticker-title">Tendencia por Categoría</span>
    <span class="ticker-period">vs mes anterior</span>
  </div>
  <div class="ticker-list">
    <!-- UP trend (red = bad) -->
    <div class="ticker-item trend-up">
      <div class="ticker-info">
        <div class="ticker-name">Supermercado</div>
        <div class="ticker-count">18 compras</div>
      </div>
      <div class="ticker-sparkline">
        <svg viewBox="0 0 60 28">
          <polyline fill="none" stroke="#ef4444" stroke-width="1.5" points="2,22 10,20 18,18 26,21 34,16 42,14 50,12 58,8"/>
          <circle cx="58" cy="8" r="2" fill="#ef4444"/>
        </svg>
      </div>
      <div class="ticker-value">
        <div class="ticker-amount">$216.8k</div>
        <div class="ticker-change up">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3"><polyline points="18 15 12 9 6 15"/></svg>
          +12.3%
        </div>
      </div>
    </div>
    <!-- DOWN trend (green = good) -->
    <div class="ticker-item trend-down">
      <div class="ticker-info">
        <div class="ticker-name">Restaurantes</div>
        <div class="ticker-count">12 compras</div>
      </div>
      <div class="ticker-sparkline">
        <svg viewBox="0 0 60 28">
          <polyline fill="none" stroke="var(--success)" stroke-width="1.5" points="2,8 10,10 18,9 26,14 34,16 42,18 50,20 58,22"/>
          <circle cx="58" cy="22" r="2" fill="var(--success)"/>
        </svg>
      </div>
      <div class="ticker-value">
        <div class="ticker-amount">$162.6k</div>
        <div class="ticker-change down">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
          -8.5%
        </div>
      </div>
    </div>
  </div>
</div>
```

```css
.ticker-card {
  background: var(--bg-secondary); border-radius: var(--radius-lg);
  padding: 16px; border: 1px solid var(--border-light);
}
.ticker-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
.ticker-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.ticker-period { font-size: 11px; color: var(--text-tertiary); }
.ticker-list { display: flex; flex-direction: column; gap: 2px; }
.ticker-item {
  display: flex; align-items: center; padding: 12px; gap: 12px;
  border-radius: var(--radius-md);
}
.ticker-item.trend-up { background: rgba(239, 68, 68, 0.04); }
.ticker-item.trend-down { background: rgba(16, 185, 129, 0.04); }
.ticker-info { flex: 1; }
.ticker-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.ticker-count { font-size: 11px; color: var(--text-tertiary); }
.ticker-sparkline { width: 60px; height: 28px; }
.ticker-value { text-align: right; min-width: 70px; }
.ticker-amount { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.ticker-change { display: flex; align-items: center; justify-content: flex-end; gap: 2px; font-size: 11px; font-weight: 600; }
.ticker-change.up { color: #ef4444; }
.ticker-change.down { color: var(--success); }
```

---

## Sankey Diagram (Money Flow)

Flow visualization showing how money moves from income through categories. Interactive nodes for filtering. Supports drill-down into subcategories.

```html
<div class="sankey-card">
  <div class="sankey-header">
    <span class="sankey-title">Flujo de Dinero</span>
    <div class="month-pill">
      <span>Diciembre</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </div>
  </div>
  <div class="sankey-container">
    <svg viewBox="0 0 320 260" class="sankey-svg">
      <!-- Gradient definitions -->
      <defs>
        <linearGradient id="flow-income-cat" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color: var(--success); stop-opacity: 0.6"/>
          <stop offset="100%" style="stop-color: var(--primary); stop-opacity: 0.6"/>
        </linearGradient>
      </defs>
      <!-- Flow paths (curved bezier) -->
      <path d="M 60 50 C 120 50, 200 30, 260 30"
            fill="none" stroke="url(#flow-income-cat)" stroke-width="48"
            stroke-linecap="round" opacity="0.7"/>
      <!-- Source node: Ingresos -->
      <rect x="10" y="20" width="50" height="180" rx="6" fill="var(--success)" opacity="0.9"/>
      <text x="35" y="115" text-anchor="middle" fill="white" font-size="11" font-weight="600"
            transform="rotate(-90, 35, 115)">Ingresos</text>
      <!-- Target nodes: Categories -->
      <rect x="260" y="10" width="50" height="48" rx="6" fill="var(--primary)" opacity="0.9"/>
      <text x="285" y="38" text-anchor="middle" fill="white" font-size="9" font-weight="500">40%</text>
    </svg>
  </div>
  <!-- Legend -->
  <div class="sankey-legend">
    <span class="legend-chip" style="background: var(--primary-light); color: var(--primary);">
      <span class="legend-dot" style="background: var(--primary);"></span>
      Supermercado $216k
    </span>
  </div>
  <!-- Interaction hint -->
  <div class="sankey-hint">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2">
      <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
    </svg>
    <span>Toca una categoría para ver detalle</span>
  </div>
</div>
```

```css
.sankey-card {
  background: var(--bg-secondary); border-radius: var(--radius-lg);
  padding: 16px; border: 1px solid var(--border-light);
}
.sankey-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
}
.sankey-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.sankey-container { position: relative; height: 280px; }
.sankey-svg { width: 100%; height: 100%; }

/* Flow paths use gradients from source to target color */
.sankey-flow {
  fill: none; stroke-linecap: round; opacity: 0.7;
}

/* Source/Target nodes */
.sankey-node { opacity: 0.9; }
.sankey-node text {
  fill: white; text-anchor: middle; font-weight: 500;
}

/* Legend chips */
.sankey-legend {
  display: flex; flex-wrap: wrap; gap: 8px;
  margin-top: 12px; padding-top: 12px;
  border-top: 1px solid var(--border-light);
}
.legend-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 8px; border-radius: var(--radius-full);
  font-size: 10px; font-weight: 500;
}
.legend-dot { width: 6px; height: 6px; border-radius: 50%; }

/* Interaction hint */
.sankey-hint {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  margin-top: 12px; padding: 8px;
  background: var(--bg-tertiary); border-radius: var(--radius-md);
  font-size: 11px; color: var(--text-tertiary);
}

/* Drilled state - breadcrumb navigation */
.sankey-breadcrumb {
  display: flex; align-items: center; gap: 4px;
  margin-bottom: 16px; font-size: 11px; color: var(--text-tertiary);
}
.sankey-breadcrumb .active { color: var(--primary); cursor: pointer; }
```

### Sankey Category Colors

| Category | Node Color | Gradient ID |
|----------|------------|-------------|
| Supermercado | var(--primary) | flow-income-groceries |
| Restaurantes | #f59e0b | flow-income-restaurant |
| Transporte | #8b5cf6 | flow-income-transport |
| Servicios | #06b6d4 | flow-income-services |
| Otro | #9ca3af | flow-income-other |

---

## Category Progress List

Detailed category breakdown with horizontal progress bars.

```html
<div class="progress-list-card">
  <div class="progress-header">
    <span class="progress-title">Desglose por Categoría</span>
    <span class="progress-period">Diciembre</span>
  </div>
  <div class="progress-list">
    <div class="progress-item">
      <div class="progress-item-header">
        <div class="progress-item-left">
          <div class="progress-icon" style="background: var(--primary-light);">
            <svg width="16" height="16" viewBox="0 0 24 24" stroke="var(--primary)">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <span class="progress-name">Supermercado</span>
        </div>
        <span class="progress-amount">$189.700</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: 100%; background: var(--primary);"></div>
      </div>
      <div class="progress-meta">
        <span>18 transacciones</span>
        <span>35% del total</span>
      </div>
    </div>
    <!-- More items... -->
  </div>
</div>
```

```css
.progress-list-card {
  background: var(--bg-secondary); border-radius: var(--radius-lg);
  padding: 16px; border: 1px solid var(--border-light);
}
.progress-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
.progress-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.progress-period { font-size: 12px; color: var(--text-tertiary); }
.progress-list { display: flex; flex-direction: column; gap: 14px; }
.progress-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.progress-item-left { display: flex; align-items: center; gap: 10px; }
.progress-icon {
  width: 32px; height: 32px; border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
}
.progress-icon svg { fill: none; stroke-width: 2; }
.progress-name { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.progress-amount { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.progress-bar-container {
  height: 6px; background: var(--bg-tertiary);
  border-radius: var(--radius-full); overflow: hidden;
}
.progress-bar-fill { height: 100%; border-radius: var(--radius-full); }
.progress-meta {
  display: flex; justify-content: space-between; margin-top: 4px;
  font-size: 11px; color: var(--text-tertiary);
}
```

---

## Expandable Transaction Item

Compact transaction with progressive disclosure - expands to show line items.

```html
<div class="expandable-item" onclick="this.classList.toggle('open')">
  <div class="expandable-header">
    <div class="transaction-thumb"><!-- receipt icon --></div>
    <div class="expandable-content">
      <div class="expandable-title">Lider</div>
      <div class="expandable-subtitle">
        <span class="category-badge groceries">Supermercado</span>
        <span>Hoy, 14:30</span>
      </div>
    </div>
    <div class="expandable-right">
      <span class="expandable-amount">$45.990</span>
      <svg class="expandable-chevron" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
    </div>
  </div>
  <div class="expandable-details">
    <!-- Line items shown when expanded -->
    <div class="line-item">
      <span>Leche Colun 1L x2</span>
      <span>$2.990</span>
    </div>
  </div>
</div>
```

```css
.expandable-item {
  background: var(--bg-secondary); border-radius: var(--radius-md); overflow: hidden;
}
.expandable-header {
  display: flex; align-items: center; gap: 10px; padding: 12px;
  cursor: pointer; transition: background var(--transition-fast);
}
.expandable-header:hover { background: var(--bg-tertiary); }
.expandable-content { flex: 1; min-width: 0; }
.expandable-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.expandable-subtitle { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-tertiary); }
.expandable-right { display: flex; align-items: center; gap: 8px; }
.expandable-amount { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.expandable-chevron {
  width: 16px; height: 16px; stroke: var(--text-tertiary);
  fill: none; stroke-width: 2; transition: transform var(--transition-fast);
}
.expandable-item.open .expandable-chevron { transform: rotate(180deg); }
.expandable-details {
  max-height: 0; overflow: hidden; padding: 0 12px;
  transition: max-height var(--transition-normal), padding var(--transition-normal);
}
.expandable-item.open .expandable-details { max-height: 300px; padding: 0 12px 12px; }
.line-item {
  display: flex; justify-content: space-between; padding: 8px 0;
  font-size: 12px; color: var(--text-secondary);
  border-bottom: 1px solid var(--border-light);
}
```

---

## Carousel / Swiper Container

Simple CSS-based carousel with dot indicators for multiple content slides.

```html
<div class="carousel-container">
  <div class="carousel-viewport">
    <div class="carousel-track" style="--active-slide: 0;">
      <!-- Slide 1 -->
      <div class="carousel-slide active">
        <!-- Any component here -->
      </div>
      <!-- Slide 2 -->
      <div class="carousel-slide">
        <!-- Any component here -->
      </div>
      <!-- Slide 3 -->
      <div class="carousel-slide">
        <!-- Any component here -->
      </div>
    </div>
  </div>
  <!-- Dot Indicators -->
  <div class="carousel-dots">
    <button class="carousel-dot active" data-slide="0"></button>
    <button class="carousel-dot" data-slide="1"></button>
    <button class="carousel-dot" data-slide="2"></button>
  </div>
</div>
```

```css
.carousel-container { position: relative; width: 100%; }
.carousel-viewport { overflow: hidden; border-radius: var(--radius-lg); }
.carousel-track {
  display: flex; transition: transform var(--transition-normal);
  transform: translateX(calc(var(--active-slide) * -100%));
}
.carousel-slide { flex: 0 0 100%; min-width: 100%; }
.carousel-dots {
  display: flex; justify-content: center; gap: 8px;
  margin-top: 12px;
}
.carousel-dot {
  width: 8px; height: 8px; border-radius: var(--radius-full);
  background: var(--border-medium); border: none; cursor: pointer;
  transition: all var(--transition-fast);
}
.carousel-dot.active { background: var(--primary); width: 24px; }
.carousel-dot:hover { background: var(--text-tertiary); }
```

```javascript
// Simple carousel navigation
document.querySelectorAll('.carousel-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    const slide = dot.dataset.slide;
    const track = dot.closest('.carousel-container').querySelector('.carousel-track');
    track.style.setProperty('--active-slide', slide);
    dot.closest('.carousel-dots').querySelectorAll('.carousel-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
  });
});
```

---

## Settings Components

### Settings Menu Item (Navigation)

Card-style menu item with icon, title, subtitle, and chevron for navigation to subsections.

```html
<div class="settings-menu-item">
  <div class="settings-icon" style="background: var(--primary-light);">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2">
      <!-- Icon path here -->
    </svg>
  </div>
  <div class="settings-info">
    <div class="settings-title">Perfil</div>
    <div class="settings-subtitle">Foto, nombre, email, teléfono</div>
  </div>
  <svg class="settings-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2">
    <path d="M9 18l6-6-6-6"/>
  </svg>
</div>
```

```css
.settings-menu-item {
  display: flex; align-items: center; gap: 12px;
  background: var(--bg-secondary); border-radius: var(--radius-lg);
  padding: 14px 16px; border: 1px solid var(--border-light);
  cursor: pointer;
}
.settings-icon {
  width: 40px; height: 40px; border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.settings-info { flex: 1; }
.settings-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.settings-subtitle { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.settings-chevron { flex-shrink: 0; }
```

### Settings Icon Colors by Section

| Section | Icon BG | Icon Stroke |
|---------|---------|-------------|
| Perfil | var(--primary-light) | var(--primary) |
| Preferencias | #e0e7ff | #6366f1 |
| Escaneo | #dbeafe | #3b82f6 |
| Suscripción | #dcfce7 | #22c55e |
| Datos Aprendidos | #fef3c7 | #f59e0b |
| App | #f3e8ff | #a855f7 |
| Datos y Cuenta | #fce7f3 | #ec4899 |

---

### Toggle Switch

On/off control for boolean settings.

```html
<!-- Toggle ON -->
<div class="toggle-switch on">
  <div class="toggle-thumb"></div>
</div>

<!-- Toggle OFF -->
<div class="toggle-switch off">
  <div class="toggle-thumb"></div>
</div>
```

```css
.toggle-switch {
  width: 48px; height: 28px; border-radius: 14px;
  position: relative; cursor: pointer;
  transition: background var(--transition-fast);
}
.toggle-switch.on { background: var(--primary); }
.toggle-switch.off {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
}
.toggle-thumb {
  width: 22px; height: 22px; background: white;
  border-radius: 50%; position: absolute; top: 3px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: left var(--transition-fast), right var(--transition-fast);
}
.toggle-switch.on .toggle-thumb { right: 3px; left: auto; }
.toggle-switch.off .toggle-thumb { left: 3px; right: auto; }
```

---

### Segmented Control (Selector Pills)

Two or more options, one active at a time. Used for language, date format, theme mode.

```html
<div class="segmented-control">
  <button class="segment">EN</button>
  <button class="segment active">ES</button>
</div>
```

```css
.segmented-control {
  display: flex; background: var(--bg-tertiary);
  border-radius: var(--radius-md); padding: 3px;
  border: 1px solid var(--border-light);
}
.segment {
  padding: 6px 14px; font-size: 13px; font-weight: 500;
  border: none; border-radius: var(--radius-sm);
  background: transparent; color: var(--text-secondary);
  cursor: pointer; font-family: inherit;
}
.segment.active {
  background: var(--primary); color: white; font-weight: 600;
}
```

---

### Settings Row with Toggle

Full-width setting row with icon, label, description, and toggle switch.

```html
<div class="settings-row">
  <div class="settings-row-left">
    <svg class="settings-row-icon" width="20" height="20"><!-- icon --></svg>
    <div class="settings-row-text">
      <span class="settings-row-label">Auto-detectar Moneda</span>
      <span class="settings-row-desc">Detectar moneda desde el texto de la boleta</span>
    </div>
  </div>
  <div class="toggle-switch on">
    <div class="toggle-thumb"></div>
  </div>
</div>
```

```css
.settings-row {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--bg-secondary); border-radius: var(--radius-lg);
  padding: 14px 16px; border: 1px solid var(--border-light);
}
.settings-row-left { display: flex; align-items: center; gap: 10px; }
.settings-row-icon { stroke: var(--text-secondary); fill: none; stroke-width: 2; }
.settings-row-label { font-size: 14px; font-weight: 500; color: var(--text-primary); display: block; }
.settings-row-desc { font-size: 11px; color: var(--text-secondary); margin-top: 2px; display: block; }
```

---

### Select Dropdown (Overlapping Label)

Native select styled with floating label above border.

```html
<div class="select-field">
  <label class="select-label">Moneda por Defecto</label>
  <select class="select-input">
    <option selected>CLP - Peso Chileno</option>
    <option>USD - Dólar Estadounidense</option>
  </select>
</div>
```

```css
.select-field { position: relative; }
.select-label {
  position: absolute; top: -8px; left: 10px;
  background: var(--bg-primary); padding: 0 4px;
  font-size: 11px; color: var(--primary); font-weight: 500; z-index: 1;
}
.select-input {
  width: 100%; height: 44px; padding: 0 32px 0 12px;
  border: 1px solid var(--border-medium); border-radius: var(--radius-md);
  font-size: 14px; background: var(--bg-secondary); color: var(--text-primary);
  cursor: pointer; appearance: none;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%236b7280" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>');
  background-repeat: no-repeat; background-position: right 12px center;
}
```

---

### Back Header (Subsection Navigation)

Used on settings subsections with back arrow and title.

```html
<div class="back-header">
  <svg class="back-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" stroke-width="2">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
  <h2 class="back-title">Preferencias</h2>
</div>
```

```css
.back-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.back-arrow { cursor: pointer; }
.back-title { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0; }
```

---

## Phone Frame & Global Controls

### Phone Frame (Mockup Container)

```css
.page-wrapper {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; padding: 20px;
}
.phone-frame {
  width: 375px; min-height: 812px;
  background: #1e293b; border-radius: 54px; padding: 14px;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25),
    inset 0 0 0 2px #334155, inset 0 0 0 4px #475569;
}
.phone-screen {
  width: 100%; height: 784px;
  background: var(--bg-primary); border-radius: 44px;
  overflow: hidden; display: flex; flex-direction: column;
}
```

### Status Bar

```html
<div class="status-bar">
  <span class="status-time">9:41</span>
  <div class="status-icons">
    <svg width="16" height="16"><!-- signal --></svg>
    <svg width="16" height="16"><!-- wifi --></svg>
    <svg width="24" height="12"><!-- battery --></svg>
  </div>
</div>
```

```css
.status-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 24px 8px; background: var(--bg-primary);
}
.status-time { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.status-icons { display: flex; gap: 4px; align-items: center; }
```

---

### Global Controls Panel (Theme & Font Switcher)

Dark panel below phone frame for testing theme and font variations.

```html
<div class="global-controls">
  <div class="control-group">
    <div class="control-label">Theme</div>
    <div class="control-options">
      <div class="theme-swatch" data-theme="professional" title="Professional Blue"></div>
      <div class="theme-swatch active" data-theme="mono" title="Mono"></div>
      <div class="theme-swatch" data-theme="ninokuni" title="Ni No Kuni"></div>
    </div>
  </div>
  <div class="control-group">
    <div class="control-label">Font</div>
    <div class="control-options">
      <div class="font-pill active" data-font="outfit">Outfit</div>
      <div class="font-pill" data-font="space">Space</div>
    </div>
  </div>
</div>
```

```css
.global-controls {
  background: rgba(30, 41, 59, 0.95); backdrop-filter: blur(8px);
  border-radius: 12px; padding: 12px 20px;
  display: flex; gap: 24px; border: 1px solid rgba(255,255,255,0.1);
  align-items: center; flex-wrap: wrap; justify-content: center;
}
.control-group { display: flex; align-items: center; gap: 10px; }
.control-label {
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.05em; color: #94a3b8; white-space: nowrap;
}
.control-options { display: flex; gap: 6px; flex-wrap: wrap; }

/* Theme Swatches */
.theme-swatch {
  width: 28px; height: 28px; border-radius: 8px;
  cursor: pointer; border: 2px solid transparent;
  transition: all 150ms ease;
}
.theme-swatch:hover { transform: scale(1.1); }
.theme-swatch.active {
  border-color: white;
  box-shadow: 0 0 0 2px rgba(255,255,255,0.3);
}
.theme-swatch[data-theme="professional"] { background: linear-gradient(135deg, #2563eb 50%, #64748b 50%); }
.theme-swatch[data-theme="mono"] { background: linear-gradient(135deg, #18181b 50%, #52525b 50%); }
.theme-swatch[data-theme="ninokuni"] { background: linear-gradient(135deg, #4a7c59 50%, #5b8fa8 50%); }

/* Font Pills */
.font-pill {
  padding: 4px 10px; border-radius: 9999px;
  font-size: 11px; font-weight: 500; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.2);
  background: transparent; color: #94a3b8;
  transition: all 150ms ease;
}
.font-pill:hover { background: rgba(255,255,255,0.1); }
.font-pill.active {
  background: white; color: #0f172a; border-color: white;
}
```

```javascript
// Theme Switcher
function setTheme(theme, el) {
  document.body.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
}

// Font Switcher
function setFont(font, el) {
  document.body.setAttribute('data-font', font);
  document.querySelectorAll('.font-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
}
```

---

## Quick Reference

- **Primary Color**: var(--primary) = #2563eb (Professional theme)
- **Background**: var(--bg-primary) = #f8fafc
- **Card Radius**: var(--radius-lg) = 12px
- **Standard Padding**: var(--space-4) = 16px
- **Nav Icon Size**: 24x24px
- **Scan Button Size**: 52x52px
- **Font**: Outfit (default), Space Grotesk (alt)
- **CLP Format**: Dot separator ($45.200, NOT $45,200)
