package com.incomeoutcome.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/** reportEmail null clears it; the other fields are left unchanged when null. */
public record UpdateSettingsRequest(
    @Email @Size(max = 255) String reportEmail,
    @Size(max = 64) String timezone,
    Boolean dailyReminderEnabled,
    Boolean monthlyLedgerEnabled
) {}
