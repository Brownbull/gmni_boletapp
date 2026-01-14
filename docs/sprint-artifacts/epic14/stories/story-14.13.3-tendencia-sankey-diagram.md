# Story 14.13.3: Tendencia Sankey Diagram

**Status:** review
**Points:** 8
**Epic:** 14 - Core Implementation
**Dependencies:** Story 14.13.2 (Tendencia Slide Redesign - complete)
**ECharts Reference:** https://echarts.apache.org/examples/en/index.html#chart-type-sankey
**Created:** 2026-01-11

---

## Story

**As a** user viewing my spending analytics in the "Explora" view,
**I want to** toggle to a Sankey flow diagram on the Tendencia slide,
**So that** I can visualize how my spending flows from store types to item types in a hierarchical manner.

---

## Context

The Tendencia slide currently has:
- **Primary View (List)**: Sparkline cards with period-over-period comparison (implemented in Story 14.13.2)
- **Alternate View (Breakdown)**: Horizontal bar chart showing percentage breakdown

This story adds a **Sankey Diagram** as a new alternate view, replacing or augmenting the breakdown view. The Sankey shows money flow across 4 levels of the category hierarchy.

### Why Sankey?

A Sankey diagram excels at showing:
1. **Flow relationships** - How spending at store types translates to item types
2. **Proportional magnitude** - Width of flow lines shows relative amounts
3. **Multi-level hierarchy** - 4 levels visible simultaneously
4. **Cross-cutting patterns** - Same item category can come from multiple store types

### Hierarchy Modes

**Default: 2-Level Mode** (simpler, more readable)
```
Store Categories (e.g., "Supermercado", "Restaurante", "Farmacia")
    ↓
Item Categories (e.g., "Carnes", "Lácteos", "Bebidas", "Medicamentos")
```

**Extended: 4-Level Mode** (full hierarchy, optional)
```
Level 1: Store Category Groups (e.g., "Food & Dining", "Transportation")
    ↓
Level 2: Store Categories (e.g., "Supermercado", "Restaurante")
    ↓
Level 3: Item Category Groups (e.g., "Fresh Food", "Packaged Food")
    ↓
Level 4: Item Categories (e.g., "Carnes", "Lácteos", "Bebidas")
```

The existing view mode selector can control which hierarchy is shown:
- `store-categories` → 2-level: Store Categories → Item Categories
- `store-groups` → 4-level: Store Groups → Store Cats → Item Groups → Item Cats
- `item-categories` → 2-level: Store Categories → Item Categories (same as default)
- `item-groups` → 3-level: Store Categories → Item Groups → Item Categories

### Current Toggle State

The view toggle button (`tendenciaView`) currently switches between:
- `'list'` - Sparkline cards (default)
- `'breakdown'` - Horizontal bar chart

This story will change it to:
- `'list'` - Sparkline cards (default)
- `'sankey'` - Sankey flow diagram

---

## Acceptance Criteria

### AC #1: ECharts Integration
- [ ] Install `echarts` and `echarts-for-react` packages
- [ ] Configure ECharts for tree-shaking (only include sankey module)
- [ ] Verify bundle size impact is acceptable (<50KB gzipped for sankey module)

### AC #2: Sankey Data Generation
- [ ] Build 4-level hierarchy from transaction data
- [ ] Calculate flow values between each level based on spending amounts
- [ ] Handle transactions with missing category mappings gracefully
- [ ] Generate unique node names to avoid collisions (e.g., prefix with level)

### AC #3: 10% Threshold + "Más" Aggregation
- [ ] Apply same 10% threshold as TreeMap/DonutChart
- [ ] Show categories with ≥10% of total at each level
- [ ] Show one additional category with highest % below 10%
- [ ] Aggregate remaining into "Más" group at each level
- [ ] "Más" node shows count badge with number of hidden categories

### AC #4: Expand/Collapse Functionality
- [ ] Plus button (+) expands "Más" to show hidden categories
- [ ] Minus button (-) collapses back to aggregated view
- [ ] Button position matches TreeMap/Sparkline expand buttons (left side)
- [ ] State tracks expansion per level independently
- [ ] Badge shows count of hidden/expanded categories

