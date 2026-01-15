# Analytics Workflow

> Drill-down navigation, data visualization, and temporal/category filtering
> **Last Updated:** 2026-01-15

---

## Overview

The Analytics system uses a **dual-axis independence pattern** where temporal (time) and category filters operate independently, allowing flexible data exploration.

---

## State Architecture

```mermaid
flowchart TB
    subgraph Context["AnalyticsContext"]
        State["AnalyticsNavigationState"]
    end

    subgraph StateFields["State Fields"]
        T[temporal: TemporalPosition]
        C[category: CategoryPosition]
        CM[chartMode: aggregation | comparison]
        DM[drillDownMode: temporal | category]
    end

    subgraph Principle["Dual-Axis Independence"]
        P1["Temporal changes → Category PRESERVED"]
        P2["Category changes → Temporal PRESERVED"]
    end

    State --> StateFields
    StateFields --> Principle
```

---

## Temporal Hierarchy (5 Levels)

```mermaid
flowchart TB
    subgraph Temporal["Temporal Drill-Down"]
        Y[Year 2024]
        Q[Quarter Q1-Q4]
        M[Month YYYY-MM]
        W[Week 1-5]
        D[Day YYYY-MM-DD]
    end

    Y --> Q
    Q --> M
    M --> W
    W --> D

    style Y fill:#e0f2fe
    style Q fill:#bae6fd
    style M fill:#7dd3fc
    style W fill:#38bdf8
    style D fill:#0ea5e9
```

### Temporal Navigation

| Level | Children | Format |
|-------|----------|--------|
| Year | 4 quarters | Q1, Q2, Q3, Q4 |
| Quarter | 3 months | January, February, March |
| Month | 4-5 weeks | Week labels (month-aligned) |
| Week | 7 days | Mon, Tue, Wed... |
| Day | None | Leaf level |

---

## Category Hierarchy (4 Levels)

```mermaid
flowchart TB
    subgraph Category["Category Drill-Down"]
        A[All Categories]
        SC[Store Category]
        IG[Item Group]
        IS[Item Subcategory]
    end

    A --> SC
    SC --> IG
    IG --> IS

    style A fill:#fef3c7
    style SC fill:#fde68a
    style IG fill:#fcd34d
    style IS fill:#fbbf24
```

### Category Examples

```
All Categories
├── Supermarket
│   ├── Fresh Food
│   │   ├── Meats
│   │   ├── Dairy
│   │   └── Produce
│   ├── Packaged Food
│   └── Household
├── Restaurant
│   ├── Fast Food
│   ├── Casual Dining
│   └── Fine Dining
└── Entertainment
    ├── Movies
    └── Events
```

---

## Drill-Down Navigation

```mermaid
sequenceDiagram
    participant User
    participant Grid as DrillDownGrid
    participant Card as DrillDownCard
    participant Context as AnalyticsContext
    participant Data as Data Calculation

    User->>Grid: View analytics
    Grid->>Data: Compute children for current position
    Data-->>Grid: Quarters/Categories with amounts

    Grid->>Card: Render cards with percentages
    User->>Card: Tap "Q4" card

    Card->>Context: dispatch(SET_TEMPORAL_LEVEL, Q4)
    Context->>Context: Update state (preserve category)
    Context-->>Grid: New state

    Grid->>Data: Compute children for Q4
    Data-->>Grid: October, November, December
    Grid->>Card: Re-render with months
```

---

## Chart Modes

```mermaid
flowchart LR
    subgraph Modes["Chart Display Modes"]
        AGG["Aggregation Mode<br/>Shows: WHAT<br/>Pie/Bar by category"]
        COMP["Comparison Mode<br/>Shows: WHEN<br/>Grouped bar by period"]
    end

    subgraph Toggle["ChartModeToggle"]
        T1["📊 Aggregation"]
        T2["📈 Comparison"]
    end

    Toggle --> Modes

    note1["Comparison unavailable<br/>at Day level"]

    style note1 fill:#fef3c7
```

---

## Drill-Down Mode Toggle

```mermaid
flowchart TB
    subgraph DrillDownMode["DrillDownModeToggle (Story 7.16)"]
        TM["🕐 Temporal<br/>Shows time periods"]
        CM["🏷️ Category<br/>Shows spending categories"]
    end

    subgraph Cards["Cards Displayed"]
        TC["Q1 | Q2 | Q3 | Q4"]
        CC["Supermarket | Restaurant | Gas"]
    end

    TM --> TC
    CM --> CC
```

---

## Data Flow

