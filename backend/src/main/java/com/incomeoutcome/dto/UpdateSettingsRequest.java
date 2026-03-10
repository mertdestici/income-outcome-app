package com.incomeoutcome.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateSettingsRequest(
    @Email @Size(max = 255) String reportEmail
) {}
