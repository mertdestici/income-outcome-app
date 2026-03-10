package com.incomeoutcome.repository;

import com.incomeoutcome.entity.RevokedToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.UUID;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, UUID> {
    boolean existsByJti(UUID jti);
    void deleteByExpiresAtBefore(Instant threshold);
}
