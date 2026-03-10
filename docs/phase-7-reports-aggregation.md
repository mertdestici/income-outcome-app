# Phase 7: Reports & Aggregation

## Status: Complete ✓

## Overview
Read-only reporting endpoints that aggregate income and expense data for the authenticated user. All monetary totals support cross-currency conversion using rates from Phase 6. No new database tables — all data comes from `incomes` and `expenses` via JPQL aggregate queries.

---

## Files to Create

### DTOs

- `dto/SummaryResponse.java` (record)
  ```java
  record SummaryResponse(
      Map<String, BigDecimal> totalIncomeByCurrency,   // {"TRY": 5000, "USD": 1000}
      Map<String, BigDecimal> totalExpenseByCurrency,  // {"TRY": 2000}
      Map<String, BigDecimal> netByCurrency,           // income - expense per currency
      BigDecimal totalIncomeInEur,                     // converted to EUR using cached rates
      BigDecimal totalExpenseInEur,
      BigDecimal netInEur
  )
  ```

- `dto/MonthlyBreakdownItem.java` (record)
  ```java
  record MonthlyBreakdownItem(
      int year,
      int month,
      String currency,
      BigDecimal totalIncome,
      BigDecimal totalExpense,
      BigDecimal net
  )
  ```

- `dto/CurrencyBreakdown.java` (record)
  ```java
  record CurrencyBreakdown(
      String currency,
      BigDecimal totalIncome,
      BigDecimal totalExpense,
      BigDecimal net,
      long incomeCount,
      long expenseCount
  )
  ```

### Repository — Aggregate Queries

Add to `IncomeRepository.java`:
```java
@Query("""
    SELECT i.currency, SUM(i.amount)
    FROM Income i WHERE i.user = :user
    GROUP BY i.currency
    """)
List<Object[]> sumByCurrency(@Param("user") User user);

@Query("""
    SELECT YEAR(i.createdAt), MONTH(i.createdAt), i.currency, SUM(i.amount)
    FROM Income i WHERE i.user = :user
    GROUP BY YEAR(i.createdAt), MONTH(i.createdAt), i.currency
    ORDER BY YEAR(i.createdAt) DESC, MONTH(i.createdAt) DESC
    """)
List<Object[]> monthlySum(@Param("user") User user);
```

Add to `ExpenseRepository.java`:
```java
@Query("""
    SELECT e.currency, SUM(e.amount)
    FROM Expense e WHERE e.user = :user
    GROUP BY e.currency
    """)
List<Object[]> sumByCurrency(@Param("user") User user);

@Query("""
    SELECT YEAR(e.date), MONTH(e.date), e.currency, SUM(e.amount)
    FROM Expense e WHERE e.user = :user
    GROUP BY YEAR(e.date), MONTH(e.date), e.currency
    ORDER BY YEAR(e.date) DESC, MONTH(e.date) DESC
    """)
List<Object[]> monthlySum(@Param("user") User user);
```

### Service
- `service/ReportService.java` — `@Service @RequiredArgsConstructor`
  - `getSummary(User user) → SummaryResponse`
    1. Aggregate income/expense totals by currency from DB
    2. Fetch cached rates from `ExchangeRateService`
    3. Convert all totals to EUR for unified net
    4. Return `SummaryResponse`
  - `getMonthlyBreakdown(User user) → List<MonthlyBreakdownItem>`
    1. Run monthly aggregate queries for both income and expense
    2. Merge results by (year, month, currency)
    3. Return sorted list (newest first)
  - `getByCurrency(User user) → List<CurrencyBreakdown>`
    1. Aggregate income and expense by currency
    2. Join results and compute net per currency

### Controller
- `controller/ReportController.java` — `@RequestMapping("/api/reports")`
  - `GET /api/reports/summary` → `SummaryResponse`
  - `GET /api/reports/monthly` → `List<MonthlyBreakdownItem>`
  - `GET /api/reports/by-currency` → `List<CurrencyBreakdown>`

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reports/summary` | Bearer | Total income/expense per currency + EUR totals |
| GET | `/api/reports/monthly` | Bearer | Month-by-month breakdown |
| GET | `/api/reports/by-currency` | Bearer | Grouped totals per currency |

### GET /api/reports/summary — Example Response
```json
{
  "totalIncomeByCurrency": { "TRY": 15000.00, "USD": 2500.00 },
  "totalExpenseByCurrency": { "TRY": 8000.00 },
  "netByCurrency": { "TRY": 7000.00, "USD": 2500.00 },
  "totalIncomeInEur": 2180.56,
  "totalExpenseInEur": 221.51,
  "netInEur": 1959.05
}
```

### GET /api/reports/monthly — Example Response
```json
[
  { "year": 2026, "month": 2, "currency": "TRY", "totalIncome": 5000.00, "totalExpense": 2000.00, "net": 3000.00 },
  { "year": 2026, "month": 1, "currency": "USD", "totalIncome": 1000.00, "totalExpense": 0.00, "net": 1000.00 }
]
```

---

## Key Design Decisions

- **No new tables** — all aggregation done via JPQL `GROUP BY` queries on existing data
- **Currency conversion at report time** — rates from Phase 6 cache; no stored converted values (they'd go stale)
- **EUR as the unified base** — ECB rates use EUR as base; straightforward to convert TRY/USD → EUR
- **Read-only service** — `@Transactional(readOnly = true)` throughout; no writes
- **Optional CSV export** — can be added to `ReportController` later using Apache Commons CSV; deferred to Phase 10

---

## Verification Steps

```bash
# Summary
curl http://localhost:8080/api/reports/summary \
  -H "Authorization: Bearer TOKEN"

# Monthly breakdown
curl http://localhost:8080/api/reports/monthly \
  -H "Authorization: Bearer TOKEN"

# By currency
curl http://localhost:8080/api/reports/by-currency \
  -H "Authorization: Bearer TOKEN"
```
