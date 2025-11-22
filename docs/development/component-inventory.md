# Component Inventory - Boletapp

## Overview

Boletapp is built as a single-file React application with all components defined in `/home/khujta/projects/bmad/boletapp/main.tsx`. This document catalogs all components, their responsibilities, props, and locations in the source code.

---

## Component Architecture

```
App (Root)
└── ErrorBoundary (Class Component)
    └── MainApp (Main Application Logic)
        ├── LoginScreen (Conditional Render)
        ├── Main Content Views
        │   ├── DashboardView
        │   ├── ScanView
        │   ├── EditView
        │   ├── TrendsView
        │   ├── HistoryView
        │   └── SettingsView
        └── Nav (Bottom Navigation)
```

---

## Class Components

### ErrorBoundary

**Location:** Lines 52-69
**Type:** Class Component (React.Component)
**Purpose:** Global error boundary to catch React rendering errors

**Props:**
```typescript
interface Props {
    children: React.ReactNode;
}
```

**State:**
```typescript
interface State {
    hasError: boolean;
    error: string;
}
```

**Methods:**
- `getDerivedStateFromError(error)` - Captures error state
- `render()` - Shows error UI or renders children

**Error UI Elements:**
- Red background with warning icon
- Error message display
- "Reload App" button

**Usage:**
```jsx
<ErrorBoundary>
    <MainApp />
</ErrorBoundary>
```

---

## Functional Components

### App (Root Component)

**Location:** Lines 621
**Type:** Functional Component (Default Export)
**Purpose:** Root wrapper that applies ErrorBoundary

**Implementation:**
```jsx
export default function App() {
    return (
        <ErrorBoundary>
            <MainApp />
        </ErrorBoundary>
    );
}
```

---

### MainApp

**Location:** Lines 253-619
**Type:** Functional Component
**Purpose:** Main application logic, routing, state management

**State Management:**
```typescript
// Authentication
const [user, setUser] = useState(null);
const [services, setServices] = useState(null);
const [initError, setInitError] = useState(null);

// UI State
const [view, setView] = useState('dashboard');
const [transactions, setTransactions] = useState([]);
const [scanImages, setScanImages] = useState([]);
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [scanError, setScanError] = useState(null);
const [currentTransaction, setCurrentTransaction] = useState(null);
const [editingItemIndex, setEditingItemIndex] = useState(null);

// Settings
const [lang, setLang] = useState('es');
const [currency, setCurrency] = useState('CLP');
const [theme, setTheme] = useState('light');
const [dateFormat, setDateFormat] = useState('LatAm');
const [wiping, setWiping] = useState(false);

// Analytics State
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
const [selectedMonth, setSelectedMonth] = useState(null);
const [selectedCategory, setSelectedCategory] = useState(null);
const [selectedGroup, setSelectedGroup] = useState(null);
const [selectedSubcategory, setSelectedSubcategory] = useState(null);
const [chartType, setChartType] = useState('pie');
const [breakdownTransId, setBreakdownTransId] = useState(null);
const [distinctAliases, setDistinctAliases] = useState([]);
const [historyPage, setHistoryPage] = useState(1);
```

**Key Functions:**
- `handleGoogleLogin()` - Google OAuth flow
- `handleLogout()` - Sign out user
- `triggerScan()` - Opens camera/file picker
- `handleFileSelect()` - Processes selected images
- `processScan()` - Calls Gemini API
- `saveTransaction()` - Writes to Firestore
- `deleteTransaction()` - Removes transaction
- `wipeDB()` - Factory reset
- `getTrendsData()` - Analytics calculations

**Conditional Renders:**
- Login screen (lines 479-490)
- Dashboard view (lines 504-531)
- Scan view (lines 533-541)
- Edit view (lines 543-552)
- Trends view (lines 554-592)
- Settings view (lines 594-605)
- History view (lines 607-614)

---

## View Components (Inline JSX)

### LoginScreen

