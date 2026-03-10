package com.incomeoutcome.dto;

import com.incomeoutcome.entity.OcrStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record OcrStatusResponse(
        OcrStatus status,
        String vendor,
        LocalDate date,
        BigDecimal amount
) {}
