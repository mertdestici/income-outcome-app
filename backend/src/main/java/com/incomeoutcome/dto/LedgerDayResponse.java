package com.incomeoutcome.dto;

import com.incomeoutcome.entity.Currency;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record LedgerDayResponse(
        LocalDate date,
        List<ExpenseResponse> expenses,
        boolean noSpend,
        Map<Currency, BigDecimal> totals
) {}
