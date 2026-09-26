package com.incomeoutcome.dto;

import com.incomeoutcome.entity.Currency;
import com.incomeoutcome.entity.DocumentType;
import com.incomeoutcome.entity.RecurrenceRule;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ExpenseResponse(
        UUID id,
        String title,
        BigDecimal amount,
        Currency currency,
        LocalDate date,
        DocumentType documentType,
        RecurrenceRule recurrenceRule,
        String card,
        String category,
        String note,
        Instant createdAt
) {}
