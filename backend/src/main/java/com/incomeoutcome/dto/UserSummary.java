package com.incomeoutcome.dto;

import com.incomeoutcome.entity.Role;

import java.time.Instant;
import java.util.UUID;

public record UserSummary(
        UUID id,
        String email,
        Role role,
        Instant createdAt
) {}
