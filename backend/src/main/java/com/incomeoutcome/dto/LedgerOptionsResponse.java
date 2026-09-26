package com.incomeoutcome.dto;

import java.util.List;

public record LedgerOptionsResponse(
        List<LedgerOptionResponse> cards,
        List<LedgerOptionResponse> categories
) {}
