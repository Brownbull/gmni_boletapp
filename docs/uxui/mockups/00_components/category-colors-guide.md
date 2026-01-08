# Category Colors API Guide

> Reference guide for the unified category color system in BoletApp.
> Use this document to determine which color function to call for different UI scenarios.

## Quick Reference: Which Function to Use?

| Scenario | Function | Notes |
|----------|----------|-------|
| Category pills/badges | `getCategoryPillColors(category)` | Always colorful |
| Chart legends | `getCategoryPillColors(category)` | Always colorful |
| Bump chart colors | `getCategoryPillColors(category)` | Always colorful |
| Merchant name text | `getCategoryColorsAuto(category)` | Respects fontColorMode |
| Treemap cell text | `getCategoryColorsAuto(category)` | Respects fontColorMode |
| General category text | `getCategoryColorsAuto(category)` | Respects fontColorMode |
| Background only | `getCategoryBackgroundAuto(category)` | Returns bg string |
| Foreground only (pill) | `getCategoryPillFgAuto(category)` | Always colorful fg |
| Store group header | `getStoreGroupColors(groupKey)` | Includes border |
| Item group header | `getItemGroupColors(groupKey)` | Includes border |

## Core Concept: Font Color Mode

The system supports two font color modes (set in user settings):

- **`colorful`** (default): Category text uses the category's foreground color
- **`plain`**: Category text uses standard black/white based on light/dark mode

**Important Rule**: Pills, badges, and legends should ALWAYS be colorful regardless of fontColorMode. Only general text (merchant names, labels) respects the fontColorMode setting.

## API Functions

### For Pills, Badges, and Legends (Always Colorful)

```typescript
import { getCategoryPillColors, getCategoryPillFgAuto } from '../config/categoryColors';

// Get both fg and bg colors for a pill
const colors = getCategoryPillColors(category);
// Returns: { fg: '#colorcode', bg: '#colorcode' }

// Usage in JSX:
<span style={{
  backgroundColor: getCategoryPillColors(category).bg,
  color: getCategoryPillColors(category).fg,
}}>
  {category}
</span>

// Get only fg color for a pill
const fgColor = getCategoryPillFgAuto(category);
```

### For General Text (Respects fontColorMode)

```typescript
import { getCategoryColorsAuto, getCategoryBackgroundAuto } from '../config/categoryColors';

// Get colors that respect fontColorMode setting
const colors = getCategoryColorsAuto(category);
// Returns: { fg: '#colorcode', bg: '#colorcode' }
// Note: In 'plain' mode, fg will be black/white based on theme

// Usage for merchant name:
<span style={{ color: getCategoryColorsAuto(category).fg }}>
  {merchantName}
</span>

// Get only background color
const bgColor = getCategoryBackgroundAuto(category);
```

### For Category Groups

```typescript
import {
  getStoreCategoryGroup,
  getItemCategoryGroup,
  getStoreGroupColors,
  getItemGroupColors
} from '../config/categoryColors';

// Get which group a store category belongs to
const groupKey = getStoreCategoryGroup('Supermarket');
// Returns: 'food-dining'

// Get which group an item category belongs to
const itemGroupKey = getItemCategoryGroup('Produce');
// Returns: 'food-fresh'

// Get colors for a store group header/divider
const groupColors = getStoreGroupColors('food-dining');
// Returns: { fg: '#...', bg: '#...', border: '#...' }

// Get colors for an item group header/divider
const itemGroupColors = getItemGroupColors('food-fresh');
// Returns: { fg: '#...', bg: '#...', border: '#...' }
```

### Low-Level Functions (Advanced)

```typescript
import {
  getCategoryColors,
  getCurrentTheme,
  getCurrentMode
} from '../config/categoryColors';

// Get colors with explicit theme and mode
const colors = getCategoryColors(category, 'normal', 'light');
// theme: 'normal' | 'professional' | 'mono'
// mode: 'light' | 'dark'
```

## Store Categories

| Category | Key | Group |
|----------|-----|-------|
| Supermarket | `Supermarket` | food-dining |
| Restaurant | `Restaurant` | food-dining |
| Café | `Café` | food-dining |
| Pharmacy | `Pharmacy` | health-wellness |
| Healthcare | `Healthcare` | health-wellness |
| Gas Station | `Gas Station` | automotive |
| Department Store | `Department Store` | retail-general |
| Convenience Store | `Convenience Store` | retail-general |
| Electronics | `Electronics` | retail-specialty |
| Home Improvement | `Home Improvement` | retail-specialty |
| Clothing | `Clothing` | retail-specialty |
| Entertainment | `Entertainment` | hospitality |
| Travel | `Travel` | hospitality |
| Services | `Services` | services |
| Utilities | `Utilities` | services |
| Other | `Other` | other |

