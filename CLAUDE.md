# CLAUDE.md

## Project Overview

A fullstack income/expense tracker with multi-currency support (TRY, USD, EUR). Live exchange rates are fetched from the Frankfurter (ECB) API. Supports document scanning (receipt/invoice upload), async Tesseract OCR, monthly PDF email reports, a Nightly Ledger (daily log with card/category, month rollup tables, reminder emails), and role-based admin access.

## Stack

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** for styling
- **lucide-react** for icons

### Backend
- **Spring Boot 3.4.3** + **Java 21**
- **Spring Data JPA** + **Hibernate**
- **Spring Security** + **JWT** (stateless, JTI blacklist logout)
- **Flyway** for database migrations (V1–V13)
- **PostgreSQL 17** as the database
- **Lombok** for boilerplate reduction
- **Apache PDFBox 3.0.3** for PDF generation and rendering
- **tess4j 5.11.0** for Tesseract OCR (provider=tesseract)
- **AWS SDK v2** for optional S3 storage
- Build tool: **Gradle (Kotlin DSL)**

## Project Structure

```
income-outcome-app/
├── frontend/
│   └── src/
│       ├── App.tsx                        # Root — routing state, all CRUD, OCR wiring
│       ├── pages/
│       │   ├── HomePage.tsx               # Dashboard summary + gear icon → Settings
│       │   ├── IncomePage.tsx             # Add/delete income entries
│       │   ├── ExpensesPage.tsx           # Expenses list with View doc + placeholder rows
│       │   ├── AddManualExpensePage.tsx   # Manual expense form
│       │   ├── AddDocumentPage.tsx        # Upload file → triggers OCR pipeline
│       │   ├── ConfirmCapturePage.tsx     # Preview captured file before upload
│       │   ├── OcrReviewPage.tsx          # Pre-filled form from OCR result
│       │   ├── LedgerDayPage.tsx          # Daily Log — day stepper, amount/card/category/note, no-spend
│       │   ├── LedgerMonthPage.tsx        # Month Table — by card, by category, every expense, missing days, MD/CSV export
│       │   ├── SettingsPage.tsx           # Theme, cards & categories, reminders + timezone, report email
│       │   ├── LoginPage.tsx
│       │   └── RegisterPage.tsx
│       ├── components/
│       │   ├── BottomNav.tsx              # Navigation bar with camera/add actions
│       │   ├── Card.tsx
│       │   ├── Page.tsx
│       │   ├── RatePill.tsx               # Displays live exchange rate
│       │   ├── Toast.tsx                  # Info/error toast (auto-dismiss 4s)
│       │   └── DocumentPreviewOverlay.tsx # Full-screen document viewer (img / PDF iframe)
│       ├── services/
│       │   ├── api.ts                     # Base fetch wrapper with auth + 401 handling
│       │   ├── auth.ts                    # register / login / logout
│       │   ├── income.ts                  # Income CRUD
│       │   ├── expense.ts                 # Expense CRUD + CreateExpensePayload
│       │   ├── document.ts                # uploadForOcr / getOcrStatus / getBlobUrl
│       │   ├── settings.ts                # getSettings / updateSettings
│       │   ├── ledger.ts                  # ledgerService (options/day/no-spend/month) + localDateStr
│       │   ├── rates.ts                   # fetchRates() — calls Frankfurter API
│       │   ├── useLiveRates.ts            # React hook wrapping fetchRates (30s refresh)
│       │   └── useOcrPolling.ts           # Polls OCR status; fast-path placeholder logic
│       └── types/
│           └── income.ts                  # Income, Expense, Currency, OcrStatus, DocumentType
│
└── backend/
    ├── src/main/java/com/incomeoutcome/
    │   ├── IncomeOutcomeApplication.java  # @EnableAsync @EnableScheduling
    │   ├── controller/
    │   │   ├── AuthController.java        # POST /api/auth/{register,login,logout}
    │   │   ├── IncomeController.java      # GET/POST/PUT/DELETE /api/incomes
    │   │   ├── ExpenseController.java     # GET/POST/PUT/DELETE /api/expenses
    │   │   ├── DocumentController.java    # POST /upload, /upload/ocr; GET /{id}, /{id}/ocr-status
    │   │   ├── RateController.java        # GET /api/rates
    │   │   ├── ReportController.java      # GET /api/report/summary, /monthly-breakdown
    │   │   ├── SettingsController.java    # GET/PUT /api/settings
    │   │   ├── AdminController.java       # GET /api/admin/users; DELETE /users/{id}; GET /api/audit
    │   │   └── LedgerController.java      # /api/ledger — options, day, no-spend, month rollup
    │   ├── service/
    │   │   ├── AuthService.java           # register / login / logout
    │   │   ├── JwtService.java            # token generate / validate / parse / role extraction
    │   │   ├── IncomeService.java         # income CRUD + audit
    │   │   ├── ExpenseService.java        # expense CRUD + audit + document linking
    │   │   ├── DocumentService.java       # upload / uploadForOcr / getOcrStatus / stream
    │   │   ├── OcrService.java            # interface: extract(File) → OcrResult(vendor,date,amount)
    │   │   ├── NoOpOcrService.java        # @ConditionalOnProperty provider=none (default stub)
    │   │   ├── TesseractOcrService.java   # @ConditionalOnProperty provider=tesseract
    │   │   ├── OcrAsyncService.java       # @Async — PROCESSING → OCR → DONE/FAILED
    │   │   ├── ExchangeRateService.java   # fetch + persist rates from Frankfurter
    │   │   ├── ReportService.java         # summary + monthly breakdown queries
    │   │   ├── PdfReportService.java      # PDFBox — merge images/PDFs into monthly report
    │   │   ├── EmailService.java          # sendHtml + sendWithAttachment (SMTP conditional)
    │   │   ├── AuditService.java          # log income/expense mutations to audit_log
    │   │   ├── UserSettingsService.java   # get/update report email, timezone, reminder toggles
    │   │   ├── LedgerService.java         # day view, no-spend marks, month rollup + missing days
    │   │   ├── StorageService.java        # interface: store / load / delete
    │   │   ├── LocalStorageService.java   # filesystem storage (default)
    │   │   └── S3StorageService.java      # S3 storage (@ConditionalOnProperty type=s3)
    │   ├── scheduler/
    │   │   ├── ExchangeRateScheduler.java    # every 30 min — refresh exchange rates
    │   │   ├── MonthlySummaryScheduler.java  # 1st of month 08:00 — email summary
    │   │   ├── MonthlyReportScheduler.java   # 20th of month 08:00 — email PDF report
    │   │   ├── RecurringEntryScheduler.java  # daily 01:00 — clone due recurring entries
    │   │   └── LedgerReminderScheduler.java  # hourly; user-local 20:00 log reminder, 1st 09:00 month table
    │   ├── entity/
    │   │   ├── User.java                  # UserDetails; role + reportEmail fields
    │   │   ├── Role.java                  # USER | ADMIN
    │   │   ├── Income.java                # recurrenceRule + nextOccurrence
    │   │   ├── Expense.java               # recurrenceRule + nextOccurrence
    │   │   ├── Document.java              # ocrStatus + ocrVendor/Date/Amount; nullable expense
    │   │   ├── OcrStatus.java             # PENDING | PROCESSING | DONE | FAILED
    │   │   ├── DocumentType.java          # Receipt | Invoice
    │   │   ├── RecurrenceRule.java        # NONE | WEEKLY | MONTHLY | YEARLY
    │   │   ├── Currency.java              # TRY | USD | EUR
    │   │   ├── ExchangeRate.java
    │   │   ├── AuditLog.java
    │   │   ├── RevokedToken.java          # JTI blacklist for logout
    │   │   ├── LedgerOption.java          # per-user card / category names (kind = LedgerOptionKind)
    │   │   └── NoSpendDay.java            # explicit "nothing spent" day
    │   ├── dto/
    │   │   ├── AuthResponse.java          # {token, email}
    │   │   ├── RegisterRequest.java
    │   │   ├── LoginRequest.java
    │   │   ├── IncomeResponse.java / CreateIncomeRequest.java / UpdateIncomeRequest.java
    │   │   ├── ExpenseResponse.java / CreateExpenseRequest.java / UpdateExpenseRequest.java
    │   │   ├── DocumentResponse.java      # includes ocrStatus + ocr fields
    │   │   ├── OcrStatusResponse.java     # {status, vendor, date, amount}
    │   │   ├── UserSettingsResponse.java  # {reportEmail}
    │   │   ├── UpdateSettingsRequest.java # {@Email @Size(max=255) reportEmail}
    │   │   ├── SummaryResponse.java / CurrencyBreakdown.java / MonthlyBreakdownItem.java
    │   │   ├── RateResponse.java
    │   │   ├── AuditLogResponse.java
    │   │   └── UserSummary.java
    │   ├── repository/
    │   │   ├── UserRepository.java           # findByEmail; findAllByReportEmailIsNotNull
    │   │   ├── IncomeRepository.java
    │   │   ├── ExpenseRepository.java
    │   │   ├── DocumentRepository.java       # findByUserAndExpenseMonth (OCR monthly report)
    │   │   ├── ExchangeRateRepository.java
    │   │   ├── AuditLogRepository.java
    │   │   └── RevokedTokenRepository.java
    │   ├── config/
    │   │   ├── SecurityConfig.java            # FilterChain; /api/admin/** → ROLE_ADMIN
    │   │   ├── JwtAuthFilter.java             # validates JWT + sets role authority
    │   │   ├── StorageConfig.java
    │   │   ├── RateLimitFilter.java
    │   │   ├── RatesClientConfig.java
    │   │   └── RequestLoggingConfig.java
    │   └── exception/
    │       ├── GlobalExceptionHandler.java    # @RestControllerAdvice
    │       ├── ResourceNotFoundException.java
    │       ├── InvalidFileException.java
    │       └── EmailAlreadyExistsException.java
    ├── src/main/resources/
    │   ├── application.yml                    # Base config; OCR provider=tesseract
    │   ├── application-dev.yml                # Dev datasource; verbose logging
    │   ├── application-prod.yml               # Reads env vars for DB + JWT + SMTP
    │   ├── tessdata/                          # Tesseract language data files (tr.traineddata)
    │   └── db/migration/
    │       ├── V1__create_schema.sql          # pgcrypto extension
    │       ├── V2__create_users_table.sql
    │       ├── V3__create_revoked_tokens_table.sql
    │       ├── V4__create_incomes_table.sql
    │       ├── V5__create_expenses_table.sql
    │       ├── V6__create_documents_table.sql
    │       ├── V7__create_exchange_rates_table.sql
    │       ├── V8__add_roles.sql
    │       ├── V9__create_audit_log_table.sql
    │       ├── V10__add_recurrence.sql
    │       ├── V11__ocr_fields_on_documents.sql  # ocrStatus/vendor/date/amount; expense nullable
    │       ├── V12__user_report_email.sql         # users.report_email
    │       └── V13__nightly_ledger.sql            # expense card/category/note; ledger_options; no_spend_days; user timezone + reminder flags
    ├── docker-compose.yml                     # postgres:17-alpine on port 5432
    ├── build.gradle.kts
    └── settings.gradle.kts
```

