# MVP_BUILD_PLAN.md

**Project:** Invora — Offline-first Invoicing & Digital Business Card App
**Status:** Planning contract only. No code, no packages, no UI has been implemented yet beyond the Phase 0 project skeleton already present in this repository.
**Purpose of this document:** This is the master implementation contract for the project. Every future implementation phase must conform to this document. Any change to architecture, scope, or data model requires an explicit update to this file before code changes are made.

---

## 1. Product Overview

Invora is a lightweight, offline-first mobile application for small businesses (1–20 employees) in the USA, UK, and Europe. It combines two core functions in a single app:

1. **Professional invoicing** — create, manage, and share invoices; track customers, items, and payments.
2. **Digital business card** — a shareable, QR-based professional profile for the business.

The app is designed to feel fast, simple, and professional — usable by non-accountants — while remaining modular enough to support new invoice types and features over time without architectural rewrites.

Design priorities, in order: **offline reliability → simplicity → speed → professionalism → extensibility.**

---

## 2. MVP Scope

The MVP includes:

- Business profile setup (identity, branding, tax info, invoice numbering)
- Digital business card generation, QR code, and link/social sharing
- Customer management (CRUD, balance, history)
- Item management (CRUD, per invoice-type fields)
- Configurable invoice types (General, Quantity, Weight, Dimension, Custom)
- Invoice creation, editing, review, and detail view
- Payment recording (multiple partial payments per invoice)
- Automatic invoice status calculation (Paid / Partial / Unpaid / Overdue)
- Customer balance derived from invoices + payments
- Dashboard with sales totals, outstanding/overdue amounts, recent invoices
- PDF generation and sharing (WhatsApp, Email, generic share sheet, share link)
- Local SQLite persistence — fully functional offline
- Manual and automatic backup to the user's own Google Drive
- Restore from Google Drive backup
- Basic settings (currency, tax defaults, invoice template, numbering, backup)

## 3. Explicit Non-MVP Features

The following are **out of scope** for MVP and must not be built unless explicitly requested later:

- Online payment processing / payment gateways (Stripe, PayPal checkout, etc.)
- Multi-user accounts, roles, permissions, or team collaboration
- Real-time multi-device sync / conflict resolution
- Server-hosted backend or REST API of our own
- Complex analytics, charts, or BI dashboards
- Recurring/subscription invoices, estimates/quotes, purchase orders
- Multi-currency conversion within a single invoice
- Inventory/stock management beyond simple item catalog fields
- Accounting features (ledgers, journals, tax filing, double-entry bookkeeping)
- Paid cloud backup billing/metering implementation (structure only, no billing logic)
- Public web storefront or e-commerce
- Localization/i18n infrastructure beyond currency formatting (translations later)
- Push notifications / reminders engine
- Any AI-generated content features

---

## 4. Technology Stack

Invora is a **100% React Native** app — Expo/TypeScript end to end, no other mobile framework involved. Every architectural choice below is made against two goals: the app must **feel fast** (instant navigation, no jank on low-end Android hardware) and **scale cleanly** as a business's data grows (thousands of invoices/customers/items over years of use), without turning into a heavy app.

| Layer | Choice | Notes |
|---|---|---|
| Framework | React Native via **Expo** (managed workflow, SDK 57) | Cross-platform, mobile-first; Expo chosen so the app can be run/verified (Expo Go / web) without a full native Android/Xcode toolchain installed. Consult the versioned Expo v57 docs before writing any Expo-API code. |
| Language | TypeScript (strict mode) | |
| Local database | **SQLite via `expo-sqlite`**, accessed through **Drizzle ORM** (`drizzle-orm/expo-sqlite` + `drizzle-kit`) | Schema-first, type-safe queries and versioned migrations, with indexed columns on high-traffic lookups (see Scalability notes below). Introduced in Phase 20; a repository layer sits on top so UI code never imports Drizzle/SQLite directly. |
| State management | **Zustand** | Small, testable, dependency-injection-friendly stores; no heavy Context boilerplate |
| Navigation | **React Navigation** (`@react-navigation/bottom-tabs` + `@react-navigation/native-stack`) | Persistent bottom-nav shell with per-tab nested stacks, plus a root stack for full-screen flows |
| PDF generation | `expo-print` (+ HTML templates) | Local, offline-capable PDF rendering & print |
| QR generation | `react-native-qrcode-svg` | Fully offline, on-device rendering |
| File/share | `expo-sharing` + `expo-file-system` | Share PDF, links, business card; local file read/write |
| Google Drive backup | `expo-auth-session` (or `@react-native-google-signin/google-signin`) + Google Drive REST API | Only for backup/restore, never as live DB |
| Secure token storage | `expo-secure-store` | For any OAuth/refresh tokens persisted for Drive access (Phase 22) |
| Image handling | `expo-image-picker` (+ light compression) | Business logo |
| Dependency injection | Zustand stores + a plain factory module (`src/app/di/providers.ts`); no separate DI framework | Keeps footprint light |
| Testing | `jest`, `@testing-library/react-native`, in-memory/mocked SQLite for repository tests | |

**Dependency policy:** Do not add a package unless it is required to implement a phase's stated objective. No experimental/unmaintained packages. No heavy animation, charting, or analytics SDKs.

**Performance & scalability principles (apply from Phase 0 onward, not retrofitted later):**

- **Lists:** every list screen (Invoices, Customers, Items, Customer History) uses `FlatList`/`FlashList`-style virtualization with pagination or windowed queries — never render an entire table into memory/DOM at once, even in mock-data phases (structure the mock data source to support `limit`/`offset` from day one so swapping to SQLite in Phase 20 changes nothing).
- **Database:** index `Invoice.customerId`, `Invoice.status`, `Invoice.dueDate`, `InvoiceItem.invoiceId`, and `Payment.invoiceId` at schema-definition time (Phase 20); dashboard/list queries aggregate in SQL, not by pulling all rows into JS and reducing client-side.
- **State:** Zustand selectors are scoped narrowly (subscribe to the slice a component needs) to avoid unnecessary re-renders on unrelated state changes; large lists keep raw records out of component state and read them via selectors backed by the store.
- **Navigation/bundle:** screens are function components with no unnecessary top-level heavy imports; defer loading of rarely-used modules (PDF builder, QR renderer, Google Drive SDK) until their screen/action is actually invoked rather than at app startup.
- **Startup:** app must be interactive quickly — DB migrations and any first-run seeding run asynchronously behind a lightweight splash/loading state, never a synchronous blocking call in `App.tsx`.
- **Footprint:** prefer built-in Expo/React Native primitives over adding a library; every dependency is evaluated against its bundle-size and maintenance cost before being added (per the dependency policy above).

---

## 5. Folder / Project Architecture

Clean, layered architecture. Feature-first folders at the top level, each internally layered into `domain` / `data` / `presentation`. This matches the scaffold already present under `src/`.

