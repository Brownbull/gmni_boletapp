# Scan State Machine

> Receipt scanning workflow for single, batch, and statement modes
> **Last Updated:** 2026-01-15
> **Epic:** 14d (Scan Architecture Refactor)

---

## Overview

The scan state machine consolidates 31+ scattered state variables into a unified, predictable state management system using React's `useReducer`.

---

## State Machine Phases

```mermaid
stateDiagram-v2
    [*] --> idle

    idle --> capturing : START_SINGLE / START_BATCH / START_STATEMENT

    capturing --> scanning : PROCESS_START
    capturing --> idle : CANCEL

    scanning --> reviewing : PROCESS_SUCCESS
    scanning --> error : PROCESS_ERROR

    reviewing --> saving : SAVE_START
    reviewing --> idle : CANCEL (with warning)

    saving --> idle : SAVE_SUCCESS
    saving --> reviewing : SAVE_ERROR

    error --> idle : RESET / CANCEL

    note right of idle : No active scan\nCredit: none
    note right of capturing : Adding images\nPre-scan options\nCredit: none
    note right of scanning : API processing\nCredit: RESERVED
    note right of reviewing : Results ready\nCredit: CONFIRMED
    note right of saving : Writing to Firestore\nCredit: CONFIRMED
    note right of error : Error occurred\nCredit: REFUNDED
```

---

## Credit Lifecycle

```mermaid
flowchart LR
    subgraph Credits["Credit States"]
        none[/"none"/]
        reserved[/"reserved"/]
        confirmed[/"confirmed"/]
        refunded[/"refunded"/]
    end

    none -->|"PROCESS_START"| reserved
    reserved -->|"PROCESS_SUCCESS"| confirmed
    reserved -->|"PROCESS_ERROR"| refunded
    reserved -->|"Offline detected"| refunded

    style none fill:#e5e7eb
    style reserved fill:#fef3c7
    style confirmed fill:#d1fae5
    style refunded fill:#fee2e2
```

---

## Scan Modes Comparison

```mermaid
flowchart TB
    subgraph Single["Single Scan Mode"]
        S1[Capture 1 image] --> S2[Process via Gemini]
        S2 --> S3[Review single result]
        S3 --> S4[Save transaction]
    end

    subgraph Batch["Batch Scan Mode"]
        B1[Capture 2-10 images] --> B2[Parallel processing]
        B2 --> B3[Review multiple results]
        B3 --> B4[Save all / Save one]
    end

    subgraph Statement["Statement Mode - Future"]
        ST1[Upload PDF/Image] --> ST2[Parse bank statement]
        ST2 --> ST3[Review multiple transactions]
        ST3 --> ST4[Bulk save]
    end
```

### Mode Specifications

| Aspect | Single | Batch | Statement |
|--------|--------|-------|-----------|
| **Credit Type** | 1 normal | 1 super per image | 1 super |
| **Image Count** | 1 | 2-10 | 1 (multi-page) |
| **Processing** | Sequential | Parallel (3 concurrent) | Sequential |
| **Results** | 1 transaction | N transactions | N transactions |
| **Review UI** | Simple editor | Thumbnail queue | List view |

---

## Batch Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant BatchCapture
    participant BatchProcessing
    participant CloudFunction
    participant BatchReview

    User->>BatchCapture: Add images (2-10)
    BatchCapture->>BatchCapture: Generate thumbnails
    User->>BatchCapture: Tap "Process"

    BatchCapture->>BatchProcessing: Start parallel processing

    par Image 1
        BatchProcessing->>CloudFunction: analyzeReceipt(img1)
        CloudFunction-->>BatchProcessing: result1
    and Image 2
        BatchProcessing->>CloudFunction: analyzeReceipt(img2)
        CloudFunction-->>BatchProcessing: result2
    and Image 3
        BatchProcessing->>CloudFunction: analyzeReceipt(img3)
        CloudFunction-->>BatchProcessing: result3
    end

    BatchProcessing->>BatchReview: All results ready

    loop For each receipt
        User->>BatchReview: Review/Edit receipt
        BatchReview->>BatchReview: Update confidence status
    end

    User->>BatchReview: Save all
    BatchReview->>BatchReview: Persist to Firestore
```

---

## Dialog System

```mermaid
flowchart TB
    subgraph Dialogs["Dialog Types"]
        D1[currency_mismatch]
        D2[total_mismatch]
        D3[quicksave]
        D4[scan_complete]
        D5[cancel_warning]
        D6[batch_cancel_warning]
        D7[discard_warning]
        D8[batch_complete]
    end

    subgraph Triggers["When Triggered"]
        T1["AI detected different currency"]
        T2["Item sum ≠ receipt total"]
        T3["High confidence (>80%)"]
        T4["Scan finished - offer save/edit"]
        T5["User canceling after credit spent"]
        T6["User canceling batch"]
        T7["User discarding unsaved changes"]
        T8["Batch save completed"]
    end

    T1 --> D1
    T2 --> D2
    T3 --> D3
    T4 --> D4
    T5 --> D5
    T6 --> D6
    T7 --> D7
    T8 --> D8
