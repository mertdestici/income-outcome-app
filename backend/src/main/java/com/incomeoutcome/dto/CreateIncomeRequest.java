package com.incomeoutcome.dto;

import com.incomeoutcome.entity.Currency;
import com.incomeoutcome.entity.RecurrenceRule;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CreateIncomeRequest(
        @NotBlank String title,
        @NotNull @Positive BigDecimal amount,
        @NotNull Currency currency,
        RecurrenceRule recurrenceRule
) {}