### AC #5: Visual Styling
- [ ] Vertical orientation (top to bottom flow)
- [ ] Node colors match category colors from TreeMap/DonutChart
- [ ] Flow line colors inherit from source node
- [ ] Curved flow lines (curveness: 0.5)
- [ ] Node labels positioned appropriately (top/bottom based on level)
- [ ] Responsive sizing to fit card container

### AC #6: Interactivity
- [ ] Hover on node shows tooltip with:
  - Category name (translated)
  - Spending amount (formatted with currency)
  - Percentage of total
  - Transaction count
- [ ] Hover on flow link shows:
  - Source → Target relationship
  - Flow amount
- [ ] Tap on node navigates to History view with appropriate filters

### AC #7: View Toggle Integration
- [ ] Toggle button switches between List and Sankey views
- [ ] Button icon: list icon when on Sankey, flow/sankey icon when on List
- [ ] Smooth fade transition between views
- [ ] State persists during session (sessionStorage)

### AC #8: Theme Support
- [ ] Works with both light and dark themes
- [ ] Node colors maintain contrast in both themes
- [ ] Flow lines have appropriate opacity for theme
- [ ] Labels use theme text colors

---

## Tasks

### Phase 1: ECharts Setup
- [x] Task 1.1: Install `echarts` and `echarts-for-react` packages
- [x] Task 1.2: Create tree-shaking configuration for minimal bundle
- [x] Task 1.3: Create `SankeyChart` component wrapper
- [x] Task 1.4: Verify chart renders in TrendsView container

### Phase 2: Data Layer
- [x] Task 2.1: Create `buildSankeyData()` utility function
- [x] Task 2.2: Generate nodes for all 4 levels from transactions
- [x] Task 2.3: Calculate links (flow values) between levels
- [x] Task 2.4: Apply 10% threshold at each level
- [x] Task 2.5: Create "Más" aggregation nodes per level
- [x] Task 2.6: Handle edge cases (empty data, single category, etc.)

### Phase 3: UI Integration
- [x] Task 3.1: Add Sankey to TrendsView carousel slide
- [x] Task 3.2: Update `tendenciaView` toggle to switch to Sankey
- [ ] Task 3.3: Position expand/collapse buttons (deferred - basic view first)
- [x] Task 3.4: Add navigation handler for node clicks
- [x] Task 3.5: Style tooltips to match app design

### Phase 4: Polish & Testing
- [x] Task 4.1: Add theme support (light/dark)
- [x] Task 4.2: Add responsive sizing
- [x] Task 4.3: Add unit tests for `buildSankeyData()` - 29 tests passing
- [ ] Task 4.4: Add integration tests for Sankey rendering (deferred)
- [ ] Task 4.5: Test with various data scenarios (manual testing needed)

---

## Technical Design

### Package Installation

```bash
npm install echarts echarts-for-react
```

### Tree-Shaking Configuration

```typescript
// src/components/analytics/SankeyChart.tsx
import * as echarts from 'echarts/core';
import { SankeyChart as EChartsSankey } from 'echarts/charts';
import { TooltipComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import ReactEChartsCore from 'echarts-for-react/lib/core';

// Register only needed components
echarts.use([EChartsSankey, TooltipComponent, GridComponent, CanvasRenderer]);
```

### Sankey Data Builder

```typescript
interface SankeyNode {
    name: string;
    itemStyle: { color: string };
    // Custom properties for our use
    level: number;
    originalName: string;
    value: number;
    count: number;
    categoryCount?: number; // For "Más" nodes
}

interface SankeyLink {
    source: string;
    target: string;
    value: number;
}

interface SankeyData {
    nodes: SankeyNode[];
    links: SankeyLink[];
}

function buildSankeyData(
    transactions: Transaction[],
    expandedCounts: { level1: number; level2: number; level3: number; level4: number }
): SankeyData {
    // 1. Aggregate transactions by all 4 category levels
    // 2. Apply 10% threshold at each level
    // 3. Create "Más" aggregation nodes
    // 4. Generate unique node names (prefix with level)
    // 5. Calculate links between adjacent levels
    // 6. Apply expansion state

    return { nodes, links };
}
```