```
src/
  app/
    App.tsx                      # root component: providers + navigation container
    navigation/
      AppNavigator.tsx           # React Navigation config, bottom-tab shell + nested stacks + root stack
    theme/
      theme.ts
      colors.ts
      typography.ts
    di/
      providers.ts               # top-level store/repository wiring (mock -> sqlite swap happens only here)

  core/
    constants/
      invoiceFieldVocabulary.ts  # shared field-key vocabulary, grouped: item details, pricing/calculations, measurements (Section 27)
    utils/
      currencyFormatter.ts
      dateFormatter.ts
      idGenerator.ts
    errors/
      failures.ts
      exceptions.ts
    result/
      result.ts                  # Result<T> success/failure wrapper
    components/                  # shared dumb UI components
      AppButton.tsx
      AppTextField.tsx
      EmptyState.tsx
      LoadingState.tsx
      ErrorState.tsx
      ConfirmationDialog.tsx

  features/
    business/
      domain/
        entities/
        usecases/
        repositories/            # interfaces only
      data/
        repositories/            # mock*Repository.ts (early), sqlite*Repository.ts (Phase 20+)
        datasources/
          local/                 # SQLite-backed (Phase 20+)
          mock/                  # in-memory datasource for early phases
      presentation/
        screens/
        components/
        state/                   # Zustand stores

    invoiceType/   domain/ data/ presentation/  (same pattern)
    customer/      domain/ data/ presentation/
    item/          domain/ data/ presentation/
    invoice/       domain/ data/ presentation/
    payment/       domain/ data/ presentation/
    digitalCard/   domain/ data/ presentation/
    dashboard/     domain/ data/ presentation/

    backup/
      domain/ data/ presentation/
        data/datasources/remote/googleDriveDataSource.ts
        data/datasources/remote/cloudBackupDataSource.ts (interface only, MVP stub)

    settings/      domain/ data/ presentation/

  database/
    schema/
      businessTable.ts
      invoiceTypeTable.ts
      customerTable.ts
      itemTable.ts
      invoiceTable.ts
      invoiceItemTable.ts
      paymentTable.ts
      socialLinkTable.ts
      appSettingsTable.ts
      backupLogTable.ts
      index.ts                   # barrel export -> combined schema object passed to drizzle()
    client.ts                    # expo-sqlite handle + drizzle() wrapper (Phase 20)
    migrations/                  # drizzle-kit generated SQL migrations
    seed.ts                      # first-run seed: 5 system InvoiceTypes

  pdf/
    invoicePdfBuilder.ts
    templates/

App.tsx                          # Expo entry re-export of src/app/App.tsx
```

**Rule:** Every feature has `domain` (pure TypeScript, no React Native/SQLite imports), `data` (repository implementations + datasources, mock and local), and `presentation` (UI + Zustand state). UI never imports SQLite/Drizzle or datasource code directly — only repository interfaces via stores wired in `app/di/providers.ts`.

---

## 6. Database Architecture

- Engine: SQLite, accessed exclusively through **`expo-sqlite`**, wrapped by **Drizzle ORM** (`drizzle-orm/expo-sqlite`) for schema definition and type-safe queries, with **`drizzle-kit`** generating versioned SQL migrations.
- One schema module (`src/database/schema/`) with one table definition per entity; `src/database/client.ts` bootstraps the `expo-sqlite` handle and wraps it with `drizzle()`.
- Unlike a reactive-streams ORM, `expo-sqlite`/Drizzle has no built-in live query subscriptions. Reactivity for the UI (dashboard totals, invoice list, customer balance) is implemented explicitly at the repository/store boundary: write methods return the affected data, and the calling Zustand store re-fetches/updates its own state after every write — never implicit, always an explicit call.
- All writes go through repository methods, never directly from UI/components.
- Migrations run on app startup, before any screen mounts; schema version is tracked and each migration step documented.
- The local database is the **single source of truth**. The app must be fully operable with zero network connectivity.
- Google Drive/cloud are backup **targets only** — never queried live by the app for normal operation.

---

## 7. Entity Definitions

### Business
| Field | Type | Notes |
|---|---|---|
| id | text (uuid) PK | |
| name | text | required |
| logoPath | text, nullable | local file path |
| address | text, nullable | |
| phone | text, nullable | |
| email | text, nullable | |
| website | text, nullable | |
| currencyCode | text | e.g. USD, GBP, EUR |
| taxNumber | text, nullable | VAT/Tax ID |
| invoicePrefix | text | e.g. "INV-" |
| nextInvoiceNumber | integer | auto-incrementing counter |
| defaultInvoiceTypeId | text, nullable FK → InvoiceType | |
| createdAt / updatedAt | datetime | |

### InvoiceType
| Field | Type | Notes |
|---|---|---|
| id | text PK | |
| name | text | "General", "Quantity", "Weight", "Dimension", "Custom", or user-defined |
| isSystemDefined | boolean | true for the 5 built-ins |
| enabledFields | text (JSON array) | which item fields apply: quantity, unit, weight, length, width, height, discount, tax |
| createdAt / updatedAt | datetime | |

### Customer
| Field | Type | Notes |
|---|---|---|
| id | text PK | |
| name | text | required |
| phone | text, nullable | |
| email | text, nullable | |
| address | text, nullable | |
| notes | text, nullable | |
| createdAt / updatedAt | datetime | |

> Customer balance and history are **derived**, not stored columns.

### Item
| Field | Type | Notes |
|---|---|---|
| id | text PK | |
| name | text | required |
| description | text, nullable | |
| sku | text, nullable | |
| unit | text, nullable | e.g. pcs, kg, m |
| defaultPrice | real | |
| taxRate | real, nullable | percentage |
| weight | real, nullable | |
| length / width / height | real, nullable | |
| invoiceTypeId | text, nullable FK → InvoiceType | which type this item is intended for |
| createdAt / updatedAt | datetime | |

### Invoice
| Field | Type | Notes |
|---|---|---|
| id | text PK | |
| invoiceNumber | text | generated from business prefix + counter |
| customerId | text FK → Customer | |
| invoiceTypeId | text FK → InvoiceType | |
| issueDate | datetime | |
| dueDate | datetime, nullable | |
| subtotal | real | computed at save time, stored as snapshot |
| discountTotal | real | |
| taxTotal | real | |
| total | real | |
| notes | text, nullable | |
| terms | text, nullable | |
| status | text (enum: unpaid/partial/paid/overdue) | recalculated, stored for fast querying |
| createdAt / updatedAt | datetime | |

### InvoiceItem
| Field | Type | Notes |
|---|---|---|
| id | text PK | |
| invoiceId | text FK → Invoice | |
| itemId | text, nullable FK → Item | nullable so item deletion never breaks history |
| **itemNameSnapshot** | text | copied at creation time |
| **itemDescriptionSnapshot** | text, nullable | copied at creation time |
| **itemSkuSnapshot** | text, nullable | copied at creation time |
| **unitSnapshot** | text, nullable | |
| quantity | real, nullable | |
| weight | real, nullable | |
| length / width / height | real, nullable | |
| unitPrice | real | snapshot of price used |
| discount | real, nullable | |
| taxRate | real, nullable | snapshot |
| lineTotal | real | computed and stored |
| createdAt | datetime | |

> **Historical integrity rule:** InvoiceItem never re-reads live Item data for display. All descriptive fields are snapshotted at invoice-creation time so later edits/renames/deletes of an Item do not alter historical invoices.

### Payment
| Field | Type | Notes |
|---|---|---|
| id | text PK | |
| invoiceId | text FK → Invoice | |
| amount | real | required |
| paymentDate | datetime | |
| method | text (enum: cash/bank_transfer/card/paypal/other) | |
| reference | text, nullable | |
| notes | text, nullable | |
| createdAt | datetime | |

### SocialLink
| Field | Type | Notes |
|---|---|---|
| id | text PK | |
| businessId | text FK → Business | |
| platform | text (enum: whatsapp/facebook/instagram/google_maps/website/other) | |
| url | text | |
| createdAt | datetime | |

### AppSettings
| Field | Type | Notes |
|---|---|---|
| id | text PK (singleton row) | |
| defaultCurrency | text | |
| defaultTaxRate | real, nullable | |
| invoiceTemplateId | text | selected PDF template |
| backupFrequency | text (enum: manual/daily/weekly) | |
| lastBackupAt | datetime, nullable | |
| cloudBackupEnabled | boolean | default false |
| updatedAt | datetime | |

### BackupLog
| Field | Type | Notes |
|---|---|---|
| id | text PK | |
| type | text (enum: google_drive/cloud/local_export) | |
| direction | text (enum: backup/restore) | |
| status | text (enum: success/failed/in_progress) | |
| fileName | text, nullable | |
| sizeBytes | integer, nullable | |
| errorMessage | text, nullable | |
| createdAt | datetime | |

---

