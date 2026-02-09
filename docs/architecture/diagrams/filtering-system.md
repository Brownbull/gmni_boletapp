# Filtering System

> Transaction filtering by temporal, category, and location
> **Last Updated:** 2026-01-15

---

## Overview

The filtering system uses **three independent filter dimensions** combined with AND logic. Filters are managed via React Context and composed at query time.

---

## Filter Architecture

```mermaid
flowchart TB
    subgraph Filters["Three Filter Dimensions"]
        TF[🕐 Temporal Filter]
        CF[🏷️ Category Filter]
        LF[📍 Location Filter]
    end

    subgraph Composition["Filter Composition"]
        AND["AND Logic<br/>All must match"]
    end

    subgraph Result["Filtered Transactions"]
        R[Matching Transactions]
    end

    TF --> AND
    CF --> AND
    LF --> AND
    AND --> R
```

---

## Filter State Structure

```typescript
interface HistoryFilterState {
  temporal: TemporalFilterState;     // Time-based
  category: CategoryFilterState;     // Store & item
  location: LocationFilterState;     // Country/city
}
```

---

## Temporal Filter (6 Levels)

```mermaid
flowchart TB
    subgraph Levels["Temporal Hierarchy"]
        ALL[all - All time]
        Y[year - 2024]
        Q[quarter - Q1-Q4]
        M[month - YYYY-MM]
        W[week - 1-5]
        D[day - YYYY-MM-DD]
    end

    ALL --> Y
    Y --> Q
    Q --> M
    M --> W
    W --> D

    subgraph Special["Special Case"]
        DR["dateRange<br/>{start, end}<br/>For Reports ISO weeks"]
    end
```

### Temporal Matching Logic

```mermaid
flowchart TD
    START[Transaction Date] --> CHECK{level?}

    CHECK -->|"all"| PASS[✓ Include]
    CHECK -->|"dateRange"| RANGE{date in range?}
    CHECK -->|"year"| YEAR{year matches?}
    CHECK -->|"quarter"| QTR{quarter matches?}
    CHECK -->|"month"| MON{month matches?}
    CHECK -->|"week"| WEEK{week matches?}
    CHECK -->|"day"| DAY{day matches?}

    RANGE -->|"Yes"| PASS
    RANGE -->|"No"| FAIL[✗ Exclude]

    YEAR -->|"Yes"| QTR
    YEAR -->|"No"| FAIL

    QTR -->|"Yes"| MON
    QTR -->|"No"| FAIL

    MON -->|"Yes"| WEEK
    MON -->|"No"| FAIL

    WEEK -->|"Yes"| DAY
    WEEK -->|"No"| FAIL

    DAY -->|"Yes"| PASS
    DAY -->|"No"| FAIL

    style PASS fill:#d1fae5
    style FAIL fill:#fee2e2
```

---

## Category Filter (4 Levels + Multi-Dimension)

```mermaid
flowchart TB
    subgraph Legacy["Legacy Single-Dimension"]
        L1[category - Store category]
        L2[group - Item group]
        L3[subcategory - Item subcategory]
    end

    subgraph Modern["Modern Multi-Dimension (drillDownPath)"]
        M1[storeGroup]
        M2[storeCategory - multi-select]
        M3[itemGroup]
        M4[itemCategory - multi-select]
        M5[subcategory]
    end

    subgraph Priority["Priority"]
        P["drillDownPath takes priority<br/>over legacy fields"]
    end

    Modern --> Priority
    Legacy --> Priority
```

### Multi-Select Support

```
Categories can be comma-separated:
"Supermarket,Restaurant,Gas Station"

Auto-detects known groups:
"Supermarket,Restaurant" → "Food & Dining"
```

---

## Location Filter

```mermaid
flowchart LR
    subgraph Fields["Location Fields"]
        C[country]
        CT[city - legacy single]
        SC[selectedCities - modern multi]
    end

    subgraph Matching["Matching Logic"]
        M1{selectedCities?}
        M2{country?}
        M3{city?}
    end

    subgraph Result["Result"]
        PASS[✓ Include]
        FAIL[✗ Exclude]
    end

    Fields --> M1
    M1 -->|"Yes"| CHECK1{tx.city in list?}
    M1 -->|"No"| M2
    M2 -->|"Yes"| CHECK2{tx.country matches?}
    M2 -->|"No"| PASS

    CHECK1 -->|"Yes"| PASS
    CHECK1 -->|"No"| FAIL

    CHECK2 -->|"Yes"| M3
    CHECK2 -->|"No"| FAIL

    M3 -->|"Yes"| CHECK3{tx.city matches?}
    M3 -->|"No"| PASS

    CHECK3 -->|"Yes"| PASS
    CHECK3 -->|"No"| FAIL
```

---

## Complete Filter Flow

