package com.incomeoutcome.dto;

import com.incomeoutcome.entity.Currency;

import java.math.BigDecimal;

/** One row of a month rollup: a card or category total within one currency. */
public record LedgerTotalRow(
        String label,
        Currency currency,
        BigDecimal total,
        long count,
        BigDecimal sharePercent   // share of this currency's month total
) {}