```

---

## State Structure

```typescript
interface ScanState {
  // Core state
  phase: 'idle' | 'capturing' | 'scanning' | 'reviewing' | 'saving' | 'error';
  mode: 'single' | 'batch' | 'statement';

  // Request tracking (prevents concurrent scans)
  requestId: string | null;
  userId: string | null;
  startedAt: number | null;

  // Image data
  images: string[];           // Base64 or URLs

  // Processing results
  results: Transaction[];

  // Credit tracking
  creditStatus: 'none' | 'reserved' | 'confirmed' | 'refunded';

  // Batch-specific
  batchProgress: BatchProgress | null;
  batchReceipts: BatchReceipt[] | null;
  batchEditingIndex: number | null;

  // Dialog state
  dialog: { type: DialogType; data?: any } | null;

  // Error state
  error: string | null;
}
```

---

## Request Precedence Rule

```mermaid
flowchart TD
    A[User initiates new scan] --> B{Current phase?}
    B -->|idle| C[✅ Allow new scan]
    B -->|capturing| D[❌ Block - active capture]
    B -->|scanning| E[❌ Block - processing in progress]
    B -->|reviewing| F[❌ Block - review pending]
    B -->|saving| G[❌ Block - save in progress]
    B -->|error| H[❌ Block - must reset first]

    C --> I[Generate new requestId]
    I --> J[Record userId + startedAt]
    J --> K[Transition to capturing]

    style C fill:#d1fae5
    style D fill:#fee2e2
    style E fill:#fee2e2
    style F fill:#fee2e2
    style G fill:#fee2e2
    style H fill:#fee2e2
```

---

## Context & Hooks Hierarchy

```mermaid
flowchart TB
    subgraph Core["Core State Machine"]
        USM[useScanStateMachine]
    end

    subgraph Context["Context Layer"]
        SC[ScanContext / ScanProvider]
    end

    subgraph Consumers["Consumer Hooks"]
        USB[useScanStateBridge]
        UBC[useBatchCapture]
        UBP[useBatchProcessing]
        UBR[useBatchReview]
    end

    subgraph Access["Access Hooks"]
        US[useScan - required]
        USO[useScanOptional - nullable]
    end

    USM --> SC
    SC --> US
    SC --> USO
    US --> USB
    US --> UBC
    US --> UBP
    US --> UBR
```

---

## Computed Values (Derived State)

| Value | Derivation | Usage |
|-------|------------|-------|
| `hasActiveRequest` | `phase !== 'idle'` | Block new scans |
| `isProcessing` | `phase === 'scanning' \|\| 'saving'` | Show loading UI |
| `isBlocking` | `hasActiveRequest && dialog` | Block navigation |
| `canSave` | `phase === 'reviewing' && hasResults && !dialog` | Enable save button |
| `currentView` | Derived from phase + mode | Determine which UI to render |
| `imageCount` | `images.length` | Badge display |
| `resultCount` | `results.length` | Progress tracking |

---

## Persistence & Recovery

```mermaid
flowchart LR
    subgraph Runtime["Runtime State"]
        RS[ScanState in Memory]
    end

    subgraph Persist["Persistence Layer"]
        LS[localStorage]
    end

    subgraph Recovery["Recovery Scenarios"]
        R1["App closed mid-scan"]
        R2["Network lost during API call"]
        R3["Browser refreshed"]
    end

    RS -->|"savePersistedScanState()"| LS
    LS -->|"loadPersistedScanState()"| RS

    R1 --> LS
    R2 --> LS
    R3 --> LS

    LS -->|"RESTORE_STATE action"| RS
```

**Recovery Logic:**
- If restored state was `scanning` → transition to `error` + refund credit
- Otherwise → restore state as-is
- Clear localStorage on successful save

---

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/useScanStateMachine.ts` | Core state machine with reducer |
| `src/contexts/ScanContext.tsx` | App-wide context provider |
| `src/hooks/useBatchCapture.ts` | Multi-image capture management |
| `src/hooks/useBatchProcessing.ts` | Parallel processing orchestration |
| `src/hooks/useBatchReview.ts` | Review workflow with confidence tracking |
| `src/services/pendingScanStorage.ts` | localStorage persistence |

---

*Diagram generated from Epic 14d implementation*
