package com.incomeoutcome.dto;

import java.math.BigDecimal;

public record MonthlyBreakdownItem(
        int year,
        int month,
        String currency,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal net
) {}