**Location:** Lines 479-490
**Condition:** `!user`
**Purpose:** Authentication gate

**Elements:**
- Receipt icon
- App title and description
- "Sign in with Google" button

**Styling:** Dark theme (`bg-slate-900`)

---

### DashboardView (HomeView)

**Location:** Lines 504-531
**Condition:** `view === 'dashboard'`
**Purpose:** Main landing page with overview

**Features:**
- Header with "+" button for manual entry
- Total Spent card (all-time)
- This Month card (filtered)
- AI Scanner CTA card
- Recent transactions list (top 5)

**Interactions:**
- Click Total Spent → Navigate to Trends (all-time)
- Click This Month → Navigate to Trends (filtered to current month)
- Click "Scan" → Navigate to Scan view
- Click transaction card → Navigate to Edit view

---

### ScanView

**Location:** Lines 533-541
**Condition:** `view === 'scan'`
**Purpose:** Receipt image capture and analysis

**Features:**
- Back button
- Image preview grid (2 columns)
- "Add Photo" button
- "Scan" button (appears when images present)
- Error message display

**States:**
- Empty state: Shows "Add Photo" prompt
- With images: Shows grid of thumbnails
- Analyzing: Shows loading spinner

**Interactions:**
- Back button → Returns to Dashboard
- Add Photo → Opens file picker
- Scan button → Calls `processScan()`

---

### EditView

**Location:** Lines 543-552
**Condition:** `view === 'edit' && currentTransaction`
**Purpose:** Create or modify transactions

**Header:**
- Back button
- Title: "New" or "Edit" based on `currentTransaction.id`
- Delete button (only for existing transactions)

**Form Sections:**

1. **Total Amount Display** (line 547)
   - Large editable number input
   - Dark background

2. **Transaction Details** (line 548)
   - Merchant name input
   - Alias input with autocomplete (datalist)
   - Date input (type="date")
   - Category dropdown

3. **Items List** (line 549)
   - Add Item button
   - Editable item rows
     - Name input
     - Price input (number)
     - Category input
     - Subcategory badge
     - Delete button
     - Confirm button

4. **Save Button** (line 550)
   - Blue, full-width
   - Calls `saveTransaction()`

**Item Edit Mode:**
- Click item → Enters edit mode
- Shows input fields
- Click check mark → Saves
- Click trash → Deletes item

---

### TrendsView

**Location:** Lines 554-592
**Condition:** `view === 'trends'`
**Purpose:** Analytics and spending visualization

**Header:**
- Back button (with breadcrumb logic)
- Current filter title
- Export CSV button
- Chart type toggle (pie/bar)
- Year selector dropdown

**Main Chart Area:**
- Total spending display
- Interactive chart (SimplePieChart or GroupedBarChart)

**Drill-Down Panels:**

1. **Year View** (no filters):
   - Left column: Category breakdown
   - Right column: Monthly breakdown

2. **Month View** (`selectedMonth` set):
   - List of categories with amounts
   - Click to drill into category

3. **Category View** (`selectedCategory` set):
   - List of item groups
   - Click to drill into group

4. **Group View** (`selectedGroup` set):
   - List of subcategories
   - Click to drill into subcategory

5. **Subcategory View** (`selectedSubcategory` set):
   - List of transactions matching filter
   - Click transaction → Navigate to Edit view

**Interactions:**
- Back button: Removes last filter (breadcrumb navigation)
- Click chart slice: Drills down one level
- Click list item: Drills down or opens transaction

---

### HistoryView (ListView)

**Location:** Lines 607-614
**Condition:** `view === 'list'`
**Purpose:** Paginated list of all transactions

**Features:**
- Back button
- Transaction cards (20 per page)
  - Merchant name and alias
  - Category badge
  - Date
  - Amount
- Pagination controls
  - Previous button
  - Page number display
  - Next button

**Interactions:**
- Click transaction → Navigate to Edit view
- Previous/Next → Change page

---

### SettingsView