```mermaid
flowchart TB
    subgraph Source["Data Source"]
        TX[(All Transactions)]
    end

    subgraph Filters["Filter Pipeline"]
        F1[Apply Temporal Filter]
        F2[Apply Category Filter]
        F3[Apply Location Filter]
        F4[Apply Search Query]
        F5[Apply Sorting]
        F6[Paginate Results]
    end

    subgraph Output["Output"]
        PAGE[Current Page]
    end

    TX --> F1
    F1 --> F2
    F2 --> F3
    F3 --> F4
    F4 --> F5
    F5 --> F6
    F6 --> PAGE
```

---

## Filter Independence Principle

```mermaid
flowchart LR
    subgraph Change["User Changes"]
        C1["Change temporal<br/>Year → Month"]
        C2["Change category<br/>All → Supermarket"]
    end

    subgraph Effect["State Effect"]
        E1["Temporal updated<br/>Category, Location PRESERVED"]
        E2["Category updated<br/>Temporal, Location PRESERVED"]
    end

    C1 --> E1
    C2 --> E2
```

---

## UI Components

```mermaid
flowchart TB
    subgraph Bar["HistoryFilterBar"]
        TFD[TemporalFilterDropdown]
        CFD[CategoryFilterDropdown]
        LFD[LocationFilterDropdown]
        CLR[Clear All Button]
    end

    subgraph Chips["FilterChips"]
        TC[Temporal Chip]
        CC[Category Chip]
        LC[Location Chip]
    end

    subgraph Search["SearchBar"]
        SB[Text Search Input]
    end

    subgraph View["HistoryView"]
        List[Transaction List]
    end

    Bar --> View
    Chips --> View
    Search --> View
    View --> List
```

---

## Available Filters Extraction

```mermaid
flowchart TB
    subgraph Scan["Scan All Transactions"]
        TX[(Transactions)]
    end

    subgraph Extract["extractAvailableFilters()"]
        E1[Unique years]
        E2[Months by year]
        E3[Store categories]
        E4[Item groups by store]
        E5[Subcategories by group]
        E6[Countries]
        E7[Cities by country]
    end

    subgraph Output["Dropdown Options"]
        D1[Year Dropdown]
        D2[Month Dropdown]
        D3[Category Dropdown]
        D4[Location Dropdown]
    end

    TX --> Extract
    Extract --> Output
```

---

## Filter State Persistence

```mermaid
sequenceDiagram
    participant User
    participant Filter as HistoryFiltersContext
    participant Parent as Parent Component
    participant View as HistoryView

    User->>Filter: Change temporal filter
    Filter->>Filter: dispatch(SET_TEMPORAL_FILTER)
    Filter->>Parent: onStateChange callback
    Parent->>Parent: Persist to local state

    Note over Parent: State preserved across<br/>navigation

    User->>View: Navigate away
    User->>View: Navigate back
    Parent->>Filter: Restore filter state
    Filter-->>View: Render with saved filters
```

---

## Smart Label Detection

```mermaid
flowchart TD
    subgraph Input["Multi-Select Categories"]
        MS["Supermarket,Restaurant"]
    end

    subgraph Check["Pattern Detection"]
        C{Forms known group?}
    end

    subgraph Display["Display Label"]
        D1["Food & Dining"]
        D2["2 categories"]
    end

    MS --> C
    C -->|"Yes"| D1
    C -->|"No"| D2

    style D1 fill:#d1fae5
```

---

## Reducer Actions

| Action | Effect | Preserves |
|--------|--------|-----------|
| `SET_TEMPORAL_FILTER` | Update temporal state | Category, Location |
| `SET_CATEGORY_FILTER` | Update category state | Temporal, Location |
| `SET_LOCATION_FILTER` | Update location state | Temporal, Category |
| `CLEAR_TEMPORAL` | Reset to current month | Others |
| `CLEAR_CATEGORY` | Reset to 'all' | Others |
| `CLEAR_LOCATION` | Remove location filter | Others |
| `CLEAR_ALL_FILTERS` | Reset everything | None |

---

## Default State

```typescript
const DEFAULT_STATE: HistoryFilterState = {
  temporal: {
    level: 'month',
    year: currentYear,
    month: currentMonth,    // YYYY-MM format
    // Default: Current month (not 'all time')
  },
  category: {
    level: 'all',
  },
  location: {
    // No filter by default
  },
};
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/contexts/HistoryFiltersContext.tsx` | Filter state context |
| `src/hooks/useHistoryFilters.ts` | Filter access hook |
| `src/utils/historyFilterUtils.ts` | Filter matching functions |
| `src/components/history/HistoryFilterBar.tsx` | Filter UI container |
| `src/components/history/TemporalFilterDropdown.tsx` | Time period selector |
| `src/components/history/CategoryFilterDropdown.tsx` | Category selector |
| `src/views/HistoryView.tsx` | Main list view with filters |

---

*Diagram reflects filtering implementation as of Epic 14*
