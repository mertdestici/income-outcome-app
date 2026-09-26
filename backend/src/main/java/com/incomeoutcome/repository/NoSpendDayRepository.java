package com.incomeoutcome.repository;

import com.incomeoutcome.entity.NoSpendDay;
import com.incomeoutcome.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface NoSpendDayRepository extends JpaRepository<NoSpendDay, UUID> {
    boolean existsByUserAndDate(User user, LocalDate date);
    List<NoSpendDay> findByUserAndDateBetween(User user, LocalDate from, LocalDate to);
    void deleteByUserAndDate(User user, LocalDate date);
}