**Location:** Lines 594-605
**Condition:** `view === 'settings'`
**Purpose:** User preferences and account management

**Settings Cards:**

1. **Language** (line 597)
   - Toggle: EN / ES
   - Updates UI text immediately

2. **Currency** (line 598)
   - Toggle: CLP / USD
   - Affects formatting and Gemini context

3. **Date Format** (line 599)
   - Toggle: 31/12 (LatAm) / 12/31 (US)
   - Changes date display format

4. **Theme** (line 600)
   - Toggle: Light / Dark
   - Updates color scheme

5. **Export All** (line 601)
   - Button: "CSV"
   - Downloads full transaction history

6. **Factory Reset** (line 602)
   - Button: "Wipe" (red)
   - Deletes all user transactions
   - Requires confirmation

7. **Sign Out** (line 603)
   - Button: "Sign Out"
   - Calls Firebase signOut()

---

## UI Components

### CategoryBadge

**Location:** Lines 160-165
**Type:** Functional Component
**Purpose:** Display category and subcategory labels

**Props:**
```typescript
interface Props {
    category: string;
    subcategory?: string;
    mini?: boolean;
}
```

**Rendering:**
- Category: Colored badge with uppercase text
- Subcategory: Grey badge (optional)

**Styling:**
- Color from `getColor(category)` function
- Mini variant: Smaller text and padding
- Flexbox layout with gap

**Usage:**
```jsx
<CategoryBadge category="Supermarket" subcategory="Fresh Food" mini />
```

---

### Nav (Bottom Navigation)

**Location:** Lines 167-179
**Type:** Functional Component
**Purpose:** Fixed bottom navigation bar

**Props:**
```typescript
interface Props {
    view: string;
    setView: (view: string) => void;
    onScanClick: () => void;
    theme: 'light' | 'dark';
}
```

**Navigation Items:**
1. **Home** - Dashboard view
2. **Trends** - Analytics view
3. **Scan** - Center FAB (Floating Action Button)
4. **History** - List view
5. **Settings** - Settings view

**Styling:**
- Fixed position at bottom
- Active state: Blue color
- Inactive state: Grey color
- Scan button: Raised, blue, circular

**Interactions:**
- Click icon → Changes view
- Scan button → Calls `onScanClick()`

---

### SimplePieChart

**Location:** Lines 181-210
**Type:** Functional Component
**Purpose:** SVG pie chart for spending distribution

**Props:**
```typescript
interface Props {
    data: Array<{
        label: string;
        value: number;
        color: string;
    }>;
    onSliceClick?: (label: string) => void;
    theme: 'light' | 'dark';
}
```

**Rendering:**
- SVG viewBox: 100x100
- Slices: Path elements with arc calculations
- Center hole: Circle element (donut chart style)
- Rotation: -90° (start from top)

**Math:**
- Converts data values to angles (360° total)
- Calculates SVG arc paths using trigonometry
- Handles edge case: 360° (full circle) without gaps

**Interactions:**
- Click slice → Calls `onSliceClick(label)`
- Hover → Opacity change

**Empty State:**
- Shows "No Data" message when total is 0

---

### GroupedBarChart

**Location:** Lines 212-244
**Type:** Functional Component
**Purpose:** Stacked bar chart for time-series data

**Props:**
```typescript
interface Props {
    data: Array<{
        label: string;
        total: number;
        segments: Array<{
            label: string;
            value: number;
            color: string;
        }>;
    }>;
    theme: 'light' | 'dark';
    currency: string;
}
```

**Rendering:**
- Each bar: Multiple segments stacked vertically
- Segment height: Proportional to value (normalized to max)
- Labels: Shown below each bar group
- Tooltips: Hover to see segment details

**Features:**
- Horizontal scrolling for many bars
- Group hover effect
- Responsive segment widths (3-4px)
- Minimum height for visibility (4px)

**Empty State:**
- Shows "No Data" message when data array is empty

---

## Utility Functions

### cleanJson

