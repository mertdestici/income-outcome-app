package com.incomeoutcome.repository;

import com.incomeoutcome.entity.LedgerOption;
import com.incomeoutcome.entity.LedgerOptionKind;
import com.incomeoutcome.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LedgerOptionRepository extends JpaRepository<LedgerOption, UUID> {
    List<LedgerOption> findByUserOrderByNameAsc(User user);
    Optional<LedgerOption> findByIdAndUser(UUID id, User user);
    boolean existsByUserAndKindAndNameIgnoreCase(User user, LedgerOptionKind kind, String name);
}