## Key Conventions

### Frontend
- Routing is handled manually via a `route` state in `App.tsx` (no React Router).
- All state lives in `App.tsx` and is passed down as props.
- Currency conversion uses rates fetched from `https://api.frankfurter.app` (ECB data).
- The base URL for the rates API can be overridden via `VITE_RATES_BASE_URL` env var.
- Document upload triggers the OCR pipeline: `useOcrPolling` polls every 500 ms; shows a placeholder row in the expenses list for fast results (≤3 s) or a toast for slow results.
- Authenticated document streaming uses `fetch` + `URL.createObjectURL` (not `<img src>`).
- Deep links: `#ledger/YYYY-MM-DD` and `#ledger-month/YYYY-MM` (used by reminder emails) open the Daily Log / Month Table after login.
- Use `localDateStr()` from `services/ledger.ts` for "today" in the ledger — `toISOString()` gives the UTC date.

### Backend
- JPA DDL is set to `validate` — schema is managed entirely by Flyway migrations.
- Dev datasource: `jdbc:postgresql://localhost:5432/income_outcome_dev`, user/pass `postgres/postgres`.
- Prod datasource uses environment variables: `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`.
- JWT secret: defaults to a dev placeholder; **prod must set `JWT_SECRET` env var** (≥256-bit string).
- Token expiry: 24 hours. Logout via JTI blacklist (`revoked_tokens` table).
- User isolation: repositories use `findByIdAndUser` — returns 404 (not 403) to avoid existence leaks.
- `@Builder.Default` required for enum fields with defaults in Lombok builders.
- `@Async` OCR uses `TransactionTemplate` for separate PROCESSING and DONE/FAILED transactions.
- OCR provider is pluggable via `app.ocr.provider`: `none` (stub) or `tesseract` (tess4j).
- Tesseract tessdata bundled in `src/main/resources/tessdata`; resolved to filesystem path at startup via `ResourceLoader`.
- Storage is pluggable: `local` (default) or `s3` (`app.storage.type=s3`).
- Email and scheduler features are `@ConditionalOnProperty`/`@ConditionalOnBean` — inactive unless SMTP is configured.
- Nightly Ledger: expenses carry optional `card`/`category`/`note` as plain names, so deleting a `LedgerOption` never alters logged expenses. A day is "missing" when it has started in the user's timezone, is on/after sign-up, and has no expense and no `NoSpendDay`. Logging an expense clears that day's no-spend mark.
- Reminder emails go to the account email; links use `app.frontend-url` (`FRONTEND_URL` env).

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | `{email, password}` → `{token, email}` |
| POST | `/api/auth/login` | Public | `{email, password}` → `{token, email}` |
| POST | `/api/auth/logout` | Bearer | Revokes token (JTI blacklist) |
| GET/POST | `/api/incomes` | Bearer | List (paginated) / create income |
| GET/PUT/DELETE | `/api/incomes/{id}` | Bearer | Get / update / delete income |
| GET/POST | `/api/expenses` | Bearer | List (paginated) / create expense |
| GET/PUT/DELETE | `/api/expenses/{id}` | Bearer | Get / update / delete expense |
| POST | `/api/documents/upload` | Bearer | Upload doc linked to existing expense |
| POST | `/api/documents/upload/ocr` | Bearer | Upload doc → async OCR pipeline |
| GET | `/api/documents/{id}` | Bearer | Stream document file |
| GET | `/api/documents/{id}/ocr-status` | Bearer | Poll OCR result |
| GET | `/api/rates` | Bearer | Latest exchange rates |
| GET | `/api/report/summary` | Bearer | Income/expense totals |
| GET | `/api/report/monthly-breakdown` | Bearer | Month-by-month breakdown |
| GET/PUT | `/api/settings` | Bearer | Get / update report email, timezone, reminder toggles |
| GET/POST | `/api/ledger/options` | Bearer | List / add card or category |
| DELETE | `/api/ledger/options/{id}` | Bearer | Remove card or category from the pick list |
| GET | `/api/ledger/day/{date}` | Bearer | Day's expenses, totals, no-spend flag |
| PUT/DELETE | `/api/ledger/day/{date}/no-spend` | Bearer | Mark / clear "nothing spent" |
| GET | `/api/ledger/month?year=&month=` | Bearer | Month rollup: by card, by category, expenses, missing days |
| GET | `/api/admin/users` | ROLE_ADMIN | List all users |
| DELETE | `/api/admin/users/{id}` | ROLE_ADMIN | Delete user |
| GET | `/api/audit` | ROLE_ADMIN | Audit log |

## Dev Commands

### Frontend
```bash
cd frontend
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

### Backend
```bash
# Start PostgreSQL via Docker (required before running the app)
cd backend
docker compose up -d

# Run the Spring Boot app
./gradlew bootRun

# Compile only (no tests)
./gradlew compileJava

# Run tests
./gradlew test
```

### OCR Setup (Tesseract)
Tessdata files live in `backend/src/main/resources/tessdata/`. The app resolves this to a filesystem path at startup automatically. To add more languages, place `.traineddata` files in that directory and update `app.ocr.tesseract.language` in `application.yml`.
