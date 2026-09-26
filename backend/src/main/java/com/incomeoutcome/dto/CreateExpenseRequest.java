package com.incomeoutcome.dto;

import com.incomeoutcome.entity.Currency;
import com.incomeoutcome.entity.DocumentType;
import com.incomeoutcome.entity.RecurrenceRule;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateExpenseRequest(
        @NotBlank String title,
        @NotNull @Positive BigDecimal amount,
        @NotNull Currency currency,
        @NotNull LocalDate date,
        DocumentType documentType,
        RecurrenceRule recurrenceRule,
        @Size(max = 50) String card,
        @Size(max = 50) String category,
        @Size(max = 500) String note,
        UUID documentId   // optional — links a pre-uploaded OCR document to this expense
) {}
