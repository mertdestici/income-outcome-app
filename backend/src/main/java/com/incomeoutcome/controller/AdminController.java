package com.incomeoutcome.controller;

import com.incomeoutcome.dto.AuditLogResponse;
import com.incomeoutcome.dto.IncomeResponse;
import com.incomeoutcome.dto.UserSummary;
import com.incomeoutcome.entity.AuditLog;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.exception.ResourceNotFoundException;
import com.incomeoutcome.repository.AuditLogRepository;
import com.incomeoutcome.repository.IncomeRepository;
import com.incomeoutcome.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final IncomeRepository incomeRepository;
    private final AuditLogRepository auditLogRepository;

    @GetMapping("/users")
    public Page<UserSummary> listUsers(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(u -> new UserSummary(u.getId(), u.getEmail(), u.getRole(), u.getCreatedAt()));
    }

    @GetMapping("/users/{id}/incomes")
    public Page<IncomeResponse> userIncomes(
            @PathVariable UUID id,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return incomeRepository.findByUser(user, pageable)
                .map(i -> new IncomeResponse(i.getId(), i.getTitle(), i.getAmount(), i.getCurrency(), i.getRecurrenceRule(), i.getCreatedAt()));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found");
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/audit")
    public Page<AuditLogResponse> auditLog(
            @RequestParam(required = false) UUID userId,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        if (userId != null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            return auditLogRepository.findByUser(user, pageable).map(this::toAuditResponse);
        }
        return auditLogRepository.findAll(pageable).map(this::toAuditResponse);
    }

    private AuditLogResponse toAuditResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getUser().getId(),
                log.getEntityType(),
                log.getEntityId(),
                log.getAction(),
                log.getPayload(),
                log.getCreatedAt()
        );
    }
}
