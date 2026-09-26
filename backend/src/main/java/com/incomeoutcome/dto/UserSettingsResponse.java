package com.incomeoutcome.dto;

public record UserSettingsResponse(
        String reportEmail,
        String timezone,
        boolean dailyReminderEnabled,
        boolean monthlyLedgerEnabled
) {}
