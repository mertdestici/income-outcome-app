package com.incomeoutcome.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

public record RateResponse(
        String base,
        Map<String, BigDecimal> rates,
        Instant fetchedAt
) {}
