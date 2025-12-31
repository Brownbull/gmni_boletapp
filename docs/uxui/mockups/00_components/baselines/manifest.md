# Component Baselines Manifest

Generated: 2025-12-28
Source: design-system-final.html

## Captured Components

### Overview (1)
- [x] baseline-overview.png - Full design system overview

### Navigation (2)
- [x] baseline-navigation.png - Bottom navigation variants
- [x] baseline-scan-center.png - Center scan button with -56px offset

### Transactions (1)
- [x] baseline-transactions.png - Expandable transaction items

### Components (1)
- [x] baseline-components.png - Buttons, icons, cards

### Scan/Forms (1)
- [x] baseline-scan-forms.png - Scan overlay and form elements

### Analytics (1)
- [x] baseline-analytics.png - Charts and data visualizations

### Insights (1)
- [x] baseline-insights.png - Insight cards and summaries

### Settings (1)
- [x] baseline-settings.png - Settings screen components

### Design Tokens (1)
- [x] baseline-design-tokens.png - Color palette and typography

## Validation Thresholds

- **Pass:** <10% pixel difference
- **Warn:** 10-30% pixel difference
- **Fail:** >30% pixel difference

## Prescriptive Elements Verified

### Spanish Navigation Labels
- Inicio (Home)
- Analíticas (Analytics)
- [Camera Icon] (Center)
- Ideas (Insights)
- Ajustes (Settings)

### Camera Icon (NOT Scan)
```svg
<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
<circle cx="12" cy="13" r="3"/>
```

### Scan Center Position
```css
.scan-center { margin-top: -56px; }
```

## Usage

These baselines are used by step-11-visual-validation.md
to compare built mockups against source components.