```mermaid
flowchart TB
    subgraph Input["Raw Data"]
        TX[All Transactions]
    end

    subgraph Filters["Applied Filters"]
        TF[Temporal Filter]
        CF[Category Filter]
    end

    subgraph Compute["Data Computation"]
        C1[computeAllCategoryData]
        C2[computeItemCategoryData]
        C3[computeSubcategoryData]
        C4[filterByPeriod]
    end

    subgraph Output["Visualization"]
        O1[DrillDownGrid]
        O2[PieChart]
        O3[BarChart]
        O4[SankeyChart]
        O5[Treemap]
    end

    TX --> Filters
    Filters --> Compute
    Compute --> Output
```

---

## Component Architecture

```mermaid
flowchart TB
    subgraph Views["Main View"]
        TV[TrendsView]
    end

    subgraph Navigation["Navigation Components"]
        TB[TemporalBreadcrumb]
        CB[CategoryBreadcrumb]
        CMT[ChartModeToggle]
        DMT[DrillDownModeToggle]
    end

    subgraph Display["Display Components"]
        DDG[DrillDownGrid]
        DDC[DrillDownCard]
        CL[CategoryLegend]
        TD[TotalDisplay]
    end

    subgraph Charts["Chart Components"]
        PC[SimplePieChart]
        BC[GroupedBarChart]
        SC[SankeyChart]
        TM[Treemap]
    end

    TV --> Navigation
    TV --> Display
    TV --> Charts

    DDG --> DDC
```

---

## Period Comparison (Tendencia)

```mermaid
flowchart LR
    subgraph Current["Current Period"]
        CP[January 2024<br/>$150,000]
    end

    subgraph Previous["Previous Period"]
        PP[December 2023<br/>$120,000]
    end

    subgraph Calculation["Comparison"]
        CALC["Change: +25%<br/>Direction: UP"]
    end

    PP --> CALC
    CP --> CALC

    subgraph Display["UI Display"]
        UP["↑ +25% vs last month"]
    end

    CALC --> Display

    style UP fill:#d1fae5
```

### Change Directions

| Direction | Condition | Display |
|-----------|-----------|---------|
| `up` | Change > +0.5% | ↑ Green |
| `down` | Change < -0.5% | ↓ Red |
| `same` | -0.5% to +0.5% | → Gray |
| `new` | No previous data | ★ Blue |

---

## Reducer Actions

```mermaid
flowchart TB
    subgraph Actions["AnalyticsReducer Actions"]
        A1[SET_TEMPORAL_LEVEL]
        A2[SET_CATEGORY_FILTER]
        A3[TOGGLE_CHART_MODE]
        A4[TOGGLE_DRILLDOWN_MODE]
        A5[RESET_TO_YEAR]
        A6[CLEAR_CATEGORY_FILTER]
    end

    subgraph Effects["State Effects"]
        E1["Update temporal<br/>Preserve category"]
        E2["Update category<br/>Preserve temporal"]
        E3["aggregation ↔ comparison"]
        E4["temporal ↔ category"]
        E5["Reset to year level"]
        E6["Clear to 'all'"]
    end

    A1 --> E1
    A2 --> E2
    A3 --> E3
    A4 --> E4
    A5 --> E5
    A6 --> E6
```

---

## Sankey Diagram Modes

```mermaid
flowchart LR
    subgraph Level2["2-Level"]
        L2A[Store Categories] --> L2B[Item Categories]
    end

    subgraph Level3G["3-Level (Groups)"]
        L3A[Store Groups] --> L3B[Store Categories] --> L3C[Item Groups]
    end

    subgraph Level4["4-Level"]
        L4A[Store Groups] --> L4B[Store Categories]
        L4B --> L4C[Item Groups] --> L4D[Item Categories]
    end
```

---

## Accessibility Features

| Feature | Implementation |
|---------|----------------|
| **Keyboard Navigation** | Arrow keys in breadcrumbs, Enter/Space on cards |
| **Touch Targets** | 44px minimum for all interactive elements |
| **ARIA Labels** | Proper roles and labels throughout |
| **Focus Management** | Visible focus indicators |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/views/TrendsView.tsx` | Main analytics view (5000+ lines) |
| `src/contexts/AnalyticsContext.tsx` | State management context |
| `src/hooks/useAnalyticsNavigation.ts` | Navigation hook with selectors |
| `src/components/analytics/DrillDownGrid.tsx` | Card grid container |
| `src/components/analytics/DrillDownCard.tsx` | Individual category/period card |
| `src/components/analytics/TemporalBreadcrumb.tsx` | Time navigation breadcrumb |
| `src/components/analytics/CategoryBreadcrumb.tsx` | Category filter breadcrumb |
| `src/components/analytics/SankeyChart.tsx` | Flow visualization |
| `src/utils/periodComparison.ts` | Period-over-period calculations |

---

*Diagram reflects Epic 14 analytics implementation*
