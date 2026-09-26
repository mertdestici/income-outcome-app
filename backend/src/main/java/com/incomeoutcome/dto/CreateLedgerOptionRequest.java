package com.incomeoutcome.dto;

import com.incomeoutcome.entity.LedgerOptionKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateLedgerOptionRequest(
        @NotNull LedgerOptionKind kind,
        @NotBlank @Size(max = 50) String name
) {}