**Location:** Lines 72-77
**Purpose:** Extract JSON from text (strips markdown)

**Signature:**
```typescript
function cleanJson(text: string): string
```

**Logic:**
- Finds first `{` and last `}`
- Returns substring between them
- Fallback: Returns `"{}"` for invalid input

---

### parseStrictNumber

**Location:** Lines 79-83
**Purpose:** Convert any string to integer (strips formatting)

**Signature:**
```typescript
function parseStrictNumber(val: any): number
```

**Logic:**
- Converts to string
- Removes all non-numeric characters
- Parses as integer
- Returns 0 for NaN

**Examples:**
- `"$1,234.56"` → `123456`
- `"42.99"` → `4299`
- `"invalid"` → `0`

---

### getSafeDate

**Location:** Lines 85-90
**Purpose:** Ensure valid ISO date format

**Signature:**
```typescript
function getSafeDate(val: any): string
```

**Logic:**
- Handles Firestore Timestamps
- Validates ISO format with regex
- Returns today's date for invalid input

---

### formatCurrency

**Location:** Lines 92-96
**Purpose:** Format number as currency

**Signature:**
```typescript
function formatCurrency(amount: number, currency: string): string
```

**Implementation:**
```javascript
return new Intl.NumberFormat(
    currency === 'CLP' ? 'es-CL' : 'en-US',
    { style: 'currency', currency, maximumFractionDigits: 0 }
).format(amount);
```

**Examples:**
- `formatCurrency(15000, 'CLP')` → `"$15.000"` (Chilean format)
- `formatCurrency(1599, 'USD')` → `"$1,599"` (US format)

---

### formatDate

**Location:** Lines 98-103
**Purpose:** Format ISO date for display

**Signature:**
```typescript
function formatDate(dateStr: string, format: 'LatAm' | 'US'): string
```

**Logic:**
- Splits ISO date (`YYYY-MM-DD`)
- LatAm: `DD/MM/YYYY`
- US: `MM/DD/YYYY`

---

### exportToCSV

**Location:** Lines 105-114
**Purpose:** Generate and download CSV file

**Signature:**
```typescript
function exportToCSV(data: Transaction[], filename: string): void
```

**CSV Format:**
```csv
Date,Merchant,Alias,Category,Total,Items
2025-11-20,"Walmart","Walmart",Supermarket,45000,12
```

**Process:**
1. Creates CSV header row
2. Maps transactions to CSV rows
3. Escapes double quotes in strings
4. Creates Blob with text/csv MIME type
5. Triggers download via temporary `<a>` element

---

### Color Utilities

#### stringToColor

**Location:** Lines 117-123
**Purpose:** Generate consistent color from string (hash function)

**Algorithm:**
- Creates hash from character codes
- Converts to hex color
- Ensures 6-character format

---

#### getColor

**Location:** Lines 125-134
**Purpose:** Get predefined or generated color for category

**Preset Colors:**
```javascript
{
    Supermarket: '#3b82f6',    // Blue
    Restaurant: '#f97316',     // Orange
    Bakery: '#eab308',         // Yellow
    Butcher: '#ef4444',        // Red
    Bazaar: '#8b5cf6',         // Purple
    Veterinary: '#10b981',     // Green
    PetShop: '#14b8a6',        // Teal
    Medical: '#06b6d4',        // Cyan
    Pharmacy: '#6366f1',       // Indigo
    Technology: '#64748b',     // Slate
    StreetVendor: '#f43f5e',   // Pink
    Transport: '#84cc16',      // Lime
    Services: '#0ea5e9',       // Sky
    Other: '#94a3b8'           // Gray
}
```

**Fallback:** Calls `stringToColor()` for unknown categories

---

## API Functions

### analyzeWithGemini

**Location:** Lines 137-157
**Purpose:** Call Gemini AI API to analyze receipt

**Signature:**
```typescript
async function analyzeWithGemini(
    images: string[],
    currency: string
): Promise<ExtractedReceipt>
```

