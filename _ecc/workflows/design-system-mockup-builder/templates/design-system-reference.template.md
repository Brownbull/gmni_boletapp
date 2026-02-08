# Gastify Design System Reference
<!-- Generated from design-system-final.html -->
<!-- Size target: <4000 tokens -->
<!-- Generated: {date} -->

## Design Tokens

### Colors (Use Variable Names)
| Category | Variables |
|----------|-----------|
| Primary | --primary, --primary-light, --primary-dark, --primary-hover |
| Background | --bg-primary, --bg-secondary, --bg-tertiary |
| Text | --text-primary, --text-secondary, --text-tertiary |
| Border | --border-light, --border-medium |
| Status | --success, --warning, --error |

### Spacing
```
--space-1 (4px), --space-2 (8px), --space-3 (12px), --space-4 (16px), --space-5 (20px)
--space-6 (24px), --space-7 (28px), --space-8 (32px), --space-9 (36px), --space-10 (40px)
```

### Border Radii
```
--radius-sm (4px), --radius-md (8px), --radius-lg (12px)
--radius-xl (16px), --radius-2xl (20px), --radius-full (9999px)
```

### Shadows
```
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl
```

### Typography
- Body: `'Outfit', sans-serif` (var(--font-family))
- Logo: `'Baloo 2', sans-serif`

---

## Navigation Components

### Bottom Navigation
**Labels:** Inicio | Analíticas | [Camera] | Ideas | Ajustes
**Center Position:** margin-top: -56px (NOT -32px)

<details>
<summary>HTML (copy-paste)</summary>

```html
<div class="bottom-nav">
    <div class="nav-item">
        <svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        <span>Inicio</span>
    </div>
    <div class="nav-item active">
        <svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        <span>Analíticas</span>
    </div>
    <div class="nav-item scan-center">
        <button class="scan-btn">
            <svg viewBox="0 0 24 24">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
            </svg>
        </button>
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

</details>

<details>
<summary>CSS (copy-paste)</summary>

```css
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: var(--bg-primary);
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 0 var(--space-4);
    border-top: 1px solid var(--border-light);
}

.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    color: var(--text-tertiary);
    cursor: pointer;
    transition: color 0.2s;
}

.nav-item svg {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.nav-item span {
    font-size: 10px;
    font-weight: 500;
}

.nav-item.active {
    color: var(--primary);
}

.scan-center {
    margin-top: -56px;
}

.scan-btn {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-full);
    background: var(--primary);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: var(--shadow-lg);
}

.scan-btn svg {
    width: 28px;
    height: 28px;
    stroke: white;
}
```

</details>

### Top Bar
**Structure:** G Logo (left) | Gastify (center) | Menu (right)

<details>
<summary>HTML (copy-paste)</summary>

```html
<div class="top-bar">
    <div class="top-bar-logo"><span>G</span></div>
    <span class="top-bar-title">Gastify</span>
    <button class="top-bar-menu">
        <svg viewBox="0 0 24 24">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
    </button>
</div>
```

</details>

<details>
<summary>CSS (copy-paste)</summary>

```css
.top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px var(--space-4);
    background: var(--bg-primary);
}

.top-bar-logo {
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
}

.top-bar-logo span {
    font-family: 'Baloo 2', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: white;
}

.top-bar-title {
    font-family: 'Baloo 2', sans-serif;
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
}

.top-bar-menu {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-lg);
    background: var(--bg-secondary);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.top-bar-menu svg {
    width: 20px;
    height: 20px;
    stroke: var(--text-secondary);
    stroke-width: 2;
    stroke-linecap: round;
}
```

</details>

---

## Canonical Icons

| Function | SVG Path |
|----------|----------|
| Inicio (house) | `m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z` |
| Analíticas (chart) | `M3 3v18h18` + `m19 9-5 5-4-4-3 3` |
| **Camera (CENTER)** | `M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z` + `circle cx=12 cy=13 r=3` |
| Ideas (lightbulb) | `M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707...` |
| Ajustes (sun) | `circle cx=12 cy=12 r=3` + `M12 1v2m0 18v2m11-11h-2M3 12H1...` |
| Menu (hamburger) | `line x1=3 y1=6 x2=21 y2=6` (×3 at y=6,12,18) |

---

## Prescriptive Validation Rules

### MUST Use
- CSS variables for ALL colors: `var(--name)`
- Spanish labels: Inicio, Analíticas, Ideas, Ajustes
- Camera icon for center button
- margin-top: -56px for .scan-center

### MUST NOT Use
- Hardcoded hex colors (#0d9488, #f8fafc, etc.)
- English labels (Home, Analytics, History, Settings)
- Scan/barcode icon for center
- margin-top: -32px for scan-center

---

## Quick Reference

### Color Usage
```css
/* CORRECT */
color: var(--primary);
background: var(--bg-secondary);

/* FORBIDDEN */
color: #0d9488;
background: #f8fafc;
```

### Nav Labels (Spanish Only)
```
Inicio | Analíticas | [Camera] | Ideas | Ajustes
```

### Camera Icon (Not Scan)
```svg
<svg viewBox="0 0 24 24">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
</svg>
```
