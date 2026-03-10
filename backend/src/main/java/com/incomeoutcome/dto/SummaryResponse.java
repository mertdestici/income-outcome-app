package com.incomeoutcome.dto;

import java.math.BigDecimal;
import java.util.Map;

public record SummaryResponse(
        Map<String, BigDecimal> totalIncomeByCurrency,
        Map<String, BigDecimal> totalExpenseByCurrency,
        Map<String, BigDecimal> netByCurrency,
        BigDecimal totalIncomeInEur,
        BigDecimal totalExpenseInEur,
        BigDecimal netInEur
) {}
