# Data Caching Architecture

> React Query + Firestore real-time integration for optimal performance
> **Last Updated:** 2026-01-15
> **Epic:** 14 (Story 14.29)

---

## Overview

BoletApp uses a **hybrid caching architecture** combining React Query's client-side cache with Firestore's real-time listeners for instant navigation and live updates.

---

## Core Pattern: useFirestoreSubscription

```mermaid
sequenceDiagram
    participant Component
    participant Hook as useFirestoreSubscription
    participant RQ as React Query Cache
    participant FB as Firestore

    Component->>Hook: Mount
    Hook->>RQ: Check cache for data

    alt Cache Hit
        RQ-->>Hook: Cached data
        Hook-->>Component: Render immediately (no spinner)
    else Cache Miss
        Hook-->>Component: Show loading spinner
    end

    Hook->>FB: Subscribe (onSnapshot)

    FB-->>Hook: Initial data
    Hook->>RQ: setQueryData()
    Hook-->>Component: Update UI

    loop Real-time Updates
        FB-->>Hook: Data changed
        Hook->>Hook: JSON compare
        alt Data different
            Hook->>RQ: setQueryData()
            Hook-->>Component: Re-render
        end
    end

    Component->>Hook: Unmount
    Hook->>FB: Unsubscribe
    Note over RQ: Cache preserved for 30 min
```

---

## Cache Configuration

```mermaid
flowchart TB
    subgraph Config["QueryClient Configuration"]
        ST["staleTime: 5 min<br/>Data fresh window"]
        GC["gcTime: 30 min<br/>Cache retention"]
        ROM["refetchOnMount: false<br/>Don't re-read if fresh"]
        ROW["refetchOnWindowFocus: true<br/>Refresh on focus"]
        ROR["refetchOnReconnect: false<br/>Firestore handles it"]
    end

    subgraph Effect["Effects"]
        E1["Instant navigation<br/>No spinners on cached routes"]
        E2["Background refresh<br/>Data stays current"]
        E3["Cost optimization<br/>Fewer Firestore reads"]
    end

    Config --> Effect
```

---

## Query Keys Structure

```mermaid
flowchart TB
    subgraph Keys["Hierarchical Query Keys"]
        TX["transactions<br/>[userId, appId]"]
        GR["groups<br/>[userId, appId]"]
        TM["trustedMerchants<br/>[userId, appId]"]

        subgraph Mappings["mappings namespace"]
            MA["all<br/>[mappings, userId, appId]"]
            MC["category<br/>[mappings, category, userId, appId]"]
            MM["merchant<br/>[mappings, merchant, userId, appId]"]
            MS["subcategory<br/>[mappings, subcategory, userId, appId]"]
        end

        subgraph Locations["locations namespace"]
            LC["countries<br/>[locations, countries]"]
        end

        subgraph Household["household namespace (Epic 14c)"]
            HA["all<br/>[household, householdId]"]
            HT["transactions<br/>[household, householdId, transactions]"]
            HM["members<br/>[household, householdId, members]"]
        end
    end
```

### Invalidation Patterns

```
Invalidate all mappings:
  queryClient.invalidateQueries(['mappings', userId, appId])

Invalidate only category mappings:
  queryClient.invalidateQueries(['mappings', 'category', userId, appId])
```

---

## Data Flow Patterns

### Pattern A: Cache-First (One-time Fetches)

```mermaid
flowchart LR
    subgraph Hook["useFirestoreQuery"]
        F1[Check cache]
        F2{Fresh?}
        F3[Return cached]
        F4[Fetch from Firestore]
        F5[Update cache]
    end

    F1 --> F2
    F2 -->|"Yes"| F3
    F2 -->|"No"| F4
    F4 --> F5
    F5 --> F3

    subgraph Use["Used For"]
        U1[User preferences]
        U2[Airlocks]
        U3[Static locations]
    end
```

### Pattern B: Real-Time Subscription

```mermaid
flowchart LR
    subgraph Hook["useFirestoreSubscription"]
        S1[Mount]
        S2[Return cached immediately]
        S3[Start listener]
        S4[Push updates to cache]
    end

    S1 --> S2
    S2 --> S3
    S3 --> S4
    S4 -->|"Loop"| S4

    subgraph Use["Used For"]
        T1[Transactions]
        T2[Groups]
        T3[Mappings]
        T4[Trusted merchants]
    end
```

### Pattern C: Pagination Hybrid

```mermaid
flowchart TB
    subgraph RealTime["Real-Time Layer"]
        RT["100 most recent<br/>Live listener"]
    end

    subgraph Paginated["Pagination Layer"]
        PG["Older transactions<br/>On-demand fetch"]
    end

    subgraph Merge["Merge Layer"]
        M["Deduplicate via Map<br/>Sort by date"]
    end

    subgraph Display["Display"]
        D["Unified transaction list"]
    end

    RT --> Merge
    PG --> Merge
    Merge --> D
```

---

## Mutation Flow with Optimistic Updates