### Node Naming Strategy

To avoid collisions (e.g., a store category and item category with same name), prefix with level:

```typescript
const nodeName = (level: number, name: string) => `L${level}_${name}`;
// Examples:
// "L1_Food & Dining" (Store Group)
// "L2_Supermercado" (Store Category)
// "L3_Fresh Food" (Item Group)
// "L4_Carnes" (Item Category)
```

Labels strip the prefix for display.

### ECharts Option Structure

```typescript
const option: EChartsOption = {
    tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: (params) => {
            // Custom tooltip formatting
        }
    },
    series: [{
        type: 'sankey',
        orient: 'vertical',
        top: '5%',
        bottom: '5%',
        left: '10%',
        right: '10%',
        nodeWidth: 20,
        nodeGap: 8,
        layoutIterations: 32,
        emphasis: {
            focus: 'adjacency'
        },
        data: nodes,
        links: links,
        label: {
            position: 'top',
            formatter: (params) => {
                // Strip level prefix, translate name
                return translateCategory(params.name.replace(/^L\d_/, ''), locale);
            }
        },
        lineStyle: {
            color: 'source',
            curveness: 0.5,
            opacity: 0.4
        }
    }]
};
```

### Flow Calculation Logic

```typescript
// For each transaction, trace the flow:
// storeGroup → storeCategory → itemGroup → itemCategory

transactions.forEach(tx => {
    const storeGroup = STORE_CATEGORY_GROUPS[tx.storeCategory];
    const storeCategory = tx.storeCategory;

    tx.items.forEach(item => {
        const itemCategory = item.category;
        const itemGroup = ITEM_CATEGORY_GROUPS[itemCategory];
        const amount = item.total;

        // Add to flow aggregations:
        // storeGroup → storeCategory: amount
        // storeCategory → itemGroup: amount
        // itemGroup → itemCategory: amount
    });
});
```

---

## File List

**New Files:**
- `src/components/analytics/SankeyChart.tsx` - ECharts Sankey wrapper component
- `src/utils/sankeyDataBuilder.ts` - Data transformation utilities
- `tests/unit/utils/sankeyDataBuilder.test.ts` - Unit tests

**Modified Files:**
- `src/views/TrendsView.tsx` - Integrate Sankey into Tendencia slide
- `package.json` - Add echarts dependencies

---

## Edge Cases

1. **No transactions**: Show empty state message
2. **Single store category**: Show single node at level 2, flows to item levels
3. **Missing item categories**: Skip items without category in flow calculation
4. **All categories below 10%**: Show top 5 + "Más" with rest
5. **Transactions without items**: Exclude from Sankey (item-level flow required)

---

## Test Plan

### Unit Tests
1. `buildSankeyData()` generates correct nodes for sample transactions
2. `buildSankeyData()` calculates correct flow values
3. 10% threshold correctly filters categories
4. "Más" aggregation includes correct categories
5. Expansion state shows/hides categories correctly
6. Node names are unique across levels

### Integration Tests
1. Sankey renders in TrendsView when toggled
2. Toggle button switches between List and Sankey
3. Clicking node navigates to History with filters
4. Tooltips show correct information
5. Theme switching updates colors correctly

### Manual Testing
1. Verify visual appearance matches ECharts examples
2. Test with real transaction data (various volumes)
3. Test expand/collapse at each level
4. Test on mobile viewport (touch interactions)
5. Verify performance with large datasets (100+ transactions)

---

## Resolved Questions

1. **Level count**: ✅ Yes, support 2-level mode (Store Categories → Item Categories) for simpler visualization
   - Default: 2-level mode (cleaner, more readable)
   - The view mode selector already exists - can map to Sankey levels

