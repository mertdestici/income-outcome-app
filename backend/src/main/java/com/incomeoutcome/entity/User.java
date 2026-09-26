package com.incomeoutcome.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.USER;

    @Column(name = "report_email")
    private String reportEmail;

    @Column(nullable = false, length = 64)
    @Builder.Default
    private String timezone = "Europe/Istanbul";

    @Column(name = "daily_reminder_enabled", nullable = false)
    @Builder.Default
    private boolean dailyReminderEnabled = false;

    @Column(name = "monthly_ledger_enabled", nullable = false)
    @Builder.Default
    private boolean monthlyLedgerEnabled = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public void setReportEmail(String reportEmail) {
        this.reportEmail = reportEmail;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public void setDailyReminderEnabled(boolean dailyReminderEnabled) {
        this.dailyReminderEnabled = dailyReminderEnabled;
    }

    public void setMonthlyLedgerEnabled(boolean monthlyLedgerEnabled) {
        this.monthlyLedgerEnabled = monthlyLedgerEnabled;
    }

    @PrePersist
    private void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (role == null) role = Role.USER;
        if (timezone == null) timezone = "Europe/Istanbul";
    }

    // UserDetails
    @Override public String getUsername() { return email; }
    @Override public String getPassword() { return passwordHash; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
