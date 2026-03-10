package com.incomeoutcome.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "revoked_tokens")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevokedToken {

    @Id
    private UUID jti;

    @Column(name = "revoked_at", nullable = false)
    private Instant revokedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
}