2. **Click behavior**: ✅ Navigate to History view (not drill-down within Sankey)
   - Sankey is a static visualization showing the full flow
   - Clicking a node filters History to that category
   - Simpler implementation, consistent with other chart click behaviors

3. **Animation**: ✅ Yes, animate flows from top to bottom on load
   - Flows should "unfurl" from top to bottom
   - Creates visual interest and guides the eye through the hierarchy
   - Use ECharts animation options for smooth entrance

4. **Mobile viewport**: ✅ Show Sankey on all viewports (this is a mobile-first PWA)
   - The app is primarily used on mobile devices
   - Sankey must be readable and touch-friendly on small screens
   - Consider: larger touch targets, simplified labels, horizontal scroll if needed

---

## Phase 5: Icon-Based Enhancement (2026-01-11)

### Overview

Enhancement to replace text labels with icon nodes featuring progress-ring borders, dynamic titles, and simplified 3-level hierarchy modes.

### Design Decisions (Confirmed)

| Feature | Decision | Rationale |
|---------|----------|-----------|
| **Border Style** | Radial progress border (conic-gradient) | Matches radar diagram pattern - 100% = full circle, 50% = half circle from 12:00 |
| **Title Behavior** | Shows clicked category name dynamically | Simple, focused interaction |
| **Click Behavior** | Updates title only - NO navigation | Self-contained exploration view |
| **Icon Source** | `getCategoryEmoji()` function | Reuse existing category emoji system |
| **View Modes** | Reduce to 2 icons (from 4) | Simplified UX for Sankey-specific hierarchy |

### New Acceptance Criteria

#### AC #9: Dynamic Title
- [x] Title displays above Sankey diagram
- [x] Default title: "Flujo de Gastos" / "Spending Flow"
- [x] On node click: Shows clicked category name (translated) + percentage
- [x] Title resets to default after 3 seconds of no interaction

#### AC #10: Icon Nodes with Progress-Ring Borders
- [ ] Replace text labels with circular icon nodes
- [ ] Each node displays category emoji from `getCategoryEmoji()`
- [ ] Background color matches category color
- [ ] Border shows percentage as radial progress:
  - 100% = complete circle border
  - 50% = half circle (12:00 to 6:00)
  - 25% = quarter circle (12:00 to 3:00)
- [ ] Border color slightly darker than background
- [ ] Icon size: 32px diameter for visibility on mobile

#### AC #11: 3-Level Hierarchy Modes
- [ ] New mode: `3-level-groups` (Store Groups → Store Cats → Item Groups)
- [ ] New mode: `3-level-categories` (Store Cats → Item Groups → Item Cats)
- [ ] Update `SankeyMode` type to include new modes
- [ ] Add `build3LevelGroupsSankey()` function
- [ ] Add `build3LevelCategoriesSankey()` function

#### AC #12: Reduced View Mode Selector (2 icons)
- [ ] Show only 2 icons in Sankey view mode selector
- [ ] Icon 1 (🏪): `3-level-groups` mode - "Grupos → Categorías → Productos"
- [ ] Icon 2 (🛒): `3-level-categories` mode - "Compras → Grupos → Items"
- [ ] Pill selector with sliding indicator (matches existing pattern)

#### AC #13: Click Behavior Change
- [ ] Remove navigation to History/Items view on node click
- [ ] Node click updates title only
- [ ] Flow link click does nothing (hover tooltip only)
- [ ] Remove `onNodeClick` navigation prop usage

### Phase 5 Tasks

#### Task 5.1: Add Dynamic Title Component
- [ ] Create title state in SankeyChart
- [ ] Add title display above chart
- [ ] Implement click handler to update title
- [ ] Add auto-reset timer (3 seconds)

#### Task 5.2: Create SankeyIconNode Component
- [ ] New component: `src/components/analytics/SankeyIconNode.tsx`
- [ ] Implement progress-ring border using conic-gradient
- [ ] Position nodes using calculated coordinates
- [ ] Handle click events for title update