## 8. Entity Relationships

- Business (1) → (many) SocialLink
- Business (1) → (many) InvoiceType (custom types belong to a business; system types are global defaults)
- Business (1) → (many) Customer
- Business (1) → (many) Item
- Business (1) → (many) Invoice
- InvoiceType (1) → (many) Item
- InvoiceType (1) → (many) Invoice
- Customer (1) → (many) Invoice
- Invoice (1) → (many) InvoiceItem
- Item (1) → (many) InvoiceItem (nullable FK — survives item deletion)
- Invoice (1) → (many) Payment
- AppSettings and Business: effectively 1:1 (singleton settings row referencing active business in MVP; multi-business is a future concern, not MVP)
- BackupLog: standalone audit table, no FK required (may optionally reference Business)

ER summary (textual):

```
Business 1---* Customer 1---* Invoice 1---* InvoiceItem *---1 Item (nullable)
Business 1---* Item
Business 1---* InvoiceType 1---* Invoice
Business 1---* SocialLink
Invoice 1---* Payment
```

---

## 9. Repository Architecture

- One repository **interface** per feature domain, defined in `domain/repositories/`, e.g. `CustomerRepository`, `InvoiceRepository`, `PaymentRepository`, `BusinessRepository`, `ItemRepository`, `BackupRepository`.
- Two implementations per repository during the build:
  - `mock*Repository.ts` (in-memory, used during screen-building phases)
  - `sqlite*Repository.ts` (real, backed by Drizzle queries against `src/database/schema`, introduced in the database phase)
- Presentation layer depends only on the repository **interface**, resolved through the factory wiring in `src/app/di/providers.ts` and consumed via Zustand stores. Swapping mock → SQLite is a one-line change in `providers.ts`, requiring no UI changes.
- Repositories return domain entities (not raw Drizzle row types) and use a `Result<T>`/failure wrapper for error handling rather than throwing raw exceptions into the UI.
- Cloud-related repositories (`GoogleDriveBackupRepository`, `CloudBackupRepository`) are likewise interfaces with a stub/no-op implementation until their phase, keeping cloud concerns fully behind the same pattern.

---

## 10. State-Management Architecture

- **Zustand** throughout: one store per feature-level concern (e.g. `useInvoiceListStore`, `useInvoiceFormStore`, `useCustomerDetailStore`, `useDashboardStore`), created with `create<State & Actions>()`.
- State is organized per feature, mirroring the repository split: a store calls into its feature's repository (via `providers.ts`) and exposes state + actions to screens.
- Derived/computed values (customer balance, invoice status, dashboard totals) are implemented as **pure domain use-case functions** (`domain/usecases/`), called from store actions or selector hooks — never computed inline inside components.
- Form state (invoice creation, customer creation, item creation) uses dedicated "form stores" holding draft state, separate from the persisted-list stores.
- No business logic inside components; components only read store state via selector hooks and dispatch intents (call store actions).

---

## 11. Offline Architecture

