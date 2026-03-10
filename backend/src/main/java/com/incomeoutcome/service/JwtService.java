package com.incomeoutcome.service;

import com.incomeoutcome.entity.User;
import com.incomeoutcome.repository.RevokedTokenRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(signingKey)
                .compact();
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public UUID extractJti(String token) {
        return UUID.fromString(parseClaims(token).getId());
    }

    public Instant extractExpiration(String token) {
        return parseClaims(token).getExpiration().toInstant();
    }

    public boolean isTokenValid(String token, UserDetails userDetails, RevokedTokenRepository revokedTokenRepository) {
        try {
            Claims claims = parseClaims(token);
            boolean notExpired = claims.getExpiration().after(new Date());
            boolean subjectMatches = claims.getSubject().equals(userDetails.getUsername());
            UUID jti = UUID.fromString(claims.getId());
            boolean notRevoked = !revokedTokenRepository.existsByJti(jti);
            return notExpired && subjectMatches && notRevoked;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