#### Task 5.3: Implement 3-Level Sankey Builders
- [ ] Add `build3LevelGroupsSankey()` to sankeyDataBuilder.ts
- [ ] Add `build3LevelCategoriesSankey()` to sankeyDataBuilder.ts
- [ ] Update `SankeyMode` type
- [ ] Add unit tests for new builders

#### Task 5.4: Hybrid Rendering Approach
- [ ] Use ECharts for flow lines only (hide native nodes)
- [ ] Overlay custom icon nodes as positioned React elements
- [ ] Calculate node positions from ECharts layout
- [ ] Ensure touch targets are accessible (min 44px)

#### Task 5.5: Update View Mode Selector in TrendsView
- [ ] Reduce to 2 icons for Sankey view
- [ ] Map icons to new 3-level modes
- [ ] Update state management for Sankey-specific mode

#### Task 5.6: Remove Navigation Behavior
- [ ] Update SankeyChart to not navigate on click
- [ ] Remove `onNodeClick` navigation logic from TrendsView
- [ ] Update tests to reflect new behavior

### Technical Approach

#### Progress-Ring Border Implementation

```tsx
// SankeyIconNode.tsx
interface SankeyIconNodeProps {
  emoji: string;
  percent: number;  // 0-100
  color: string;
  size?: number;
  onClick?: () => void;
}

function SankeyIconNode({ emoji, percent, color, size = 32, onClick }: SankeyIconNodeProps) {
  // Convert percent to degrees (0-360)
  const degrees = (percent / 100) * 360;

  // Darken color for border
  const borderColor = darkenColor(color, 0.2);

  return (
    <button
      onClick={onClick}
      className="rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(
          ${borderColor} ${degrees}deg,
          transparent ${degrees}deg
        )`,
        padding: '3px', // Border width
      }}
    >
      <div
        className="rounded-full flex items-center justify-center w-full h-full"
        style={{ backgroundColor: color }}
      >
        <span className="text-sm">{emoji}</span>
      </div>
    </button>
  );
}
```

#### Hybrid Chart Structure

```tsx
// SankeyChart.tsx (updated)
<div className="relative">
  {/* Dynamic Title */}
  <div className="text-center font-medium mb-2">
    {selectedTitle || (locale === 'es' ? 'Flujo de Gastos' : 'Spending Flow')}
  </div>

  {/* ECharts for flow lines only */}
  <ReactEChartsCore
    option={flowLinesOnlyOption}
    // Configure to show links, hide native node labels
  />

  {/* Custom icon nodes overlay */}
  <div className="absolute inset-0 pointer-events-none">
    {nodePositions.map(({ node, x, y }) => (
      <div
        key={node.name}
        className="absolute pointer-events-auto"
        style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
      >
        <SankeyIconNode
          emoji={getCategoryEmoji(node.originalName)}
          percent={(node.value / totalValue) * 100}
          color={node.itemStyle.color}
          onClick={() => setSelectedTitle(translateNodeName(node.originalName, node.level, mode, locale))}
        />
      </div>
    ))}
  </div>
