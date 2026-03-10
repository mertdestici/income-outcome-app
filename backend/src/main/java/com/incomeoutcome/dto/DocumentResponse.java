package com.incomeoutcome.dto;

import com.incomeoutcome.entity.OcrStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DocumentResponse(
        UUID id,
        UUID expenseId,       // null when document is uploaded before expense creation
        String fileName,
        String contentType,
        long sizeBytes,
        Instant uploadedAt,
        OcrStatus ocrStatus,
        String ocrVendor,
        LocalDate ocrDate,
        BigDecimal ocrAmount
) {}