## Store Category Groups

| Group Key | Display Name | Description |
|-----------|--------------|-------------|
| `food-dining` | Food & Dining | Supermarkets, restaurants, cafés |
| `health-wellness` | Health & Wellness | Pharmacies, healthcare |
| `retail-general` | General Retail | Department stores, convenience |
| `retail-specialty` | Specialty Retail | Electronics, home, clothing |
| `automotive` | Automotive | Gas stations, auto services |
| `services` | Services | Utilities, professional services |
| `hospitality` | Hospitality | Entertainment, travel |
| `other` | Other | Uncategorized stores |

## Item Categories

| Category | Key | Group |
|----------|-----|-------|
| Produce | `Produce` | food-fresh |
| Meat & Seafood | `Meat & Seafood` | food-fresh |
| Dairy | `Dairy` | food-fresh |
| Bakery | `Bakery` | food-fresh |
| Beverages | `Beverages` | food-packaged |
| Snacks | `Snacks` | food-packaged |
| Pantry | `Pantry` | food-packaged |
| Frozen | `Frozen` | food-packaged |
| Health & Beauty | `Health & Beauty` | health-personal |
| Personal Care | `Personal Care` | health-personal |
| Household | `Household` | household |
| Cleaning | `Cleaning` | household |
| Pet Supplies | `Pet Supplies` | household |
| Electronics | `Electronics` | nonfood-retail |
| Clothing | `Clothing` | nonfood-retail |
| Home & Garden | `Home & Garden` | nonfood-retail |
| Services | `Services` | services-fees |
| Fees & Charges | `Fees & Charges` | services-fees |
| Other | `Other` | other-item |

## Item Category Groups

| Group Key | Display Name | Description |
|-----------|--------------|-------------|
| `food-fresh` | Fresh Food | Produce, meat, dairy, bakery |
| `food-packaged` | Packaged Food | Beverages, snacks, pantry, frozen |
| `health-personal` | Health & Personal | Health, beauty, personal care |
| `household` | Household | Cleaning, pet supplies |
| `nonfood-retail` | Non-Food Retail | Electronics, clothing, home |
| `services-fees` | Services & Fees | Services, fees, charges |
| `other-item` | Other | Uncategorized items |

## Code Examples

### CategoryBadge Component

```tsx
import { getCategoryPillColors } from '../config/categoryColors';

const CategoryBadge = ({ category }) => (
  <span style={{
    backgroundColor: getCategoryPillColors(category).bg,
    color: getCategoryPillColors(category).fg,
  }}>
    {category}
  </span>
);
```

### Transaction Card with Merchant Name

```tsx
import { getCategoryColorsAuto } from '../config/categoryColors';

const TransactionCard = ({ merchant, category }) => (
  <div>
    <span style={{ color: getCategoryColorsAuto(category).fg }}>
      {merchant}
    </span>
  </div>
);
```

### Chart Legend

```tsx
import { getCategoryPillColors } from '../config/categoryColors';

const ChartLegend = ({ categories }) => (
  <div>
    {categories.map(cat => (
      <span key={cat} style={{
        backgroundColor: getCategoryPillColors(cat).bg,
        color: getCategoryPillColors(cat).fg,
      }}>
        {cat}
      </span>
    ))}
  </div>
);
```

### Grouped Transaction List

```tsx
import {
  getStoreCategoryGroup,
  getStoreGroupColors
} from '../config/categoryColors';

const GroupedList = ({ transactions }) => {
  const grouped = groupBy(transactions, t => getStoreCategoryGroup(t.category));

  return Object.entries(grouped).map(([groupKey, items]) => {
    const groupColors = getStoreGroupColors(groupKey);
    return (
      <div key={groupKey}>
        <div style={{
          backgroundColor: groupColors.bg,
          color: groupColors.fg,
          borderColor: groupColors.border,
        }}>
          {groupKey}
        </div>
        {items.map(item => /* render item */)}
      </div>
    );
  });
};
```

## Color Themes

The system supports three color themes:

| Theme | Key | Description |
|-------|-----|-------------|
| Normal | `normal` | Warm, vibrant colors (formerly "ghibli") |
| Professional | `professional` | Cool, muted colors |
| Mono | `mono` | Monochrome/grayscale (default) |

Theme is set in user settings as `colorTheme` and affects the color palettes used by all functions.

## Related Files

- `src/config/categoryColors.ts` - Core color system implementation
- `src/types/settings.ts` - Type definitions (ColorTheme, FontColorMode)
- `src/components/CategoryBadge.tsx` - Example component using pills API
- `docs/uxui/category-color-consolidation.md` - Design decisions and rationale
