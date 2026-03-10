package com.incomeoutcome.dto;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID userId,
        String entityType,
        UUID entityId,
        String action,
        String payload,
        Instant createdAt
) {}
