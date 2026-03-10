package com.incomeoutcome.dto;

import com.incomeoutcome.entity.Currency;
import com.incomeoutcome.entity.RecurrenceRule;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record IncomeResponse(
        UUID id,
        String title,
        BigDecimal amount,
        Currency currency,
        RecurrenceRule recurrenceRule,
        Instant createdAt
) {}
