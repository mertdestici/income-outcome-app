package com.incomeoutcome.dto;

import java.math.BigDecimal;

public record CurrencyBreakdown(
        String currency,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal net,
        long incomeCount,
        long expenseCount
) {}