</div>
```

### File Changes

**New Files:**
- `src/components/analytics/SankeyIconNode.tsx` - Icon node with progress border

**Modified Files:**
- `src/components/analytics/SankeyChart.tsx` - Hybrid rendering, dynamic title
- `src/utils/sankeyDataBuilder.ts` - 3-level builder functions
- `src/views/TrendsView.tsx` - 2-icon view mode selector, remove navigation
- `tests/unit/utils/sankeyDataBuilder.test.ts` - Tests for 3-level modes

---

## Phase 5.1: Layout & Title Improvements (2026-01-11)

### Issues Addressed (Session 1)

Based on visual review of the current diagram:

1. **Diagram too short** - Nodes appeared compressed vertically
2. **Nodes overlapping** - Category bars were mixed/unclear at each level
3. **Missing percentage in title** - When clicking a category, user couldn't see the % it represents

### Changes Made (Session 1)

| File | Change | Before | After |
|------|--------|--------|-------|
| `SankeyChart.tsx:274` | Default height | 400px | 500px |
| `SankeyChart.tsx:490` | nodeGap | 12 | 20 |
| `SankeyChart.tsx:485-488` | ECharts padding | top:12%/5%, bottom:10% | top:8%/3%, bottom:5%, left/right:8% |
| `SankeyChart.tsx:384-394` | Icon position calc | 10%/15% padding | 8% padding, aligned with ECharts |
| `SankeyChart.tsx:338-339` | Title handler | Name only | Name + percentage |
| `TrendsView.tsx:5213` | Component height | 300px | 500px |

---

### Issues Addressed (Session 2)

Based on screenshot feedback - diagram still had problems:

1. **Icon nodes not appearing** - Categories weren't visible on initial load
2. **Flow lines unclear** - Hard to distinguish between categories (too transparent)
3. **Height too tall** - 500px caused scrolling on 360x780 viewport

### Changes Made (Session 2)

| File | Change | Before | After |
|------|--------|--------|-------|
| `SankeyChart.tsx:274` | Default height | 500px | 380px |
| `SankeyChart.tsx:494` | nodeWidth (icon mode) | 0 | 8 |
| `SankeyChart.tsx:495` | nodeGap | 20 | 12 |
| `SankeyChart.tsx:520` | Node opacity (icon mode) | 0 | 0.9 |
| `SankeyChart.tsx:527` | Line opacity | 0.3/0.4 | 0.5/0.6 |
| `TrendsView.tsx:5213` | Component height | 500px | 380px |

### Technical Details

**Title with Percentage:**
```typescript
const percent = totalValue > 0 ? ((node.value / totalValue) * 100).toFixed(1) : '0';
const titleWithPercent = `${displayName} (${percent}%)`;
```

**Improved Layout Config (Session 2):**
```typescript
series: [{
    nodeWidth: useIconNodes ? 8 : 20,  // Thin bars as flow anchors
    nodeGap: 12,
    lineStyle: {
        opacity: activeMode === 'dark' ? 0.5 : 0.6,  // Higher for visibility
    }
}]
// Node itemStyle in icon mode: opacity: 0.9 (visible bars)
```

### Verification

- [x] 29/29 sankeyDataBuilder tests pass
- [x] 29/29 TrendsView.polygon tests pass
- [x] No TypeScript errors
- [ ] Manual visual verification needed

---

## Phase 5.2: UI Polish & Animation Enhancements (2026-01-12)

### Session 3: Sankey Title Separator Fix

**Issue:** The title displayed between categories used a small arrow (`→`) that was hard to read on mobile.

**Change:** Replaced arrow separator with `>` for better readability.

| File | Change | Before | After |
|------|--------|--------|-------|
| `SankeyChart.tsx:486` | Title format | `${sourceEmoji}→${targetEmoji} ${sourceName} → ${targetName}` | `${sourceEmoji} ${sourceName} > ${targetEmoji} ${targetName}` |
| `SankeyChart.tsx:493` | displayName | `${sourceName} → ${targetName}` | `${sourceName} > ${targetName}` |
| `TrendsView.tsx:5299` | Pill title in TrendsView | `-` dash separator | `>` separator |

**Result:** Title now shows: `🛒 Alimentación > 🏪 Supermercado - $133k (33.1%)`

---

### Session 3: Sankey Title Truncation

**Issue:** Long category names like "Alimentos Frescos" and "Carnes y Mariscos" were wrapping to multiple lines and getting cut off by the title container.

**Changes:**

| File | Change | Before | After |
|------|--------|--------|-------|
| `TrendsView.tsx:5281` | Title container height | 52px | 60px |
| `TrendsView.tsx:5290` | Category name max-width | None | `max-w-[80px]` with truncate |
| `TrendsView.tsx:5294` | Single node name max-width | None | `max-w-[180px]` with truncate |

**Technical Details:**
- Added `truncate` class to category name spans for ellipsis on overflow
- Emojis and `>` separator use `flex-shrink-0` to prevent clipping
- Container expanded to 60px height for better accommodation

---

### Session 3: TreeMap Drill-Down Animation

**Issue:** When drilling down in the TreeMap, cells appeared instantly without any visual transition.

**Enhancement:** Added staggered entrance animation for TreeMap cells on drill-down.

| File | Change | Description |
|------|--------|-------------|
| `TrendsView.tsx:847` | New prop `index` | Added to `AnimatedTreemapCell` for stagger timing |
| `TrendsView.tsx:849-856` | Entrance state | `isVisible` state with staggered setTimeout (50ms per cell) |
| `TrendsView.tsx:927-932` | Animation styles | `entranceAnimationStyle` with translate + scale transform |
| `TrendsView.tsx:952-953` | Tiny cell | Applied animation styles |
| `TrendsView.tsx:1000-1001` | Compact cell | Applied animation styles |
| `TrendsView.tsx:1087-1088` | Standard cell | Applied animation styles |
| `TrendsView.tsx:5019-5020` | Cell rendering | Pass `index` prop to each cell |

**Animation Behavior:**
- Cells start at `translate(-20px, -20px) scale(0.8)` with `opacity: 0`
- Each cell animates to final position with 300ms ease-out transition
- Stagger: 50ms delay per cell index (first cell immediate, second at 50ms, etc.)
- Animation triggers on `animationKey` change (drill-down or data change)

---

### Session 3: Donut Chart Animation Restoration

**Issue:** The donut chart previously had animations that were lost. User wanted to restore:
1. Clockwise segment reveal animation
2. Count-up animations for all numbers (total, amounts, percentages, counts)

**Changes:**

#### New Animation State (DonutChart)
| Line | Change | Description |
|------|--------|-------------|
| 1248-1252 | Animation state | Added `donutAnimationKey` and `visibleSegments` Set |
| 1276-1278 | viewMode reset | Reset animation on view mode change |
| 1281-1296 | Segment reveal effect | setTimeout stagger (80ms per segment) |

#### Animated Center Total
| Line | Change | Description |
|------|--------|-------------|
| 1567-1572 | `animatedTotal` | useCountUp hook for center total (800ms duration) |
| 1979 | Center display | Uses `animatedTotal` instead of static `displayTotal` |

#### New AnimatedLegendValues Component
| Lines | Description |
|-------|-------------|
| 1186-1267 | New component for legend item values with count-up |

**AnimatedLegendValues Props:**
- `value`: Amount to animate (800ms duration)
- `count`: Transaction/item count (600ms duration)
- `percent`: Percentage value (600ms duration)
- `animationKey`: Triggers re-animation on change

#### Segment Animation
| Line | Change | Description |
|------|--------|-------------|
| 1930-1931 | Segment visibility | Check `visibleSegments.has(index)` |
| 1937-1938 | Dash animation | Animate `strokeDasharray` from 0 to full length |
| 1957-1958 | CSS transition | 400ms ease-out for `stroke-dasharray` |

#### Drill-Down Animation Triggers
| Lines | Change | Description |
|-------|--------|-------------|
| 1602-1604 | handleDrillDown | Reset animation key and visible segments |
| 1617-1619 | handleBack | Reset animation key and visible segments |

**Animation Behavior:**
- **Clockwise reveal**: Segments appear one by one with 80ms stagger
- **Segment grow**: Each segment animates from 0 length to full length (400ms)
- **Center count-up**: Total animates from 0 to final value (800ms)
- **Legend count-up**: Each legend item's amount, count, and percentage animate

---

### Verification (Session 3)

- [x] TypeScript compilation: No errors
- [x] Build successful
- [x] TreeMap drill-down animation working
- [x] Donut clockwise reveal animation working
- [x] Count-up animations for all numbers working
- [ ] Manual visual verification on device

---

## References

- [ECharts Sankey Examples](https://echarts.apache.org/examples/en/index.html#chart-type-sankey)
- [echarts-for-react Documentation](https://github.com/hustcc/echarts-for-react)
- Story 14.13.2 - Original Sankey requirements (Phase 4 - deferred)
- Dashboard Radar Diagram - Reference for progress-ring border pattern
