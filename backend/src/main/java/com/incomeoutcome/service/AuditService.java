package com.incomeoutcome.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.incomeoutcome.entity.AuditLog;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public void log(User user, String entityType, UUID entityId, String action, Object payload) {
        String json = null;
        if (payload != null) {
            try {
                json = objectMapper.writeValueAsString(payload);
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize audit payload for {}/{}", entityType, entityId);
            }
        }
        auditLogRepository.save(AuditLog.builder()
                .user(user)
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .payload(json)
                .build());
    }
}