```mermaid
sequenceDiagram
    participant Component
    participant Mutation as useFirestoreMutation
    participant RQ as React Query
    participant FB as Firestore

    Component->>Mutation: updateTransaction()

    Mutation->>RQ: Cancel in-flight queries
    Mutation->>RQ: Snapshot old data
    Mutation->>RQ: Apply optimistic update
    RQ-->>Component: Re-render with new data

    Mutation->>FB: Write to Firestore

    alt Success
        FB-->>Mutation: Write confirmed
        Mutation->>RQ: Invalidate query
        RQ->>FB: Listener fires with fresh data
        FB-->>RQ: Updated document
        RQ-->>Component: Final re-render
    else Error
        FB-->>Mutation: Write failed
        Mutation->>RQ: Rollback to snapshot
        RQ-->>Component: Re-render with old data
        Mutation-->>Component: Show error
    end
```

---

## Listener Limits (Cost Optimization)

```mermaid
flowchart TB
    subgraph Limits["Firestore Listener Limits"]
        L1["TRANSACTIONS: 100<br/>Most recent by date"]
        L2["RECENT_SCANS: 10<br/>Most recent by createdAt"]
        L3["GROUPS: 50"]
        L4["TRUSTED_MERCHANTS: 200"]
        L5["MAPPINGS: 500"]
    end

    subgraph Savings["Cost Savings"]
        S1["User with 500 txns:<br/>5,000 reads/day → 100 reads/day<br/>= 98% reduction"]
    end

    Limits --> Savings
```

---

## Local Storage Persistence

```mermaid
flowchart TB
    subgraph Runtime["In-Memory State"]
        RM["ScanState"]
    end

    subgraph Persist["localStorage"]
        LS["boletapp_pending_scan_{userId}"]
    end

    subgraph Schema["Persisted Format"]
        F1["version: 1"]
        F2["state: ScanState"]
        F3["persistedAt: timestamp"]
    end

    subgraph Recovery["Recovery Scenarios"]
        R1["App closed mid-scan"]
        R2["Network lost"]
        R3["Browser refreshed"]
    end

    RM -->|"savePersistedScanState()"| LS
    LS -->|"loadPersistedScanState()"| RM

    Recovery --> LS
    LS --> Schema
```

---

## Cache Lifecycle Example

```mermaid
flowchart TB
    subgraph T0["T+0: First Visit"]
        A1["Navigate to Transactions"]
        A2["Cache miss → Loading spinner"]
        A3["Firestore fetch → 2-3 seconds"]
        A4["Data cached + displayed"]
    end

    subgraph T1["T+1: Navigate Away"]
        B1["Component unmounts"]
        B2["Listener unsubscribes"]
        B3["Cache preserved (30 min TTL)"]
    end

    subgraph T2["T+2: Return Visit"]
        C1["Navigate back to Transactions"]
        C2["Cache hit → Instant render"]
        C3["New listener subscribes"]
        C4["Any updates sync automatically"]
    end

    T0 --> T1
    T1 --> T2
```

---

## Derived Data Caching

```mermaid
flowchart LR
    subgraph Input["Raw Transactions"]
        TX[Transactions array]
    end

    subgraph Compute["Expensive Computation"]
        C1["flattenTransactionItems()"]
        C2["Content hash for cache key"]
    end

    subgraph Cache["Query Client Cache"]
        K["items-derived-{hash}"]
    end

    subgraph Output["Derived Items"]
        I[Flattened item list]
    end

    TX --> Compute
    Compute --> Cache
    Cache --> Output

    note["Reuses cached result<br/>when content unchanged"]
```

---

## Memory Management

| Strategy | Implementation | Benefit |
|----------|----------------|---------|
| **Listener Limits** | 100 txns, 200 merchants | Bounded memory |
| **GC Time** | 30 minute cache retention | Clears unused data |
| **JSON Comparison** | Skip redundant state updates | Fewer re-renders |
| **Pagination** | Load older on demand | Lazy loading |
| **URL Revocation** | Clean up blob URLs on unmount | Prevent leaks |

---

## App Lifecycle States

```mermaid
stateDiagram-v2
    [*] --> Active

    Active --> Background : App backgrounded
    Background --> Active : App foregrounded

    Active --> Offline : Network lost
    Offline --> Active : Network restored

    state Active {
        [*] --> Fresh
        Fresh --> Stale : 5 min elapsed
        Stale --> Refreshing : refetchOnWindowFocus
        Refreshing --> Fresh : Data fetched
    }

    state Background {
        note right: Listeners may miss updates
        note right: Cache becomes stale
    }

    state Offline {
        note right: Pending scans persist to localStorage
        note right: Firestore handles reconnection
    }
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/queryClient.ts` | QueryClient configuration |
| `src/lib/queryKeys.ts` | Hierarchical query key factory |
| `src/hooks/useFirestoreSubscription.ts` | Core subscription hook |
| `src/hooks/useFirestoreQuery.ts` | One-time fetch hook |
| `src/hooks/useFirestoreMutation.ts` | Mutation with optimistic updates |
| `src/hooks/usePaginatedTransactions.ts` | Hybrid real-time + pagination |
| `src/services/pendingScanStorage.ts` | localStorage persistence |

---

## Performance Metrics

| Metric | Value | Impact |
|--------|-------|--------|
| Cache TTL | 30 minutes | Extended navigation benefit |
| Stale Time | 5 minutes | Reduced refetches |
| Listener Limit | 100 docs | 98% cost reduction |
| First Paint | < 100ms (cached) | Instant UX |
| First Paint | 2-3s (fresh) | Acceptable initial load |

---

*Diagram reflects React Query implementation from Story 14.29*
