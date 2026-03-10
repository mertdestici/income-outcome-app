# Phase 6: Exchange Rates

## Status: Complete ✓

## Overview
Replace the frontend's direct call to the Frankfurter (ECB) API with a server-side scheduled job that fetches and caches daily rates. The backend exposes a single `GET /api/rates` endpoint. This avoids CORS issues with the external API, enables server-side currency conversion for reports, and reduces external API calls.

---

## Files to Create

### Flyway Migration
- `V7__create_exchange_rates_table.sql`
  ```sql
  CREATE TABLE exchange_rates (
      id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      base_currency   VARCHAR(3)   NOT NULL,
      target_currency VARCHAR(3)   NOT NULL,
      rate            NUMERIC(19,6) NOT NULL,
      fetched_at      TIMESTAMPTZ  NOT NULL,
      UNIQUE (base_currency, target_currency)
  );
  CREATE INDEX idx_exchange_rates_pair ON exchange_rates (base_currency, target_currency);
  ```

### Entity
- `entity/ExchangeRate.java`
  - `UUID id`
  - `String baseCurrency` — e.g. `"EUR"`
  - `String targetCurrency` — e.g. `"TRY"`
  - `BigDecimal rate`
  - `Instant fetchedAt`

### Repository
- `repository/ExchangeRateRepository.java`
  - `List<ExchangeRate> findAll()`
  - `Optional<ExchangeRate> findByBaseCurrencyAndTargetCurrency(String base, String target)`
  - `void deleteAll()` — used by scheduler before re-inserting fresh rates

### DTOs
- `dto/RateResponse.java` (record) — `String base`, `Map<String, BigDecimal> rates`, `Instant fetchedAt`

### Service
- `service/ExchangeRateService.java`
  - `fetchAndStore() → void` — called by scheduler
    1. Call `https://api.frankfurter.app/latest?from=EUR&to=TRY,USD`
    2. Parse response
    3. Delete existing rows; insert fresh rates
    4. Log result
  - `getLatestRates() → RateResponse`
    1. Load all rows from DB
    2. If empty (first boot, scheduler not yet run), call `fetchAndStore()` eagerly
    3. Return as `RateResponse`
  - `convert(BigDecimal amount, String from, String to) → BigDecimal` — utility for reports

### Scheduler
- `scheduler/ExchangeRateScheduler.java`
  - `@Scheduled(cron = "0 0 8 * * *")` — runs daily at 08:00 server time (ECB publishes ~16:00 CET previous day)
  - Calls `ExchangeRateService.fetchAndStore()`
  - Add `@EnableScheduling` to `IncomeOutcomeApplication.java`

### Config
- Add to `application.yml`:
  ```yaml
  app:
    rates:
      base-url: https://api.frankfurter.app
      base-currency: EUR
      target-currencies: TRY,USD
  ```

### Controller
- `controller/RateController.java` — `@RequestMapping("/api/rates")`
  - `GET /api/rates` — public (no auth required) → `RateResponse`

### Update SecurityConfig
- Add `/api/rates` to `.requestMatchers(...).permitAll()`

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/rates` | Public | Latest cached exchange rates |

### Response Example
```json
{
  "base": "EUR",
  "rates": {
    "TRY": 36.12,
    "USD": 1.08
  },
  "fetchedAt": "2026-02-28T08:00:00Z"
}
```

---

## Frankfurter API

- URL: `https://api.frankfurter.app/latest?from=EUR&to=TRY,USD`
- Free, no API key required
- Updated daily by ECB
- Existing frontend `VITE_RATES_BASE_URL` env var can point to the backend endpoint in production

---

## Key Design Decisions

- **Server-side cache** — single daily fetch instead of per-user frontend calls; rate-limit friendly
- **`UNIQUE (base_currency, target_currency)`** — enforces one rate per pair; delete-all + reinsert keeps data fresh without upsert complexity
- **Eager fetch on first request** — if the scheduler hasn't run yet (fresh deploy), the first `GET /api/rates` triggers a live fetch
- **Public endpoint** — rates are not sensitive; avoids requiring auth just to render the dashboard
- **`convert()` utility** — used internally by Phase 7 reports for cross-currency aggregation

---

## Verification Steps

```bash
# Trigger eager fetch and get rates
curl http://localhost:8080/api/rates

# Confirm rates are stored in DB
psql -U postgres -d income_outcome_dev \
  -c "SELECT * FROM exchange_rates;"

# Force scheduler run (dev only — add a test endpoint or call directly)
```
