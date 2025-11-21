Here is a summary of the Expense Tracker application in its current state:

### **App Overview**
This is a **Smart Expense Tracker** designed to automate receipt entry using AI. It focuses on capturing detailed spending data (down to the item level) while providing high-level analytics to track where your money goes over time. It supports **Chilean Pesos (CLP)** and **USD**, with full localization for Spanish and English.

### **What It Does**

1.  **AI Receipt Scanning:**
    * Extracts **Merchant Name**, **Date**, **Total Amount**, and **Line Items** automatically from photos.
    * Intelligently categorizes items into **Broad Groups** (e.g., "Fresh Food", "Household") and specific **Subcategories** (e.g., "Vegetables", "Bleach").
    * Auto-assigns a **Store Category** (e.g., Supermarket, Pharmacy).

2.  **Smart Data Entry:**
    * **Alias System:** Helps group transactions from the same merchant under a common name (e.g., "Starbucks" -> "Coffee"). It learns from your history to autocomplete.
    * **Duplicate Detection:** Warns you if you try to add a receipt with the same date and amount as an existing one.

3.  **Deep Analytics (Trends):**
    * **Hierarchical Drill-Down:** View spending by **Year** $\to$ **Month** $\to$ **Category** $\to$ **Group** $\to$ **Subcategory**.
    * **Interactive Charts:** Toggle between **Pie Charts** (Distribution) and **Grouped Bar Charts** (Timeline comparisons).
    * **CSV Export:** Download specific datasets (monthly or yearly) to Excel/Google Sheets.

4.  **History & Management:**
    * Paginated list of all past transactions.
    * Full editing capabilities to correct AI mistakes or add manual entries.
    * Database management tools (Factory Reset, Repair Data).

---

### **Key Workflows**

#### **1. The Scanning Workflow**
1.  **Capture:** You press the **Scan** button (or Camera icon) and upload one or more photos of a receipt.
2.  **AI Analysis:** The app sends the image to **Google Gemini AI**, which reads the text and structures it into strict JSON data.
    * *Smart Logic:* If multiple dates appear on the receipt, it picks the one closest to **Today**.
3.  **Review:** The app opens the **Edit Screen** pre-filled with the extracted data.
    * You can modify the Merchant, add a custom Alias, or adjust line items.
4.  **Save:** Upon saving, the transaction is stored in **Firebase Firestore**.

#### **2. The Analysis Workflow (Trends)**
1.  **Year View:** Starts by showing your spending for the current year.
    * *Left Column:* Breakdown by Store Category (e.g., Supermarket vs. Restaurant).
    * *Right Column:* Breakdown by Month (Jan vs. Feb).
2.  **Drill Down:**
    * Clicking a **Month** takes you to that specific month's view.
    * Clicking a **Category** filters the data to show specific Groups (e.g., "Pantry" vs "Fresh Food").
    * Clicking a **Group** reveals the specific items (e.g., "Rice" vs "Meat").
3.  **Visualization:** You can switch between seeing *proportions* (Pie) or *trends over time* (Bar) at any level of this hierarchy.

#### **3. The Data Safety Workflow**
* **Auto-Repair:** On load, the app silently checks for corrupted dates or invalid number formats in your database and fixes them to prevent crashes.
* **Safe Mode:** If the database fails to connect, the app catches the error and shows a "Reload" screen instead of a white blank page.
* **Privacy:** Data is stored in a path unique to your User ID; you cannot see others' data, and they cannot see yours.