- SQLite is local-first and requires no network; all core flows (listed in the product spec's Offline Requirement) function fully offline.
- No feature required for core invoicing/customer/payment/dashboard/PDF/QR/business-card flows may depend on a network call.
- Network-dependent features (Google Drive backup, cloud backup, account/subscription, share-link server operations) are isolated behind their own repositories and screens, and their absence/failure must never block or degrade the offline flows.
- Connectivity checks (where needed, e.g. before attempting a Drive backup) are handled at the repository/service boundary, not scattered through UI.

---

## 12. Backup Architecture

- Backup = exporting the local SQLite state (or a structured export derived from it) to an external destination. It is **not** a live sync mechanism.
- Two backup channels, both behind `BackupRepository`-family interfaces:
  1. Google Drive (user's own account) — MVP.
  2. Optional paid cloud backup — architecture stubbed only in MVP, not implemented end-to-end.
- Every backup/restore attempt is recorded in `BackupLog` (status, timestamp, size, errors) for user-visible history and troubleshooting.
- Restore is a destructive operation on local data and must always go through an explicit confirmation step (see Section 33).

---

## 13. Google Drive Backup Strategy

- Uses the user's personal Google Drive via OAuth (`expo-auth-session` or `@react-native-google-signin/google-signin`) — app-scoped app-data or a visible app folder (decision left to Phase 22, defaulting to a visible "Invora Backups" folder for transparency).
- **Manual backup:** user-triggered from Settings/Backup screen; exports DB snapshot, uploads, logs result.
- **Automatic backup:** runs on a schedule (daily/weekly, per `AppSettings.backupFrequency`) when the app is opened and connectivity is available; never blocks app startup — runs as a background-safe task after UI is interactive.
- **Restore:** lists available backups from Drive by date, user selects one, confirms, app restores into local DB (with pre-restore safety copy, see Section 33).
- Drive access failures (auth expired, quota, offline) must degrade gracefully: show a clear status/error, never crash, never touch local data.

---

## 14. Cloud Backup Strategy (Optional, Paid — Architecture Only in MVP)

- Represented by a `CloudBackupRepository` interface and a "Storage usage" UI placeholder in Settings, but **no working implementation, billing, or server integration in MVP**.
- Design intent for later phases: a metered storage backend, billed separately from the core app; kept entirely behind the same repository abstraction used for Google Drive so it can be added without touching invoicing/customer/payment code.
- Must not be wired into any critical path; its absence must not affect any other feature.

---

## 15. Navigation Architecture

- **React Navigation**: a bottom-tab navigator (`@react-navigation/bottom-tabs`) as the persistent shell, wrapping four top-level tabs:
  1. Dashboard
  2. Invoices
  3. Customers
  4. Business
- Each tab owns its own nested native-stack navigator (`@react-navigation/native-stack`) so switching tabs preserves that tab's navigation state.
- Full-screen flows that don't belong to a tab (Welcome/Setup, Create Business, the Invoice creation wizard, Backup & Restore, Settings, the full-screen QR view, the Invoice Sharing sheet) are pushed as screens on a root stack that wraps the tab navigator (shown modally or full-screen as appropriate).
- Typed navigation params (TypeScript param-list types per stack) are used for type safety across the whole app.
- No server-side deep linking is required in MVP, but route names are kept stable/predictable to keep the door open for a future share-link deep link.

---

## 16–20. Complete Screen Inventory (Purpose, Components, Required Data, Interactions)

> Format per screen: **Purpose** · **Key components** · **Required data** · **Interactions**

### 1. Welcome / Setup
- **Purpose:** First-run entry point; introduces the app and starts business setup.
- **Components:** Branding/logo, short value-prop text, "Get Started" CTA.
- **Required data:** None (static).
- **Interactions:** Tap "Get Started" → Create Business screen.

### 2. Create Business
- **Purpose:** Capture initial business profile so invoicing/business-card can function.
- **Components:** Logo picker, name field, address/phone/email/website fields, currency selector, tax number field, invoice prefix field.
- **Required data:** Business entity (draft, unsaved).
- **Interactions:** Save → persists Business, navigates to Dashboard (first-run) or Invoice Type Selection if numbering/type not yet chosen.

### 3. Dashboard
- **Purpose:** At-a-glance business health.
- **Components:** Summary cards (Total sales, Paid, Outstanding, Overdue), invoice count, recent invoices list, quick-action buttons (New Invoice, New Customer, View Business Card).
- **Required data:** Aggregated invoice/payment totals, recent Invoice list.
- **Interactions:** Tap card → filtered invoice list; tap recent invoice → Invoice Detail; quick actions → respective creation flows.

### 4. Business / Company
- **Purpose:** View/edit business profile; entry point to related settings.
- **Components:** Profile summary, edit button, links to Invoice Type Selection, Digital Business Card, Settings, Backup & Restore.
- **Required data:** Business entity, SocialLinks.
- **Interactions:** Edit → editable Create-Business-style form; navigate to sub-screens.

### 5. Invoice Type Selection
- **Purpose:** Choose/manage which invoice type(s) the business uses.
- **Components:** List of types (General/Quantity/Weight/Dimension/Custom) with description of fields, radio/checkbox selection, "Create Custom Type" entry.
- **Required data:** InvoiceType list.
- **Interactions:** Select default type; tap Custom → Custom Invoice Type screen.

### 6. Custom Invoice Type
- **Purpose:** Let owner define which item fields apply for a custom type.
- **Components:** Field toggle list (quantity, unit, weight, dimensions, discount, tax), name field for the custom type.
- **Required data:** Draft InvoiceType with `enabledFields`.
- **Interactions:** Save → persists new InvoiceType, returns to Invoice Type Selection.

### 7. Items List
- **Purpose:** Browse/search/manage item catalog.
- **Components:** Search bar, list/grid of items (name, price, type), FAB "Add Item".
- **Required data:** Item list.
- **Interactions:** Tap item → edit (Create Item screen in edit mode); FAB → Create Item.

### 8. Create Item
- **Purpose:** Add or edit a catalog item.
- **Components:** Name, description, SKU, unit, price, tax, weight/dimension fields (conditionally shown based on invoice type), invoice-type selector.
- **Required data:** Draft Item, InvoiceType list (for field visibility).
- **Interactions:** Save → persists Item; Cancel → discard.

### 9. Customers List
- **Purpose:** Browse/search customers.
- **Components:** Search bar, list (name, balance badge), FAB "Add Customer".
- **Required data:** Customer list with computed balances.
- **Interactions:** Tap customer → Customer Detail; FAB → Create Customer.

### 10. Create Customer
- **Purpose:** Add or edit a customer.
- **Components:** Name, phone, email, address, notes fields.
- **Required data:** Draft Customer.
- **Interactions:** Save → persists Customer.

### 11. Customer Detail
- **Purpose:** Overview of one customer's relationship with the business.
- **Components:** Contact info, outstanding balance, quick actions (New Invoice, Record Payment), tabs/links to invoice list and history.
- **Required data:** Customer, computed balance, recent Invoices.
- **Interactions:** Tap invoice → Invoice Detail; tap "History" → Customer History; Edit → Create Customer (edit mode).

### 12. Customer History
- **Purpose:** Full chronological invoice + payment history for a customer.
- **Components:** Combined timeline/list of invoices and payments, filters (date range, status).
- **Required data:** All Invoices + Payments for the customer.
- **Interactions:** Tap entry → Invoice Detail or payment detail.

### 13. Invoice List
- **Purpose:** Browse/search/filter all invoices.
- **Components:** Search bar, status filter chips (All/Paid/Partial/Unpaid/Overdue), list rows (number, customer, total, status badge), FAB "New Invoice".
- **Required data:** Invoice list with computed status.
- **Interactions:** Tap invoice → Invoice Detail; FAB → Create Invoice - Customer.

### 14. Create Invoice — Customer
- **Purpose:** Step 1 of invoice creation: pick or create the customer and set invoice metadata.
- **Components:** Customer search/select, "New Customer" inline option, invoice date, due date, invoice type selector.
- **Required data:** Customer list, InvoiceType list, next invoice number preview.
- **Interactions:** Next → Create Invoice - Items.

### 15. Create Invoice — Items
- **Purpose:** Step 2: add line items, with fields conditional on selected invoice type.
- **Components:** Item picker/search, add-line form (fields per invoice type: qty/unit/weight/dimensions/price/discount/tax), running subtotal.
- **Required data:** Item catalog, selected InvoiceType's enabled fields, draft InvoiceItem list.
- **Interactions:** Add line, edit line, remove line, Next → Invoice Review.

### 16. Invoice Review
- **Purpose:** Final check before saving — totals, notes, terms.
- **Components:** Line-item summary, subtotal/discount/tax/total breakdown, notes/terms fields, Save button.
- **Required data:** Full draft Invoice + InvoiceItems.
- **Interactions:** Edit (back to Items/Customer step), Save → persists Invoice + InvoiceItems (with snapshots), navigates to Invoice Detail.

### 17. Invoice Detail
- **Purpose:** View a saved invoice; central hub for payment/sharing actions.
- **Components:** Header (number, status badge, customer), line items, totals, payment history summary, action buttons (Record Payment, Share, Edit, PDF).
- **Required data:** Invoice, InvoiceItems, Payments, computed status/remaining balance.
- **Interactions:** Record Payment → Record Payment screen; Share → Invoice Sharing; Edit → Create Invoice flow (edit mode).

### 18. Record Payment
- **Purpose:** Log a payment against an invoice.
- **Components:** Amount field (with remaining-balance hint), date picker, method selector, reference/notes fields.
- **Required data:** Invoice total, sum of existing Payments, remaining balance.
- **Interactions:** Save → persists Payment, recalculates Invoice status, returns to Invoice Detail.

### 19. Invoice Sharing
- **Purpose:** Export/share an invoice.
- **Components:** Generate PDF action, share targets (WhatsApp, Email, generic share sheet), copy share-link option.
- **Required data:** Invoice + InvoiceItems + Business branding for PDF rendering.
- **Interactions:** Tap target → OS share sheet / deep link with generated PDF or link.

### 20. Digital Business Card
- **Purpose:** Present the business as a shareable digital card.
- **Components:** Logo, name, contact info, social/action buttons (WhatsApp, Facebook, Instagram, Google Maps), Share and QR buttons.
- **Required data:** Business, SocialLinks.
- **Interactions:** Tap social icon → opens respective app/link; Share → share sheet; QR → QR Code screen.

### 21. QR Code
- **Purpose:** Full-screen QR for the business card/share link.
- **Components:** Large QR code, business name/logo, save/share buttons.
- **Required data:** Encoded share-link or vCard-style payload.
- **Interactions:** Save to gallery, share QR image.

### 22. Backup & Restore
- **Purpose:** Manage data safety.
- **Components:** Last backup status, manual "Backup Now" button, backup frequency selector, "Restore" entry, backup history list (from BackupLog), cloud storage usage placeholder.
- **Required data:** AppSettings, BackupLog list.
- **Interactions:** Backup Now → triggers Google Drive backup flow; Restore → confirmation → restore flow.

### 23. Settings
- **Purpose:** App-level configuration.
- **Components:** Currency, tax defaults, invoice numbering, invoice template selector link, backup link, about/version info.
- **Required data:** AppSettings, Business.
- **Interactions:** Change setting → persists immediately or on Save.

### 24. Invoice Template Selection
- **Purpose:** Choose the visual PDF template.
- **Components:** Template thumbnails/previews, select action.
- **Required data:** Available template identifiers, Business branding for live preview.
- **Interactions:** Select → persists `invoiceTemplateId` in AppSettings.

### 25. Empty States
- **Purpose:** Consistent "nothing here yet" treatment across lists (no customers, no invoices, no items, no backups).
- **Components:** Icon/illustration (simple, no heavy animation), message, primary CTA.
- **Required data:** Context (which list is empty).
- **Interactions:** CTA → relevant creation screen.

### 26. Loading States
- **Purpose:** Consistent loading treatment for async operations (list fetch, PDF generation, backup/restore).
- **Components:** Skeleton/list placeholder or spinner + label, non-blocking where possible.
- **Required data:** N/A.
- **Interactions:** None (may allow cancel where applicable, e.g. long backup).

### 27. Error States
- **Purpose:** Consistent error treatment (DB error, backup failure, PDF generation failure).
- **Components:** Icon, message, retry button, secondary "dismiss"/"details" action.
- **Required data:** Error/failure message from Result wrapper.
- **Interactions:** Retry → re-attempt the failed operation.

### 28. Confirmation Dialogs
- **Purpose:** Guard destructive/irreversible actions (delete customer/item, restore backup, delete invoice).
- **Components:** Title, explanatory body, Cancel/Confirm buttons (Confirm styled as destructive where relevant).
- **Required data:** Context-specific message.
- **Interactions:** Confirm → proceeds; Cancel → dismiss, no side effects.

---

## 21. Which Data Is Local

All of the following live exclusively in the local SQLite database and are fully available offline:

- Business profile, logo, social links
- InvoiceTypes (system + custom)
- Customers and computed balances/history
- Items
- Invoices and InvoiceItems (with snapshots)
- Payments
- AppSettings
- BackupLog (the log itself is local; only the backup payload travels to Drive/cloud)
- Generated PDFs (cached locally after generation)
- QR code data (generated on-device from local data)

## 22. Which Data Is Cloud-Only

Nothing in the core product is "cloud-only" by design — cloud is backup/export, never the primary store. The only cloud-touching concerns are:

- The **uploaded backup file itself**, sitting in the user's Google Drive
- Optional paid cloud backup storage (stubbed, not implemented in MVP)
- Any future account/subscription/entitlement state (not in MVP)
- Share-link resolution, **only if** a public link-based sharing mechanism requiring a server is added later (not required for MVP; MVP sharing can rely on file/PDF share instead of a hosted link)

---

## 23. Invoice Calculation Rules

For each InvoiceItem:
```
lineSubtotal = quantity_or_equivalent * unitPrice
  (quantity_or_equivalent depends on invoice type:
     General/Quantity  -> quantity
     Weight             -> weight
     Dimension          -> quantity * length * width * height  [or quantity, per Custom Invoice Type config]
     Custom             -> per configured fields)
lineDiscount = discount (flat amount or % per item config; MVP: flat amount OR percentage, chosen consistently per item)
lineTaxable  = lineSubtotal - lineDiscount
lineTax      = lineTaxable * (taxRate / 100)
lineTotal    = lineTaxable + lineTax
```

For the Invoice:
```
subtotal      = sum(lineSubtotal for all InvoiceItems)
discountTotal = sum(lineDiscount for all InvoiceItems)
taxTotal      = sum(lineTax for all InvoiceItems)
total         = subtotal - discountTotal + taxTotal
```

All monetary calculations use fixed-point-safe arithmetic (avoid raw floating point for money — round consistently to 2 decimal places at the point of storage/display) to prevent rounding drift.

## 24. Payment Calculation Rules

```
totalPaid       = sum(Payment.amount where Payment.invoiceId == invoice.id)
remainingBalance = invoice.total - totalPaid
```

- `Invoice.amountPaid` is never a stored/trusted field on its own — it is always derived live from the Payment table.
- Multiple partial payments are fully supported; no limit on payment count per invoice within MVP.
- A payment cannot be negative; a payment may exceed the remaining balance only with an explicit confirmation (overpayment), recorded as-is (no automatic refund logic in MVP).

## 25. Customer Balance Calculation

```
customerBalance = sum(Invoice.total for all customer's invoices)
                 - sum(Payment.amount for all payments on those invoices)
```

Computed on demand via a repository/use-case query, never stored as a denormalized column, to avoid drift between stored and true balance.

## 26. Invoice Status Calculation

```
remaining = invoice.total - totalPaid

if totalPaid <= 0:
    status = (dueDate has passed AND remaining > 0) ? Overdue : Unpaid
elif totalPaid > 0 AND remaining > 0:
    status = (dueDate has passed) ? Overdue : Partial
elif remaining <= 0:
    status = Paid
```

- Status is recalculated on every Payment write and on read (for date-based Overdue transitions) and persisted to `Invoice.status` for fast list/dashboard queries, but the derivation above is always the source of truth — never manually set by the UI.

---

## 27. Invoice-Type Architecture

- `InvoiceType.enabledFields` is a JSON array of field keys from a fixed vocabulary defined once in `src/core/constants/invoiceFieldVocabulary.ts`, grouped as: **Item Details** (`itemName, description, sku`), **Pricing & Calculations** (`unitPrice, quantity, discount, tax`), **Measurements** (`unit, weight, length, width, height`). `itemName` and `unitPrice` are structural (every Item always has a name and a price, Section 7) and are always included/locked-on wherever fields are toggled (Phase 6, Screen 6); every other key is a genuine per-invoice-type choice.
- The 5 initial types are seeded on first run as system-defined rows (`isSystemDefined = true`):
  - General: quantity, unit, discount, tax
  - Quantity: quantity, unit, discount, tax (alias/refinement of General per product spec)
  - Weight: quantity, weight, discount, tax
  - Dimension: quantity, length, width, height, discount, tax
  - Custom: user-selected subset of the full vocabulary
- The **Create Invoice — Items** screen and **Create Item** screen both read `enabledFields` to decide which inputs to render — this logic lives in a shared domain helper (`resolveInvoiceTypeFields` use-case), not duplicated per screen.
- System-defined types cannot be deleted; they can be used as the default. Custom types can be created, edited, and deleted (with a guard against deleting a type in use by existing invoices/items — soft-block with a warning).

---

## 28. PDF Architecture

- PDF generation is a pure function of `(Invoice + InvoiceItems + Business + AppSettings.invoiceTemplateId) → local PDF file`, implemented in `src/pdf/invoicePdfBuilder.ts`, decoupled from UI.
- Multiple templates are supported via a `templateId -> HTML template function` map; templates share a common data model so adding a template does not touch invoice logic.
- Generation is fully offline using `expo-print` (HTML-to-PDF); output is written to local app storage via `expo-file-system`, then handed to `expo-sharing` for sharing/printing.
- The PDF layer never queries the database directly — it receives fully-resolved domain objects from the calling use-case/store.

---

## 29. Digital Business Card Architecture

- The card is a read-only presentation of `Business` + `SocialLink` data — no separate "card" entity; it's a view/composition, not new storage.
- A `BusinessCardPayload` domain object (name, contact info, social links, logo path) is derived from Business/SocialLink for both on-screen display and QR/share-link encoding, ensuring one source of truth.
- Sharing the card reuses the same share mechanism as invoice sharing (`expo-sharing`) for consistency and lower footprint.

## 30. QR Architecture

- QR payload encodes either: (a) a vCard-style text blob generated from `BusinessCardPayload`, or (b) a share-link URL if/when link-based sharing is added — decision to formalize in Phase 15, defaulting to (a) since it requires no server and works fully offline.
- QR generation is on-device (`react-native-qrcode-svg`), synchronous, no network call.
- Saving/sharing the QR image reuses the same `expo-file-system` + `expo-sharing` pattern already used for PDFs, avoiding a parallel export mechanism.

---

## 31. Error Handling Strategy

- All repository/use-case calls return a `Result<T>` (success/failure) rather than throwing into the UI layer.
- Failures are typed (`DatabaseFailure`, `ValidationFailure`, `NetworkFailure`, `BackupFailure`, `NotFoundFailure`) so the UI can present appropriate messaging without string-matching.
- The shared `ErrorState` component (Screen 27) is the single rendering path for failure UI; no ad hoc error components per screen.
- Network-dependent failures (Drive/cloud) must never surface as if they were core-data failures — messaging must make clear the local data is safe.

## 32. Loading-State Strategy

- Any async boundary (DB query while migrating, PDF generation, backup/restore) shows the shared `LoadingState` component or an inline skeleton for lists.
- Local DB reads are expected to be near-instant; loading UI is primarily for PDF/backup/restore operations and first-run seeding.
- No blocking full-screen spinners for actions that can be optimistic (e.g., saving a customer) — optimistic UI updates with rollback-on-failure preferred once real persistence is in place.

## 33. Backup / Restore Safety Strategy

- Before any restore overwrites local data, the app creates a local safety snapshot of the current database file.
- Restore requires an explicit confirmation dialog stating that current data will be replaced.
- If a restore fails mid-way, the app rolls back to the pre-restore local safety snapshot rather than leaving a partially-restored DB.
- Every backup and restore attempt — success or failure — is written to `BackupLog` with enough detail to diagnose issues without exposing sensitive content.
- Automatic backups never run in a way that could block or crash the main app flow; failures there are logged and surfaced non-intrusively (e.g., a status line in Backup & Restore), not as blocking dialogs.

## 34. Security Considerations

- No plaintext storage of OAuth tokens; use `expo-secure-store` for any Drive auth tokens that must persist — to be finalized in Phase 22, not before.
- Local database is app-sandboxed by OS default; no additional at-rest encryption in MVP unless explicitly requested (flag as a possible future hardening item, not a current requirement).
- Business/customer data never leaves the device except: (a) explicit user-initiated share actions, (b) explicit backup to the user's own Drive.
- No analytics/telemetry SDKs are introduced without explicit approval, given the sensitivity of invoicing/customer data.
- Input validation on all forms (especially monetary fields, dates) to prevent malformed data from corrupting calculations.

## 35. Testing Strategy

- **Domain layer:** unit tests (Jest) for calculation use-cases (invoice totals, payment aggregation, customer balance, status derivation, invoice-type field resolution) — highest priority, since these are pure functions.
- **Repository layer:** tests against an in-memory/test SQLite database (or a mocked Drizzle client) to verify CRUD and query correctness, and against mock repositories to verify contract conformance.
- **Component tests:** `@testing-library/react-native` for shared components (`EmptyState`, `LoadingState`, `ErrorState`, `ConfirmationDialog`) and key forms (Create Invoice steps, Record Payment) using mock stores/repositories.
- **Golden/manual review:** PDF output and Digital Business Card layout reviewed visually per template, not pixel-diffed in MVP.
- Testing is introduced incrementally per phase (see Phase acceptance criteria) rather than deferred entirely to Phase 24; Phase 24 focuses on hardening, coverage gaps, and performance, not first-time test authoring.

## 36. Development Phases

See the full phase breakdown below.

---

# Development Phases

> **Global rule for Phases 1–19:** all screens are built against **mock repositories** returning static/in-memory data. Code must be structured so that swapping to SQLite/Drizzle-backed repositories later (Phase 20) requires no UI changes — only wiring changes in `src/app/di/providers.ts`. Do not implement SQLite/Drizzle tables or queries during UI phases unless the phase explicitly says so (Phase 0 foundation and Phase 20+ only).

---

### PHASE 0 — Project Architecture and Foundation
- **Objective:** Establish the React Native (Expo/TypeScript) project skeleton, folder structure, theming, navigation shell, and core shared utilities/components — no feature screens yet.
- **Files:** `App.tsx`, `src/app/**`, `src/core/**`, empty `src/features/*/` scaffolding per Section 5, `package.json`/`tsconfig.json` (core deps only: expo, react-navigation, zustand).
- **Dependencies:** None.
- **Required UI:** Empty shell app with bottom-navigation tabs (Dashboard/Invoices/Customers/Business) showing placeholder text per tab.
- **Required data:** None.
- **Expected behavior:** App launches, navigates between the 4 tabs via bottom nav.
- **Acceptance criteria:** App builds and runs on at least one platform; folder structure matches Section 5; theme/colors centralized, not hard-coded per component.
- **What Claude must NOT do:** Do not add SQLite, PDF, QR, or Google Drive packages yet. Do not build any feature screen content beyond placeholders.

### PHASE 1 — Welcome / Setup
- **Objective:** Build the first-run Welcome/Setup screen.
- **Files:** `src/features/business/presentation/screens/WelcomeScreen.tsx` and related components.
- **Dependencies:** Phase 0.
- **Required UI:** Screen 1 (Welcome/Setup) per Section 16–20.
- **Required data:** None (static).
- **Expected behavior:** Tapping "Get Started" navigates to Create Business.
- **Acceptance criteria:** Screen matches purpose/components spec; navigation works; no persistence logic yet.
- **What Claude must NOT do:** Do not wire real first-run detection to a database — a simple in-memory/mock flag is sufficient at this stage.

### PHASE 2 — Create Business
- **Objective:** Build the Create Business form using a mock `BusinessRepository`.
- **Files:** `src/features/business/domain/entities/Business.ts`, `src/features/business/domain/repositories/BusinessRepository.ts`, `src/features/business/data/repositories/mockBusinessRepository.ts`, `src/features/business/presentation/screens/CreateBusinessScreen.tsx`, `src/features/business/presentation/state/businessFormStore.ts`.
- **Dependencies:** Phase 1.
- **Required UI:** Screen 2.
- **Required data:** Draft Business entity held in the mock repository/Zustand store.
- **Expected behavior:** Form validates required fields; Save stores into the mock repository and navigates onward.
- **Acceptance criteria:** `BusinessRepository` interface defined in `domain/`; mock implementation wired via `src/app/di/providers.ts` and consumed through the Zustand store; UI has zero direct references to the mock class (depends on the interface).
- **What Claude must NOT do:** Do not implement SQLite/Drizzle persistence yet. Do not skip the repository interface "for speed."

### PHASE 3 — Dashboard
- **Objective:** Build the Dashboard screen with mock aggregated data.
- **Files:** `src/features/dashboard/**`.
- **Dependencies:** Phase 2.
- **Required UI:** Screen 3.
- **Required data:** Mock summary numbers and a mock recent-invoices list (can reference mock Invoice entities defined ahead of schedule as simple domain models even before Phase 10/11 build their screens).
- **Expected behavior:** Cards display mock totals; quick actions navigate to stub routes for New Invoice/New Customer/Business Card (routes can be placeholders until their phases land).
- **Acceptance criteria:** Dashboard calculation logic (summing mock data) lives in a use-case/store, not inline in the component tree.
- **What Claude must NOT do:** Do not add charts/analytics beyond the specified summary cards.

### PHASE 4 — Business / Company
- **Objective:** Build the Business/Company profile view + edit + navigation hub.
- **Files:** `src/features/business/presentation/screens/BusinessScreen.tsx`.
- **Dependencies:** Phase 2.
- **Required UI:** Screen 4.
- **Required data:** Mock Business + mock SocialLink list.
- **Expected behavior:** View profile; edit reopens the Create-Business-style form pre-filled; links to Invoice Type Selection, Digital Business Card, Settings, Backup & Restore (stub routes acceptable if their phases haven't landed).
- **Acceptance criteria:** Editing reuses the Phase 2 form component rather than duplicating it.
- **What Claude must NOT do:** Do not fork a second business-form implementation.

### PHASE 5 — Invoice Type Selection
- **Objective:** Build Invoice Type Selection screen with mock InvoiceType data (seeded system types).
- **Files:** `src/features/invoiceType/**`.
- **Dependencies:** Phase 0.
- **Required UI:** Screen 5.
- **Required data:** Mock list of 5 system InvoiceTypes.
- **Expected behavior:** Select a default type; navigate to Custom Invoice Type screen.
- **Acceptance criteria:** `InvoiceType` domain model matches Section 7; field-visibility vocabulary matches Section 27.
- **What Claude must NOT do:** Do not hard-code field lists into the UI component — read from the InvoiceType model.

### PHASE 6 — Custom Invoice Type
- **Objective:** Build the Custom Invoice Type field-selection screen.
- **Files:** `src/features/invoiceType/presentation/screens/CustomInvoiceTypeScreen.tsx`.
- **Dependencies:** Phase 5.
- **Required UI:** Screen 6.
- **Required data:** Draft custom InvoiceType with toggleable `enabledFields`.
- **Expected behavior:** Save creates a new mock InvoiceType and returns to selection list.
- **Acceptance criteria:** Field vocabulary is a shared constant (`src/core/constants/invoiceFieldVocabulary.ts`), not redefined per screen.
- **What Claude must NOT do:** Do not allow deleting/editing system-defined types.

### PHASE 7 — Items
- **Objective:** Build Items List and Create Item screens with a mock `ItemRepository`.
- **Files:** `src/features/item/**`.
- **Dependencies:** Phase 5 (needs InvoiceType for conditional fields).
- **Required UI:** Screens 7 and 8.
- **Required data:** Mock Item list; InvoiceType list for field visibility.
- **Expected behavior:** List/search items; create/edit item with fields conditional on selected invoice type via the shared `resolveInvoiceTypeFields` use-case.
- **Acceptance criteria:** Field-visibility logic is shared with Create Invoice — Items (Phase 11), implemented once in `domain/`.
- **What Claude must NOT do:** Do not duplicate field-visibility logic per screen.

### PHASE 8 — Customers
- **Objective:** Build Customers List and Create Customer screens with a mock `CustomerRepository`.
- **Files:** `src/features/customer/**`.
- **Dependencies:** Phase 0.
- **Required UI:** Screens 9 and 10.
- **Required data:** Mock Customer list.
- **Expected behavior:** List/search/create/edit customers.
- **Acceptance criteria:** Balance field on list rows uses a placeholder computed-balance use-case (mock data) so the real calculation slots in later without UI change.
- **What Claude must NOT do:** Do not store balance as a static field on the mock Customer model — compute it via a use-case even with mock data.

### PHASE 9 — Customer Detail and History
- **Objective:** Build Customer Detail and Customer History screens.
- **Files:** `src/features/customer/presentation/screens/CustomerDetailScreen.tsx`, `CustomerHistoryScreen.tsx`.
- **Dependencies:** Phase 8, mock Invoice/Payment models (defined early, screens built later).
- **Required UI:** Screens 11 and 12.
- **Required data:** Mock Customer, mock Invoices/Payments for that customer, computed balance.
- **Expected behavior:** Detail shows summary + quick actions; History shows full timeline.
- **Acceptance criteria:** Balance/history computed via shared use-cases from Section 25/26 logic (against mock data).
- **What Claude must NOT do:** Do not hard-code the balance number in the component.

### PHASE 10 — Invoice List
- **Objective:** Build the Invoice List screen with a mock `InvoiceRepository`.
- **Files:** `src/features/invoice/**` (list portion).
- **Dependencies:** Phase 8 (customers), Phase 5 (invoice types).
- **Required UI:** Screen 13.
- **Required data:** Mock Invoice list with computed status badges.
- **Expected behavior:** Search/filter by status; tap → Invoice Detail (stub if Phase 12 not yet built).
- **Acceptance criteria:** Status displayed via the Section 26 derivation logic run against mock data, not a hard-coded field.
- **What Claude must NOT do:** Do not add analytics/extra filters beyond the specified status chips.

### PHASE 11 — Create Invoice
- **Objective:** Build the 3-step invoice creation flow: Customer → Items → (hand-off to Review in Phase 12).
- **Files:** `src/features/invoice/presentation/screens/CreateInvoiceCustomerScreen.tsx`, `CreateInvoiceItemsScreen.tsx`, `src/features/invoice/presentation/state/invoiceFormStore.ts`.
- **Dependencies:** Phase 7 (items), Phase 8 (customers), Phase 5 (invoice types).
- **Required UI:** Screens 14 and 15.
- **Required data:** Mock Customer/Item/InvoiceType lists; draft Invoice/InvoiceItem state.
- **Expected behavior:** Pick customer + metadata → add line items with type-conditional fields → running subtotal.
- **Acceptance criteria:** Reuses `resolveInvoiceTypeFields` from Phase 7; line calculations use the Section 23 formulas as pure functions with unit tests.
- **What Claude must NOT do:** Do not compute totals inline in component render logic — use the domain calculation functions.

### PHASE 12 — Invoice Review and Invoice Detail
- **Objective:** Complete the invoice flow with Review (save step) and build Invoice Detail.
- **Files:** `src/features/invoice/presentation/screens/InvoiceReviewScreen.tsx`, `InvoiceDetailScreen.tsx`.
- **Dependencies:** Phase 11.
- **Required UI:** Screens 16 and 17.
- **Required data:** Full draft Invoice + InvoiceItems; on save, appended to mock repository with snapshot fields populated.
- **Expected behavior:** Review shows full breakdown; Save persists (mock) and opens Invoice Detail; Detail shows line items, totals, payment summary (mock, empty initially), and action buttons.
- **Acceptance criteria:** InvoiceItem snapshot fields (name/description/sku/unit) are populated at save time from the selected Item, per Section 7's historical-integrity rule — verified even against mock data.
- **What Claude must NOT do:** Do not let Invoice Detail re-read live Item data for display — it must use the stored/mock snapshot fields only.

### PHASE 13 — Payments
- **Objective:** Build the Record Payment screen with a mock `PaymentRepository`.
- **Files:** `src/features/payment/**`.
- **Dependencies:** Phase 12.
- **Required UI:** Screen 18.
- **Required data:** Mock Invoice total, existing mock Payments, computed remaining balance.
- **Expected behavior:** Save appends a mock Payment; Invoice Detail's status/remaining balance updates via Section 24/26 logic.
- **Acceptance criteria:** No `amountPaid` field trusted directly — always derived by summing Payments, matching Section 24.
- **What Claude must NOT do:** Do not add payment gateway integration or online processing.

### PHASE 14 — Digital Business Card
- **Objective:** Build the Digital Business Card screen.
- **Files:** `src/features/digitalCard/**`.
- **Dependencies:** Phase 4 (business + social links).
- **Required UI:** Screen 20.
- **Required data:** Mock Business + SocialLink data, composed into `BusinessCardPayload`.
- **Expected behavior:** Displays card; social icons are tappable (stub external-link behavior acceptable); Share and QR buttons present.
- **Acceptance criteria:** `BusinessCardPayload` is a single derived domain object reused by both this screen and Phase 15's QR screen.
- **What Claude must NOT do:** Do not create a separate "BusinessCard" persisted entity — it must remain a derived view.

### PHASE 15 — QR Code
- **Objective:** Build the full-screen QR Code screen.
- **Files:** `src/features/digitalCard/presentation/screens/QrCodeScreen.tsx`.
- **Dependencies:** Phase 14.
- **Required UI:** Screen 21.
- **Required data:** `BusinessCardPayload` encoded into QR data.
- **Expected behavior:** Renders QR from local data (introduce `react-native-qrcode-svg` here); save/share buttons present (share can be stubbed until Phase 16's share plumbing lands, or implemented directly if trivial).
- **Acceptance criteria:** QR generation is fully offline, confirmed by testing with network disabled.
- **What Claude must NOT do:** Do not introduce any server-side link-shortening or hosted QR service.

### PHASE 16 — Invoice PDF and Sharing
- **Objective:** Build PDF generation and the Invoice Sharing screen.
- **Files:** `src/pdf/**`, `src/features/invoice/presentation/screens/InvoiceSharingScreen.tsx`.
- **Dependencies:** Phase 12 (invoice detail/data), Phase 4 (business branding).
- **Required UI:** Screen 19.
- **Required data:** Mock Invoice + InvoiceItems + Business, mapped into the PDF builder's input model.
- **Expected behavior:** Generate PDF from mock data using `expo-print`; share via `expo-sharing` to WhatsApp/Email/generic sheet; copy share-link option (can be a placeholder string in MVP if no server exists).
- **Acceptance criteria:** PDF builder (Section 28) takes plain domain objects as input — no database or store access inside `src/pdf/`.
- **What Claude must NOT do:** Do not query the database/mock repository from inside the PDF builder — pass data in.

### PHASE 17 — Settings
- **Objective:** Build Settings and Invoice Template Selection screens.
- **Files:** `src/features/settings/**`.
- **Dependencies:** Phase 4, Phase 16 (templates feed PDF builder).
- **Required UI:** Screens 23 and 24.
- **Required data:** Mock `AppSettings`.
- **Expected behavior:** Change currency/tax defaults/numbering/template; selections persist to mock settings state and are reflected where used (e.g., PDF template choice).
- **Acceptance criteria:** Settings reads/writes go through a `SettingsRepository` interface, mock-backed.
- **What Claude must NOT do:** Do not let other screens read settings directly from AsyncStorage/globals — always through the repository/store.

### PHASE 18 — Backup and Restore
- **Objective:** Build the Backup & Restore screen UI (no real Drive/cloud calls yet).
- **Files:** `src/features/backup/**`.
- **Dependencies:** Phase 17.
- **Required UI:** Screen 22.
- **Required data:** Mock `BackupLog` list, mock last-backup status.
- **Expected behavior:** "Backup Now" and "Restore" trigger mock flows (simulated success/failure) with confirmation dialogs for restore.
- **Acceptance criteria:** `GoogleDriveBackupRepository` and `CloudBackupRepository` interfaces are defined now (even though implemented later), so the UI is written against the final contract.
- **What Claude must NOT do:** Do not add real Google sign-in or Drive API calls yet.

### PHASE 19 — Connect Screen Interactions
- **Objective:** Wire up all remaining cross-screen navigation, empty/loading/error states, and confirmation dialogs across the whole app so it behaves as one coherent product on mock data.
- **Files:** `src/app/navigation/AppNavigator.tsx` updates; shared components from `src/core/components/` applied across feature screens as needed.
- **Dependencies:** Phases 1–18.
- **Required UI:** Screens 25, 26, 27, 28 (Empty/Loading/Error states, Confirmation dialogs) applied consistently; all previously-stubbed routes replaced with real navigation.
- **Required data:** Existing mock data across features.
- **Expected behavior:** A user can walk through the entire app end-to-end on mock data with no dead-end buttons or stub placeholders remaining.
- **Acceptance criteria:** Manual end-to-end walkthrough of all 28 screens succeeds; every list has a working empty state; every async mock action has a loading state; simulated failures show the error state.
- **What Claude must NOT do:** Do not introduce new features/screens beyond the inventory in Section 16–20 while doing this wiring pass.

### PHASE 20 — Replace Mock Data with SQLite/Drizzle
- **Objective:** Introduce the SQLite database (via `expo-sqlite` + Drizzle ORM) and swap every mock repository for a SQLite-backed implementation via DI wiring updates.
- **Files:** `src/database/**` (new: `schema/`, `client.ts`, `migrations/`, `seed.ts`), `src/features/*/data/repositories/sqlite*Repository.ts` (new), wiring updates only in `src/app/di/providers.ts` — **UI files should not need changes**.
- **Dependencies:** Phase 19 (feature-complete on mock data).
- **Required UI:** None new — this phase is data-layer only.
- **Required data:** Real schema per Section 7/8, seeded with the 5 system InvoiceTypes on first run.
- **Expected behavior:** App behaves identically to Phase 19 from a user's perspective, but data now persists across app restarts via SQLite.
- **Acceptance criteria:** All repository interfaces satisfied by SQLite/Drizzle implementations; mock implementations remain in the codebase only for tests, no longer wired for runtime use; app restart preserves all created data.
- **What Claude must NOT do:** Do not redesign screens "while we're in there." Do not change the domain entity shapes established in Phases 1–19 without flagging it as an approval-needed deviation.

### PHASE 21 — Offline Persistence and Recovery
- **Objective:** Harden offline behavior: app launch/recovery with no network, DB migration handling, crash-safety on writes.
- **Files:** `src/database/migrations/**`, `src/core/errors/**` refinements, startup sequence in `src/app/App.tsx`.
- **Dependencies:** Phase 20.
- **Required UI:** Error/loading states applied to startup/migration edge cases only (no new screens).
- **Required data:** Existing schema; migration test fixtures.
- **Expected behavior:** App launches correctly with airplane mode on; a killed app mid-write does not corrupt the database (relies on SQLite's own transactional guarantees, verified via tests).
- **Acceptance criteria:** All Section 11 offline-required flows verified offline; migration path tested from a prior schema version (once one exists) to current.
- **What Claude must NOT do:** Do not introduce any network dependency into a flow listed as offline-required in Section 11.

### PHASE 22 — Google Drive Backup/Restore
- **Objective:** Implement real Google Drive backup and restore behind the Phase 18 interfaces.
- **Files:** `src/features/backup/data/datasources/remote/googleDriveDataSource.ts`, `src/features/backup/data/repositories/googleDriveBackupRepository.ts`, OAuth wiring (`expo-auth-session` or `@react-native-google-signin/google-signin`, per Section 4).
- **Dependencies:** Phase 20 (real DB to back up), Phase 18 (UI contract).
- **Required UI:** None new beyond finalizing states already built in Screen 22 (real status/history instead of mock).
- **Required data:** Real DB export payload, `BackupLog` entries.
- **Expected behavior:** Manual backup uploads a real snapshot to the user's Drive; automatic backup runs per configured frequency; Restore lists real backups and restores with the Section 33 safety strategy (pre-restore snapshot, confirmation, rollback on failure).
- **Acceptance criteria:** Backup/restore round-trip verified (backup → wipe local test data → restore → data matches); failures logged to `BackupLog` and surfaced without crashing.
- **What Claude must NOT do:** Do not treat Drive as a live database. Do not skip the pre-restore safety snapshot.

### PHASE 23 — Optional Cloud Backup
- **Objective:** Flesh out the `CloudBackupRepository` interface with, at most, a stub/no-op or minimal placeholder integration point — full billing/server implementation remains out of scope unless separately approved.
- **Files:** `src/features/backup/data/repositories/cloudBackupRepository.ts`, Settings/Backup UI storage-usage placeholder wired to real (if available) or clearly-labeled placeholder values.
- **Dependencies:** Phase 22.
- **Required UI:** No new screens; existing "Storage usage" placeholder in Backup & Restore may show real values if a minimal backend exists, otherwise remains explicitly a placeholder.
- **Required data:** N/A unless explicitly scoped further at this phase's start.
- **Expected behavior:** No regression to Google Drive backup; cloud backup remains additive and optional.
- **Acceptance criteria:** Confirm scope with the user before writing any server-communicating code in this phase — this phase must not silently expand into a billing/subscription system.
- **What Claude must NOT do:** Do not implement payment/billing logic. Do not make cloud backup mandatory or default-enabled.

### PHASE 24 — Testing, Performance, and Production Polish
- **Objective:** Close testing gaps, verify performance on lightweight devices, and polish rough edges without changing scope.
- **Files:** `**/*.test.ts(x)` additions across all layers using `jest` + `@testing-library/react-native`; minor non-structural fixes identified during hardening.
- **Dependencies:** Phases 0–23.
- **Required UI:** No new screens; only bug-level fixes to existing ones.
- **Required data:** N/A.
- **Expected behavior:** Full test suite passes; app remains responsive with realistic data volumes (hundreds of invoices/customers/items); startup time and list scrolling stay smooth.
- **Acceptance criteria:** Unit tests cover all calculation rules (Sections 23–26); repository tests cover SQLite/Drizzle CRUD; component tests cover shared components; no known crash paths in core offline flows.
- **What Claude must NOT do:** Do not use this phase to add new features "since we're polishing anyway" — any such idea must be raised for approval as a new, separate phase.

---

# Development Rules

- Do not expand scope without approval.
- Do not redesign previous screens without approval.
- Do not change database architecture without approval.
- Do not add dependencies unless necessary.
- Do not duplicate business logic.
- Do not hard-code business calculations into widgets.
- Do not put database queries directly inside UI widgets.
- Keep widgets/components reusable.
- Keep the app lightweight.
- Maintain offline-first behavior.
- Preserve existing functionality when modifying code.
- Before modifying existing code, inspect the current implementation.
- Do not delete working functionality to solve a new problem.
- Test the affected functionality after every phase.
