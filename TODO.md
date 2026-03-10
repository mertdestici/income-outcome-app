# Backend TODO — Spring Boot

## Phase 1: Project Setup
- [x] Initialize Spring Boot 3 project (Maven/Gradle)
- [x] Configure project structure (controller/service/repository layers)
- [x] Set up PostgreSQL connection + application.yml profiles (dev/prod)
- [x] Add base dependencies (Spring Web, Spring Data JPA, Spring Security, Lombok, etc.)
- [x] Set up database migration tool (Flyway or Liquibase)

## Phase 2: Authentication ✓
- [x] User entity (id, email, password_hash, createdAt)
- [x] Register endpoint (POST /api/auth/register)
- [x] Login endpoint (POST /api/auth/login) — returns JWT
- [x] Logout endpoint (POST /api/auth/logout) — JTI blacklist revocation
- [x] Spring Security config with JWT filter
- [x] Password hashing (BCrypt)
- [x] Protected route middleware — all /api/** except /api/auth/**
- [x] Global exception handler (409 duplicate email, 401 bad credentials, 400 validation)
- See PHASE-2.md for full details

## Phase 3: Income Module ✓
- [x] Income entity (id, userId, title, amount, currency, createdAt)
- [x] POST /api/incomes — create income
- [x] GET /api/incomes — list user's incomes (with pagination)
- [x] PUT /api/incomes/{id} — update income
- [x] DELETE /api/incomes/{id} — delete income
- [x] Filter by date range, currency
- See docs/phase-3-income-module.md for full details

## Phase 4: Expense Module ✓
- [x] Expense entity (id, userId, title, amount, currency, date, documentType, createdAt)
- [x] POST /api/expenses — create expense
- [x] GET /api/expenses — list user's expenses (with pagination)
- [x] PUT /api/expenses/{id} — update expense
- [x] DELETE /api/expenses/{id} — delete expense
- [x] Filter by month/year, currency, documentType

## Phase 5: Document / File Upload ✓
- [x] Document entity (id, expenseId, fileName, filePath, contentType, uploadedAt)
- [x] POST /api/documents/upload — upload file (multipart)
- [x] GET /api/documents/{id} — download/view file
- [x] DELETE /api/documents/{id} — delete file
- [x] Local filesystem storage initially
- [x] File size/type validation
- See docs/phase-5-document-upload.md for full details

## Phase 6: Exchange Rates ✓
- [x] Scheduled job to fetch & cache ECB rates (daily)
- [x] ExchangeRate entity (baseCurrency, targetCurrency, rate, fetchedAt)
- [x] GET /api/rates — return latest cached rates
- [x] Server-side currency conversion util
- See docs/phase-6-exchange-rates.md for full details

## Phase 7: Reports & Aggregation ✓
- [x] GET /api/reports/summary — total income/expense per currency
- [x] GET /api/reports/monthly — monthly breakdown
- [x] GET /api/reports/by-currency — grouped by currency
- [ ] Export to CSV/PDF (optional — deferred to Phase 10)
- See docs/phase-7-reports-aggregation.md for full details

## Phase 8: Frontend Integration ✓
- [x] Update frontend API calls to use backend instead of localStorage
- [x] Add login/register pages to frontend
- [x] Add auth token storage (localStorage or httpOnly cookie)
- [x] Handle 401 responses — redirect to login
- [x] Remove localStorage persistence for incomes/expenses
- See docs/phase-8-frontend-integration.md for full details

## Phase 9: Production Readiness ✓
- [x] Environment-based config (dev/staging/prod)
- [x] CORS configuration
- [x] Rate limiting (Bucket4j — 60 req/min general, 10 req/min auth)
- [x] Input validation (Bean Validation annotations)
- [x] Global exception handler (@ControllerAdvice)
- [x] Logging (SLF4J + request logging in dev, JSON pattern in prod)
- [x] API documentation (Swagger / SpringDoc OpenAPI — disabled in prod)
- [x] Dockerize the app (Dockerfile + docker-compose with PostgreSQL + app)
- [ ] Deploy to Railway or Render free tier
- See docs/phase-9-production-readiness.md for full details

## Phase 10: Future / Full Platform ✓
- [x] Multi-user with roles (admin/user)
- [x] Admin panel endpoints
- [x] Notifications (email or push)
- [x] OCR for receipt scanning (no-op stub — swap in Tesseract or cloud OCR)
- [x] S3-compatible file storage migration (StorageService interface + S3StorageService)
- [x] Audit log for financial changes
- [x] Recurring income/expense support