**Process:**
1. Converts base64 images to Gemini format
2. Builds prompt with context (currency, date)
3. Sends POST request to Gemini API
4. Extracts JSON from response
5. Returns parsed receipt data

**Error Handling:**
- Throws error if no candidates in response
- JSON parse errors propagate to caller

---

## Localization

### TRANSLATIONS Object

**Location:** Lines 247-250
**Purpose:** Multi-language support

**Structure:**
```typescript
const TRANSLATIONS: {
    [lang: string]: {
        [key: string]: string;
    };
}
```

**Supported Languages:**
- `en` - English
- `es` - Spanish (Español)

**Usage:**
```javascript
const t = (key) => TRANSLATIONS[lang][key] || key;

// In JSX
<h1>{t('overview')}</h1>
```

**Translation Keys:** (50+ keys)
- UI Labels: `overview`, `welcome`, `totalSpent`, etc.
- Actions: `save`, `update`, `delete`, `export`, etc.
- Views: `home`, `trends`, `settings`, `history`, etc.

---

## Constants

### STORE_CATEGORIES

**Location:** Lines 44-48
**Type:** String array
**Purpose:** Predefined store types for classification

**Values:**
```javascript
[
    'Supermarket', 'Restaurant', 'Bakery', 'Butcher',
    'Bazaar', 'Veterinary', 'PetShop', 'Medical',
    'Pharmacy', 'Technology', 'StreetVendor',
    'Transport', 'Services', 'Other'
]
```

---

### ITEMS_PER_PAGE

**Location:** Line 50
**Value:** `20`
**Purpose:** Pagination size for history view

---

## Component Dependencies

### External Imports

```javascript
// React
import React, { useState, useEffect, useRef, Component } from 'react';

// Icons (Lucide React)
import { Camera, Plus, Trash2, Save, ... } from 'lucide-react';

// Firebase Auth
import {
    getAuth, onAuthStateChanged, GoogleAuthProvider,
    signInWithPopup, signOut
} from 'firebase/auth';

// Firebase Firestore
import {
    getFirestore, collection, addDoc, onSnapshot,
    deleteDoc, doc, serverTimestamp, updateDoc, getDocs
} from 'firebase/firestore';

// Firebase Core
import { initializeApp } from 'firebase/app';
```

### Internal Dependencies

Component interdependencies:
- `MainApp` depends on all utility functions
- `Nav` requires `view` state from `MainApp`
- Charts receive computed data from `getTrendsData()`
- All views access shared state via props/context

---

## Component Count Summary

| Type | Count |
|------|-------|
| Class Components | 1 (ErrorBoundary) |
| Functional Components | 5 (App, MainApp, Nav, SimplePieChart, GroupedBarChart, CategoryBadge) |
| View Sections (JSX) | 6 (Dashboard, Scan, Edit, Trends, History, Settings) |
| Utility Functions | 10 (cleanJson, parseStrictNumber, formatCurrency, etc.) |
| API Functions | 1 (analyzeWithGemini) |
| **Total Components** | **23** |

---

## Component Interactions

### State Flow

```
User Action → Event Handler → State Update → Component Re-render
```

**Example: Scan Flow**
1. User clicks "Scan" button
2. `triggerScan()` called
3. Sets `view='scan'`
4. `MainApp` re-renders with `ScanView`
5. File input opened
6. User selects images
7. `handleFileSelect()` called
8. `setScanImages()` updates state
9. Images displayed in grid
10. User clicks "Scan"
11. `processScan()` called
12. `setIsAnalyzing(true)` shows spinner
13. Gemini API called
14. Response parsed
15. `setCurrentTransaction()` with data
16. `setView('edit')` navigates to Edit view

### Navigation Flow

```
Dashboard → Scan → Edit → Dashboard
Dashboard → Trends → (drill-down) → Edit
Dashboard → History → Edit
Dashboard → Settings
```

---

**Generated by BMAD Document Project Workflow**
*Date: 2025-11-20*
