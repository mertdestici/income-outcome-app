# Income/Expense Application

This will be a mobile-friendly web application. Each heading below corresponds to a separate page.

## Login Page

If the user doesn't have an account, they can navigate to a registration screen. Alternatively, they can sign in using Google, Apple, or similar identity providers.

## Home Page

After logging in, a new screen will appear with the title "Income/Expense". This screen also serves as the home page. The screen will contain 3 boxes:

1. **Income Box** — Shows the user's total income with equivalents in various currencies.
2. **Expense Box** — Shows the total of the user's expenses.
3. **Exchange Rates Box** — Displays TRY/USD, TRY/EUR, and USD/EUR exchange rates, refreshing every 30 seconds.

At the bottom of the screen, there will be 3 buttons:
- **Left button:** "Incomes"
- **Center button:** An oval-shaped button with a plus icon, labeled "Add Expense". Tapping it opens a list with 4 options:
  - "Scan Document"
  - "Add From Photos"
  - "Add From Files"
  - "Add Manual Expense"
- **Right button:** "Expenses"

## Add From Files

The user will have access to the phone's file system and can select one file/photo. After selection, a confirmation screen will open. The screen will show:
- **Top:** File/photo preview
- **Bottom-left:** "Cancel" button
- **Bottom-right:** "Done" button

If the user taps "Cancel", they return to the file/photo selection screen. Tapping "Done" confirms the selection.

## Add From Photos

The user will have access to the phone's photo library and can select one photo. After selection, a confirmation screen will open. The screen will show:
- **Top:** Photo preview
- **Bottom-left:** "Cancel" button
- **Bottom-right:** "Done" button

If the user taps "Cancel", they return to the photo selection screen. Tapping "Done" confirms the selection.

## Scan Document

If the user selects "Scan Document" from the home page, the phone's camera will open, allowing them to take a photo. After taking the photo, a confirmation screen will appear. The screen will show:
- **Top:** Photo preview
- **Bottom-left:** "Retake" button
- **Bottom-right:** "Done" button

If the user taps "Retake", they return to the camera screen. Tapping "Done" confirms the photo.

## Add File/Photo (Post-Confirmation Screen)

After confirming a document (from any of the above flows), a screen will appear containing:
- A **text input** where the user can enter the document name
- A **dropdown list** to select the document type (options: "Receipt" and "Invoice")
- A **Save button** to save the document
- A **close (X) button** in the top-left to cancel the addition

If the confirmed document came from "Add From Files", the file/photo name will appear as the default value in the text input. The dropdown list default value will be "Receipt". Tapping Save will submit the document for OCR processing and navigate to the OCR Review Screen (see below).

## Document OCR Processing

When a document is submitted through any of the three input flows (Scan Document, Add From Photos, Add From Files), it is sent to an AI/ML OCR service in the background. The service attempts to extract the following fields from the document:

- **Vendor / Merchant** — Where the expense was made
- **Date** — When the expense was made
- **Amount** — The total amount of the expense

### Processing State on the Expenses Page

Because OCR runs asynchronously, the following behavior applies:

- **If processing completes within ~2–3 seconds:** A "Processing…" placeholder row is shown immediately on the Expenses page while OCR runs. Once complete, the placeholder is replaced with the actual expense data.
- **If processing takes longer than ~2–3 seconds:** No placeholder is shown. Instead, a notification/toast banner is displayed when processing finishes and the new expense row appears at that point.

### OCR Review Screen

After OCR processing completes, the user is taken to (or notified to open) an **OCR Review Screen**. This screen shows the extracted data in a pre-filled, editable form:

- **Vendor / Merchant** — text input, pre-filled from OCR result
- **Date** — date picker, pre-filled from OCR result
- **Amount** — numeric input, pre-filled from OCR result
- **Currency** — dropdown (TRY, USD, EUR), default: TRY
- **Document Type** — dropdown (Receipt, Invoice), carries forward the value selected earlier
- A **Save button** to confirm and record the expense
- A **close (X) button** in the top-left to cancel without saving

The user can correct any field before tapping Save. Tapping Save records the expense and associates the original document file with it.

## Incomes Page

Accessible by tapping the "Incomes" button (bottom-left) or the income box on the home page. The page title will be "Incomes". To the left of the title, there will be a home icon button that navigates back to the home page.

This page contains two boxes:

1. **Add Income Box** — Contains:
   - A text input for the income title
   - A text input for the income amount
   - A dropdown list for currency type (TRY, USD, EUR — default: TRY)
   - A save button that records the income when tapped

2. **Income List Box** — Displays saved incomes in a 4-column layout:
   - Column 1: Income title
   - Column 2: Amount
   - Column 3: Currency type
   - Column 4: A delete (X) icon button — tapping it removes that income entry

The bottom navigation ("Incomes", "Add Expense", "Expenses") will also be present on this page.

## Expenses Page

Accessible by tapping the "Expenses" button (bottom-right) or the expense box on the home page. The page title will be "Expenses". To the left of the title, there will be a home icon button that navigates back to the home page. In the top-right, there will be a plus (+) button that navigates to the "Add Manual Expense" screen.

Below the title, there will be two dropdown lists for filtering:
- One for **months**
- One for **years**
- Default values: current month and year

Below the filters, a 6-column table will display:
- Column 1: Expense name
- Column 2: Expense date
- Column 3: Expense amount
- Column 4: Currency type
- Column 5: A **View** icon button — visible only for expenses that have an associated document (added via Scan Document, Add From Photos, or Add From Files). Tapping it opens a fullscreen **in-app document preview overlay**. Inside the overlay, a **Download** button allows the user to save the file to their device. This column is empty for manually entered expenses.
- Column 6: A delete (X) icon button — tapping it removes that expense entry

The bottom navigation ("Incomes", "Add Expense", "Expenses") will also be present on this page.

## Add Manual Expense

This screen contains:
- A **text input** for the expense name
- A **text input** for the expense amount
- A **dropdown list** for the currency type
- A **calendar picker** for the expense date
- A **close (X) icon** in the top-left (tapping it cancels the manual expense entry)
- A **Save button** to record the expense

## Monthly PDF Report

On the **20th of each month**, the system automatically compiles all documents uploaded or scanned during that month (from Scan Document, Add From Photos, and Add From Files flows) into a single PDF and emails it to a configurable recipient address.

The recipient email address is configured by the user in the **Settings** page. If no address is set, the monthly report is not sent.

## Settings Page

The app includes a **Settings** page accessible from the home page. It contains:

- **Report Email** — A text input where the user can enter an email address to receive the monthly PDF report (e.g., their accountant's address). If left empty, the monthly report email is disabled.
