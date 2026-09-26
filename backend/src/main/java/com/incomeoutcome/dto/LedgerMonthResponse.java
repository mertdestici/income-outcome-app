package com.incomeoutcome.dto;

import com.incomeoutcome.entity.Currency;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record LedgerMonthResponse(
        int year,
        int month,
        Map<Currency, BigDecimal> totals,
        List<LedgerTotalRow> byCard,
        List<LedgerTotalRow> byCategory,
        List<ExpenseResponse> expenses,
        List<LocalDate> noSpendDays,
        List<LocalDate> missingDays
) {}
