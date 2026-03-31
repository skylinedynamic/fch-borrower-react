# Module-by-Module Technical Documentation: FCH Borrower Portal

This document provides a granular breakdown of the functional modules located in `src/modules`. Each module is designed to handle a specific domain of the application's business logic, decoupling it from the UI components.

---

## 1. Agreement Module (`src/modules/agreement`)

**Purpose:** Manages the legal agreement signing process for borrowers.

- **Key Files:** `services.ts`, `types.ts`, `queries.ts`.
- **Primary Services:**
  - `checkAgreementSign()`: Validates if the current user has any pending agreements to sign before proceeding to other features.
  - `submitAgreementSign(data)`: Transmits the borrower's signature/consent data to the backend.
  - `downloadAgreementSign(userId?)`: Retrieves the signed agreement as a PDF (Blob) for user records.
  - `fetchSignedAgreementHtml(userId?)`: Fetches an HTML snapshot of the signed agreement for in-app preview.
- **Role:** Crucial for compliance; often used in a global layout or logic-gate to prevent further app use until legal requirements are met.

---

## 2. Appointment Module (`src/modules/appointment`)

**Purpose:** Handles the end-to-end appointment booking and management system.

- **Key Files:** `services.ts`, `types.ts`, `queries.ts`.
- **Primary Services:**
  - `fetchAppointments()`: Retrieves all scheduled, past, and upcoming appointments for the user.
  - `createAppointment(payload)` / `updateAppointment(id, payload)`: CRUD operations for meetings.
  - `fetchTimeSlots()`: Retrieves available time windows based on the firm's schedule.
  - `checkAvailability(payload)`: Real-time validation to ensure a selected slot hasn't been taken.
- **Integration:** Powered by `FullCalendar` on the frontend for visual scheduling.

---

## 3. Auth Module (`src/modules/auth`)

**Purpose:** Core authentication and session lifecycle management.

- **Key Files:** `services.ts`, `types.ts`, `queries.ts`.
- **Primary Services:**
  - `login(email, password)`: Authenticates user, stores the JWT, and initializes the `authStore` with profile and subscription data.
  - `registerBorrower(payload)`: Handles new borrower onboarding.
  - `logout()`: Clears local session and invalidates server-side tokens.
  - `forgotPassword()` / `resetPassword()`: Standard password recovery workflows.
- **Role:** Foundation for all `ProtectedRoute` and `RBAC` logic.

---

## 4. Credit Builder Module (`src/modules/credit-builder`)

**Purpose:** A specialized suite of tools to help users build and monitor their credit scores.

### 4.1 Overview (`credit-builder/overview`)

- `fetchCreditProgress()`: Gets overall scores and progress percentages.
- `fetchTaskOverview()`: Summarizes pending actions needed to improve credit.

### 4.2 Guide (`credit-builder/guide`)

- `fetchTierTaskList()`: Retrieves structured tasks organized by "Tiers" (stages of credit building).
- `verifyTierTasks(payload)`: Allows users to submit evidence or request verification for completed tasks.

---

## 5. Dashboard Module (`src/modules/dashboard`)

**Purpose:** Provides the aggregated data view for the landing page after login.

- **Primary Services:** Fetches summary metrics like total alerts, active applications, message count, and upcoming deadlines.
- **Role:** High-level state overview for the borrower.

---

## 6. Documents Module (`src/modules/documents`)

**Purpose:** General document management for the borrower's personal vault.

- **Key Files:** `services.ts`, `types.ts`.
- **Primary Services:**
  - `fetchDocumentTypes()`: List of acceptable documents (e.g., Drivers License, Tax Returns).
  - `fetchBorrowerDocuments()`: Lists all files uploaded by the user.
  - `deleteDocument(id)`: Removes a file from the user's records.
- **Note:** This is distinct from application-specific document uploads.

---

## 7. Funding Application Module (`src/modules/funding-application`)

**Purpose:** The most complex module; handles the multi-step funding request process.

- **Primary Services:**
  - `saveBusinessInfo()` / `fetchBusinessInfo()`
  - `saveOwnershipInfo()` / `fetchOwnershipInfo()`
  - `saveFinancialInfo()` / `fetchFinancialInfo()`
  - `saveFundingRequest()`
  - `saveFederalCompliance()`: Compliance disclosures.
  - `uploadFundingApplicationDocuments()`: Uploads files specifically attached to an active application.
- **Role:** Orchestrates the core business flow of the platform.

---

## 8. Invoice Module (`src/modules/invoice`)

**Purpose:** Management of billing, payments, and financial history.

- **Primary Services:**
  - `fetchInvoices(params)`: Lists all invoices with filtering/searching.
  - `fetchInvoiceStats()`: Summary of paid vs unpaid amounts.
  - `fetchUnpaidInvoices()`: A critical check used to block certain app features if the user has past-due balances.
  - `downloadInvoice(id)`: PDF download of the bill.
- **Integration:** Heavily linked with the `payment` module for processing.

---

## 9. Payment Module (`src/modules/payment`)

**Purpose:** Integration with payment processors.

- **Primary Services:**
  - `processInvoicePayment(payload)`: Initiates a payment transaction.
  - Works closely with `src/lib/stripe.ts` to handle secure card tokenization and submission to the backend.

---

## 10. Pre-Qualification Module (`src/modules/pre-qualification`)

**Purpose:** Initial intake form for potential borrowers.

- **Primary Services:**
  - `submitPersonalInfo()`, `submitBusinessInfo()`, `submitFundingInfo()`: Individual step saves to allow for "resume later" functionality.
  - `submitPreQualification()`: Final submission that triggers backend review.
- **Role:** The entry point for users before they are allowed to create full funding applications.

---

## 11. Profile Module (`src/modules/profile`)

**Purpose:** Management of the user's primary identity and business data.

- **Primary Services:**
  - `fetchProfileCompletion()`: Returns a percentage and list of missing fields to encourage the user to complete their profile.
  - `savePersonalInfo()`, `saveBusinessDetails()`, `saveFinancialInfo()`: Updates the user's master record.

---

## 12. Settings Module (`src/modules/settings`)

**Purpose:** Account configuration and security.

- **Primary Services:** `changePassword(old, new)`.

---

## 13. File Manager Module (`src/modules/filemanager`)

**Purpose:** Generic file handling utility.

- **Role:** Used as a shared service across other modules for standardizing how files are uploaded, renamed, and stored in the backend "media library".

---

## 14. Architecture Patterns (Shared across modules)

1. **`services.ts`**: Pure async functions using `apiClient` (Axios). No React state here.
2. **`queries.ts`**: Utilizes **TanStack Query** (`useQuery`, `useMutation`) to wrap service calls. This provides:
   - Automatic caching.
   - Background re-fetching.
   - Loading/Error states for UI components.
3. **`types.ts`**: TypeScript Interfaces for Request/Response payloads, ensuring type safety throughout the data flow.
4. **`index.ts`**: Centralized exports to keep imports in `pages` clean.
