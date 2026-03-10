package com.incomeoutcome.repository;

import com.incomeoutcome.entity.AuditLog;
import com.incomeoutcome.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findByUser(User user, Pageable pageable);
}
